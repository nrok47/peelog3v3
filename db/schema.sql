-- ═══════════════════════════════════════════════════════
--  Spirit Master — Supabase Schema
--  วิ่งใน: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════

-- ── Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
--  1. PLAYERS — ข้อมูลผู้เล่น
-- ─────────────────────────────────────────
create table if not exists players (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  username    text not null unique,
  title       text default 'จอมขมังเวทฝึกหัด',
  spirit_dust integer default 0,
  focus_pts   integer default 100,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─────────────────────────────────────────
--  2. GHOSTS — คลังผีของผู้เล่น
--  soul_core: stats + skills (locked per type)
--  frame: enhancement level + sockets
--  spirit_mass: PoE-style affixes
-- ─────────────────────────────────────────
create table if not exists ghosts (
  id           uuid primary key default uuid_generate_v4(),
  player_id    uuid references players(id) on delete cascade,

  -- Identity
  ghost_type   text not null,          -- 'pob' | 'krasue' | 'maeNak' ...
  nickname     text,                   -- ชื่อเล่นที่ผู้เล่นตั้ง
  evo_stage    integer default 0,      -- 0=base, 1=evolved, 2=mythic

  -- Progression
  level        integer default 1 check (level between 1 and 30),
  exp          integer default 0,
  bond         integer default 30 check (bond between 0 and 100),
  corruption   integer default 0 check (corruption between 0 and 100),

  -- Stat points (distributed by player on level-up)
  stat_points  integer default 0,
  stats        jsonb default '{
    "str": 30, "mag": 30, "def": 30,
    "spr": 30, "spd": 30, "hp": 1000
  }'::jsonb,

  -- Soul Core (locked — determined by ghost_type)
  soul_core    jsonb default '{}'::jsonb,

  -- Amulet Frame (+1 to +15)
  frame        jsonb default '{
    "enhancement": 0,
    "base_def": 30,
    "base_spr": 30,
    "sockets": []
  }'::jsonb,

  -- Spirit Mass (PoE affixes, rerollable)
  spirit_mass  jsonb default '{
    "affixes": [],
    "tier_history": []
  }'::jsonb,

  -- Skill Tree
  skill_tree   jsonb default '{
    "points_spent": 0,
    "nodes_taken": [],
    "branches": {"offense": 0, "resource": 0, "defense": 0}
  }'::jsonb,

  -- Amulet slots (4 sockets)
  amulet_slots jsonb default '[null, null, null, null]'::jsonb,

  is_in_team   boolean default false,
  team_slot    integer,                -- 0=front, 1=mid, 2=back

  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─────────────────────────────────────────
--  3. SAVES — Adventure progress + story state
-- ─────────────────────────────────────────
create table if not exists saves (
  id                uuid primary key default uuid_generate_v4(),
  player_id         uuid references players(id) on delete cascade,

  -- Story progress
  chapter           integer default 1 check (chapter between 1 and 4),
  chapter_step      integer default 0,
  corruption_score  integer default 0 check (corruption_score between 0 and 100),

  -- Roguelike map state
  zone_id           text default 'zone_01',
  steps_taken       integer default 0,
  zone_cleared      boolean default false,

  -- Mentor relationships (4 mentors)
  mentor_bonds      jsonb default '{
    "phra": 0,
    "chee": 0,
    "mo_jeen": 0,
    "mo_farang": 0
  }'::jsonb,

  -- Key decisions that affected story
  decisions         jsonb default '[]'::jsonb,

  -- Resources
  resources         jsonb default '{
    "coins": 200,
    "necro_fluid": 0
  }'::jsonb,

  -- Active ending path (computed, cached)
  current_ending    text default 'neutral',   -- 'good'|'neutral'|'bad'|'true'

  is_active         boolean default true,      -- current active save
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─────────────────────────────────────────
--  4. LEADERBOARD (optional)
-- ─────────────────────────────────────────
create table if not exists leaderboard (
  id          uuid primary key default uuid_generate_v4(),
  player_id   uuid references players(id) on delete cascade,
  username    text not null,
  score       integer default 0,
  ending      text,
  season      text default '2025-S1',
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────
--  INDEXES — เพิ่ม query speed
-- ─────────────────────────────────────────
create index if not exists idx_ghosts_player    on ghosts(player_id);
create index if not exists idx_ghosts_type      on ghosts(ghost_type);
create index if not exists idx_saves_player     on saves(player_id);
create index if not exists idx_leaderboard_score on leaderboard(score desc);

-- ─────────────────────────────────────────
--  ROW LEVEL SECURITY — ผู้เล่นดูได้เฉพาะข้อมูลตัวเอง
-- ─────────────────────────────────────────
alter table players     enable row level security;
alter table ghosts      enable row level security;
alter table saves       enable row level security;

-- Drop policies ก่อน (safe re-run)
drop policy if exists "players_own"       on players;
drop policy if exists "ghosts_own"        on ghosts;
drop policy if exists "saves_own"         on saves;
drop policy if exists "leaderboard_read"  on leaderboard;
drop policy if exists "leaderboard_write" on leaderboard;

-- Players: ดู/แก้เฉพาะตัวเอง
create policy "players_own" on players
  for all using (auth.uid() = user_id);

-- Ghosts: ดู/แก้เฉพาะผีตัวเอง
create policy "ghosts_own" on ghosts
  for all using (
    player_id in (select id from players where user_id = auth.uid())
  );

-- Saves: ดู/แก้เฉพาะ save ตัวเอง
create policy "saves_own" on saves
  for all using (
    player_id in (select id from players where user_id = auth.uid())
  );

-- Leaderboard: อ่านได้ทุกคน, เขียนได้เฉพาะตัวเอง
alter table leaderboard enable row level security;
create policy "leaderboard_read"  on leaderboard for select using (true);
create policy "leaderboard_write" on leaderboard for insert with check (
  player_id in (select id from players where user_id = auth.uid())
);

-- ─────────────────────────────────────────
--  AUTO-UPDATE updated_at
-- ─────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Drop triggers ก่อน (safe re-run)
drop trigger if exists trg_players_updated on players;
drop trigger if exists trg_ghosts_updated  on ghosts;
drop trigger if exists trg_saves_updated   on saves;

create trigger trg_players_updated before update on players
  for each row execute function update_updated_at();
create trigger trg_ghosts_updated  before update on ghosts
  for each row execute function update_updated_at();
create trigger trg_saves_updated   before update on saves
  for each row execute function update_updated_at();
