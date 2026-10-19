import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Cliente Supabase privilegiado (SECRET KEY / service_role) — IGNORA RLS.
 *
 * Usar APENAS em código de servidor confiável:
 *   - Webhook GSI (/api/gsi/[slug_da_partida])
 *   - Server Actions do painel admin (após validar a sessão do admin)
 *
 * Nunca exponha este cliente ou a chave ao browser.
 */
export function createAdminClient() {
  return createClient<Database>(
    publicEnv.supabaseUrl,
    serverEnv.supabaseSecretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
