-- =============================================================================
-- 0002_highlights.sql
-- Tabela para biblioteca de highlights, vídeos curtos e melhores momentos (xplay.gg)
-- =============================================================================

create table if not exists public.championship_highlights (
  id               uuid primary key default gen_random_uuid(),
  championship_id  uuid not null references public.championships (id) on delete cascade,
  title            text not null check (char_length(title) between 1 and 120),
  description      text,
  video_url        text not null,
  player_name      text,
  round_number     integer,
  created_at       timestamptz not null default now()
);

create index if not exists idx_highlights_championship_id on public.championship_highlights (championship_id);

alter table public.championship_highlights enable row level security;

create policy "public read championship_highlights" 
  on public.championship_highlights 
  for select 
  to anon, authenticated 
  using (true);
