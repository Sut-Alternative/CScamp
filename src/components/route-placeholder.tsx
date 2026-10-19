import type { ReactNode } from "react";

/**
 * Placeholder temporário de rota — será substituído pelos componentes reais
 * na etapa de frontend.
 */
export function RoutePlaceholder({
  title,
  route,
  description,
  children,
}: {
  title: string;
  route: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-16">
      <code className="w-fit rounded bg-white/10 px-2 py-1 font-mono text-xs text-zinc-400">
        {route}
      </code>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="text-zinc-400">{description}</p>}
      {children}
    </main>
  );
}
