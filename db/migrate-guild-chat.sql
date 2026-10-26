-- ═══════════════════════════════════════════════════════
--  Spirit Master — Guild Chat Migration
--  วิ่งครั้งเดียวใน Supabase Dashboard → SQL Editor (หลัง migrate-guild.sql)
-- ═══════════════════════════════════════════════════════

create table if not exists guild_messages (
  id         uuid primary key default uuid_generate_v4(),
  guild_id   uuid references guilds(id) on delete cascade,
  player_id  uuid references players(id) on delete cascade,
  username   text not null,
  message    text not null check (char_length(message) between 1 and 300),
  created_at timestamptz default now()
);

create index if not exists idx_guild_messages_guild on guild_messages(guild_id, created_at desc);

alter table guild_messages enable row level security;

drop policy if exists "guild_messages_read"   on guild_messages;
drop policy if exists "guild_messages_insert" on guild_messages;

-- อ่านได้เฉพาะคนในกิลด์เดียวกัน
create policy "guild_messages_read" on guild_messages for select using (
  guild_id in (
    select guild_id from guild_members
    where player_id in (select id from players where user_id = auth.uid())
  )
);

-- ส่งได้เฉพาะคนในกิลด์เดียวกัน และต้องเป็นข้อความของตัวเอง
create policy "guild_messages_insert" on guild_messages for insert with check (
  player_id in (select id from players where user_id = auth.uid())
  and guild_id in (
    select guild_id from guild_members
    where player_id in (select id from players where user_id = auth.uid())
  )
);

-- ─────────────────────────────────────────
--  เปิด Realtime ให้ตารางนี้ด้วย (ไม่งั้น client subscribe ไม่เห็นข้อความใหม่):
--  Supabase Dashboard → Database → Replication → เปิด guild_messages
-- ─────────────────────────────────────────
