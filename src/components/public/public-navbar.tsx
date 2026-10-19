import Link from "next/link";
import Image from "next/image";
import { Trophy, Shield } from "lucide-react";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-amber-500/30 p-1 shadow-lg shadow-amber-500/10 group-hover:border-amber-400/60 group-hover:scale-105 transition-all">
            <Image
              src="/logo.svg"
              alt="CS Valorosos Logo"
              width={36}
              height={36}
              priority
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white group-hover:text-amber-400 transition-colors">
                CSCAMP
              </span>
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                CS2 LIVE
              </span>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase hidden sm:block">
              Torneios & GSI Scoreboard
            </p>
          </div>
        </Link>

        {/* Links */}
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <Trophy className="h-4 w-4 text-amber-400" />
            <span>Campeonatos</span>
          </Link>

          <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block" />

          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs sm:text-sm font-semibold text-zinc-300 hover:border-amber-500/40 hover:text-white transition-colors"
          >
            <Shield className="h-3.5 w-3.5 text-amber-500" />
            <span>Painel do Host</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
