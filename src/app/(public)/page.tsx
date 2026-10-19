import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  Trophy,
  ArrowRight,
  Flame,
  CheckCircle2,
  Clock,
  Users,
  Swords,
} from "lucide-react";
import type { ChampionshipStatus } from "@/types/database";

export const metadata = {
  title: "CScamp — Campeonatos de CS2 ao Vivo",
  description: "Acompanhe campeonatos de Counter-Strike 2 em tempo real com placar e estatísticas do GSI oficial da Valve.",
};

export const instant = false;

export default async function HomePage() {
  const supabase = await createClient();

  // 1. Busca partidas que estão AO VIVO
  const { data: liveMatches } = await supabase
    .from("matches")
    .select(`
      id,
      gsi_endpoint_slug,
      map_name,
      team_a_score,
      team_b_score,
      current_round,
      status,
      team_a:teams!team_a_id(id, name, logo_url),
      team_b:teams!team_b_id(id, name, logo_url),
      championship:championships!championship_id(id, name)
    `)
    .eq("status", "live")
    .order("updated_at", { ascending: false });

  // 2. Busca campeonatos cadastrados
  const { data: championships } = await supabase
    .from("championships")
    .select(`
      id,
      name,
      status,
      created_at,
      teams:teams(count),
      matches:matches(count)
    `)
    .order("created_at", { ascending: false });

  // 3. Busca partidas recém-finalizadas (Resultados)
  const { data: recentMatches } = await supabase
    .from("matches")
    .select(`
      id,
      gsi_endpoint_slug,
      map_name,
      team_a_score,
      team_b_score,
      status,
      team_a:teams!team_a_id(id, name, logo_url),
      team_b:teams!team_b_id(id, name, logo_url),
      championship:championships!championship_id(id, name)
    `)
    .eq("status", "finished")
    .order("updated_at", { ascending: false })
    .limit(4);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl border border-zinc-800 bg-[#0c0e14] p-8 sm:p-14 overflow-hidden shadow-2xl">
        {/* Authentic CS2 Art Background with dark tactical vignette */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-cs2.jpg"
            alt="CS2 Competitive Arena"
            fill
            priority
            className="object-cover object-right md:object-center opacity-35 brightness-75 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e14] via-[#0c0e14]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14] via-transparent to-[#0c0e14]/50" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-mono font-bold text-amber-400">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>CORUJÃO CS2 • TRANSMISSÃO EM TEMPO REAL</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight uppercase font-sans">
            Acompanhe cada abate, round e placar ao vivo.
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl font-normal">
            Estatísticas instantâneas sincronizadas diretamente do servidor oficial do Counter-Strike 2 via Game State Integration (GSI).
          </p>
        </div>
      </section>

      {/* SEÇÃO: Partidas AO VIVO no momento */}
      {liveMatches && liveMatches.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                Partidas Ao Vivo Agora
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {liveMatches.length} em andamento
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveMatches.map((m) => {
              const teamA = m.team_a as unknown as { id: string; name: string; logo_url: string | null } | null;
              const teamB = m.team_b as unknown as { id: string; name: string; logo_url: string | null } | null;
              const champ = m.championship as unknown as { id: string; name: string } | null;

              return (
                <Link
                  key={m.id}
                  href={`/partidas/${m.gsi_endpoint_slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#10131a] p-5 hover:border-amber-500/50 transition-all shadow-xl block"
                >
                  {/* Map Backdrop */}
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                      src="/images/map-mirage.jpg"
                      alt={m.map_name || "Mirage"}
                      fill
                      className="object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10131a] via-[#10131a]/85 to-transparent" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-xs mb-4">
                      <span className="font-mono font-bold text-amber-400 uppercase bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-800">
                        {m.map_name || "de_mirage"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-red-400 font-bold text-[11px] bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
                        ROUND {m.current_round}
                      </span>
                    </div>

                    {/* Placar */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex-1 text-center sm:text-right">
                        <span className="font-black text-lg text-white block truncate">
                          {teamA?.name || "Time A"}
                        </span>
                      </div>

                      <div className="px-6 font-mono font-black text-3xl text-amber-400 flex items-center gap-2">
                        <span>{m.team_a_score}</span>
                        <span className="text-zinc-600 text-lg">:</span>
                        <span>{m.team_b_score}</span>
                      </div>

                      <div className="flex-1 text-center sm:text-left">
                        <span className="font-black text-lg text-white block truncate">
                          {teamB?.name || "Time B"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                      <span className="truncate max-w-[200px]">{champ?.name || "Torneio CS2"}</span>
                      <span className="inline-flex items-center gap-1 font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                        <span>Assistir Placar</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* SEÇÃO: Resultados Recentes */}
      {recentMatches && recentMatches.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                Resultados Recentes
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-500">Últimos confrontos</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentMatches.map((m) => {
              const teamA = m.team_a as unknown as { id: string; name: string; logo_url: string | null } | null;
              const teamB = m.team_b as unknown as { id: string; name: string; logo_url: string | null } | null;
              const champ = m.championship as unknown as { id: string; name: string } | null;
              const aWon = m.team_a_score > m.team_b_score;
              const bWon = m.team_b_score > m.team_a_score;

              return (
                <Link
                  key={m.id}
                  href={`/partidas/${m.gsi_endpoint_slug}`}
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 hover:border-zinc-700 transition-all block group"
                >
                  <div className="flex items-center justify-between text-xs mb-3 text-zinc-400">
                    <span className="font-mono text-[11px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 uppercase text-zinc-300">
                      {m.map_name || "de_mirage"}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">Finalizada</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex-1 text-right">
                      <span
                        className={`font-bold text-sm truncate block ${
                          aWon ? "text-amber-400 font-black" : "text-zinc-300"
                        }`}
                      >
                        {teamA?.name || "Time A"}
                      </span>
                    </div>

                    <div className="px-5 font-mono font-black text-2xl text-white flex items-center gap-2">
                      <span className={aWon ? "text-amber-400" : "text-zinc-400"}>
                        {m.team_a_score}
                      </span>
                      <span className="text-zinc-600 text-sm">:</span>
                      <span className={bWon ? "text-amber-400" : "text-zinc-400"}>
                        {m.team_b_score}
                      </span>
                    </div>

                    <div className="flex-1 text-left">
                      <span
                        className={`font-bold text-sm truncate block ${
                          bWon ? "text-amber-400 font-black" : "text-zinc-300"
                        }`}
                      >
                        {teamB?.name || "Time B"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="truncate">{champ?.name || "Campeonato"}</span>
                    <span className="text-amber-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      <span>Ver Placar</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* SEÇÃO: Campeonatos */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-2xl font-black text-white">Campeonatos</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Acesse o chaveamento (brackets) e a tabela de cada edição.
            </p>
          </div>
        </div>

        {!championships || championships.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center space-y-3">
            <Trophy className="mx-auto h-12 w-12 text-zinc-600" />
            <h3 className="text-base font-bold text-white">Nenhum campeonato ativo no momento</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              O host ainda não iniciou as inscrições. Se você é o organizador, acesse o painel administrativo.
            </p>
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 text-xs transition-colors"
              >
                <span>Acessar Painel do Host</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {championships.map((champ) => {
              const teamCount = (champ.teams as unknown as { count: number }[])?.[0]?.count || 0;
              const matchCount = (champ.matches as unknown as { count: number }[])?.[0]?.count || 0;

              return (
                <div
                  key={champ.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col justify-between hover:border-zinc-700 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <StatusBadge status={champ.status} />
                      <span className="text-[11px] font-mono text-zinc-500">
                        {new Date(champ.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {champ.name}
                    </h3>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-300">
                      <div className="rounded-lg bg-zinc-950/60 border border-zinc-800/80 p-2.5 flex items-center gap-2">
                        <Users className="h-4 w-4 text-zinc-500" />
                        <span><strong>{teamCount}</strong> Equipes</span>
                      </div>
                      <div className="rounded-lg bg-zinc-950/60 border border-zinc-800/80 p-2.5 flex items-center gap-2">
                        <Swords className="h-4 w-4 text-zinc-500" />
                        <span><strong>{matchCount}</strong> Partidas</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <Link
                      href={`/museu/${champ.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 transition-all"
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      <span>Museu Oficial</span>
                    </Link>
                    <Link
                      href={`/campeonatos/${champ.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-200 hover:text-white group-hover:translate-x-0.5 transition-all"
                    >
                      <span>Ver Chaveamento</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
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
          Inscrições Abertas
        </span>
      );
  }
}
