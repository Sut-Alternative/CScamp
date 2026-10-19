"use client";

import { useTransition } from "react";
import { updateChampionshipStatusAction } from "@/app/admin/actions";
import type { ChampionshipStatus } from "@/types/database";

export function ChampionshipStatusSelect({
  championshipId,
  currentStatus,
}: {
  championshipId: string;
  currentStatus: ChampionshipStatus;
}) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ChampionshipStatus;
    startTransition(async () => {
      await updateChampionshipStatusAction(championshipId, newStatus);
    });
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        defaultValue={currentStatus}
        disabled={isPending}
        onChange={handleChange}
        className="text-xs bg-zinc-950 border border-zinc-700/80 rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none focus:border-amber-500 font-medium disabled:opacity-50 transition-colors cursor-pointer"
      >
        <option value="pending">Pendente</option>
        <option value="active">Ativo (Em jogo)</option>
        <option value="finished">Finalizado</option>
      </select>
      {isPending && (
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
      )}
    </div>
  );
}
