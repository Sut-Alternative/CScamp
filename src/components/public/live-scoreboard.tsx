"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Star,
  Clock,
  CheckCircle2,
  Share2,
  Check,
} from "lucide-react";
import type { Match, MatchStats, Player, Team } from "@/types/database";

interface EnrichedPlayerStats extends MatchStats {
  player: Player;
}

interface LiveScoreboardProps {
  initialMatch: Match & {
    team_a: Team;
    team_b: Team;
  };
  initialTeamAPlayers: Player[];
  initialTeamBPlayers: Player[];
  initialStats: MatchStats[];
}

export function LiveScoreboard({
  initialMatch,
  initialTeamAPlayers,
  initialTeamBPlayers,
  initialStats,
}: LiveScoreboardProps) {
  const [match, setMatch] = useState(initialMatch);
  const [stats, setStats] = useState<MatchStats[]>(initialStats);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Inscrição no Supabase Realtime (WebSockets)
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`live-match-${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `id=eq.${match.id}`,
        },
        (payload) => {
          if (payload.new) {
            setMatch((prev) => ({
              ...prev,
              ...(payload.new as Match),
            }));
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_stats",
          filter: `match_id=eq.${match.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newStat = payload.new as MatchStats;
            setStats((prev) => {
              const filtered = prev.filter((s) => s.player_id !== newStat.player_id);
              return [...filtered, newStat];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedStat = payload.new as MatchStats;
            setStats((prev) =>
              prev.map((s) => (s.player_id === updatedStat.player_id ? updatedStat : s)),
            );
          } else if (payload.eventType === "DELETE") {
            const oldStat = payload.old as MatchStats;
            setStats((prev) => prev.filter((s) => s.id !== oldStat.id));
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsLiveConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsLiveConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id]);

  // Separa e ordena estatísticas para o Time A e Time B
  const teamAStats = useMemo(() => {
    const list: EnrichedPlayerStats[] = initialTeamAPlayers.map((player) => {
      const found = stats.find((s) => s.player_id === player.id);
      return (
        found
          ? { ...found, player }
          : {
              id: `virtual-${player.id}`,
              match_id: match.id,
              player_id: player.id,
              kills: 0,
              deaths: 0,
              assists: 0,
              headshots: 0,
              hs_percent: 0,
              total_damage: 0,
              adr: 0,
              mvps: 0,
              score: 0,
              updated_at: new Date().toISOString(),
              player,
            }
      );
    });
    // Ordena por Score decrescente, depois Kills
    return list.sort((a, b) => b.score - a.score || b.kills - a.kills);
  }, [initialTeamAPlayers, stats, match.id]);

  const teamBStats = useMemo(() => {
    const list: EnrichedPlayerStats[] = initialTeamBPlayers.map((player) => {
      const found = stats.find((s) => s.player_id === player.id);
      return (
        found
          ? { ...found, player }
          : {
              id: `virtual-${player.id}`,
              match_id: match.id,
              player_id: player.id,
              kills: 0,
              deaths: 0,
              assists: 0,
              headshots: 0,
              hs_percent: 0,
              total_damage: 0,
              adr: 0,
              mvps: 0,
              score: 0,
              updated_at: new Date().toISOString(),
              player,
            }
      );
    });
    return list.sort((a, b) => b.score - a.score || b.kills - a.kills);
  }, [initialTeamBPlayers, stats, match.id]);

  // Totais de cada time
  const teamATotals = useMemo(() => {
    return teamAStats.reduce(
      (acc, s) => ({
        kills: acc.kills + s.kills,
        assists: acc.assists + s.assists,
        deaths: acc.deaths + s.deaths,
        score: acc.score + s.score,
      }),
      { kills: 0, assists: 0, deaths: 0, score: 0 },
    );
  }, [teamAStats]);

  const teamBTotals = useMemo(() => {
    return teamBStats.reduce(
      (acc, s) => ({
        kills: acc.kills + s.kills,
        assists: acc.assists + s.assists,
        deaths: acc.deaths + s.deaths,
        score: acc.score + s.score,
      }),
      { kills: 0, assists: 0, deaths: 0, score: 0 },
    );
  }, [teamBStats]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const isLive = match.status === "live";

  return (
    <div className="space-y-6">
      {/* Top Banner do Placar */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-[#12161f] shadow-2xl">
        {/* Glow de fundo */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Info Bar */}
        <div className="border-b border-zinc-800/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold tracking-wider uppercase text-amber-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
              {match.map_name || "de_mirage"}
            </span>

            {isLive ? (
              <span className="inline-flex items-center gap-1.5 font-black uppercase text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                AO VIVO • ROUND {match.current_round}
              </span>
            ) : match.status === "finished" ? (
              <span className="inline-flex items-center gap-1.5 font-bold uppercase text-[11px] text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Partida Finalizada
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-bold uppercase text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                <Clock className="h-3.5 w-3.5" />
                Partida Agendada
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  isLiveConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"
                }`}
              />
              <span>{isLiveConnected ? "GSI Realtime Ativo" : "Conectando..."}</span>
            </div>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              {copiedLink ? <Check className="h-3 w-3 text-emerald-400" /> : <Share2 className="h-3 w-3" />}
              <span>{copiedLink ? "Copiado!" : "Compartilhar"}</span>
            </button>
          </div>
        </div>

        {/* Confronto Central e Placar */}
        <div className="px-6 py-8 sm:py-10 grid grid-cols-1 md:grid-cols-3 items-center gap-6">
          {/* Time A */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-black text-2xl sm:text-3xl text-white tracking-tight">
                {match.team_a.name}
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-amber-400 font-black text-base shadow-lg overflow-hidden shrink-0">
                {match.team_a.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={match.team_a.logo_url} alt={match.team_a.name} className="h-full w-full object-cover" />
                ) : (
                  match.team_a.name.slice(0, 2).toUpperCase()
                )}
              </div>
            </div>
            <span className="text-[11px] font-mono tracking-wider font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              EQUIPE A
            </span>
          </div>

          {/* Placar Numérico */}
          <div className="flex flex-col items-center justify-center space-y-1">
            <div className="flex items-center gap-4 bg-zinc-950/80 px-6 py-3 rounded-2xl border border-zinc-800/80 shadow-2xl">
              <span
                className={`font-mono font-black text-4xl sm:text-5xl tabular-nums ${
                  match.team_a_score > match.team_b_score ? "text-amber-400" : "text-white"
                }`}
              >
                {match.team_a_score}
              </span>
              <span className="text-zinc-600 font-mono text-2xl font-bold">:</span>
              <span
                className={`font-mono font-black text-4xl sm:text-5xl tabular-nums ${
                  match.team_b_score > match.team_a_score ? "text-amber-400" : "text-white"
                }`}
              >
                {match.team_b_score}
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">
              {match.status === "finished" ? "PLACAR FINAL" : "TEMPO REAL (GSI)"}
            </span>
          </div>

          {/* Time B */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
            <div className="flex items-center gap-3 flex-row-reverse md:flex-row">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-amber-400 font-black text-base shadow-lg overflow-hidden shrink-0">
                {match.team_b.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={match.team_b.logo_url} alt={match.team_b.name} className="h-full w-full object-cover" />
                ) : (
                  match.team_b.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <span className="font-black text-2xl sm:text-3xl text-white tracking-tight">
                {match.team_b.name}
              </span>
            </div>
            <span className="text-[11px] font-mono tracking-wider font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              EQUIPE B
            </span>
          </div>
        </div>
      </div>

      {/* TABELAS OFICIAIS DE SCOREBOARD (Estilo CS2 Pro / HLTV) */}
      <div className="space-y-8">
        {/* TABELA TIME A */}
        <ScoreboardTable
          teamName={match.team_a.name}
          sideTheme="team-a"
          playerStats={teamAStats}
          totals={teamATotals}
        />

        {/* TABELA TIME B */}
        <ScoreboardTable
          teamName={match.team_b.name}
          sideTheme="team-b"
          playerStats={teamBStats}
          totals={teamBTotals}
        />
      </div>
    </div>
  );
}

function ScoreboardTable({
  teamName,
  sideTheme,
  playerStats,
  totals,
}: {
  teamName: string;
  sideTheme: "team-a" | "team-b";
  playerStats: EnrichedPlayerStats[];
  totals: { kills: number; assists: number; deaths: number; score: number };
}) {
  const isTeamA = sideTheme === "team-a";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#10131a] overflow-hidden shadow-xl">
      {/* Título da Equipe */}
      <div
        className={`px-5 py-3 border-b flex items-center justify-between ${
          isTeamA
            ? "border-blue-900/40 bg-gradient-to-r from-blue-950/40 via-zinc-900/60 to-transparent"
            : "border-amber-900/40 bg-gradient-to-r from-amber-950/40 via-zinc-900/60 to-transparent"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`h-3 w-1 rounded-full ${isTeamA ? "bg-blue-400" : "bg-amber-400"}`}
          />
          <h3 className="font-black text-lg text-white uppercase tracking-wider">{teamName}</h3>
        </div>

        <span className="text-xs font-mono text-zinc-400">
          {playerStats.length} Jogadores
        </span>
      </div>

      {/* Tabela de Estatísticas */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800/80 bg-zinc-950/60 font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              <th className="py-3 px-4 font-bold text-zinc-300">Jogador</th>
              <th className="py-3 px-3 text-center font-bold text-white">K</th>
              <th className="py-3 px-3 text-center font-bold text-zinc-300">A</th>
              <th className="py-3 px-3 text-center font-bold text-zinc-400">D</th>
              <th className="py-3 px-3 text-center font-bold text-zinc-300">+/-</th>
              <th className="py-3 px-3 text-center font-bold text-zinc-300">HS%</th>
              <th className="py-3 px-3 text-center font-bold text-zinc-300">ADR</th>
              <th className="py-3 px-3 text-center font-bold text-amber-400">MVP</th>
              <th className="py-3 px-4 text-right font-bold text-white">Pontos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40 font-mono">
            {playerStats.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-zinc-600 italic font-sans text-xs">
                  Nenhum jogador registrado no time.
                </td>
              </tr>
            ) : (
              playerStats.map((stat, idx) => {
                const diff = stat.kills - stat.deaths;
                const hsPercent = stat.kills > 0 ? ((stat.headshots / stat.kills) * 100).toFixed(0) : "0";

                return (
                  <tr
                    key={stat.player_id}
                    className="hover:bg-zinc-800/20 transition-colors group"
                  >
                    {/* Jogador */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5 font-sans">
                        <span className="text-zinc-600 font-mono text-[11px] w-4">{idx + 1}</span>
                        <div className="h-7 w-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-amber-400">
                          {stat.player.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm block group-hover:text-amber-400 transition-colors">
                            {stat.player.name}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-500 block">
                            {stat.player.steam_id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Kills */}
                    <td className="py-3 px-3 text-center font-black text-sm text-white">
                      {stat.kills}
                    </td>

                    {/* Assists */}
                    <td className="py-3 px-3 text-center text-zinc-300">
                      {stat.assists}
                    </td>

                    {/* Deaths */}
                    <td className="py-3 px-3 text-center text-zinc-400">
                      {stat.deaths}
                    </td>

                    {/* +/- */}
                    <td
                      className={`py-3 px-3 text-center font-bold ${
                        diff > 0
                          ? "text-emerald-400"
                          : diff < 0
                          ? "text-red-400"
                          : "text-zinc-500"
                      }`}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </td>

                    {/* HS% */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-semibold ${
                          Number(hsPercent) >= 50
                            ? "text-amber-400"
                            : Number(hsPercent) >= 30
                            ? "text-zinc-200"
                            : "text-zinc-500"
                        }`}
                      >
                        {hsPercent}%
                      </span>
                    </td>

                    {/* ADR */}
                    <td className="py-3 px-3 text-center font-semibold text-zinc-300">
                      {stat.adr > 0 ? stat.adr : "—"}
                    </td>

                    {/* MVPs */}
                    <td className="py-3 px-3 text-center">
                      {stat.mvps > 0 ? (
                        <div className="inline-flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span>{stat.mvps}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    {/* Score */}
                    <td className="py-3 px-4 text-right font-black text-amber-400 text-sm">
                      {stat.score}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Totais do Time */}
          {playerStats.length > 0 && (
            <tfoot>
              <tr className="border-t border-zinc-800 bg-zinc-950/80 font-mono text-xs font-bold">
                <td className="py-2.5 px-4 font-sans uppercase text-[11px] tracking-wider text-zinc-400">
                  Total da Equipe
                </td>
                <td className="py-2.5 px-3 text-center text-white">{totals.kills}</td>
                <td className="py-2.5 px-3 text-center text-zinc-300">{totals.assists}</td>
                <td className="py-2.5 px-3 text-center text-zinc-400">{totals.deaths}</td>
                <td className="py-2.5 px-3 text-center text-zinc-500">—</td>
                <td className="py-2.5 px-3 text-center text-zinc-500">—</td>
                <td className="py-2.5 px-3 text-center text-zinc-500">—</td>
                <td className="py-2.5 px-3 text-center text-zinc-500">—</td>
                <td className="py-2.5 px-4 text-right text-amber-400">{totals.score}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
