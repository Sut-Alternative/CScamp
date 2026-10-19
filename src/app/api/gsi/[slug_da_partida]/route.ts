import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GsiPayload } from "@/types/gsi";

/**
 * Webhook oficial do Game State Integration (GSI) do Counter-Strike 2.
 *
 * Recebe payloads HTTP POST da Valve (PC espectador).
 * Processa allplayers, placar CT/TR cruzando com os SteamID64 cadastrados
 * e atualiza matches e match_stats em tempo real via Supabase.
 */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/gsi/[slug_da_partida]">,
) {
  const { slug_da_partida: slug } = await ctx.params;

  let payload: GsiPayload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Busca a partida ativa pelo slug
  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select(`
      id,
      team_a_id,
      team_b_id,
      team_a_score,
      team_b_score,
      status,
      map_name,
      current_round,
      credentials:match_gsi_credentials(auth_token)
    `)
    .eq("gsi_endpoint_slug", slug)
    .single();

  if (matchErr || !match) {
    return Response.json({ ok: false, error: "match_not_found" }, { status: 404 });
  }

  // 2. Valida token de autenticação se configurado
  const expectedAuthToken = (match.credentials as unknown as { auth_token: string }[])?.[0]?.auth_token;
  if (expectedAuthToken && payload.auth?.token) {
    if (payload.auth.token !== expectedAuthToken) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  // 3. Busca jogadores cadastrados nas duas equipes da partida
  const { data: players } = await supabase
    .from("players")
    .select("id, team_id, steam_id, name")
    .in("team_id", [match.team_a_id, match.team_b_id]);

  const steamIdToPlayer = new Map<string, { id: string; team_id: string; name: string }>();
  players?.forEach((p) => {
    steamIdToPlayer.set(p.steam_id, { id: p.id, team_id: p.team_id, name: p.name });
  });

  // 4. Determina qual lado (CT ou T) a Equipe A e Equipe B estão jogando
  let teamASide: "CT" | "T" | null = null;
  const allPlayersObj = payload.allplayers || {};

  for (const [steamId, gsiPlayer] of Object.entries(allPlayersObj)) {
    const regPlayer = steamIdToPlayer.get(steamId);
    if (regPlayer && regPlayer.team_id === match.team_a_id) {
      if (gsiPlayer.team === "CT" || gsiPlayer.team === "T") {
        teamASide = gsiPlayer.team;
        break;
      }
    }
  }

  // Se a Equipe A não foi encontrada diretamente pelo allplayers, tenta pela Equipe B
  if (!teamASide) {
    for (const [steamId, gsiPlayer] of Object.entries(allPlayersObj)) {
      const regPlayer = steamIdToPlayer.get(steamId);
      if (regPlayer && regPlayer.team_id === match.team_b_id) {
        if (gsiPlayer.team === "CT") teamASide = "T";
        else if (gsiPlayer.team === "T") teamASide = "CT";
        break;
      }
    }
  }

  // 5. Calcula o placar geral
  let teamAScore = match.team_a_score;
  let teamBScore = match.team_b_score;

  if (payload.map?.team_ct && payload.map?.team_t) {
    const ctScore = payload.map.team_ct.score ?? 0;
    const tScore = payload.map.team_t.score ?? 0;

    if (teamASide === "CT") {
      teamAScore = ctScore;
      teamBScore = tScore;
    } else if (teamASide === "T") {
      teamAScore = tScore;
      teamBScore = ctScore;
    } else {
      // Padrão: Time A = CT, Time B = TR
      teamAScore = ctScore;
      teamBScore = tScore;
    }
  }

  // Determina status da partida a partir da fase do mapa
  let matchStatus = match.status;
  if (payload.map?.phase === "gameover") {
    matchStatus = "finished";
  } else if (payload.map?.phase === "live" && match.status === "scheduled") {
    matchStatus = "live";
  }

  const currentRound = payload.map?.round ?? match.current_round ?? 0;

  // 6. Atualiza a tabela matches
  await supabase
    .from("matches")
    .update({
      team_a_score: teamAScore,
      team_b_score: teamBScore,
      map_name: payload.map?.name || match.map_name,
      status: matchStatus,
      current_round: currentRound,
    })
    .eq("id", match.id);

  // 7. Busca estatísticas existentes para calcular Headshots e Dano acumulado
  const { data: existingStats } = await supabase
    .from("match_stats")
    .select("id, player_id, kills, headshots, total_damage, adr")
    .eq("match_id", match.id);

  const existingStatsMap = new Map<string, { headshots: number; total_damage: number; kills: number }>();
  existingStats?.forEach((st) => {
    existingStatsMap.set(st.player_id, {
      headshots: st.headshots,
      total_damage: st.total_damage,
      kills: st.kills,
    });
  });

  // 8. Prepara UPSERT para cada jogador presente em allplayers
  const statsToUpsert: Array<{
    match_id: string;
    player_id: string;
    kills: number;
    deaths: number;
    assists: number;
    headshots: number;
    total_damage: number;
    adr: number;
    mvps: number;
    score: number;
  }> = [];

  for (const [steamId, gsiPlayer] of Object.entries(allPlayersObj)) {
    const regPlayer = steamIdToPlayer.get(steamId);
    if (!regPlayer) {
      // Jogador não cadastrado no campeonato (pode ser bot ou espectador)
      continue;
    }

    const matchStats = gsiPlayer.match_stats || { kills: 0, assists: 0, deaths: 0, mvps: 0, score: 0 };
    const playerState = gsiPlayer.state;
    const existing = existingStatsMap.get(regPlayer.id);

    // Headshots: se houver aumento de kills com round_killhs presente
    let headshots = existing?.headshots || 0;
    if (playerState?.round_killhs && playerState.round_killhs > 0) {
      // Se as kills aumentaram, garante que headshots não ultrapassem as kills
      const newKills = matchStats.kills;
      const oldKills = existing?.kills || 0;
      if (newKills > oldKills) {
        headshots = Math.min(newKills, headshots + playerState.round_killhs);
      }
    }
    // Salvaguarda: headshots nunca podem ser maiores que kills
    if (headshots > matchStats.kills) {
      headshots = matchStats.kills;
    }

    // Dano acumulado e ADR
    let totalDamage = existing?.total_damage || 0;
    if (playerState?.round_totaldmg && playerState.round_totaldmg > 0) {
      // Se mudou de round, acumula o dano
      if (currentRound > (match.current_round || 0)) {
        totalDamage += playerState.round_totaldmg;
      }
    }

    // ADR = dano total dividido pelos rounds jogados (mínimo 1 para cálculo)
    const roundsPlayed = Math.max(1, currentRound);
    const calculatedAdr = totalDamage > 0 ? Number((totalDamage / roundsPlayed).toFixed(1)) : 0;

    statsToUpsert.push({
      match_id: match.id,
      player_id: regPlayer.id,
      kills: matchStats.kills ?? 0,
      deaths: matchStats.deaths ?? 0,
      assists: matchStats.assists ?? 0,
      headshots,
      total_damage: totalDamage,
      adr: calculatedAdr,
      mvps: matchStats.mvps ?? 0,
      score: matchStats.score ?? 0,
    });
  }

  // Executa o upsert se houver estatísticas para salvar
  if (statsToUpsert.length > 0) {
    await supabase.from("match_stats").upsert(statsToUpsert, {
      onConflict: "match_id,player_id",
    });
  }

  return Response.json({
    ok: true,
    match_id: match.id,
    round: currentRound,
    players_updated: statsToUpsert.length,
  });
}
