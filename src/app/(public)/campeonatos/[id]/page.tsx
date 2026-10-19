import { Suspense } from "react";
import { RoutePlaceholder } from "@/components/route-placeholder";

/** Chaveamento (brackets) público de um campeonato. */
export default function ChampionshipBracketPage({
  params,
}: PageProps<"/campeonatos/[id]">) {
  return (
    <RoutePlaceholder
      title="Chaveamento"
      route="/campeonatos/[id]"
      description="Brackets do campeonato com links para cada partida."
    >
      {/* Com cacheComponents, params é dado de runtime → precisa de Suspense. */}
      <Suspense fallback={<p className="text-zinc-500">Carregando…</p>}>
        {params.then(({ id }) => (
          <p className="font-mono text-sm text-zinc-500">id: {id}</p>
        ))}
      </Suspense>
    </RoutePlaceholder>
  );
}
