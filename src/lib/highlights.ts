import "server-only";

import fs from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ChampionshipHighlight } from "@/types/highlight";
import { parseVideoUrl } from "./video-parser";

export { parseVideoUrl };

const DATA_DIR = path.join(process.cwd(), "data");
const HIGHLIGHTS_FILE = path.join(DATA_DIR, "highlights.json");

function ensureDataFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(HIGHLIGHTS_FILE)) {
      fs.writeFileSync(HIGHLIGHTS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error creating data/highlights.json:", err);
  }
}

function readLocalHighlights(): ChampionshipHighlight[] {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(HIGHLIGHTS_FILE, "utf-8");
    return JSON.parse(raw) as ChampionshipHighlight[];
  } catch {
    return [];
  }
}

function writeLocalHighlights(data: ChampionshipHighlight[]): void {
  try {
    ensureDataFile();
    fs.writeFileSync(HIGHLIGHTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving data/highlights.json:", err);
  }
}

/**
 * Busca todos os highlights de um campeonato
 */
export async function getChampionshipHighlights(
  championshipId: string,
): Promise<ChampionshipHighlight[]> {
  const localList = readLocalHighlights().filter(
    (h) => h.championship_id === championshipId,
  );

  try {
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("championship_highlights")
      .select("*")
      .eq("championship_id", championshipId)
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      // Mescla com locais para garantir integridade
      const map = new Map<string, ChampionshipHighlight>();
      localList.forEach((h) => map.set(h.id, h));
      data.forEach((h: ChampionshipHighlight) => map.set(h.id, h));
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
  } catch {
    // Tabela ainda não criada no Supabase — usa local
  }

  return localList.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/**
 * Adiciona um novo highlight
 */
export async function saveChampionshipHighlight(
  highlight: Omit<ChampionshipHighlight, "id" | "created_at">,
): Promise<ChampionshipHighlight> {
  const newHighlight: ChampionshipHighlight = {
    id: crypto.randomUUID(),
    championship_id: highlight.championship_id,
    title: highlight.title.trim(),
    description: highlight.description?.trim() || null,
    video_url: highlight.video_url.trim(),
    player_name: highlight.player_name?.trim() || null,
    round_number: highlight.round_number || null,
    created_at: new Date().toISOString(),
  };

  // Salva local
  const current = readLocalHighlights();
  current.unshift(newHighlight);
  writeLocalHighlights(current);

  // Tenta salvar no Supabase se tabela existir
  try {
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("championship_highlights").insert(newHighlight);
  } catch {
    // Fallback silencioso para arquivo local
  }

  return newHighlight;
}

/**
 * Remove um highlight
 */
export async function deleteChampionshipHighlight(
  id: string,
  championshipId: string,
): Promise<boolean> {
  const current = readLocalHighlights();
  const filtered = current.filter((h) => h.id !== id);
  writeLocalHighlights(filtered);

  try {
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("championship_highlights")
      .delete()
      .eq("id", id)
      .eq("championship_id", championshipId);
  } catch {
    // Fallback silencioso
  }

  return true;
}
