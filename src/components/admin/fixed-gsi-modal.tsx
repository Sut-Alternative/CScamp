"use client";

import { useState } from "react";
import {
  generateFixedGsiConfig,
  FIXED_GSI_FILENAME,
  CS2_CFG_DIRECTORY,
} from "@/lib/gsi-generator";
import {
  Radio,
  Copy,
  Check,
  Download,
  X,
  Monitor,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface FixedGsiModalProps {
  siteUrl: string;
}

export function FixedGsiModal({ siteUrl }: FixedGsiModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  const cfgContent = generateFixedGsiConfig({ siteUrl });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cfgContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(CS2_CFG_DIRECTORY);
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([cfgContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = FIXED_GSI_FILENAME;
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
        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-amber-600/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:from-amber-500/30 hover:to-amber-500/20 hover:border-amber-400 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
        title="Arquivo GSI Fixo e Permanente para os 2 Espectadores"
      >
        <Radio className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
        <span>CFG Fixo dos Espectadores</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl border border-amber-500/40 bg-zinc-950 p-6 shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-amber-300 tracking-wider">
                    ★ ARQUIVO ÚNICO E PERMANENTE
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1">
                  CFG Fixo • Espectadores & Transmissão
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Arquivo: <code className="text-amber-300 font-mono font-bold">{FIXED_GSI_FILENAME}</code>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4 overflow-y-auto pr-1 text-xs">
              {/* Vantagens do arquivo fixo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>Instalação Única</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Coloque nos 2 PCs de Espectadores antes do torneio começar.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Zap className="h-4 w-4 shrink-0" />
                    <span>Zero Reinícios</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Funciona para todas as partidas sem precisar fechar o CS2.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Auto-Roteamento</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    O sistema atualiza a partida que você der &quot;Iniciar&quot; no painel.
                  </p>
                </div>
              </div>

              {/* Instructions Callout */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2">
                <div className="flex items-center justify-between font-bold text-amber-300">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-amber-400" />
                    <span>Pasta de destino no PC do Espectador:</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPath}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:text-amber-200 transition-colors cursor-pointer"
                  >
                    {copiedPath ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedPath ? "Copiado!" : "Copiar Caminho"}</span>
                  </button>
                </div>
                <div className="bg-zinc-950/90 border border-zinc-800 rounded-lg p-2 font-mono text-[11px] text-zinc-300 select-all break-all">
                  {CS2_CFG_DIRECTORY}
                </div>
              </div>

              {/* Code viewer */}
              <div>
                <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                  <span className="font-mono text-[11px]">Conteúdo Oficial VDF do CFG:</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? "Copiado!" : "Copiar Código"}</span>
                  </button>
                </div>
                <pre className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-[11px] text-zinc-300 overflow-x-auto select-all max-h-56 leading-relaxed">
                  {cfgContent}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800 mt-2">
              <span className="text-[11px] text-zinc-400">
                Endereço fixo: <code className="text-amber-400 font-mono">/api/gsi/live</code>
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? "Copiado!" : "Copiar CFG"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar .CFG Fixo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
