/**
 * Gerador do arquivo de configuração oficial do CS2 Game State Integration (GSI).
 *
 * O arquivo gerado deve ser salvo no PC do espectador em:
 * C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg\
 */

export const CS2_CFG_DIRECTORY =
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg";

export const FIXED_GSI_FILENAME = "gamestate_integration_cscamp.cfg";
export const DEFAULT_MASTER_GSI_TOKEN = "cscamp_live_spectator";

export function getGsiCfgFileName(slug: string): string {
  const safeSlug = slug.replace(/[^a-z0-9_-]/gi, "_");
  return `gamestate_integration_${safeSlug}.cfg`;
}

/**
 * Gera a configuração FIXA e IMUTÁVEL para os espectadores do campeonato.
 * Os 2 espectadores colocam este arquivo UMA ÚNICA VEZ antes do torneio começar
 * e ele serve para todas as partidas (Quartas, Semis e Final) sem precisar reiniciar o CS2.
 */
export function generateFixedGsiConfig({
  siteUrl,
  authToken = DEFAULT_MASTER_GSI_TOKEN,
}: {
  siteUrl: string;
  authToken?: string;
}): string {
  const base = siteUrl.replace(/\/+$/, "");
  const uri = `${base}/api/gsi/live`;

  return `"CS2_CSCAMP_GSI" {
   "uri" "${uri}"
   "timeout" "5.0"
   "buffer"  "0.1"
   "throttle" "0.5"
   "heartbeat" "30.0"
   "auth" {
      "token" "${authToken}"
   }
   "data" {
      "provider" "1"
      "map" "1"
      "round" "1"
      "player_id" "1"
      "player_match_stats" "1"
      "player_state" "1"
      "player_weapons" "1"
      "allplayers_id" "1"
      "allplayers_match_stats" "1"
      "allplayers_state" "1"
      "allplayers_weapons" "1"
   }
}
`;
}

/**
 * Gera a configuração específica para uma partida por slug (compatibilidade retroativa).
 */
export function generateGsiConfig({
  siteUrl,
  slug,
  authToken,
}: {
  siteUrl: string;
  slug: string;
  authToken?: string;
}): string {
  const base = siteUrl.replace(/\/+$/, "");
  const uri = `${base}/api/gsi/${slug}`;

  const authBlock = authToken
    ? `
   "auth" {
      "token" "${authToken}"
   }`
    : "";

  return `"CS2_CSCAMP_GSI" {
   "uri" "${uri}"
   "timeout" "5.0"
   "buffer"  "0.1"
   "throttle" "0.5"
   "heartbeat" "30.0"${authBlock}
   "data" {
      "provider" "1"
      "map" "1"
      "round" "1"
      "player_id" "1"
      "player_match_stats" "1"
      "player_state" "1"
      "player_weapons" "1"
      "allplayers_id" "1"
      "allplayers_match_stats" "1"
      "allplayers_state" "1"
      "allplayers_weapons" "1"
   }
}
`;
}
