import { Suspense } from "react";
import { RoutePlaceholder } from "@/components/route-placeholder";

/**
 * Live Scoreboard público. Na etapa de frontend, um Client Component assinará
 * o Supabase Realtime (tabelas `matches` e `match_stats`) para atualizar sem reload.
 */
export default function LiveMatchPage({
  params,
}: PageProps<"/partidas/[slug]">) {
  return (
    <RoutePlaceholder
      title="Placar ao vivo"
      route="/partidas/[slug]"
      description="K/D/A, HS% e placar em tempo real via WebSocket."
    >
      <Suspense fallback={<p className="text-zinc-500">Carregando…</p>}>
        {params.then(({ slug }) => (
          <p className="font-mono text-sm text-zinc-500">slug: {slug}</p>
        ))}
      </Suspense>
    </RoutePlaceholder>
  );
}
