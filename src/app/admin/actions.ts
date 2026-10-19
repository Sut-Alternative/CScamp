"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serverEnv } from "@/lib/env";
import { setAdminSessionCookie, removeAdminSessionCookie, requireAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ChampionshipStatus, MatchStatus, Database } from "@/types/database";

type MatchUpdate = Database["public"]["Tables"]["matches"]["Update"];

export interface ActionResponse {
  success?: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Autenticação
// ---------------------------------------------------------------------------

export async function loginAction(
  prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const username = formData.get("username")?.toString().trim();
  const password = formData.get("password")?.toString();
  const redirectTo = formData.get("redirectTo")?.toString() || "/admin";

  if (!username || !password) {
    return { error: "Informe usuário e senha." };
  }

  if (username !== serverEnv.adminUser || password !== serverEnv.adminPassword) {
    return { error: "Credenciais incorretas." };
  }

  await setAdminSessionCookie(username);
  redirect(redirectTo);
}

export async function logoutAction() {
  await removeAdminSessionCookie();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Campeonatos
// ---------------------------------------------------------------------------

export async function createChampionshipAction(formData: FormData): Promise<ActionResponse> {
  await requireAdminSession();
  const name = formData.get("name")?.toString().trim();

  if (!name || name.length < 3) {
    return { error: "O nome do campeonato deve ter no mínimo 3 caracteres." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("championships")
    .insert({ name, status: "pending" })
    .select("id")
    .single();

  if (error) {
    return { error: `Erro ao criar campeonato: ${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect(`/admin/campeonatos/${data.id}`);
}

export async function updateChampionshipStatusAction(
  id: string,
  status: ChampionshipStatus,
): Promise<ActionResponse> {
  await requireAdminSession();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("championships")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { error: `Erro ao atualizar status: ${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/campeonatos/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function deleteChampionshipAction(id: string): Promise<ActionResponse> {
  await requireAdminSession();

  const supabase = createAdminClient();
  const { error } = await supabase.from("championships").delete().eq("id", id);

  if (error) {
    return { error: `Erro ao excluir: ${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

// ---------------------------------------------------------------------------
// Equipes
// ---------------------------------------------------------------------------

export async function createTeamAction(
  championshipId: string,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAdminSession();
  const name = formData.get("name")?.toString().trim();
  const logoUrl = formData.get("logo_url")?.toString().trim() || null;

  if (!name || name.length < 2) {
    return { error: "O nome da equipe deve ter no mínimo 2 caracteres." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("teams").insert({
    championship_id: championshipId,
    name,
    logo_url: logoUrl,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe uma equipe com este nome neste campeonato." };
    }
    return { error: `Erro ao cadastrar equipe: ${error.message}` };
  }

  revalidatePath(`/admin/campeonatos/${championshipId}`);
  return { success: true };
}

export async function deleteTeamAction(
  teamId: string,
  championshipId: string,
): Promise<ActionResponse> {
  await requireAdminSession();

  const supabase = createAdminClient();
  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    return { error: `Erro ao excluir equipe: ${error.message}` };
  }

  revalidatePath(`/admin/campeonatos/${championshipId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Jogadores
// ---------------------------------------------------------------------------

export async function createPlayerAction(
  teamId: string,
  championshipId: string,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAdminSession();
  const name = formData.get("name")?.toString().trim();
  const steamId = formData.get("steam_id")?.toString().trim();

  if (!name || name.length < 2) {
    return { error: "O apelido (Nick) deve ter no mínimo 2 caracteres." };
  }

  // SteamID64 DEVE ter exatamente 17 dígitos
  if (!steamId || !/^[0-9]{17}$/.test(steamId)) {
    return {
      error: "O SteamID deve ser o SteamID64 oficial de 17 dígitos (ex: 76561198000000000).",
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("players").insert({
    team_id: teamId,
    name,
    steam_id: steamId,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Este jogador já está cadastrado nesta equipe." };
    }
    return { error: `Erro ao cadastrar jogador: ${error.message}` };
  }

  revalidatePath(`/admin/campeonatos/${championshipId}`);
  return { success: true };
}

export async function deletePlayerAction(
  playerId: string,
  championshipId: string,
): Promise<ActionResponse> {
  await requireAdminSession();

  const supabase = createAdminClient();
  const { error } = await supabase.from("players").delete().eq("id", playerId);

  if (error) {
    return { error: `Erro ao remover jogador: ${error.message}` };
  }

  revalidatePath(`/admin/campeonatos/${championshipId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Partidas & GSI
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function createMatchAction(
  championshipId: string,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAdminSession();

  const teamAId = formData.get("team_a_id")?.toString();
  const teamBId = formData.get("team_b_id")?.toString();
  const mapName = formData.get("map_name")?.toString().trim() || "de_mirage";
  let slug = formData.get("gsi_endpoint_slug")?.toString().trim();
  const bracketRoundStr = formData.get("bracket_round")?.toString();
  const bracketPosStr = formData.get("bracket_position")?.toString();

  if (!teamAId || !teamBId) {
    return { error: "Selecione as duas equipes da partida." };
  }

  if (teamAId === teamBId) {
    return { error: "As duas equipes devem ser diferentes." };
  }

  if (!slug) {
    slug = `partida-${Date.now().toString(36)}`;
  } else {
    slug = slugify(slug);
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { error: "Slug inválido. Use apenas letras minúsculas, números e hífens." };
  }

  const supabase = createAdminClient();
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      championship_id: championshipId,
      team_a_id: teamAId,
      team_b_id: teamBId,
      map_name: mapName,
      gsi_endpoint_slug: slug,
      bracket_round: bracketRoundStr ? parseInt(bracketRoundStr, 10) : null,
      bracket_position: bracketPosStr ? parseInt(bracketPosStr, 10) : null,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (matchError) {
    if (matchError.code === "23505") {
      return { error: `O slug GSI "${slug}" já está em uso por outra partida.` };
    }
    return { error: `Erro ao criar partida: ${matchError.message}` };
  }

  // Gera o token de autenticação GSI exclusivo
  await supabase.from("match_gsi_credentials").insert({
    match_id: match.id,
  });

  revalidatePath(`/admin/campeonatos/${championshipId}`);
  revalidatePath(`/partidas/${slug}`);
  revalidatePath("/campeonatos/" + championshipId);
  return { success: true };
}

export async function updateMatchStatusAction(
  matchId: string,
  championshipId: string,
  status: MatchStatus,
): Promise<ActionResponse> {
  await requireAdminSession();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("matches")
    .update({ status })
    .eq("id", matchId);

  if (error) {
    return { error: `Erro ao alterar status da partida: ${error.message}` };
  }

  revalidatePath(`/admin/campeonatos/${championshipId}`);
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteMatchAction(
  matchId: string,
  championshipId: string,
): Promise<ActionResponse> {
  await requireAdminSession();

  const supabase = createAdminClient();
  const { error } = await supabase.from("matches").delete().eq("id", matchId);

  if (error) {
    return { error: `Erro ao excluir partida: ${error.message}` };
  }

  revalidatePath(`/admin/campeonatos/${championshipId}`);
  return { success: true };
}

/**
 * Ajuste manual de emergência (placar, round, mapa e status)
 * Para quando o host precisar corrigir rounds após mp_backup_restore ou queda de energia.
 */
export async function overrideMatchScoreAction(
  matchId: string,
  championshipId: string,
  teamAScore: number,
  teamBScore: number,
  currentRound: number,
  status?: MatchStatus,
  mapName?: string,
): Promise<ActionResponse> {
  await requireAdminSession();

  const supabase = createAdminClient();
  const updateData: MatchUpdate = {
    team_a_score: Math.max(0, teamAScore),
    team_b_score: Math.max(0, teamBScore),
    current_round: Math.max(0, currentRound),
    updated_at: new Date().toISOString(),
  };

  if (status) updateData.status = status;
  if (mapName) updateData.map_name = mapName;

  const { error } = await supabase
    .from("matches")
    .update(updateData)
    .eq("id", matchId);

  if (error) {
    return { error: `Erro ao ajustar placar manual: ${error.message}` };
  }

  revalidatePath(`/admin/campeonatos/${championshipId}`);
  revalidatePath(`/partidas/[slug]`, "layout");
  revalidatePath(`/campeonatos/${championshipId}`);
  revalidatePath("/");
  return { success: true };
}

/**
 * Zera estatísticas e reinicia a partida para 0x0
 * Útil quando os times jogaram aquecimento e o host quer recomeçar limpo.
 */
export async function resetMatchStatsAction(
  matchId: string,
  championshipId: string,
): Promise<ActionResponse> {
  await requireAdminSession();

  const supabase = createAdminClient();

  // 1. Apaga estatísticas de jogadores da partida
  await supabase.from("match_stats").delete().eq("match_id", matchId);

  // 2. Reseta o placar e round
  const { error } = await supabase
    .from("matches")
    .update({
      team_a_score: 0,
      team_b_score: 0,
      current_round: 0,
      status: "scheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  if (error) {
    return { error: `Erro ao reiniciar partida: ${error.message}` };
  }

  revalidatePath(`/admin/campeonatos/${championshipId}`);
  revalidatePath(`/partidas/[slug]`, "layout");
  revalidatePath(`/campeonatos/${championshipId}`);
  revalidatePath("/");
  return { success: true };
}

/**
 * Avança o time vencedor para uma partida seguinte no chaveamento
 */
export async function advanceWinnerToMatchAction(
  targetMatchId: string,
  targetSlot: "team_a_id" | "team_b_id",
  winnerTeamId: string,
  championshipId: string,
): Promise<ActionResponse> {
  await requireAdminSession();

  const supabase = createAdminClient();
  const updateData: MatchUpdate =
    targetSlot === "team_a_id"
      ? { team_a_id: winnerTeamId, updated_at: new Date().toISOString() }
      : { team_b_id: winnerTeamId, updated_at: new Date().toISOString() };

  const { error } = await supabase
    .from("matches")
    .update(updateData)
    .eq("id", targetMatchId);

  if (error) {
    return { error: `Erro ao avançar vencedor na chave: ${error.message}` };
  }

  revalidatePath(`/admin/campeonatos/${championshipId}`);
  revalidatePath(`/campeonatos/${championshipId}`);
  revalidatePath("/");
  return { success: true };
}
