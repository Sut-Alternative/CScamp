import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LiveScoreboard } from "@/components/public/live-scoreboard";
import { ArrowLeft } from "lucide-react";
import type { Match, MatchStats, Player, Team } from "@/types/database";

export const metadata = {
  title: "Placar Ao Vivo • CS2 Scoreboard — CScamp",
  description: "Acompanhe ao vivo estatísticas de kills, mortes, ADR e HS% da partida de Counter-Strike 2 via GSI.",
};

export const instant = false;

export default async function LiveMatchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Busca a partida e suas equipes
  const { data: matchData, error: matchErr } = await supabase
    .from("matches")
    .select(`
      id,
      championship_id,
      team_a_id,
      team_b_id,
      status,
      map_name,
      team_a_score,
      team_b_score,
      gsi_endpoint_slug,
      bracket_round,
      bracket_position,
      current_round,
      created_at,
      updated_at,
      team_a:teams!team_a_id(*),
      team_b:teams!team_b_id(*),
      championship:championships!championship_id(id, name)
    `)
    .eq("gsi_endpoint_slug", slug)
    .single();

  if (matchErr || !matchData) {
    notFound();
  }

  const match = matchData as unknown as Match & {
    team_a: Team;
    team_b: Team;
    championship: { id: string; name: string };
  };

  // 2. Busca jogadores cadastrados em ambas as equipes
  const { data: teamAPlayers } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", match.team_a_id)
    .order("name", { ascending: true });

  const { data: teamBPlayers } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", match.team_b_id)
    .order("name", { ascending: true });

  // 3. Busca estatísticas já registradas para esta partida
  const { data: stats } = await supabase
    .from("match_stats")
    .select("*")
    .eq("match_id", match.id);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/" className="hover:text-white flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Início</span>
        </Link>
        <span>/</span>
        <Link
          href={`/campeonatos/${match.championship_id}`}
          className="hover:text-white transition-colors"
        >
          {match.championship?.name || "Campeonato"}
        </Link>
        <span>/</span>
        <span className="text-zinc-200 font-semibold">
          {match.team_a.name} vs {match.team_b.name}
        </span>
      </div>

      {/* Componente Interativo com Supabase Realtime */}
      <LiveScoreboard
        initialMatch={match}
        initialTeamAPlayers={(teamAPlayers || []) as Player[]}
        initialTeamBPlayers={(teamBPlayers || []) as Player[]}
        initialStats={(stats || []) as MatchStats[]}
      />
    </main>
  );
}
