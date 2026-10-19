/**
 * Gerador do arquivo de configuração oficial do CS2 Game State Integration (GSI).
 *
 * O arquivo gerado deve ser salvo no PC do espectador em:
 * C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg\
 */

export const CS2_CFG_DIRECTORY =
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg";

export function getGsiCfgFileName(slug: string): string {
  const safeSlug = slug.replace(/[^a-z0-9_-]/gi, "_");
  return `gamestate_integration_${safeSlug}.cfg`;
}

export function generateGsiConfig({
  siteUrl,
  slug,
  authToken,
}: {
  siteUrl: string;
  slug: string;
  authToken?: string;
}): string {
  // Garante que a URL não termine com barra
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
