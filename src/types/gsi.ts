/**
 * Tipagens do payload do Game State Integration (GSI) oficial do CS2.
 *
 * Apenas dados enviados nativamente pelo jogo via HTTP POST — nenhuma leitura
 * de memória ou injeção. Os campos são opcionais porque o GSI só envia o que
 * mudou / o que está habilitado no bloco "data" do .cfg.
 *
 * A validação em runtime (zod) será feita no webhook na próxima etapa.
 */

export type GsiTeamSide = "CT" | "T";

export interface GsiProvider {
  name: string;
  appid: number;
  version: number;
  /** SteamID64 da conta que está rodando o jogo (o espectador). */
  steamid: string;
  timestamp: number;
}

export interface GsiMapTeam {
  score: number;
  name?: string;
  consecutive_round_losses?: number;
  timeouts_remaining?: number;
  matches_won_this_series?: number;
}

export interface GsiMap {
  mode: string;
  name: string;
  phase: "warmup" | "live" | "intermission" | "gameover" | string;
  round: number;
  team_ct: GsiMapTeam;
  team_t: GsiMapTeam;
  num_matches_to_win_series?: number;
}

export interface GsiRound {
  phase: "freezetime" | "live" | "over" | string;
  win_team?: GsiTeamSide;
  bomb?: "planted" | "exploded" | "defused" | string;
}

export interface GsiPlayerMatchStats {
  kills: number;
  assists: number;
  deaths: number;
  mvps: number;
  score: number;
}

export interface GsiPlayerState {
  health: number;
  armor: number;
  helmet: boolean;
  flashed: number;
  smoked: number;
  burning: number;
  money: number;
  /** Kills no round atual. */
  round_kills: number;
  /** Headshots no round atual (base para acumular HS total). */
  round_killhs: number;
  /** Dano causado no round atual (base para ADR). */
  round_totaldmg?: number;
  equip_value: number;
}

export interface GsiAllPlayersEntry {
  name: string;
  observer_slot?: number;
  team: GsiTeamSide;
  match_stats?: GsiPlayerMatchStats;
  state?: GsiPlayerState;
  weapons?: Record<string, unknown>;
}

export interface GsiPayload {
  provider?: GsiProvider;
  map?: GsiMap;
  round?: GsiRound;
  /** Chave = SteamID64 do jogador. Só presente no modo espectador. */
  allplayers?: Record<string, GsiAllPlayersEntry>;
  /** Preenchido a partir do bloco "auth" do arquivo .cfg. */
  auth?: { token?: string };
  previously?: unknown;
  added?: unknown;
}
