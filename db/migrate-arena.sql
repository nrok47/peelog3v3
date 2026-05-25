-- ═══════════════════════════════════════════════════════
--  Spirit Master — Arena Migration
--  เพิ่ม UPDATE policy ให้ leaderboard (สำหรับ upsert best score)
--  วิ่งครั้งเดียว
-- ═══════════════════════════════════════════════════════

drop policy if exists "leaderboard_update" on leaderboard;

create policy "leaderboard_update" on leaderboard
  for update using (
    player_id in (select id from players where user_id = auth.uid())
  );

-- ── Async PvP: defense team snapshot (เพิ่มหลัง migration แรก)
alter table leaderboard
  add column if not exists defense_team jsonb;
