/**
 * Acesso centralizado às variáveis de ambiente.
 *
 * Variáveis NEXT_PUBLIC_* precisam ser referenciadas literalmente
 * (`process.env.NEXT_PUBLIC_X`) para o Next.js conseguir inlinar no bundle.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[env] Variável de ambiente ausente: ${name}. Veja .env.example.`,
    );
  }
  return value;
}

/** Seguro para uso no browser e no servidor. */
export const publicEnv = {
  get supabaseUrl() {
    return required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get supabasePublishableKey() {
    return required(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  },
  /** URL pública do site — usada para montar a URI do .cfg do GSI. */
  get siteUrl() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  },
};

/** SOMENTE servidor. Nunca importe em Client Components. */
export const serverEnv = {
  get supabaseSecretKey() {
    return required("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY);
  },
  get adminPassword() {
    return required("ADMIN_PASSWORD", process.env.ADMIN_PASSWORD);
  },
};
