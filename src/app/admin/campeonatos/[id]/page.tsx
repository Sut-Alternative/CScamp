import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import {
  createTeamAction,
  deleteTeamAction,
  createPlayerAction,
  deletePlayerAction,
  createMatchAction,
  updateMatchStatusAction,
  deleteMatchAction,
} from "@/app/admin/actions";
import { GsiModal } from "@/components/admin/gsi-modal";
import { AdminNavbar } from "@/components/admin/navbar";
import { ChampionshipStatusSelect } from "@/components/admin/championship-status-select";
import {
  ArrowLeft,
  Users,
  Swords,
  Plus,
  Trash2,
  ExternalLink,
  Play,
  CheckCircle2,
  Radio,
} from "lucide-react";
import type { ChampionshipStatus, MatchStatus } from "@/types/database";

const CS2_MAPS = [
  "de_mirage",
  "de_inferno",
  "de_nuke",
  "de_anubis",
  "de_dust2",
  "de_ancient",
  "de_vertigo",
];

export const instant = false;

export default async function AdminChampionshipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Busca o campeonato com todas as equipes, jogadores e partidas
  const { data: championship } = await supabase
    .from("championships")
    .select(`
      id,
      name,
      status,
      created_at,
      teams:teams(
        id,
        name,
        logo_url,
        players:players(
          id,
          name,
          steam_id
        )
      ),
      matches:matches(
        id,
        team_a_id,
        team_b_id,
        map_name,
        team_a_score,
        team_b_score,
        status,
        gsi_endpoint_slug,
        bracket_round,
        bracket_position,
        credentials:match_gsi_credentials(auth_token)
      )
    `)
    .eq("id", id)
    .single();

  if (!championship) {
    notFound();
  }

  const teams = championship.teams || [];
  const matches = championship.matches || [];

  // Mapeamento de id do time para nome
  const teamMap = new Map<string, string>();
  teams.forEach((t) => teamMap.set(t.id, t.name));

  return (
    <>
      <AdminNavbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/admin" className="hover:text-white flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar para Campeonatos</span>
        </Link>
        <span>/</span>
        <span className="text-zinc-200 font-semibold">{championship.name}</span>
      </div>

      {/* Championship Header */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white">{championship.name}</h1>
            <StatusBadge status={championship.status} />
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Cadastre as equipes participantes e configure os confrontos com Game State Integration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400">Status:</span>
            <ChampionshipStatusSelect
              championshipId={championship.id}
              currentStatus={championship.status}
            />
          </div>

          {/* Link para o chaveamento público */}
          <Link
            href={`/campeonatos/${championship.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Ver Chaveamento</span>
          </Link>
        </div>
      </div>

      {/* Grid Principal: Times/Jogadores à esquerda, Partidas/GSI à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* =================================================================== */}
        {/* COLUNA ESQUERDA: Equipes e Jogadores (5 colunas) */}
        {/* =================================================================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Cadastrar Nova Equipe */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-amber-400" />
              <span>Cadastrar Equipe</span>
            </h2>

            <form
              action={async (formData: FormData) => {
                "use server";
                await createTeamAction(championship.id, formData);
              }}
              className="space-y-3"
            >
              <div>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Nome do Time (ex: FURIA, MIBR, Corujão Team)..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <input
                  type="url"
                  name="logo_url"
                  placeholder="URL do Logo (opcional)..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Adicionar Equipe</span>
              </button>
            </form>
          </div>

          {/* Lista de Equipes */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center justify-between">
              <span>Equipes Cadastradas ({teams.length})</span>
            </h3>

            {teams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
                Nenhuma equipe cadastrada. Cadastre os times acima para poder criar partidas.
              </div>
            ) : (
              teams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3"
                >
                  {/* Cabeçalho do Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-amber-400 font-bold text-xs overflow-hidden">
                        {team.logo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={team.logo_url} alt={team.name} className="h-full w-full object-cover" />
                        ) : (
                          team.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{team.name}</h4>
                        <span className="text-[11px] text-zinc-400">
                          {team.players?.length || 0} jogador(es)
                        </span>
                      </div>
                    </div>

                    <form
                      action={async () => {
                        "use server";
                        await deleteTeamAction(team.id, championship.id);
                      }}
                    >
                      <button
                        type="submit"
                        title="Excluir equipe"
                        className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>

                  {/* Lista de Jogadores deste Time */}
                  <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
                    {team.players && team.players.length > 0 ? (
                      <div className="space-y-1">
                        {team.players.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between rounded bg-zinc-950/70 px-2.5 py-1.5 text-xs border border-zinc-800/40"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-200">{player.name}</span>
                              <span className="font-mono text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                {player.steam_id}
                              </span>
                            </div>

                            <form
                              action={async () => {
                                "use server";
                                await deletePlayerAction(player.id, championship.id);
                              }}
                            >
                              <button
                                type="submit"
                                title="Remover jogador"
                                className="text-zinc-600 hover:text-red-400 p-0.5"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 italic">Nenhum jogador cadastrado.</p>
                    )}

                    {/* Formulário para adicionar jogador */}
                    <form
                      action={async (formData: FormData) => {
                        "use server";
                        await createPlayerAction(team.id, championship.id, formData);
                      }}
                      className="pt-2 flex flex-col sm:flex-row gap-1.5"
                    >
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Nick do jogador"
                        className="flex-1 rounded bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="text"
                        name="steam_id"
                        required
                        pattern="[0-9]{17}"
                        placeholder="SteamID64 (17 dígitos)"
                        title="O SteamID64 deve conter exatamente 17 números (ex: 76561198000000000)"
                        className="w-full sm:w-44 font-mono rounded bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="submit"
                        className="rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3 py-1 text-xs transition-colors"
                      >
                        + Add
                      </button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* COLUNA DIREITA: Partidas e Configuração GSI (7 colunas) */}
        {/* =================================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Criar Nova Partida */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Swords className="h-4 w-4 text-amber-400" />
              <span>Criar Nova Partida (Confronto)</span>
            </h2>

            {teams.length < 2 ? (
              <p className="text-xs text-zinc-400">
                É necessário cadastrar pelo menos <strong>2 equipes</strong> para poder criar uma partida.
              </p>
            ) : (
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await createMatchAction(championship.id, formData);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Time A</label>
                    <select
                      name="team_a_id"
                      required
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="">Selecione a Equipe A...</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Time B</label>
                    <select
                      name="team_b_id"
                      required
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="">Selecione a Equipe B...</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Mapa</label>
                    <select
                      name="map_name"
                      defaultValue="de_mirage"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                    >
                      {CS2_MAPS.map((map) => (
                        <option key={map} value={map}>
                          {map}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Slug do GSI (URL da partida)
                    </label>
                    <input
                      type="text"
                      name="gsi_endpoint_slug"
                      placeholder="ex: corujao-mesa-1"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Rodada (Brackets)</label>
                    <input
                      type="number"
                      name="bracket_round"
                      min={1}
                      placeholder="ex: 1 (Quartas), 2 (Semi)"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Posição na Chave</label>
                    <input
                      type="number"
                      name="bracket_position"
                      min={1}
                      placeholder="ex: 1, 2, 3..."
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold py-2 text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10"
                >
                  <Plus className="h-4 w-4" />
                  <span>Criar Partida & Gerar Link GSI</span>
                </button>
              </form>
            )}
          </div>

          {/* Lista de Partidas do Campeonato */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center justify-between">
              <span>Partidas ({matches.length})</span>
            </h3>

            {matches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
                Nenhuma partida criada neste campeonato ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => {
                  const teamAName = teamMap.get(match.team_a_id) || "Time A";
                  const teamBName = teamMap.get(match.team_b_id) || "Time B";
                  const authToken = (match.credentials as unknown as { auth_token: string }[])?.[0]?.auth_token;

                  return (
                    <div
                      key={match.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition-colors"
                    >
                      {/* Top Bar: Map, Round, Status, Delete */}
                      <div className="flex items-center justify-between text-xs mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            {match.map_name || "de_mirage"}
                          </span>
                          {match.bracket_round && (
                            <span className="text-[11px] text-zinc-400">
                              Round {match.bracket_round}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <MatchStatusBadge status={match.status} />

                          <form
                            action={async () => {
                              "use server";
                              await deleteMatchAction(match.id, championship.id);
                            }}
                          >
                            <button
                              type="submit"
                              title="Excluir partida"
                              className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Placar Confronto */}
                      <div className="flex items-center justify-between py-2 px-3 bg-zinc-950/80 rounded-lg border border-zinc-800/80">
                        <div className="flex-1 text-right font-bold text-sm text-white truncate">
                          {teamAName}
                        </div>
                        <div className="px-4 font-mono font-black text-lg text-amber-400 flex items-center gap-2">
                          <span>{match.team_a_score}</span>
                          <span className="text-xs text-zinc-600">x</span>
                          <span>{match.team_b_score}</span>
                        </div>
                        <div className="flex-1 text-left font-bold text-sm text-white truncate">
                          {teamBName}
                        </div>
                      </div>

                      {/* Rodapé: Slug GSI, Ações e Modal */}
                      <div className="mt-3 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="font-mono text-[11px] text-zinc-400 flex items-center gap-1">
                          <Radio className="h-3.5 w-3.5 text-emerald-400" />
                          <span>/api/gsi/{match.gsi_endpoint_slug}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Botão de Modal GSI CFG */}
                          <GsiModal
                            slug={match.gsi_endpoint_slug}
                            siteUrl={publicEnv.siteUrl}
                            authToken={authToken}
                            teamAName={teamAName}
                            teamBName={teamBName}
                          />

                          {/* Alternar Status (Live / Finalizar) */}
                          {match.status === "scheduled" && (
                            <form
                              action={async () => {
                                "use server";
                                await updateMatchStatusAction(match.id, championship.id, "live");
                              }}
                            >
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              >
                                <Play className="h-3 w-3" />
                                <span>Iniciar</span>
                              </button>
                            </form>
                          )}

                          {match.status === "live" && (
                            <form
                              action={async () => {
                                "use server";
                                await updateMatchStatusAction(match.id, championship.id, "finished");
                              }}
                            >
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Finalizar</span>
                              </button>
                            </form>
                          )}

                          {/* Link Placar Público */}
                          <Link
                            href={`/partidas/${match.gsi_endpoint_slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:text-white transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Placar</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
    </>
  );
}

function StatusBadge({ status }: { status: ChampionshipStatus }) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Ativo
        </span>
      );
    case "finished":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-400">
          Finalizado
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
          Pendente
        </span>
      );
  }
}

function MatchStatusBadge({ status }: { status: MatchStatus }) {
  switch (status) {
    case "live":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[11px] font-bold text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
          AO VIVO
        </span>
      );
    case "finished":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-400">
          Encerrada
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded bg-zinc-800/80 px-2 py-0.5 text-[11px] font-semibold text-zinc-400">
          Agendada
        </span>
      );
  }
}
