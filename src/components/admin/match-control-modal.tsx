"use client";

import { useState, useEffect } from "react";
import {
  overrideMatchScoreAction,
  resetMatchStatsAction,
  advanceWinnerToMatchAction,
} from "@/app/admin/actions";
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowRight,
} from "lucide-react";
import type { MatchStatus } from "@/types/database";

interface MatchControlModalProps {
  match: {
    id: string;
    championship_id: string;
    map_name: string | null;
    team_a_score: number;
    team_b_score: number;
    current_round: number;
    status: MatchStatus;
    gsi_endpoint_slug: string;
    updated_at: string;
  };
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  allChampionshipMatches?: Array<{
    id: string;
    bracket_round: number | null;
    team_a: { name: string } | null;
    team_b: { name: string } | null;
  }>;
}

export function MatchControlModal({
  match,
  teamA,
  teamB,
  allChampionshipMatches = [],
}: MatchControlModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [teamAScore, setTeamAScore] = useState(match.team_a_score);
  const [teamBScore, setTeamBScore] = useState(match.team_b_score);
  const [currentRound, setCurrentRound] = useState(match.current_round);
  const [mapName, setMapName] = useState(match.map_name || "de_mirage");
  const [status, setStatus] = useState<MatchStatus>(match.status);

  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Avanço na chave
  const [selectedTargetMatch, setSelectedTargetMatch] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<"team_a_id" | "team_b_id">("team_a_id");
  const [selectedWinner, setSelectedWinner] = useState(teamA.id);

  // Calcula tempo desde último sinal GSI em useEffect (puro)
  const [secondsSinceLastSignal, setSecondsSinceLastSignal] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const calc = () => {
      const sec = Math.floor((Date.now() - new Date(match.updated_at).getTime()) / 1000);
      setSecondsSinceLastSignal(Math.max(0, sec));
    };
    calc();
    const interval = setInterval(calc, 3000);
    return () => clearInterval(interval);
  }, [isOpen, match.updated_at]);

  const isGsiAlive = secondsSinceLastSignal < 20;

  const handleSaveScore = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await overrideMatchScoreAction(
        match.id,
        match.championship_id,
        teamAScore,
        teamBScore,
        currentRound,
        status,
        mapName,
      );
      if (res?.error) {
        setFeedback(`Erro: ${res.error}`);
      } else {
        setFeedback("Placar e status atualizados com sucesso!");
        setTimeout(() => setIsOpen(false), 1200);
      }
    } catch {
      setFeedback("Falha de rede ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetMatch = async () => {
    if (!confirm("Tem certeza que deseja ZERAR o placar e todas as estatísticas desta partida?")) {
      return;
    }
    setIsResetting(true);
    setFeedback(null);
    try {
      const res = await resetMatchStatsAction(match.id, match.championship_id);
      if (res?.error) {
        setFeedback(`Erro: ${res.error}`);
      } else {
        setFeedback("Partida reiniciada para 0x0!");
        setTeamAScore(0);
        setTeamBScore(0);
        setCurrentRound(0);
        setStatus("scheduled");
        setTimeout(() => setIsOpen(false), 1200);
      }
    } catch {
      setFeedback("Falha ao reiniciar partida.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleAdvanceWinner = async () => {
    if (!selectedTargetMatch) return;
    setIsSaving(true);
    try {
      const res = await advanceWinnerToMatchAction(
        selectedTargetMatch,
        selectedSlot,
        selectedWinner,
        match.championship_id,
      );
      if (res?.error) {
        setFeedback(`Erro ao avançar: ${res.error}`);
      } else {
        setFeedback("Equipe vencedora avançada no chaveamento!");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/90 px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:text-white hover:border-amber-500/50 hover:bg-zinc-800 transition-colors"
        title="Ajuste manual de emergência, placar e reinicialização"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
        <span>Controles</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-[#0d1017] p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Controle de Partida do Host</h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    {teamA.name} vs {teamB.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Diagnóstico GSI em Tempo Real */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <Activity
                  className={`h-4 w-4 ${isGsiAlive ? "text-emerald-400 animate-pulse" : "text-amber-500"}`}
                />
                <span className="text-zinc-300">Sinal GSI da Valve:</span>
              </div>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  isGsiAlive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                }`}
              >
                {secondsSinceLastSignal < 60
                  ? `Sinal recebido há ${secondsSinceLastSignal}s`
                  : `Inativo há >1min`}
              </span>
            </div>

            {/* Formulário de Ajuste de Placar e Round */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Ajuste Manual de Emergência (Placar & Rounds)
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300 truncate block">
                    Placar {teamA.name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={teamAScore}
                    onChange={(e) => setTeamAScore(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-mono font-bold text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300 truncate block">
                    Placar {teamB.name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={teamBScore}
                    onChange={(e) => setTeamBScore(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-mono font-bold text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300 block">Round Atual</label>
                  <input
                    type="number"
                    min="0"
                    value={currentRound}
                    onChange={(e) => setCurrentRound(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-mono font-bold text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300 block">Status da Partida</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MatchStatus)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="scheduled">Agendada</option>
                    <option value="live">AO VIVO</option>
                    <option value="finished">Finalizada</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300 block">Mapa</label>
                <input
                  type="text"
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  placeholder="ex: de_mirage"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-mono text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSaveScore}
                disabled={isSaving}
                className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2.5 text-xs transition-colors disabled:opacity-50"
              >
                {isSaving ? "Salvando..." : "Salvar Alterações de Placar"}
              </button>
            </div>

            {/* SEÇÃO: Avançar Vencedor na Chave */}
            {allChampionshipMatches.length > 1 && (
              <div className="space-y-3 border-t border-zinc-800 pt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Trophy className="h-4 w-4" />
                  <span>Avançar Vencedor para Próxima Rodada</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Equipe Vencedora</label>
                    <select
                      value={selectedWinner}
                      onChange={(e) => setSelectedWinner(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white"
                    >
                      <option value={teamA.id}>{teamA.name}</option>
                      <option value={teamB.id}>{teamB.name}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Partida Destino</label>
                    <select
                      value={selectedTargetMatch}
                      onChange={(e) => setSelectedTargetMatch(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white"
                    >
                      <option value="">Selecione...</option>
                      {allChampionshipMatches
                        .filter((m) => m.id !== match.id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            Rodada {m.bracket_round || 2} ({m.team_a?.name || "A definir"} vs{" "}
                            {m.team_b?.name || "A definir"})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Slot Destino</label>
                    <select
                      value={selectedSlot}
                      onChange={(e) =>
                        setSelectedSlot(e.target.value as "team_a_id" | "team_b_id")
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white"
                    >
                      <option value="team_a_id">Time A</option>
                      <option value="team_b_id">Time B</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAdvanceWinner}
                  disabled={!selectedTargetMatch || isSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white hover:border-emerald-500/50 transition-colors disabled:opacity-40"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Confirmar Avanço no Chaveamento</span>
                </button>
              </div>
            )}

            {/* SEÇÃO DE PERIGO: Zerar Partida */}
            <div className="border-t border-red-500/20 pt-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Zona de Reinicialização de Emergência</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Se a partida foi iniciada com warmup ou houve queda de servidor que exigiu
                reiniciar o jogo no CS2, clique abaixo para limpar as estatísticas e voltar para
                0x0.
              </p>
              <button
                onClick={handleResetMatch}
                disabled={isResetting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/20 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-900/40 hover:text-red-100 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{isResetting ? "Reiniciando..." : "Zerar Placar e Estatísticas (0x0)"}</span>
              </button>
            </div>

            {/* Mensagem de Feedback */}
            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  feedback.includes("Erro") || feedback.includes("Falha")
                    ? "bg-red-500/10 text-red-300 border border-red-500/30"
                    : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
