import { Suspense } from "react";
import { RoutePlaceholder } from "@/components/route-placeholder";

/** Gestão de um campeonato: equipes, jogadores (SteamID) e partidas/GSI. */
export default function AdminChampionshipPage({
  params,
}: PageProps<"/admin/campeonatos/[id]">) {
  return (
    <RoutePlaceholder
      title="Gerenciar campeonato"
      route="/admin/campeonatos/[id]"
      description="Cadastro de equipes e jogadores (SteamID obrigatório), criação de partidas e geração do .cfg do GSI."
    >
      <Suspense fallback={<p className="text-zinc-500">Carregando…</p>}>
        {params.then(({ id }) => (
          <p className="font-mono text-sm text-zinc-500">id: {id}</p>
        ))}
      </Suspense>
    </RoutePlaceholder>
  );
}
