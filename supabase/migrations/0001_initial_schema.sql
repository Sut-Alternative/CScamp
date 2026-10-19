-- =============================================================================
-- CScamp — Schema inicial
-- Execute no SQL Editor do Supabase (ou via `supabase db push`).
--
-- Modelo de acesso:
--   * Leitura pública (anon) em todas as tabelas de exibição → placar ao vivo.
--   * NENHUMA política de escrita para anon/authenticated. Todas as escritas
--     (webhook GSI e painel admin) acontecem no servidor com a SECRET KEY
--     (service_role), que ignora RLS.
--   * Credenciais GSI ficam numa tabela separada SEM políticas → invisível
--     para o público, inclusive via Realtime.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.championship_status as enum ('pending', 'active', 'finished');
create type public.match_status        as enum ('scheduled', 'live', 'finished');

-- ---------------------------------------------------------------------------
-- Helper: updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Championships
-- ---------------------------------------------------------------------------
create table public.championships (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  status      public.championship_status not null default 'pending',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Teams
-- ---------------------------------------------------------------------------
create table public.teams (
  id               uuid primary key default gen_random_uuid(),
  championship_id  uuid not null references public.championships (id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 80),
  logo_url         text,
  created_at       timestamptz not null default now(),
  unique (championship_id, name)
);
create index teams_championship_id_idx on public.teams (championship_id);

-- ---------------------------------------------------------------------------
-- 3. Players
--    steam_id é TEXT de propósito: o SteamID64 (17 dígitos) estoura a precisão
--    de Number no JavaScript. Deve bater EXATAMENTE com `provider.steamid` /
--    chaves de `allplayers` no payload GSI.
-- ---------------------------------------------------------------------------
create table public.players (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 64),
  steam_id    text not null check (steam_id ~ '^[0-9]{17}$'),
  created_at  timestamptz not null default now(),
  unique (team_id, steam_id)
);
create index players_team_id_idx  on public.players (team_id);
create index players_steam_id_idx on public.players (steam_id);

-- ---------------------------------------------------------------------------
-- 4. Matches
-- ---------------------------------------------------------------------------
create table public.matches (
  id                 uuid primary key default gen_random_uuid(),
  championship_id    uuid not null references public.championships (id) on delete cascade,
  team_a_id          uuid not null references public.teams (id) on delete restrict,
  team_b_id          uuid not null references public.teams (id) on delete restrict,
  status             public.match_status not null default 'scheduled',
  map_name           text,
  team_a_score       integer not null default 0 check (team_a_score >= 0),
  team_b_score       integer not null default 0 check (team_b_score >= 0),
  -- Slug usado na URL do webhook: /api/gsi/{gsi_endpoint_slug}
  gsi_endpoint_slug  text not null unique
                     check (gsi_endpoint_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
                            and char_length(gsi_endpoint_slug) <= 64),
  -- Chaveamento (brackets): rodada e posição dentro da rodada. Opcionais.
  bracket_round      integer check (bracket_round >= 1),
  bracket_position   integer check (bracket_position >= 1),
  -- Último round processado pelo webhook (evita contagem duplicada de HS/dano).
  current_round      integer not null default 0 check (current_round >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (team_a_id <> team_b_id)
);
create index matches_championship_id_idx on public.matches (championship_id);
create index matches_status_idx          on public.matches (status);

create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4b. Match GSI credentials (PRIVADA — sem políticas RLS)
--     Token enviado pelo bloco "auth" do .cfg do GSI e validado no webhook,
--     impedindo que qualquer pessoa que descubra o slug forje placares.
-- ---------------------------------------------------------------------------
create table public.match_gsi_credentials (
  match_id    uuid primary key references public.matches (id) on delete cascade,
  auth_token  text not null default replace(gen_random_uuid()::text, '-', ''),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. Match_Stats (tempo real)
-- ---------------------------------------------------------------------------
create table public.match_stats (
  id            uuid primary key default gen_random_uuid(),
  match_id      uuid not null references public.matches (id) on delete cascade,
  player_id     uuid not null references public.players (id) on delete cascade,
  kills         integer not null default 0 check (kills >= 0),
  deaths        integer not null default 0 check (deaths >= 0),
  assists       integer not null default 0 check (assists >= 0),
  headshots     integer not null default 0 check (headshots >= 0),
  -- HS% = (headshots / kills) * 100 — calculado pelo banco, sempre consistente.
  hs_percent    numeric(5, 2) generated always as (
                  case when kills > 0
                       then round((headshots::numeric / kills) * 100, 2)
                       else 0 end
                ) stored,
  -- Dano acumulado (base para ADR = total_damage / rounds jogados).
  total_damage  integer not null default 0 check (total_damage >= 0),
  adr           numeric(6, 2) not null default 0 check (adr >= 0),
  mvps          integer not null default 0 check (mvps >= 0),
  score         integer not null default 0,
  updated_at    timestamptz not null default now(),
  unique (match_id, player_id)   -- alvo do UPSERT do webhook
);
create index match_stats_match_id_idx on public.match_stats (match_id);

create trigger match_stats_set_updated_at
  before update on public.match_stats
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.championships          enable row level security;
alter table public.teams                  enable row level security;
alter table public.players                enable row level security;
alter table public.matches                enable row level security;
alter table public.match_stats            enable row level security;
alter table public.match_gsi_credentials  enable row level security;

create policy "public read championships" on public.championships for select to anon, authenticated using (true);
create policy "public read teams"         on public.teams         for select to anon, authenticated using (true);
create policy "public read players"       on public.players       for select to anon, authenticated using (true);
create policy "public read matches"       on public.matches       for select to anon, authenticated using (true);
create policy "public read match_stats"   on public.match_stats   for select to anon, authenticated using (true);
-- match_gsi_credentials: intencionalmente SEM políticas (apenas service_role).

-- ---------------------------------------------------------------------------
-- Realtime: o placar ao vivo escuta estas tabelas
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.matches, public.match_stats;
