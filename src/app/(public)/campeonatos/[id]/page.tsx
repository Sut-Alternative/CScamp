import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  Trophy,
  ArrowLeft,
  Users,
  Swords,
  ExternalLink,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { ChampionshipStatus, MatchStatus } from "@/types/database";

export const metadata = {
  title: "Chaveamento do Campeonato — CScamp",
  description: "Chaveamento e confrontos oficiais do campeonato de Counter-Strike 2.",
};

export const instant = false;

export default async function ChampionshipBracketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Busca o campeonato com suas equipes, jogadores e partidas
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

  // Mapeamento de id do time para dados do time
  const teamMap = new Map<string, { id: string; name: string; logo_url: string | null }>();
  teams.forEach((t) => teamMap.set(t.id, t));

  // Agrupa partidas por rodada
  const matchesByRound = new Map<number, typeof matches>();
  matches.forEach((m) => {
    const roundNumber = m.bracket_round || 1;
    if (!matchesByRound.has(roundNumber)) {
      matchesByRound.set(roundNumber, []);
    }
    matchesByRound.get(roundNumber)?.push(m);
  });

  // Ordena os rounds (1, 2, 3...)
  const sortedRounds = Array.from(matchesByRound.keys()).sort((a, b) => a - b);

  function getRoundTitle(round: number, totalRounds: number) {
    if (totalRounds >= 3) {
      if (round === totalRounds) return "Grande Final";
      if (round === totalRounds - 1) return "Semifinais";
      if (round === totalRounds - 2) return "Quartas de Final";
    }
    if (totalRounds === 2) {
      if (round === 2) return "Grande Final";
      if (round === 1) return "Semifinais";
    }
    return `Rodada ${round}`;
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/" className="hover:text-white flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar para Início</span>
        </Link>
        <span>/</span>
        <span className="text-zinc-200 font-semibold">{championship.name}</span>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-[#0e1118] p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        {/* Authentic Arena Backdrop */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/images/esports-arena.jpg"
            alt="CS2 Tournament Arena"
            fill
            priority
            className="object-cover opacity-25 brightness-75 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e1118] via-[#0e1118]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1118] via-transparent to-[#0e1118]/60" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">{championship.name}</h1>
            <StatusBadge status={championship.status} />
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 mt-2">
            Chaveamento e confrontos oficiais com atualização de placar ao vivo.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-xs text-zinc-200">
          <div className="rounded-xl bg-zinc-950/90 border border-zinc-800 px-4 py-2.5 flex items-center gap-2 shadow-lg">
            <Users className="h-4 w-4 text-amber-400" />
            <span><strong className="text-white">{teams.length}</strong> Equipes</span>
          </div>
          <div className="rounded-xl bg-zinc-950/90 border border-zinc-800 px-4 py-2.5 flex items-center gap-2 shadow-lg">
            <Swords className="h-4 w-4 text-amber-400" />
            <span><strong className="text-white">{matches.length}</strong> Confrontos</span>
          </div>
        </div>
      </div>

      {/* CHAVEAMENTO / BRACKETS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-black text-white uppercase tracking-wider">
              Chaveamento do Torneio
            </h2>
          </div>
          <span className="text-xs text-zinc-400">Clique na partida para ver o placar</span>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-xs text-zinc-500">
            Nenhuma partida foi gerada para este campeonato ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedRounds.map((round) => {
              const roundMatches = matchesByRound.get(round) || [];
              const roundTitle = getRoundTitle(round, sortedRounds.length);

              return (
                <div key={round} className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-amber-400">
                      {roundTitle}
                    </h3>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {roundMatches.length} jogo(s)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {roundMatches.map((match) => {
                      const teamA = teamMap.get(match.team_a_id);
                      const teamB = teamMap.get(match.team_b_id);
                      const isLive = match.status === "live";

                      return (
                        <Link
                          key={match.id}
                          href={`/partidas/${match.gsi_endpoint_slug}`}
                          className={`rounded-2xl border p-4 transition-all block group relative ${
                            isLive
                              ? "border-red-500/40 bg-gradient-to-b from-red-950/20 via-zinc-900 to-zinc-950 shadow-lg shadow-red-500/10 hover:border-red-500"
                              : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                          }`}
                        >
                          {/* Top: Map and Status */}
                          <div className="flex items-center justify-between text-xs mb-3">
                            <span className="font-mono font-bold text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                              {match.map_name || "de_mirage"}
                            </span>
                            <MatchStatusBadge status={match.status} />
                          </div>

                          {/* Teams & Scores */}
                          <div className="space-y-2 py-1">
                            {/* Team A */}
                            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-850">
                              <span className="font-bold text-sm text-white truncate max-w-[160px]">
                                {teamA?.name || "Equipe A"}
                              </span>
                              <span
                                className={`font-mono font-black text-base px-2 py-0.5 rounded ${
                                  match.team_a_score > match.team_b_score
                                    ? "text-emerald-400 bg-emerald-500/10"
                                    : "text-zinc-400"
                                }`}
                              >
                                {match.team_a_score}
                              </span>
                            </div>

                            {/* Team B */}
                            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-850">
                              <span className="font-bold text-sm text-white truncate max-w-[160px]">
                                {teamB?.name || "Equipe B"}
                              </span>
                              <span
                                className={`font-mono font-black text-base px-2 py-0.5 rounded ${
                                  match.team_b_score > match.team_a_score
                                    ? "text-emerald-400 bg-emerald-500/10"
                                    : "text-zinc-400"
                                }`}
                              >
                                {match.team_b_score}
                              </span>
                            </div>
                          </div>

                          {/* Footer Action */}
                          <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                            <span className="text-zinc-500 font-mono">
                              {isLive ? `Round ${match.current_round}` : "Scoreboard Oficial"}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 font-bold ${
                                isLive ? "text-red-400" : "text-amber-400 group-hover:text-amber-300"
                              }`}
                            >
                              <span>{isLive ? "Acompanhar Ao Vivo" : "Ver Estatísticas"}</span>
                              <ExternalLink className="h-3 w-3" />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* EQUIPES & JOGADORES INSCRITOS */}
      <section className="space-y-6 pt-6 border-t border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-black text-white uppercase tracking-wider">
              Equipes & Jogadores
            </h2>
          </div>
          <span className="text-xs text-zinc-400">{teams.length} equipes confirmadas</span>
        </div>

        {teams.length === 0 ? (
          <p className="text-xs text-zinc-500">Nenhuma equipe cadastrada ainda.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 font-black text-sm text-amber-400 overflow-hidden">
                    {team.logo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={team.logo_url} alt={team.name} className="h-full w-full object-cover" />
                    ) : (
                      team.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{team.name}</h3>
                    <span className="text-xs text-zinc-500 font-mono">
                      {team.players?.length || 0} jogador(es)
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-zinc-800/60">
                  {team.players && team.players.length > 0 ? (
                    team.players.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded bg-zinc-950/50 border border-zinc-850"
                      >
                        <span className="font-bold text-zinc-300">{p.name}</span>
                        <span className="font-mono text-[10px] text-zinc-500">{p.steam_id}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-zinc-600 italic">Roster não cadastrado.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: ChampionshipStatus }) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Em Andamento
        </span>
      );
    case "finished":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-400">
          <CheckCircle2 className="h-3 w-3 text-zinc-400" />
          Finalizado
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
          <Clock className="h-3 w-3 text-amber-400" />
          Pendente
        </span>
      );
  }
}

function MatchStatusBadge({ status }: { status: MatchStatus }) {
  switch (status) {
    case "live":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[11px] font-bold text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
          AO VIVO
        </span>
      );
    case "finished":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-400">
          Encerrada
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded bg-zinc-800/80 px-2 py-0.5 text-[11px] font-semibold text-zinc-400">
          Agendada
        </span>
      );
  }
}
