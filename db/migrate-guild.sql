-- ═══════════════════════════════════════════════════════
--  Spirit Master — Guild Migration (V1: create/join/leave + leaderboard)
--  วิ่งครั้งเดียวใน Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

create table if not exists guilds (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  tag        text not null unique,
  leader_id  uuid references players(id) on delete set null,
  created_at timestamptz default now()
);

-- username denormalized (เหมือน leaderboard.username) — กัน RLS ของ players
-- ไม่ให้อ่าน username คนอื่นได้ตอน join roster
create table if not exists guild_members (
  id         uuid primary key default uuid_generate_v4(),
  guild_id   uuid references guilds(id) on delete cascade,
  player_id  uuid references players(id) on delete cascade unique,
  username   text not null,
  role       text default 'member' check (role in ('leader','member')),
  joined_at  timestamptz default now()
);

create index if not exists idx_guild_members_guild on guild_members(guild_id);

alter table guilds        enable row level security;
alter table guild_members enable row level security;

drop policy if exists "guilds_read"          on guilds;
drop policy if exists "guilds_insert"        on guilds;
drop policy if exists "guild_members_read"   on guild_members;
drop policy if exists "guild_members_insert" on guild_members;
drop policy if exists "guild_members_delete" on guild_members;

-- ดูกิลด์ทั้งหมดได้ (browse/join + guild leaderboard ต้องรวมคะแนนข้ามผู้เล่น)
create policy "guilds_read" on guilds for select using (true);

create policy "guilds_insert" on guilds for insert with check (
  leader_id in (select id from players where user_id = auth.uid())
);

create policy "guild_members_read" on guild_members for select using (true);

create policy "guild_members_insert" on guild_members for insert with check (
  player_id in (select id from players where user_id = auth.uid())
);

create policy "guild_members_delete" on guild_members for delete using (
  player_id in (select id from players where user_id = auth.uid())
);

-- ─────────────────────────────────────────
--  รู้ไว้: ไม่มี leadership transfer ใน V1
--  ถ้า leader ออกแต่ยังมีสมาชิกเหลือ กิลด์จะไม่มี leader ชั่วคราว
--  (ของจริง: 1 player = 1 guild เท่านั้น บังคับด้วย unique บน player_id)
-- ─────────────────────────────────────────
