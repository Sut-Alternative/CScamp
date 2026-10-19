import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { publicEnv } from "@/lib/env";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Usa a publishable key → sujeito a RLS (leitura pública).
 *
 * Crie um novo cliente a cada request — nunca compartilhe entre requests.
 * Com `cacheComponents`, `cookies()` é dado de runtime: quem usar este cliente
 * em uma página precisa estar dentro de um <Suspense>.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado a partir de um Server Component (cookies somente leitura).
            // Pode ser ignorado: não usamos sessão do Supabase Auth no público.
          }
        },
      },
    },
  );
}
