"use client";

import { useActionState } from "react";
import { loginAction, type ActionResponse } from "@/app/admin/actions";
import { Lock, User, ShieldCheck, ArrowRight } from "lucide-react";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState<ActionResponse | null, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo || "/admin"} />

      {state?.error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
          Usuário do Host
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
            <User className="h-4 w-4" />
          </div>
          <input
            name="username"
            type="text"
            required
            defaultValue="admin_cs_valoroso_2026"
            placeholder="admin_cs_valoroso_2026"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
          Senha de Acesso
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
            <Lock className="h-4 w-4" />
          </div>
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••••••"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors font-mono"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20"
      >
        <span>{isPending ? "Autenticando..." : "Entrar no Painel"}</span>
        <ArrowRight className="h-4 w-4" />
      </button>

      <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        <span>GSI Oficial da Valve • Risco Zero de VAC Ban</span>
      </div>
    </form>
  );
}
