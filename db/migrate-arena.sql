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
