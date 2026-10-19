"use client";

import { Download } from "lucide-react";

interface PlayerStatRow {
  rank: number;
  playerName: string;
  steamId: string;
  teamName: string;
  matchesPlayed: number;
  kills: number;
  deaths: number;
  assists: number;
  kdRatio: number;
  kdDiff: number;
  adr: number;
  hsPercent: number;
  mvps: number;
  score: number;
}

interface MuseumExportCsvButtonProps {
  championshipName: string;
  leaderboard: PlayerStatRow[];
}

export function MuseumExportCsvButton({
  championshipName,
  leaderboard,
}: MuseumExportCsvButtonProps) {
  function handleExportCsv() {
    if (!leaderboard || leaderboard.length === 0) return;

    const headers = [
      "Ranking",
      "Jogador",
      "SteamID64",
      "Equipe",
      "Partidas",
      "Kills",
      "Deaths",
      "Assists",
      "+/-",
      "K/D",
      "ADR",
      "HS%",
      "MVPs",
      "Pontos",
    ];

    const rows = leaderboard.map((p) => [
      p.rank,
      `"${p.playerName.replace(/"/g, '""')}"`,
      `"${p.steamId}"`,
      `"${p.teamName.replace(/"/g, '""')}"`,
      p.matchesPlayed,
      p.kills,
      p.deaths,
      p.assists,
      p.kdDiff > 0 ? `+${p.kdDiff}` : `${p.kdDiff}`,
      p.kdRatio.toFixed(2),
      p.adr.toFixed(1),
      `${p.hsPercent.toFixed(1)}%`,
      p.mvps,
      p.score,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const sanitizedName = championshipName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    link.setAttribute("download", `museu_${sanitizedName}_estatisticas.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <button
      onClick={handleExportCsv}
      disabled={leaderboard.length === 0}
      title="Baixar planilha de estatísticas oficiais do torneio"
      className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs sm:text-sm font-semibold text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/5 cursor-pointer"
    >
      <Download className="h-4 w-4 text-amber-400" />
      <span>Exportar Relatório CSV</span>
    </button>
  );
}
