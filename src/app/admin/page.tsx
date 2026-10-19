import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createChampionshipAction, deleteChampionshipAction } from "./actions";
import { Trophy, Plus, Users, Swords, Calendar, ArrowRight, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { AdminNavbar } from "@/components/admin/navbar";
import { ChampionshipStatusSelect } from "@/components/admin/championship-status-select";
import type { ChampionshipStatus } from "@/types/database";

export const metadata = {
  title: "Painel do Host — Campeonatos",
};

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  // Busca todos os campeonatos
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

  // Estatísticas globais
  const totalChampionships = championships?.length || 0;
  const activeChampionships = championships?.filter((c) => c.status === "active").length || 0;

  // Busca partidas ao vivo
  const { count: liveMatchesCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("status", "live");

  return (
    <>
      <AdminNavbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <span className="text-xs font-mono font-semibold tracking-wider text-amber-400 uppercase">
            Painel Geral
          </span>
          <h1 className="text-3xl font-black tracking-tight text-white mt-1">
            Campeonatos de CS2
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Crie torneios, cadastre times e gere configurações de integração com o jogo (GSI).
          </p>
        </div>

        {/* Link para o manual */}
        <Link
          href="/admin/manual"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-700 hover:text-white transition-colors"
        >
          <span>Guia do Host & CFG</span>
          <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Total de Torneios</span>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-white">{totalChampionships}</p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Torneios Ativos</span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-400">{activeChampionships}</p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Partidas AO VIVO</span>
            <Swords className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-black text-amber-400">{liveMatchesCount || 0}</p>
        </div>
      </div>

      {/* Create Championship Card Form */}
      <div className="rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-zinc-900 to-zinc-900 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-400" />
              <span>Criar Novo Campeonato</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Informe o nome do torneio (ex: &quot;Corujão CS2 Arena - 1ª Edição&quot;).
            </p>
          </div>

          <form
            action={async (formData: FormData) => {
              "use server";
              await createChampionshipAction(formData);
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto"
          >
            <input
              type="text"
              name="name"
              required
              minLength={3}
              placeholder="Nome do campeonato..."
              className="w-full sm:w-80 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 text-sm transition-colors whitespace-nowrap shadow-lg shadow-amber-500/10"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Torneio</span>
            </button>
          </form>
        </div>
      </div>

      {/* Championships List */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Todos os Campeonatos</h2>

        {!championships || championships.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
            <h3 className="text-base font-semibold text-white">Nenhum campeonato cadastrado ainda</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              Use o formulário acima para criar o primeiro campeonato e começar a cadastrar as equipes e partidas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {championships.map((champ) => {
              const teamCount = (champ.teams as unknown as { count: number }[])?.[0]?.count || 0;
              const matchCount = (champ.matches as unknown as { count: number }[])?.[0]?.count || 0;

              return (
                <div
                  key={champ.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-zinc-700 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Status and Delete */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <StatusBadge status={champ.status} />

                      <form
                        action={async () => {
                          "use server";
                          await deleteChampionshipAction(champ.id);
                        }}
                      >
                        <button
                          type="submit"
                          title="Excluir campeonato"
                          className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-zinc-800/50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {champ.name}
                    </h3>

                    {/* Meta info */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{teamCount} equipes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Swords className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{matchCount} partidas</span>
                      </div>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(champ.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                    {/* Status switcher */}
                    <ChampionshipStatusSelect
                      championshipId={champ.id}
                      currentStatus={champ.status}
                    />

                    <Link
                      href={`/admin/campeonatos/${champ.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <span>Gerenciar</span>
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
    </>
  );
}

function StatusBadge({ status }: { status: ChampionshipStatus }) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Ativo
        </span>
      );
    case "finished":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-400">
          <CheckCircle2 className="h-3 w-3 text-zinc-400" />
          Finalizado
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
          <Clock className="h-3 w-3 text-amber-400" />
          Pendente
        </span>
      );
  }
}
