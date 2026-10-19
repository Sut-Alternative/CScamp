import type { NextRequest } from "next/server";

/**
 * Webhook do Game State Integration (GSI) do CS2.
 *
 * O jogo (PC espectador) faz POST aqui a cada mudança de estado, conforme o
 * arquivo gamestate_integration_<slug>.cfg gerado pelo painel admin.
 *
 * Próxima etapa (lógica pesada):
 *   1. Validar payload com zod (src/types/gsi.ts).
 *   2. Buscar a partida por `gsi_endpoint_slug` + validar `auth.token`
 *      contra `match_gsi_credentials` (cliente admin / secret key).
 *   3. Mapear `allplayers` → cruzar SteamID com `players`.
 *   4. UPSERT em `match_stats` (onConflict: match_id,player_id).
 *   5. Atualizar placar em `matches` (resolver CT/T → time A/B pelos jogadores).
 *
 * Regra de ouro: responder 200 rápido para não travar o envio do jogo.
 */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/gsi/[slug_da_partida]">,
) {
  const { slug_da_partida: slug } = await ctx.params;

  try {
    await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // TODO(etapa 2): processar o payload para a partida `slug`.
  return Response.json({ ok: true, slug });
}
