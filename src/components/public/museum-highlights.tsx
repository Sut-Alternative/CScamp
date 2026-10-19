"use client";

import { useState } from "react";
import { Play, ExternalLink, Film, X, User, Flame } from "lucide-react";
import type { ChampionshipHighlight } from "@/types/highlight";
import { parseVideoUrl } from "@/lib/video-parser";

interface MuseumHighlightsProps {
  highlights: ChampionshipHighlight[];
  championshipName: string;
}

export function MuseumHighlights({
  highlights,
  championshipName,
}: MuseumHighlightsProps) {
  const [activeHighlight, setActiveHighlight] = useState<ChampionshipHighlight | null>(null);

  if (!highlights || highlights.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 sm:p-12 text-center backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700/60 bg-zinc-900 text-amber-400 mb-4 shadow-inner">
          <Film className="h-7 w-7" />
        </div>
        <h4 className="text-lg font-bold text-white mb-2">
          Galeria de Vídeos & Melhores Momentos
        </h4>
        <p className="text-sm text-zinc-400 max-w-lg mx-auto">
          Nenhum clipe do <strong className="text-zinc-200">xplay.gg</strong> ou YouTube foi vinculado ainda. 
          O Host pode colar links de lances e clutches no painel administrativo a qualquer momento!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {highlights.map((item) => {
          const parsed = parseVideoUrl(item.video_url);

          return (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-all duration-300 hover:border-amber-500/40 hover:bg-zinc-900 hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div className="space-y-3">
                {/* Media Preview Box */}
                <div
                  onClick={() => setActiveHighlight(item)}
                  className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-950 border border-zinc-800/80 cursor-pointer flex items-center justify-center group-hover:border-amber-500/50 transition-colors"
                >
                  {parsed.type === "direct_video" ? (
                    <video
                      src={parsed.embedUrl}
                      preload="metadata"
                      className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : parsed.type === "youtube" ? (
                    <div className="relative h-full w-full bg-zinc-950 flex items-center justify-center">
                      {/* YouTube thumbnail */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://img.youtube.com/vi/${item.video_url.match(/(?:youtu\.be\/|v=)([^"&?\/\s]{11})/)?.[1] || "default"}/mqdefault.jpg`}
                        alt={item.title}
                        className="h-full w-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-500 gap-1.5 p-4 text-center">
                      <Film className="h-8 w-8 text-amber-400/80" />
                      <span className="text-xs font-mono text-zinc-400">
                        {parsed.type === "xplay" ? "xplay.gg Clip" : "Assistir Clipe"}
                      </span>
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/90 text-zinc-950 shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:bg-amber-400 transition-all">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Round Badge */}
                  {item.round_number && (
                    <span className="absolute top-2 left-2 rounded bg-zinc-950/90 border border-zinc-700/80 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 backdrop-blur-md">
                      ROUND {item.round_number}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div>
                  <h4 className="font-bold text-zinc-100 line-clamp-1 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer info */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-1.5 font-medium">
                  {item.player_name ? (
                    <>
                      <User className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-zinc-200">{item.player_name}</span>
                    </>
                  ) : (
                    <>
                      <Flame className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="text-zinc-500">Lance Geral</span>
                    </>
                  )}
                </div>

                <a
                  href={item.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-amber-400 transition-colors"
                >
                  <span>{parsed.type === "xplay" ? "xplay.gg" : "Link"}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Modal Player */}
      {activeHighlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Film className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">
                    {activeHighlight.title}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {activeHighlight.player_name ? `Jogador: ${activeHighlight.player_name}` : championshipName}
                    {activeHighlight.round_number ? ` • Round ${activeHighlight.round_number}` : ""}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveHighlight(null)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Box */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              {(() => {
                const parsed = parseVideoUrl(activeHighlight.video_url);

                if (parsed.type === "direct_video") {
                  return (
                    <video
                      controls
                      autoPlay
                      src={parsed.embedUrl}
                      className="h-full w-full"
                    />
                  );
                }

                if (parsed.type === "youtube" || parsed.type === "twitch") {
                  return (
                    <iframe
                      src={parsed.embedUrl}
                      title={activeHighlight.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="h-full w-full border-0"
                    />
                  );
                }

                // xplay.gg ou link externo
                return (
                  <div className="p-8 text-center space-y-4">
                    <p className="text-sm text-zinc-300 max-w-md mx-auto">
                      Este clipe do <strong className="text-amber-400">xplay.gg</strong> pode ser visualizado diretamente na página oficial:
                    </p>
                    <a
                      href={activeHighlight.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-bold text-zinc-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
                    >
                      <span>Abrir Lance no xplay.gg</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            {activeHighlight.description && (
              <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400">
                {activeHighlight.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
