/**
 * Tipagens do banco de dados (Supabase / PostgreSQL).
 *
 * Espelha `supabase/migrations/0001_initial_schema.sql` no mesmo formato gerado
 * pelo Supabase CLI. Quando o projeto estiver linkado, pode ser regenerado com:
 *
 *   npx supabase gen types typescript --project-id <ID> > src/types/database.ts
 *
 * (mantenha os aliases de conveniência do final do arquivo ao regenerar).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      championships: {
        Row: {
          id: string;
          name: string;
          status: Database["public"]["Enums"]["championship_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: Database["public"]["Enums"]["championship_status"];
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["championship_status"];
          created_at?: string;
        };
        Relationships: [];
      };

      teams: {
        Row: {
          id: string;
          championship_id: string;
          name: string;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          championship_id: string;
          name: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          championship_id?: string;
          name?: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
        ];
      };

      players: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          /** SteamID64 como string (17 dígitos) — chave de cruzamento com o GSI. */
          steam_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          steam_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          steam_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };

      matches: {
        Row: {
          id: string;
          championship_id: string;
          team_a_id: string;
          team_b_id: string;
          status: Database["public"]["Enums"]["match_status"];
          map_name: string | null;
          team_a_score: number;
          team_b_score: number;
          gsi_endpoint_slug: string;
          bracket_round: number | null;
          bracket_position: number | null;
          current_round: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          championship_id: string;
          team_a_id: string;
          team_b_id: string;
          status?: Database["public"]["Enums"]["match_status"];
          map_name?: string | null;
          team_a_score?: number;
          team_b_score?: number;
          gsi_endpoint_slug: string;
          bracket_round?: number | null;
          bracket_position?: number | null;
          current_round?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          championship_id?: string;
          team_a_id?: string;
          team_b_id?: string;
          status?: Database["public"]["Enums"]["match_status"];
          map_name?: string | null;
          team_a_score?: number;
          team_b_score?: number;
          gsi_endpoint_slug?: string;
          bracket_round?: number | null;
          bracket_position?: number | null;
          current_round?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_team_a_id_fkey";
            columns: ["team_a_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_team_b_id_fkey";
            columns: ["team_b_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };

      /** Tabela privada (sem RLS policies) — acessível apenas com a secret key. */
      match_gsi_credentials: {
        Row: {
          match_id: string;
          auth_token: string;
          created_at: string;
        };
        Insert: {
          match_id: string;
          auth_token?: string;
          created_at?: string;
        };
        Update: {
          match_id?: string;
          auth_token?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "match_gsi_credentials_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: true;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
        ];
      };

      match_stats: {
        Row: {
          id: string;
          match_id: string;
          player_id: string;
          kills: number;
          deaths: number;
          assists: number;
          headshots: number;
          /** Coluna gerada: (headshots / kills) * 100. Somente leitura. */
          hs_percent: number;
          total_damage: number;
          adr: number;
          mvps: number;
          score: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          player_id: string;
          kills?: number;
          deaths?: number;
          assists?: number;
          headshots?: number;
          hs_percent?: never;
          total_damage?: number;
          adr?: number;
          mvps?: number;
          score?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          player_id?: string;
          kills?: number;
          deaths?: number;
          assists?: number;
          headshots?: number;
          hs_percent?: never;
          total_damage?: number;
          adr?: number;
          mvps?: number;
          score?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "match_stats_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      championship_status: "pending" | "active" | "finished";
      match_status: "scheduled" | "live" | "finished";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ---------------------------------------------------------------------------
// Aliases de conveniência
// ---------------------------------------------------------------------------
type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];

export type Championship = Tables<"championships">;
export type Team = Tables<"teams">;
export type Player = Tables<"players">;
export type Match = Tables<"matches">;
export type MatchStats = Tables<"match_stats">;
export type MatchGsiCredentials = Tables<"match_gsi_credentials">;

export type ChampionshipStatus = Enums<"championship_status">;
export type MatchStatus = Enums<"match_status">;

/** Valores dos enums em runtime (para selects, validação com zod etc.). */
export const CHAMPIONSHIP_STATUSES = [
  "pending",
  "active",
  "finished",
] as const satisfies readonly ChampionshipStatus[];

export const MATCH_STATUSES = [
  "scheduled",
  "live",
  "finished",
] as const satisfies readonly MatchStatus[];
