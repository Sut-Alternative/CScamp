import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { PublicNavbar } from "@/components/public/public-navbar";
import { MuseumHighlights } from "@/components/public/museum-highlights";
import { MuseumExportCsvButton } from "@/components/public/museum-export-csv-button";
import { getChampionshipHighlights } from "@/lib/highlights";
import {
  Trophy,
  Crown,
  Crosshair,
  Flame,
  Swords,
  ArrowLeft,
  Calendar,
  Users,
  Medal,
  Award,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export const metadata = {
  title: "Museu & Hall da Fama Oficial — CScamp",
  description: "Estatísticas consolidadas, campeões, MVPs e melhores momentos do campeonato de Counter-Strike 2.",
};

export const instant = false;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChampionshipMuseumPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Busca dados do campeonato, times, jogadores e partidas
  const { data: championship } = await supabase
    .from("championships")
    .select(`
      id,
      name,
      status,
      created_at,
      teams:teams(
        id,
        name,
        logo_url,
        players:players(
          id,
          name,
          steam_id
        )
      ),
      matches:matches(
        id,
        team_a_id,
        team_b_id,
        map_name,
        team_a_score,
        team_b_score,
        status,
        gsi_endpoint_slug,
        bracket_round,
        bracket_position,
        current_round
      )
    `)
    .eq("id", id)
    .single();

  if (!championship) {
    notFound();
  }

  const teams = championship.teams || [];
  const matches = championship.matches || [];
  const matchIds = matches.map((m) => m.id);

  // Mapeamentos
  const teamMap = new Map<string, { id: string; name: string; logo_url: string | null }>();
  teams.forEach((t) => teamMap.set(t.id, t));

  const playerMap = new Map<
    string,
    { id: string; name: string; steam_id: string; team_id: string; team_name: string }
  >();
  teams.forEach((t) => {
    t.players?.forEach((p) => {
      playerMap.set(p.id, {
        id: p.id,
        name: p.name,
        steam_id: p.steam_id,
        team_id: t.id,
        team_name: t.name,
      });
    });
  });

  // 2. Busca todas as estatísticas consolidadas das partidas
  let allStats: Array<{
    id: string;
    match_id: string;
    player_id: string;
    kills: number;
    deaths: number;
    assists: number;
    headshots: number;
    total_damage: number;
    mvps: number;
    score: number;
    hs_percent: number | null;
    adr: number;
  }> = [];

  if (matchIds.length > 0) {
    const { data: statsData } = await supabase
      .from("match_stats")
      .select("*")
      .in("match_id", matchIds);

    if (statsData) {
      allStats = statsData;
    }
  }

  // 3. Busca highlights cadastrados (xplay.gg, youtube, etc)
  const highlights = await getChampionshipHighlights(id);

  // 4. Consolidação matemática de estatísticas por jogador
  interface ConsolidatedPlayer {
    playerId: string;
    name: string;
    steamId: string;
    teamId: string;
    teamName: string;
    matchesPlayed: number;
    kills: number;
    deaths: number;
    assists: number;
    headshots: number;
    totalDamage: number;
    mvps: number;
    score: number;
    totalRounds: number;
    kdRatio: number;
    kdDiff: number;
    adr: number;
    hsPercent: number;
  }

  const statsByPlayer = new Map<string, ConsolidatedPlayer>();

  // Inicializa jogadores cadastrados
  playerMap.forEach((p, playerId) => {
    statsByPlayer.set(playerId, {
      playerId,
      name: p.name,
      steamId: p.steam_id,
      teamId: p.team_id,
      teamName: p.team_name,
      matchesPlayed: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      headshots: 0,
      totalDamage: 0,
      mvps: 0,
      score: 0,
      totalRounds: 0,
      kdRatio: 0,
      kdDiff: 0,
      adr: 0,
      hsPercent: 0,
    });
  });

  // Mapeia rounds por partida
  const matchRounds = new Map<string, number>();
  matches.forEach((m) => {
    const rounds = Math.max(m.current_round, (m.team_a_score || 0) + (m.team_b_score || 0));
    matchRounds.set(m.id, rounds > 0 ? rounds : 1);
  });

  // Acumula stats de cada registro de partida
  allStats.forEach((st) => {
    let p = statsByPlayer.get(st.player_id);
    if (!p) {
      // Jogador pode ter sido cadastrado durante a partida
      const foundInfo = playerMap.get(st.player_id);
      p = {
        playerId: st.player_id,
        name: foundInfo?.name || "Jogador",
        steamId: foundInfo?.steam_id || "76561190000000000",
        teamId: foundInfo?.team_id || "",
        teamName: foundInfo?.team_name || "Equipe",
        matchesPlayed: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        headshots: 0,
        totalDamage: 0,
        mvps: 0,
        score: 0,
        totalRounds: 0,
        kdRatio: 0,
        kdDiff: 0,
        adr: 0,
        hsPercent: 0,
      };
      statsByPlayer.set(st.player_id, p);
    }

    p.matchesPlayed += 1;
    p.kills += st.kills || 0;
    p.deaths += st.deaths || 0;
    p.assists += st.assists || 0;
    p.headshots += st.headshots || 0;
    p.totalDamage += st.total_damage || 0;
    p.mvps += st.mvps || 0;
    p.score += st.score || 0;
    p.totalRounds += matchRounds.get(st.match_id) || 1;
  });

  // Calcula médias consolidadas (K/D, ADR, HS%)
  const playerList: ConsolidatedPlayer[] = Array.from(statsByPlayer.values()).map((p) => {
    const kdRatio = p.deaths > 0 ? p.kills / p.deaths : p.kills;
    const kdDiff = p.kills - p.deaths;
    const hsPercent = p.kills > 0 ? (p.headshots / p.kills) * 100 : 0;
    const adr = p.totalRounds > 0 ? p.totalDamage / p.totalRounds : 0;
    return {
      ...p,
      kdRatio,
      kdDiff,
      hsPercent,
      adr,
    };
  });

  // Ordena por Pontuação / Kills
  playerList.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.kills !== a.kills) return b.kills - a.kills;
    return b.kdRatio - a.kdRatio;
  });

  // Formato para CSV e Leaderboard com Rank
  const leaderboard = playerList.map((p, index) => ({
    rank: index + 1,
    playerName: p.name,
    steamId: p.steamId,
    teamName: p.teamName,
    matchesPlayed: p.matchesPlayed,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    kdRatio: p.kdRatio,
    kdDiff: p.kdDiff,
    adr: p.adr,
    hsPercent: p.hsPercent,
    mvps: p.mvps,
    score: p.score,
  }));

  // 5. Determina Campeão e Vice-Campeão
  // Procura a partida com maior bracket_round (Grande Final)
  let championTeam: { id: string; name: string; logo_url: string | null } | null = null;
  let runnerUpTeam: { id: string; name: string; logo_url: string | null } | null = null;

  const sortedMatches = [...matches].sort((a, b) => (b.bracket_round || 0) - (a.bracket_round || 0));
  const finalMatch = sortedMatches.find(
    (m) => m.status === "finished" || (m.team_a_score > 0 || m.team_b_score > 0),
  );

  if (finalMatch) {
    if (finalMatch.team_a_score > finalMatch.team_b_score) {
      championTeam = teamMap.get(finalMatch.team_a_id) || null;
      runnerUpTeam = teamMap.get(finalMatch.team_b_id) || null;
    } else if (finalMatch.team_b_score > finalMatch.team_a_score) {
      championTeam = teamMap.get(finalMatch.team_b_id) || null;
      runnerUpTeam = teamMap.get(finalMatch.team_a_id) || null;
    }
  }

  // 6. Os 4 Troféus de Honra Individuais
  const hasStats = playerList.some((p) => p.kills > 0 || p.score > 0);

  // MVP: Maior score
  const mvpPlayer = hasStats ? [...playerList].sort((a, b) => b.score - a.score)[0] : null;

  // Top Fragger: Mais kills
  const topFragger = hasStats ? [...playerList].sort((a, b) => b.kills - a.kills)[0] : null;

  // Headshot King: Maior HS% (mínimo 1 kill)
  const hsKing = hasStats
    ? [...playerList].filter((p) => p.kills > 0).sort((a, b) => b.hsPercent - a.hsPercent)[0] || null
    : null;

  // Damage Machine: Maior ADR
  const damageMachine = hasStats
    ? [...playerList].filter((p) => p.totalRounds > 0).sort((a, b) => b.adr - a.adr)[0] || null
    : null;

  const formattedDate = new Date(championship.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <PublicNavbar />

      <main className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
        {/* Hero Banner do Museu */}
        <section className="relative overflow-hidden border-b border-zinc-800 bg-zinc-900/40">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/esports-arena.jpg"
              alt="Arena Esports Major CS2"
              fill
              priority
              className="object-cover object-center opacity-25 filter blur-[1px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.12)_0%,transparent_70%)]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-6">
            {/* Breadcrumb & Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Link
                  href="/"
                  className="hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Campeonatos</span>
                </Link>
                <span>/</span>
                <Link
                  href={`/campeonatos/${championship.id}`}
                  className="hover:text-amber-400 transition-colors"
                >
                  {championship.name}
                </Link>
                <span>/</span>
                <span className="text-amber-400 font-semibold">Museu Oficial</span>
              </div>

              {/* Botões de Ação Rápida */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/campeonatos/${championship.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-200 hover:border-zinc-500 hover:text-white transition-all shadow-md"
                >
                  <Swords className="h-4 w-4 text-zinc-400" />
                  <span>Ver Chaveamento</span>
                </Link>

                <MuseumExportCsvButton
                  championshipName={championship.name}
                  leaderboard={leaderboard}
                />
              </div>
            </div>

            {/* Header Content */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-mono font-bold tracking-wider text-amber-400 shadow-lg shadow-amber-500/10">
                  <Trophy className="h-3.5 w-3.5" />
                  <span>MUSEU & HALL DA FAMA OFICIAL</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase drop-shadow-md">
                  {championship.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-zinc-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    <span>{formattedDate}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-amber-400" />
                    <span>
                      {teams.length} Equipes • {playerMap.size} Atletas
                    </span>
                  </div>
                  <span>•</span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      championship.status === "finished"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    }`}
                  >
                    {championship.status === "finished" ? "🏆 TORNEIO CONCLUÍDO" : "⚔️ EM ANDAMENTO"}
                  </span>
                </div>
              </div>

              {/* Selo CS Valorosos */}
              <div className="hidden lg:flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-zinc-950/70 p-4 backdrop-blur-md shadow-2xl">
                <Image
                  src="/logo.svg"
                  alt="CS Valorosos"
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain drop-shadow"
                />
                <div>
                  <span className="block text-[11px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                    Registro Oficial
                  </span>
                  <span className="block text-xs font-bold text-zinc-300">
                    CS Valorosos Esports
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          {/* Seção 1: Pódio dos Campeões */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Medal className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                Pódio do Campeonato
              </h2>
            </div>

            {championTeam ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1º Lugar - Ouro */}
                <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-950 p-6 sm:p-8 shadow-2xl shadow-amber-500/10">
                  <div className="absolute top-0 right-0 rounded-bl-2xl bg-gradient-to-l from-amber-500 to-amber-600 px-4 py-1.5 text-xs font-black tracking-wider text-zinc-950 shadow-lg">
                    ★ GRANDE CAMPEÃO (1º LUGAR)
                  </div>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mt-4">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-400/80 bg-zinc-900 p-2 shadow-xl shadow-amber-500/20">
                      {championTeam.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={championTeam.logo_url}
                          alt={championTeam.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Trophy className="h-12 w-12 text-amber-400" />
                      )}
                    </div>

                    <div className="text-center sm:text-left space-y-2">
                      <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                        Vencedor da Grande Final
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {championTeam.name}
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-sm">
                        Imortalizado na história do CScamp como a equipe campeã da edição.
                      </p>

                      {/* Escalação dos Campeões */}
                      <div className="pt-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                          Elenco Campeão:
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {teams
                            .find((t) => t.id === championTeam?.id)
                            ?.players?.map((p) => (
                              <span
                                key={p.id}
                                className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-300"
                              >
                                {p.name}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2º Lugar - Prata */}
                <div className="relative overflow-hidden rounded-2xl border border-zinc-700 bg-gradient-to-br from-zinc-800/40 via-zinc-900 to-zinc-950 p-6 sm:p-8 shadow-xl">
                  <div className="absolute top-0 right-0 rounded-bl-2xl bg-zinc-700 px-4 py-1.5 text-xs font-bold tracking-wider text-zinc-200 shadow-md">
                    VICE-CAMPEÃO (2º LUGAR)
                  </div>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mt-4">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-zinc-600 bg-zinc-900 p-2 shadow-lg">
                      {runnerUpTeam?.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={runnerUpTeam.logo_url}
                          alt={runnerUpTeam.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Medal className="h-12 w-12 text-zinc-400" />
                      )}
                    </div>

                    <div className="text-center sm:text-left space-y-2">
                      <span className="text-xs font-mono font-bold tracking-widest text-zinc-400 uppercase">
                        Finalista
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-zinc-200 tracking-tight">
                        {runnerUpTeam?.name || "Aguardando Finalista"}
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-sm">
                        Grande campanha e desempenho de alto nível ao longo de todo o chaveamento.
                      </p>

                      {/* Escalação */}
                      {runnerUpTeam && (
                        <div className="pt-2">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                            Elenco:
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {teams
                              .find((t) => t.id === runnerUpTeam?.id)
                              ?.players?.map((p) => (
                                <span
                                  key={p.id}
                                  className="rounded bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[11px] font-semibold text-zinc-300"
                                >
                                  {p.name}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                <Trophy className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-zinc-300">
                  Disputa do Título em Aberto
                </h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                  A Grande Final ainda não foi concluída. Assim que a partida for finalizada no servidor ou pelo host, o campeão e vice-campeão serão coroados aqui automaticamente.
                </p>
              </div>
            )}
          </section>

          {/* Seção 2: Os 4 Troféus de Honra Individuais */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Award className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                Destaques & Honrarias do Campeonato
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: MVP do Torneio */}
              <div className="relative overflow-hidden rounded-xl border border-amber-500/50 bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-950 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <Crown className="h-5 w-5" />
                  </div>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                    TROFÉU MVP
                  </span>
                </div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                  MVP do Torneio
                </h4>
                <p className="text-lg font-black text-white truncate mt-1">
                  {mvpPlayer?.name || "Aguardando"}
                </p>
                <p className="text-xs text-zinc-400 truncate">
                  {mvpPlayer?.teamName || "—"}
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Impacto / Score:</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {mvpPlayer?.score || 0} pts
                  </span>
                </div>
              </div>

              {/* Card 2: Top Fragger */}
              <div className="relative overflow-hidden rounded-xl border border-red-500/40 bg-gradient-to-b from-red-500/10 via-zinc-900 to-zinc-950 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
                    <Crosshair className="h-5 w-5" />
                  </div>
                  <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-red-300 border border-red-500/30">
                    TOP KILLS
                  </span>
                </div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold">
                  Top Fragger
                </h4>
                <p className="text-lg font-black text-white truncate mt-1">
                  {topFragger?.name || "Aguardando"}
                </p>
                <p className="text-xs text-zinc-400 truncate">
                  {topFragger?.teamName || "—"}
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Total Abates:</span>
                  <span className="font-bold text-red-400 text-sm">
                    {topFragger?.kills || 0} Kills
                  </span>
                </div>
              </div>

              {/* Card 3: Headshot King */}
              <div className="relative overflow-hidden rounded-xl border border-cyan-500/40 bg-gradient-to-b from-cyan-500/10 via-zinc-900 to-zinc-950 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                    <Crosshair className="h-5 w-5" />
                  </div>
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                    PRECISÃO
                  </span>
                </div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  Rei do Headshot
                </h4>
                <p className="text-lg font-black text-white truncate mt-1">
                  {hsKing?.name || "Aguardando"}
                </p>
                <p className="text-xs text-zinc-400 truncate">
                  {hsKing?.teamName || "—"}
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Taxa de HS%:</span>
                  <span className="font-bold text-cyan-400 text-sm">
                    {hsKing ? `${hsKing.hsPercent.toFixed(1)}%` : "0%"}
                  </span>
                </div>
              </div>

              {/* Card 4: Damage Machine */}
              <div className="relative overflow-hidden rounded-xl border border-orange-500/40 bg-gradient-to-b from-orange-500/10 via-zinc-900 to-zinc-950 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40">
                    <Flame className="h-5 w-5" />
                  </div>
                  <span className="rounded bg-orange-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-orange-300 border border-orange-500/30">
                    DANO / ROUND
                  </span>
                </div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold">
                  Damage Machine
                </h4>
                <p className="text-lg font-black text-white truncate mt-1">
                  {damageMachine?.name || "Aguardando"}
                </p>
                <p className="text-xs text-zinc-400 truncate">
                  {damageMachine?.teamName || "—"}
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Média ADR:</span>
                  <span className="font-bold text-orange-400 text-sm">
                    {damageMachine ? damageMachine.adr.toFixed(1) : 0}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 3: Ranking Geral de Atletas (1º ao 20º+) */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                  Ranking Geral de Jogadores
                </h2>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                Ordenado por Score & Impacto Oficial GSI
              </span>
            </div>

            {leaderboard.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
                <ShieldAlert className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">
                  Nenhum jogador registrado no torneio ainda.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="py-3.5 px-4 text-center w-12">#</th>
                      <th className="py-3.5 px-4">Jogador</th>
                      <th className="py-3.5 px-4">Equipe</th>
                      <th className="py-3.5 px-3 text-center">PJ</th>
                      <th className="py-3.5 px-3 text-center text-zinc-200">K</th>
                      <th className="py-3.5 px-3 text-center text-zinc-400">D</th>
                      <th className="py-3.5 px-3 text-center">+/-</th>
                      <th className="py-3.5 px-3 text-center text-amber-400">K/D</th>
                      <th className="py-3.5 px-3 text-center text-orange-400">ADR</th>
                      <th className="py-3.5 px-3 text-center text-cyan-400">HS%</th>
                      <th className="py-3.5 px-3 text-center text-amber-300">MVPs</th>
                      <th className="py-3.5 px-4 text-right text-white font-black">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {leaderboard.map((p) => {
                      const isTop1 = p.rank === 1;
                      const isTop3 = p.rank <= 3;

                      return (
                        <tr
                          key={p.steamId + p.rank}
                          className={`hover:bg-zinc-800/40 transition-colors ${
                            isTop1
                              ? "bg-amber-500/5 font-semibold"
                              : isTop3
                              ? "bg-zinc-900/40"
                              : ""
                          }`}
                        >
                          {/* Rank # */}
                          <td className="py-3 px-4 text-center">
                            {p.rank === 1 ? (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20">
                                1
                              </span>
                            ) : p.rank === 2 ? (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-300 text-zinc-950 font-black text-xs">
                                2
                              </span>
                            ) : p.rank === 3 ? (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-amber-100 font-black text-xs">
                                3
                              </span>
                            ) : (
                              <span className="text-zinc-500 font-bold">
                                {p.rank}
                              </span>
                            )}
                          </td>

                          {/* Nome */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span
                                className={`font-bold text-sm ${
                                  isTop1 ? "text-amber-300" : "text-white"
                                }`}
                              >
                                {p.playerName}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[140px]">
                                {p.steamId}
                              </span>
                            </div>
                          </td>

                          {/* Time */}
                          <td className="py-3 px-4 text-zinc-300 font-sans font-medium">
                            {p.teamName}
                          </td>

                          {/* Partidas Jogadas */}
                          <td className="py-3 px-3 text-center text-zinc-400">
                            {p.matchesPlayed}
                          </td>

                          {/* Kills */}
                          <td className="py-3 px-3 text-center text-zinc-100 font-bold">
                            {p.kills}
                          </td>

                          {/* Deaths */}
                          <td className="py-3 px-3 text-center text-zinc-400">
                            {p.deaths}
                          </td>

                          {/* Saldo (+/-) */}
                          <td
                            className={`py-3 px-3 text-center font-bold ${
                              p.kdDiff > 0
                                ? "text-emerald-400"
                                : p.kdDiff < 0
                                ? "text-red-400"
                                : "text-zinc-500"
                            }`}
                          >
                            {p.kdDiff > 0 ? `+${p.kdDiff}` : p.kdDiff}
                          </td>

                          {/* K/D Ratio */}
                          <td
                            className={`py-3 px-3 text-center font-bold ${
                              p.kdRatio >= 1.2
                                ? "text-emerald-400"
                                : p.kdRatio >= 1.0
                                ? "text-zinc-200"
                                : "text-zinc-400"
                            }`}
                          >
                            {p.kdRatio.toFixed(2)}
                          </td>

                          {/* ADR */}
                          <td className="py-3 px-3 text-center text-orange-400 font-semibold">
                            {p.adr.toFixed(1)}
                          </td>

                          {/* HS% */}
                          <td className="py-3 px-3 text-center text-cyan-400 font-semibold">
                            {p.hsPercent.toFixed(1)}%
                          </td>

                          {/* MVPs */}
                          <td className="py-3 px-3 text-center text-amber-400 font-bold">
                            {p.mvps > 0 ? `★ ${p.mvps}` : "—"}
                          </td>

                          {/* Score */}
                          <td className="py-3 px-4 text-right text-white font-black text-sm">
                            {p.score}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Seção 4: Melhores Momentos & Highlights (xplay.gg) */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                  Galeria de Melhores Momentos & Clipes (xplay.gg)
                </h2>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                Lances e clutches registrados do campeonato
              </span>
            </div>

            <MuseumHighlights
              highlights={highlights}
              championshipName={championship.name}
            />
          </section>

          {/* Banner de Retorno ao Chaveamento */}
          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <h4 className="font-bold text-white text-base">
                Deseja consultar os confrontos e rodadas do campeonato?
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Acesse o chaveamento interativo com todas as partidas e placares individuais.
              </p>
            </div>

            <Link
              href={`/campeonatos/${championship.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 shrink-0"
            >
              <span>Ver Chaveamento Completo</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
