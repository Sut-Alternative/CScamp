import { PublicNavbar } from "@/components/public/public-navbar";

export const instant = false;

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d11] text-zinc-100">
      <PublicNavbar />
      <div className="flex-1 flex flex-col">{children}</div>
      <footer className="border-t border-zinc-850 py-8 text-center text-xs text-zinc-400 bg-zinc-950/40">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 CScamp — Plataforma de Campeonatos e Placar ao Vivo de Counter-Strike 2.</p>
          <p className="font-mono text-[11px] text-zinc-400">
            Powered by Valve CS2 Game State Integration (GSI)
          </p>
        </div>
      </footer>
    </div>
  );
}
