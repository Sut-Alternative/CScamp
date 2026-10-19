/**
 * Utilitário puro de parsing e detecção de URLs de vídeo (xplay.gg, YouTube, Twitch, MP4).
 * Isento de dependências de Node (fs) ou server-only, seguro para Client Components.
 */

export interface ParsedVideoUrl {
  type: "direct_video" | "youtube" | "twitch" | "xplay" | "external";
  embedUrl: string;
}

export function parseVideoUrl(url: string): ParsedVideoUrl {
  const trimmed = (url || "").trim();

  // 1. Arquivo direto (.mp4, .webm)
  if (trimmed.match(/\.(mp4|webm|ogg)($|\?)/i)) {
    return { type: "direct_video", embedUrl: trimmed };
  }

  // 2. YouTube
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0`,
    };
  }

  // 3. Twitch Clips
  const twitchMatch = trimmed.match(/clips\.twitch\.tv\/([A-Za-z0-9_-]+)/i);
  if (twitchMatch && twitchMatch[1]) {
    return {
      type: "twitch",
      embedUrl: `https://clips.twitch.tv/embed?clip=${twitchMatch[1]}&parent=localhost`,
    };
  }

  // 4. xplay.gg
  if (trimmed.includes("xplay.gg")) {
    return { type: "xplay", embedUrl: trimmed };
  }

  return { type: "external", embedUrl: trimmed };
}
