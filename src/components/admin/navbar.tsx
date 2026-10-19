import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { Trophy, BookOpen, ExternalLink, LogOut } from "lucide-react";

export function AdminNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-zinc-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider text-white">CSCAMP</span>
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                  HOST
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">Painel de Controle CS2</p>
            </div>
          </Link>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <Trophy className="h-4 w-4 text-amber-400" />
            <span>Campeonatos</span>
          </Link>

          <Link
            href="/admin/manual"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <span>Manual GSI</span>
          </Link>

          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Área Pública</span>
          </Link>

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          {/* Logout */}
          <form action={logoutAction}>
            <button
              type="submit"
              title="Encerrar sessão de host"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
