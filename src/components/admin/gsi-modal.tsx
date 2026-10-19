"use client";

import { useState } from "react";
import { generateGsiConfig, getGsiCfgFileName, CS2_CFG_DIRECTORY } from "@/lib/gsi-generator";
import { FileCode2, Copy, Check, Download, X, Terminal, Monitor } from "lucide-react";

export function GsiModal({
  slug,
  siteUrl,
  authToken,
  teamAName,
  teamBName,
}: {
  slug: string;
  siteUrl: string;
  authToken?: string;
  teamAName: string;
  teamBName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const cfgContent = generateGsiConfig({ siteUrl, slug, authToken });
  const fileName = getGsiCfgFileName(slug);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cfgContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([cfgContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors"
      >
        <FileCode2 className="h-3.5 w-3.5" />
        <span>Gerar CFG</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-amber-400 tracking-wider">
                  Configuração Oficial do CS2
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  GSI CFG • {teamAName} vs {teamBName}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Arquivo: <code className="text-amber-300 font-mono">{fileName}</code>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4 overflow-y-auto pr-1">
              {/* Instructions Callout */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-emerald-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Monitor className="h-4 w-4" />
                  <span>Onde salvar no PC Espectador do Corujão:</span>
                </div>
                <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-2 font-mono text-[11px] text-zinc-300 select-all break-all">
                  {CS2_CFG_DIRECTORY}
                </div>
              </div>

              {/* Code viewer */}
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                  <span className="font-mono">Conteúdo do arquivo ({fileName}):</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-white"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <pre className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 font-mono text-xs text-amber-200/90 overflow-x-auto max-h-56 select-all">
                  {cfgContent}
                </pre>
              </div>

              {/* Steps Quick Guide */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 text-xs text-zinc-400 space-y-1.5">
                <p className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-amber-400" />
                  <span>Passo a passo rápido:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px]">
                  <li>Clique no botão abaixo para baixar o arquivo ou copie o código acima.</li>
                  <li>Salve na pasta <code className="text-zinc-300">game\csgo\cfg</code> do PC que ficará de espectador.</li>
                  <li>Inicie o CS2 com uma conta secundária e entre como <strong>Espectador</strong> da partida.</li>
                  <li>Abra o console e digite <code className="text-amber-400">fps_max 30</code> para economizar bateria e temperatura.</li>
                </ol>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Copiado!" : "Copiar Código"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-zinc-950 transition-colors shadow-lg shadow-amber-500/20"
              >
                <Download className="h-4 w-4" />
                <span>Baixar {fileName}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
