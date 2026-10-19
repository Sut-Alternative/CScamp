export interface ChampionshipHighlight {
  id: string;
  championship_id: string;
  title: string;
  description?: string | null;
  video_url: string;
  player_name?: string | null;
  round_number?: number | null;
  created_at: string;
}
