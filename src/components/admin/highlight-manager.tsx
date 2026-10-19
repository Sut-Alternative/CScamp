"use client";

import { useActionState, useState } from "react";
import {
  createHighlightAction,
  deleteHighlightAction,
  type ActionResponse,
} from "@/app/admin/actions";
import { Film, Plus, Trash2, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import type { ChampionshipHighlight } from "@/types/highlight";

interface HighlightManagerProps {
  championshipId: string;
  initialHighlights: ChampionshipHighlight[];
}

export function HighlightManager({
  championshipId,
  initialHighlights,
}: HighlightManagerProps) {
  const [highlights, setHighlights] = useState<ChampionshipHighlight[]>(initialHighlights);
  const [state, formAction, isPending] = useActionState<ActionResponse | null, FormData>(
    async (prev, formData) => {
      const res = await createHighlightAction(prev, formData);
      if (res?.success) {
        // Recarrega lista
        const title = formData.get("title")?.toString() || "";
        const videoUrl = formData.get("video_url")?.toString() || "";
        const playerName = formData.get("player_name")?.toString() || null;
        const roundRaw = formData.get("round_number")?.toString();
        const newHighlight: ChampionshipHighlight = {
          id: crypto.randomUUID(),
          championship_id: championshipId,
          title,
          video_url: videoUrl,
          player_name: playerName,
          round_number: roundRaw ? parseInt(roundRaw, 10) : null,
          created_at: new Date().toISOString(),
        };
        setHighlights((prevList) => [newHighlight, ...prevList]);
      }
      return res;
    },
    null,
  );

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja remover este clipe do Museu?")) return;
    setDeletingId(id);
    await deleteHighlightAction(id, championshipId);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">
              Galeria de Highlights & Clipes (xplay.gg)
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Cadastre os melhores lances, clutches e aces gerados no xplay.gg ou YouTube para imortalizar no Museu do campeonato.
          </p>
        </div>
      </div>

      {/* Form de Cadastro */}
      <form action={formAction} className="space-y-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4">
        <input type="hidden" name="championship_id" value={championshipId} />

        {state?.error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {state?.success && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Highlight adicionado com sucesso ao Museu!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Título do Lance *
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="Ex: Ace de AK-47 do coldzera na Semifinal"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              URL do Vídeo / Clipe (xplay.gg, YouTube ou MP4) *
            </label>
            <input
              type="url"
              name="video_url"
              required
              placeholder="https://xplay.gg/clips/... ou https://youtu.be/..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Jogador do Lance (Opcional)
            </label>
            <input
              type="text"
              name="player_name"
              placeholder="Ex: FalleN"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Número do Round (Opcional)
            </label>
            <input
              type="number"
              name="round_number"
              min="1"
              max="60"
              placeholder="Ex: 11"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Descrição Curta (Opcional)
            </label>
            <input
              type="text"
              name="description"
              placeholder="Ex: 1v3 no Bombsite B sem kit"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>{isPending ? "Salvando..." : "Adicionar ao Museu"}</span>
          </button>
        </div>
      </form>

      {/* Lista de Highlights Atuais */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Clipes Vinculados ({highlights.length})
        </h4>

        {highlights.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-2">
            Nenhum clipe cadastrado ainda para este campeonato.
          </p>
        ) : (
          <div className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800 bg-zinc-950/40">
            {highlights.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between gap-4 p-3 hover:bg-zinc-900/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-200 truncate">
                      {h.title}
                    </span>
                    {h.round_number && (
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-amber-400">
                        R{h.round_number}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5">
                    {h.player_name && <span>{h.player_name}</span>}
                    <a
                      href={h.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-zinc-400 hover:text-amber-400 truncate max-w-xs"
                    >
                      <span className="truncate">{h.video_url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(h.id)}
                  disabled={deletingId === h.id}
                  className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Remover clipe"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
