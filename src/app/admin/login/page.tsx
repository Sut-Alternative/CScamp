import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "@/components/admin/login-form";

export const metadata = {
  title: "Login do Host",
  description: "Acesso administrativo ao painel de gerenciamento de campeonatos de CS2.",
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-zinc-950">
      {/* Background artwork with dark vignette */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-cs2.jpg"
          alt="CS2 Tactical"
          fill
          priority
          className="object-cover opacity-20 brightness-50 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/95" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-amber-500/30 p-2 shadow-xl shadow-amber-500/10 mb-3">
              <Image
                src="/logo.svg"
                alt="CS Valorosos Logo"
                width={56}
                height={56}
                priority
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-amber-400 mb-1">
              Counter-Strike 2 • Corujão
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Painel do Host
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Gerencie campeonatos, equipes, jogadores e endpoints GSI em tempo real.
            </p>
          </div>

          <Suspense fallback={<div className="h-40 flex items-center justify-center text-zinc-500">Carregando...</div>}>
            <LoginWrapper searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function LoginWrapper({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  return <LoginForm redirectTo={resolved?.redirect} />;
}
