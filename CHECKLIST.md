# Spirit Master — Feature Checklist
## สถานะระบบทั้งหมด · อัปเดต: 2026-06-18 (ตรวจจาก source code จริงใน `client/src/`, ไม่ใช่จากคำอธิบายเก่า)

> ฉบับนี้แทนทั้ง CHECKLIST.md เดิม (2026-05-23) และ Roadmap ใน CLAUDE.md (2026-05-24) — ทั้งสองไฟล์ตามหลังโค้ดจริงไปไกลมาก (มี commit feature ใหม่ๆ ทับไปแล้ว 30+ ครั้งหลังจากนั้น) ตรวจซ้ำได้จาก `git log` + อ่านโค้ดใน `client/src/screens/*.tsx`, `store/gameStore.ts`

Legend: ✅ Done (เห็นโค้ด wiring จริง) · 🟡 Partial (UI/logic มีบางส่วน) · ⬜ Todo · — ไม่ได้ตรวจ

---

## ⚠️ สิ่งสำคัญที่ต้องรู้ก่อนอ่านต่อ

1. **โปรเจคจริงอยู่ที่ `client/` เท่านั้น** (Vite + React + TS + Zustand) — ไฟล์ `.jsx` ที่ root (`battle-live.jsx`, `roster-live.jsx` ฯลฯ) เป็น prototype เก่า**ไม่ถูกใช้แล้ว**
2. ~~`Forge.tsx` / `SkillTree.tsx` / `Amulet.tsx` / `Evolution.tsx` เป็น dead code~~ — **ลบแล้ว 2026-06-18** (ยืนยันไม่มี import เหลือ + build ผ่าน)
3. Routes จริงทั้งหมด (จาก `App.tsx`): `/login /home /battle /roster /spirit/:id /map /upgrade /arena /adventure /codex /ending /guild`
4. **`db/migrate-guild.sql` ยังไม่ได้รันใน Supabase จริง** — ต้องไปรันใน Supabase Dashboard → SQL Editor ก่อน guild feature จะใช้งานได้ (ตาราง `guilds`/`guild_members` ยังไม่มีถ้ายังไม่รัน)

---

## 🏗 Infrastructure

- [x] ✅ Supabase project (auth + DB + RLS)
- [x] ✅ Zustand store (`gameStore.ts`) — action ครบ: loadAll, signIn/Up/Out, updateGhost, setTeam, summonGhost, addBattleRewards, applyAdventureChoice, advanceZoneStep, setFieldAmulet, submitArenaScore, saveDefenseTeam, loadGuild/createGuild/joinGuild/leaveGuild
- [x] ✅ GitHub Actions CI/CD → deploy GitHub Pages (`https://nrok47.github.io/peelog3v3/`)
- [x] ✅ HashRouter (รองรับ GitHub Pages ไม่ต้อง 404.html hack)

---

## 🔐 Auth + Onboarding

- [x] ✅ Sign in / Sign up / Sign out
- [x] ✅ Starter ghost อัตโนมัติให้ player ใหม่ (random common)
- [x] ✅ Session persist ผ่าน Supabase Auth
- [ ] ⬜ Guest mode
- [ ] ⬜ Social login

---

## 🎮 Gacha / Roster

- [x] ✅ 3-pool summon (basic/premium/festival) + rarity table จริง
- [x] ✅ Innate affix ติดผีตอน summon ตาม rarity (legendary/rare/uncommon 20%)
- [x] ✅ Roster filter/sort (level, bond, element, rarity), EXP bar, stat_points alert
- [x] ✅ Spend dust จริงผ่าน `spendDust()` (ตัด DB จริง ไม่ใช่แค่เช็ค)

---

## ⚔️ Battle System (`Battle.tsx`, 1196 บรรทัด — ใหญ่สุดในโปรเจค)

- [x] ✅ ATB loop (100ms tick), GUTS, bond-based AI (random/class/smart)
- [x] ✅ Damage formula + element multiplier (ตรงตาม ELEMENT_CHART)
- [x] ✅ **Final stats รวม Frame DEF/SPR + Spirit Mass affixes + Skill Tree nodes + Field Amulet เข้า combat จริง** (เดิม checklist บอกว่ายังไม่ wire — ตอนนี้ wire แล้วทุกระบบ)
- [x] ✅ Critical hit (ผ่าน skill node `'crit'` ใน skill tree — ไม่ใช่ stat อิสระ)
- [x] ✅ Battle Rewards: EXP + level up + stat_points +3/level + bond +2 + dust reward (`addBattleRewards`)
- [x] ✅ Enemy scaling ตาม zone/boss level (`buildZoneEnemies` ใน `data/zones.ts`)
- [x] ✅ Attack animation (projectile orb + card flash) + animated sprite (prototype 3 ตัว)
- [x] ✅ Speed selector x1/x2/x3/x4, Flee button (มี confirm)
- [x] ✅ Team select 1-3 ตัว (ไม่บังคับครบทีม 3)
- [ ] ⬜ Dodge/Accuracy check
- [ ] ⬜ Taunt force-target logic
- [ ] ⬜ Wave system (enemy respawn ระหว่าง battle)

---

## 🌿 Adventure (`Adventure.tsx`, 797 บรรทัด — รีไรท์ทั้งยวง 2026-05-25)

- [x] ✅ "Capybara Go!" style auto-walk loop (ไม่ใช่ scripted choice เดิมแล้ว)
- [x] ✅ Choice outcome → `applyAdventureChoice()` → corruption delta + dust + bond บันทึกจริงลง DB
- [x] ✅ Speed selector, pause, run-length picker, difficulty indicator
- [x] ✅ Event gating ตาม chapter/corruption threshold — wired แล้ว 2026-06-18 (boon ขั้นสูง 3 ตัวล็อคด้วย `chapterReq` 2-3, Hazard โหดขึ้นเมื่อ corruption≥50 — "corruption spiral")
- [ ] ⬜ Mentor encounter / mentor bond system (mentor_bonds field มีใน schema แต่ไม่เจอ UI ใช้งาน)

---

## 🗺 Map / Zone System (`Map.tsx` + `data/zones.ts`)

- [x] ✅ 5 zones จริง (ป่าผีสิง→วัดร้าง→บึงสาปมรณะ→ป่าช้าโบราณ→เมืองล่างดิน), 5 steps/zone, boss ทุกโซน
- [x] ✅ Zone unlock + chapter advance ผ่าน `advanceZoneStep()` (เรียกจาก Battle.tsx ตอนชนะ)
- [x] ✅ Boss battle = step สุดท้ายของโซน (enemy pool พิเศษ + level สูงกว่า)
- [x] ✅ Steps tracker แสดงผลใน Map.tsx (locked/current/cleared state)

---

## 🛠 Upgrade Screen (`Upgrade.tsx`, 511 บรรทัด — รวม 4 ระบบเดิม)

### Forge (Frame + Mass)
- [x] ✅ Frame enhancement → +DEF/+SPR สะสม, cost เพิ่มตามระดับ, ตัด dust จริง
- [x] ✅ Mass reroll → affix pool สุ่ม 2-3 ชิ้น, ตัด dust จริง, ผลไป apply ใน Battle.tsx จริง (เดิม checklist บอก "AFFIX_TABLE ยังไม่ define" — ผิดแล้ว มีและ wire ครบ)

### Skill Tree
- [x] ✅ 40 nodes, 4 branches, tier system
- [x] ✅ Save unlocked nodes ลง `ghost.skill_tree` (JSONB) จริง
- [x] ✅ Apply node bonus เข้า battle จริง (เช่น crit node)
- [x] ✅ stat_points หักตอนปลดล็อค, ได้จาก level up

### Amulet
- [x] ✅ Field slot system (1 slot/ช่อง แทนติดตัวละคร) ผ่าน `setFieldAmulet()`
- [x] ✅ Apply field amulet เข้า battle stats จริง

### Evolution
- [x] ✅ 3-stage (base→evolved→mythic), level+dust requirement, stat scale ผ่าน `evo_stage`
- [x] ✅ Visual: evo ring สี/glow ใน `Chibi.tsx` (รับ `evoStage` prop)

---

## 🏆 Arena / PvP (`Arena.tsx`, 222 บรรทัด — ระบบใหม่ ไม่อยู่ใน roadmap เดิมเลย)

- [x] ✅ Async PvP (Defense Team Payload) — ไม่ใช่ live matchmaking โดยตั้งใจ
- [x] ✅ Defense team save (`saveDefenseTeam`)
- [x] ✅ Leaderboard จริงจาก Supabase (top 10 + ตำแหน่งตัวเอง) ผ่าน `LeaderboardService`
- [x] ✅ Score submission (`submitArenaScore`) เรียกจาก Battle.tsx ตอนจบ PvP
- [x] ✅ Rank tier display (ไอคอน/สีตามคะแนน)
- [x] ✅ Season ranking — wired แล้ว 2026-06-19: `lib/season.ts` คำนวณ season id จากปี-เดือนปัจจุบัน (`YYYY-MM`) หมุนรายเดือนอัตโนมัติ แทน hardcode `'2026-S1'` ทุกที่ใน `LeaderboardService`, แสดงวันที่เหลือของ season ใน Arena
- [x] ✅ Guild system V1 — wired แล้ว 2026-06-19: ตาราง `guilds`/`guild_members` (migration `db/migrate-guild.sql` — **ยังไม่รันใน Supabase จริง**), `GuildService` (create/join/leave/roster/guild leaderboard), หน้า `/guild` (สร้าง/เข้าร่วม/ดู roster/ออก), tab "กิลด์" ใน Arena leaderboard + quick-link card
- [x] ✅ Guild chat — wired แล้ว 2026-06-19: ตาราง `guild_messages` (migration `db/migrate-guild-chat.sql` — **ยังไม่รันใน Supabase จริง**), อ่าน/ส่งจำกัดเฉพาะคนในกิลด์เดียวกัน (RLS), realtime ผ่าน Supabase `postgres_changes` channel (**ต้องเปิด Realtime replication ให้ตาราง `guild_messages` ใน Supabase Dashboard ด้วย ไม่งั้นข้อความใหม่จะไม่เด้งสด ต้อง refresh เอง**), แชทอยู่ในหน้า `/guild`
  - ไม่มี: guild war, donation/bank, kick member, leadership transfer, แก้/ลบข้อความ, rate limit การส่ง — known gap ทำทีหลังถ้าจำเป็น

---

## 🔮 Corruption Ending (`CorruptionEnding.tsx`, 213 บรรทัด)

- [x] ✅ 4 endings, unlock condition ตาม corruption score (อ่านจาก `save.corruption_score` live)
- [x] ✅ Decision log อ่านจาก `save.decisions[]` จริง (ไม่ hardcode)
- [x] ✅ Highlight ending ปัจจุบันอัตโนมัติ
- [x] ✅ Leaderboard submission ตอนจบเกม — wired แล้ว 2026-06-18 (`handleSubmit` → `submitArenaScore`, score = chapter×100 + avgBond×5 + ghosts.length×20, มี loading/submitted state)
- [ ] ⬜ New Game+ — ไม่มีโค้ดเลย (grep ทั้ง repo ไม่เจอ)

---

## 📖 Element Codex

- [x] ✅ Static content ครบ (ไม่ต้อง DB ตามดีไซน์)

---

## 🧹 Technical Debt (ยืนยันจากโค้ดจริง)

- [ ] ⬜ **ลบไฟล์ตาย 4 ไฟล์**: `screens/Forge.tsx`, `SkillTree.tsx`, `Amulet.tsx`, `Evolution.tsx` (~920 บรรทัดรวม) — ถูกแทนที่ด้วย `Upgrade.tsx` หมดแล้ว ไม่มี route เรียกใช้
- [ ] ⬜ ไฟล์ `.jsx` เก่าที่ root ของ `peelog3v3/` (`battle-live.jsx`, `game.html` ฯลฯ) — prototype ก่อน migrate ไป Vite, ไม่ถูกใช้ แต่ยังอยู่ใน repo
- [ ] ⬜ Bundle size ~535KB (ยังไม่ verify ซ้ำ — ตามที่ CLAUDE.md เคยบันทึกไว้, ควร lazy-import หน้า Battle)
- [ ] ⬜ `focus_pts` field ใน players table — ยังไม่มีระบบใช้งาน (ตามที่ CLAUDE.md บันทึกไว้, ยังไม่ verify ซ้ำ)
- [x] ✅ Mobile touch optimization — wired แล้ว 2026-06-18: `viewport-fit=cover`+`user-scalable=no` ใน index.html (เดิม `env(safe-area-inset-bottom)` ใน `.bottom-nav` ไม่ทำงานจริงเพราะขาด `viewport-fit=cover`), `touch-action:manipulation` กันดับเบิลแท็บซูม, `overscroll-behavior-y:none` กัน rubber-band, `-webkit-touch-callout:none`+`user-select:none` บน button/.card/.nav-item/a กัน long-press callout
- [ ] ⬜ Standalone Inventory screen — ไม่มี route `/inventory`

---

## Progress Summary (ตรวจจาก source 2026-06-18)

```
Infra/Auth/Roster:        DONE
Battle Core + Rewards:    DONE (Sprint 4 เสร็จจริง ตรงข้ามกับที่ roadmap เก่าบอก)
Adventure:                DONE core loop, ขาด event gating + mentor bond UI
Map/Zone (Sprint 9):       DONE
Upgrade (Forge/Skill/      DONE ทั้ง 4 ระบบ wire เข้า battle จริง
  Amulet/Evo, Sprint 6-8):
Arena/PvP:                 DONE (ระบบใหม่ทั้งหมด ไม่อยู่ใน roadmap เดิม)
Ending (Sprint 10):        🟡 เหลือ "submit leaderboard ตอนจบ" + New Game+

สรุป: ระบบเกมเพลย์หลัก (gacha→battle→progression→PvP) จบลูปสมบูรณ์แล้ว
งานที่เหลือจริงๆมีน้อยกว่าที่ doc เก่าบอกมาก — ส่วนใหญ่เป็น polish/endgame ไม่ใช่ core
```

### งานที่เหลือจริง เรียงตามผลกระทบ

```
✅ 1. ผูก submitArenaScore เข้า CorruptionEnding.tsx          — เสร็จ 2026-06-18
✅ 2. ลบ 4 ไฟล์ dead code (Forge/SkillTree/Amulet/Evolution)  — เสร็จ 2026-06-18
✅ 3. Event gating ใน Adventure (chapter boon lock + corruption spiral) — เสร็จ 2026-06-18
✅ 4. Mobile touch optimization (viewport-fit, touch-action, overscroll, callout) — เสร็จ 2026-06-18
✅ 5. Season ranking (รายเดือนอัตโนมัติ) + Guild system V1 (create/join/leave/roster/leaderboard) — เสร็จ 2026-06-19
   ⚠️ ต้องรัน db/migrate-guild.sql ใน Supabase ก่อนใช้งานจริงได้

6. New Game+ (reset save, เก็บ ghosts)
```
