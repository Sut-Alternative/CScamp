import Link from "next/link";
import { publicEnv } from "@/lib/env";
import { CS2_CFG_DIRECTORY } from "@/lib/gsi-generator";
import {
  BookOpen,
  ArrowLeft,
  Smartphone,
  Laptop,
  FolderOpen,
  ShieldCheck,
  Terminal,
  Flame,
} from "lucide-react";
import { AdminNavbar } from "@/components/admin/navbar";

export const metadata = {
  title: "Manual de Operação do Campeonato — CScamp",
  description: "Instruções oficiais de operação para o Host e configuração do PC Espectador com CS2 GSI.",
};

export default function AdminManualPage() {
  const sampleUrl = `${publicEnv.siteUrl}/api/gsi/mesa1`;

  const sampleCfg = `"CS2_CSCAMP_GSI" {
   "uri" "${sampleUrl}"
   "timeout" "5.0"
   "buffer"  "0.1"
   "throttle" "0.5"
   "heartbeat" "30.0"
   "data" {
      "provider" "1"
      "map" "1"
      "round" "1"
      "player_id" "1"
      "player_match_stats" "1"
      "player_state" "1"
      "player_weapons" "1"
      "allplayers_id" "1"
      "allplayers_match_stats" "1"
      "allplayers_state" "1"
      "allplayers_weapons" "1"
   }
}`;

  return (
    <>
      <AdminNavbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/admin" className="hover:text-white flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar para o Painel</span>
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
          <BookOpen className="h-4 w-4" />
          <span>Documentação Oficial</span>
        </div>
        <h1 className="text-3xl font-black text-white mt-1">
          Manual de Operação do Campeonato
        </h1>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
          Siga o guia passo a passo para gerenciar o torneio pelo celular e configurar a máquina de espectador que transmitirá os dados do CS2 via Game State Integration (GSI) oficial.
        </p>
      </div>

      {/* Safety Notice: Anti-Ban (VAC) */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 backdrop-blur-sm space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <ShieldCheck className="h-5 w-5" />
          <span>Segurança & Risco Zero de VAC Ban</span>
        </div>
        <p className="text-xs text-emerald-200/90 leading-relaxed">
          O sistema utiliza <strong>EXCLUSIVAMENTE</strong> o Game State Integration (GSI) nativo da Valve.
          É estritamente proibido criar qualquer código que injete DLLs, leia a memória do jogo ou simule inputs.
          O GSI é uma ferramenta oficial, homologada e aprovada pela Valve para torneios oficiais e transmissões de Major. O risco de banimento é <strong>ZERO</strong>.
        </p>
      </div>

      {/* PASSO 1 */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-sm">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold uppercase text-amber-400 tracking-wider">
              Etapa 1
            </span>
            <h2 className="text-xl font-bold text-white">
              Passo 1: Cadastro (No Celular ou PC do Host)
            </h2>
          </div>
        </div>

        <ol className="list-decimal list-inside space-y-3 text-sm text-zinc-300 pl-2">
          <li className="leading-relaxed">
            <strong className="text-white">Crie o campeonato e cadastre os times:</strong> No painel do host, crie o campeonato (ex: &quot;Corujão CS2&quot;) e em seguida cadastre todas as equipes participantes.
          </li>
          <li className="leading-relaxed">
            <strong className="text-white">Adicione os jogadores informando o Nick e o SteamID exato:</strong> Em cada equipe, adicione os jogadores. O SteamID deve ser o <strong>SteamID64 (17 dígitos)</strong> para que o sistema consiga cruzar os dados recebidos pelo GSI com o jogador cadastrado.
          </li>
          <li className="leading-relaxed">
            <strong className="text-white">Crie a partida entre Time A x Time B:</strong> O sistema gerará um link GSI exclusivo (Ex: <code className="text-amber-400 font-mono text-xs">{publicEnv.siteUrl}/api/gsi/mesa1</code>).
          </li>
        </ol>
      </section>

      {/* PASSO 2 */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold text-sm">
            <Laptop className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold uppercase text-cyan-400 tracking-wider">
              Etapa 2
            </span>
            <h2 className="text-xl font-bold text-white">
              Passo 2: Configurando o PC Espectador
            </h2>
          </div>
        </div>

        <div className="space-y-4 text-sm text-zinc-300">
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-1">
            <span className="text-xs font-mono font-bold uppercase text-amber-300 tracking-wider">
              ★ NOVIDADE: ARQUIVO 100% FIXO E IMUTÁVEL
            </span>
            <p className="text-xs text-amber-100/90 leading-relaxed">
              Os 2 computadores de espectadores colocam este arquivo <strong>UMA ÚNICA VEZ</strong> antes de começar o campeonato. Você <strong>NÃO</strong> precisa fechar o CS2 nem trocar arquivos entre as partidas! O sistema direciona os dados automaticamente para a partida que estiver ao vivo.
            </p>
          </div>

          <div className="space-y-2">
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">1</span>
              <span>No PC ou notebook que ficará de espectador, baixe ou crie o arquivo fixo oficial: <code className="text-amber-400 font-mono font-bold">gamestate_integration_cscamp.cfg</code> (disponível no botão <strong>&quot;CFG Fixo dos Espectadores&quot;</strong> no topo da página do campeonato).</span>
            </p>
          </div>

          <div className="space-y-2">
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">2</span>
              <span>Conteúdo oficial do arquivo fixo dos espectadores:</span>
            </p>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-amber-200/90 overflow-x-auto select-all">
              <pre>{`"CS2_CSCAMP_GSI" {
   "uri" "${publicEnv.siteUrl}/api/gsi/live"
   "timeout" "5.0"
   "buffer"  "0.1"
   "throttle" "0.5"
   "heartbeat" "30.0"
   "auth" {
      "token" "cscamp_live_spectator"
   }
   "data" {
      "provider" "1"
      "map" "1"
      "round" "1"
      "player_id" "1"
      "player_match_stats" "1"
      "player_state" "1"
      "player_weapons" "1"
      "allplayers_id" "1"
      "allplayers_match_stats" "1"
      "allplayers_state" "1"
      "allplayers_weapons" "1"
   }
}`}</pre>
            </div>
          </div>

          <div className="space-y-2">
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">3</span>
              <span>Salve o arquivo na pasta oficial de CFGs do Counter-Strike 2:</span>
            </p>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-300 flex items-center justify-between gap-2 overflow-x-auto select-all">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{CS2_CFG_DIRECTORY}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">4</span>
              <span>Entre no jogo com uma conta secundária (sem risco de deslogar a principal) e conecte na partida como <strong>Espectador</strong>.</span>
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
            <p className="flex items-start gap-2 text-xs text-amber-300 font-semibold">
              <Flame className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Dica de ouro para o notebook de espectador:</span>
            </p>
            <p className="text-xs text-zinc-300 pl-6">
              Abra o console do jogo (tecla <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[11px] font-mono text-zinc-200">`</kbd> ou <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[11px] font-mono text-zinc-200">&apos;</kbd>) e digite:
            </p>
            <div className="pl-6">
              <code className="rounded bg-zinc-950 border border-zinc-800 px-3 py-1 font-mono text-xs text-amber-400 font-bold inline-block">
                fps_max 30
              </code>
            </div>
            <p className="text-xs text-zinc-400 pl-6">
              Isso limita a renderização a 30 quadros por segundo para que o notebook não superaqueça durante horas de Corujão. Deixe o jogo rodando e acompanhe o placar ao vivo pelo celular ou telão!
            </p>
          </div>
        </div>
      </section>

      {/* Como descobrir o SteamID64 */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="h-4 w-4 text-amber-400" />
          <span>Como descobrir o SteamID64 de um jogador</span>
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          O SteamID64 é o número de 17 dígitos que identifica de forma única a conta Steam (ex: <code className="font-mono text-zinc-300">76561198000000000</code>).
        </p>
        <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1.5 pl-2">
          <li><strong>Pelo perfil da Steam:</strong> Acesse o perfil do jogador e copie a URL. Se for <code className="text-zinc-400">steamcommunity.com/profiles/76561198...</code>, os números no final são o SteamID64.</li>
          <li><strong>Pelo site SteamID.io / SteamFinder:</strong> Cole o link personalizado do perfil (ex: <code className="text-zinc-400">steamcommunity.com/id/nome</code>) no site <a href="https://steamid.io" target="_blank" rel="noreferrer" className="text-amber-400 underline">steamid.io</a> e copie o campo <strong>steamID64</strong>.</li>
          <li><strong>Dentro do próprio CS2:</strong> No console do jogo, digite <code className="text-amber-400 font-mono">status</code> para listar o SteamID de todos os jogadores conectados no servidor.</li>
        </ul>
      </section>
    </main>
    </>
  );
}
