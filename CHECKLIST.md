# Spirit Master — Feature Checklist
## สถานะระบบทั้งหมด · อัปเดต: 2026-05-23

Legend: ✅ Done · 🔄 Partial · ⬜ Todo · 🚫 Blocked by dependency

---

## 🏗 Infrastructure

- [x] ✅ Supabase project setup (miffompdtiasgssndayp)
- [x] ✅ DB Schema: players, ghosts, saves, leaderboard
- [x] ✅ Row Level Security (RLS) ทุก table
- [x] ✅ supabase.js client (Auth + GhostService + SaveService + Leaderboard)
- [x] ✅ game-state.js (window.GS singleton)
- [x] ✅ ghost-data.js (GHOST_REG — 12 ผี)
- [x] ✅ seed.js (browser seed — 1 player + 5 ghosts + 10 items)
- [x] ✅ seed.sql (SQL seed for Supabase SQL Editor)
- [x] ✅ XAMPP localhost serve

---

## 🔐 Auth System

- [x] ✅ Login screen UI (dark fantasy style)
- [x] ✅ Register screen UI
- [x] ✅ signIn / signUp / signOut
- [x] ✅ Auto session restore (refresh หน้าแล้วยัง login อยู่)
- [x] ✅ Auth state machine: loading → login → game
- [ ] ⬜ Guest mode (ไม่ต้องสมัครเล่น demo ได้)
- [ ] ⬜ Social login (Google / Line)
- [ ] ⬜ Forgot password UI

---

## 🎮 Game Shell (game.html)

- [x] ✅ PlayerHUD (ชื่อ, Spirit Dust, Corruption bar) — live จาก GS
- [x] ✅ Bottom nav (5 ปุ่มหลัก)
- [x] ✅ Dev bar (toggle, switch screen, logout)
- [x] ✅ goTo(screenId) — global navigation
- [x] ✅ goTo(screenId, { ghostId }) — navigation with params
- [x] ✅ Error boundary (ป้องกัน crash ทั้งหน้า)
- [x] ✅ Loading state per screen (React.Suspense)
- [x] ✅ Back navigation stack (goBack())

---

## ⚔️ Battle System

### Battle Engine (battle_engine.js)
- [x] ✅ ATB loop (tick 100ms, fill = spd / ATB_K)
- [x] ✅ GUTS accumulation (per tick)
- [x] ✅ Bond-based AI (< 50 random, 50-79 class, 80+ smart)
- [x] ✅ Damage formula (str/mag × power × elemMod / def)
- [x] ✅ Element multipliers (±33%)
- [x] ✅ Skill types: physical, magical, heal, heal_all, drain, revive, buff, debuff, aoe
- [x] ✅ Status effects: burn, slow, taunt, atk_down, rage
- [x] ✅ DoT (burn dot per tick)
- [x] ✅ Win/lose detection
- [ ] ⬜ Critical hit system (secStats.crit)
- [ ] ⬜ Dodge/Accuracy check
- [ ] ⬜ Taunt logic (force target)
- [ ] ⬜ Wave system (enemy respawn)

### Battle Screen (battle-live.jsx)
- [x] ✅ Player team จาก GS.team (live DB)
- [x] ✅ Enemy team จาก chapter (scripted per chapter 1-4)
- [x] ✅ Live HP/ATB/GUTS bars (update ทุก 100ms)
- [x] ✅ Status effects display
- [x] ✅ Battle log (last 3 actions)
- [x] ✅ Pause/Resume button
- [x] ✅ Win → save Bond +5, chapter_step +1 to DB
- [x] ✅ Lose → show retry screen
- [x] ✅ Corruption display (live จาก GS.save)
- [ ] ⬜ Manual skill override (tap skill → execute)
- [ ] ⬜ Target selection UI (tap enemy card)
- [ ] ⬜ Battle entry animation
- [ ] ⬜ Skill animations (flash, damage pop)
- [ ] ⬜ Sound effects

---

## 👻 Ghost Roster (roster-live.jsx) ✅ Phase 1 DONE

- [x] ✅ UI design (filter tabs, team slots, grid)
- [x] ✅ Load ghosts จาก GS.ghosts (live)
- [x] ✅ Filter by element
- [x] ✅ Set team (tap ghost → assign slot → GhostService.setTeam())
- [ ] ⬜ Sort by level/bond/power
- [x] ✅ Tap ghost → goTo('detail', { ghostId })

---

## 🔍 Spirit Detail (spirit-detail-live.jsx) ✅ Phase 1 DONE

- [x] ✅ UI design (stats, frame, affixes, skills)
- [x] ✅ Receive ghostId param จาก goTo()
- [x] ✅ Load ghost data จาก GS.ghosts
- [x] ✅ Show real stats (level, bond, corruption)
- [x] ✅ Quick nav → Forge / Skill Tree / Amulet / Evolution
- [x] ✅ Bond + Corruption progress bars

---

## ⚒ Forge System (forge.jsx)

### Frame Enhancement
- [x] ✅ UI design (+12→+13, success rate curve) — hardcoded krasue
- [ ] ⬜ Load selected ghost frame data จาก GS
- [ ] ⬜ Enhance button → GhostService.enhanceFrame()
- [ ] ⬜ Success/fail animation
- [ ] ⬜ Protection amulet (ยันต์กันแตก) consumption
- [ ] ⬜ Save result to DB

### Mass Reroll (PoE Affixes)
- [x] ✅ UI design (affix tiers, reroll button) — hardcoded
- [ ] ⬜ Load selected ghost spirit_mass จาก GS
- [ ] ⬜ Reroll → random new affixes ตาม AFFIX_TABLE
- [ ] ⬜ Consume ผงอาถรรพ์ from inventory
- [ ] ⬜ Save new affixes to DB

---

## 🌳 Skill Tree (skill-tree.jsx)

- [x] ✅ UI design (yantra tree, 3 branches, keystone) — hardcoded
- [x] ✅ Node types: minor/notable/keystone
- [x] ✅ Visual: taken/available/locked states
- [ ] ⬜ Load selected ghost skill_tree จาก GS
- [ ] ⬜ Invest point → update GS + save to DB
- [ ] ⬜ Refund points (consume item)
- [ ] ⬜ Apply node bonuses to battle stats
- [ ] ⬜ Validate path (can't unlock locked node)

---

## 💎 Amulet Slots (amulet.jsx)

- [x] ✅ UI design (4 slots, inventory grid, replace preview) — hardcoded
- [ ] ⬜ Load ghost amulet_slots จาก GS
- [ ] ⬜ Load inventory items จาก GS.inventory
- [ ] ⬜ Equip amulet → update ghost.amulet_slots + save to DB
- [ ] ⬜ Unequip → return to inventory
- [ ] ⬜ Filter inventory by slot type (active/passive/utility)

---

## 🐉 Evolution System (evolution.jsx)

- [x] ✅ UI design (3-stage: base → evolved → mythic) — hardcoded krasue
- [x] ✅ Stat preview (before/after comparison bars)
- [x] ✅ Materials display
- [x] ✅ Corruption warning (+10 per evo)
- [ ] ⬜ Load selected ghost evo_stage จาก GS
- [ ] ⬜ Check materials (ดวงตาคนตาย etc.) in inventory
- [ ] ⬜ Evolve button → GhostService.evolve() + corruption +10
- [ ] ⬜ Unlock new skills on evo

---

## 🌿 Adventure System (adventure.jsx)

- [x] ✅ UI design (scene frame, choice buttons, text) — hardcoded
- [ ] ⬜ Load chapter/zone จาก GS.save
- [ ] ⬜ Random event picker (ตาม zone type)
- [ ] ⬜ Choice tap → SaveService.addDecision() + corruption delta
- [ ] ⬜ Mentor encounter → updateMentorBond()
- [ ] ⬜ Battle trigger (เดิน N ก้าว → goTo('battle'))
- [ ] ⬜ Resource reward (coins, items)
- [ ] ⬜ Twine story fragment injection

---

## 🗺 Roguelike Map (map-live.jsx) ✅ Phase 1 DONE

- [x] ✅ UI design (SVG node graph, paths, zones)
- [x] ✅ Load zone_id + steps_taken จาก GS.save
- [x] ✅ Node tap → goTo('adventure')
- [x] ✅ Show cleared/current/locked node states
- [x] ✅ Show mentor bonds
- [ ] ⬜ Advance zone (steps_taken ++)
- [ ] ⬜ Zone clear → unlock next zone
- [ ] ⬜ Boss node (every 10 steps)

---

## 🔮 Corruption Ending (corruption-ending.jsx) ✅ Phase 1 DONE

- [x] ✅ UI design (4 endings, decision log, rewards)
- [x] ✅ Read corruption_score จาก GS.save (live)
- [x] ✅ Read decisions[] จาก GS.save (real decisions)
- [x] ✅ Read mentor_bonds จาก GS.save
- [x] ✅ Highlight correct ending path (auto by corruption%)
- [x] ✅ Unlock conditions check (True End: corruption≤20 + all bonds≥60)
- [ ] ⬜ Submit to leaderboard on ending view

---

## 📖 Element Codex (element-codex.jsx)

- [x] ✅ Element chart display
- [x] ✅ Damage formula display
- [x] ✅ Tier/affix reference
- [x] ✅ Static content — no DB needed ✓

---

## 🔐 Phase 4 — Story (Not Started)

- [ ] ⬜ Mentor dialogue screen (4 อาจารย์: พระ/ชี/หมอผีจีน/หมอผีฝรั่ง)
- [ ] ⬜ Branching dialogue → affect bond/corruption
- [ ] ⬜ Chapter 1-4 story nodes
- [ ] ⬜ True/Good/Bad/Neutral ending unlock conditions
- [ ] ⬜ Twine story integration

---

## 🏆 Endgame / Social (Not Started)

- [ ] ⬜ Leaderboard screen
- [ ] ⬜ PvP matchmaking (3v3 vs other players)
- [ ] ⬜ Season ranking
- [ ] ⬜ Guild system

---

## 🛠 Technical Debt

- [x] ✅ goTo() รับ params { ghostId } — DONE
- [x] ✅ selectedGhostId context — DONE (window.selectedGhostId)
- [x] ✅ Error boundaries — DONE
- [ ] ⬜ battle.jsx (old) ยังอยู่ใน codebase — อาจลบออก
- [ ] ⬜ AFFIX_TABLE ยังไม่ได้ define (reroll ยังไม่ work)
- [ ] ⬜ Enhancement success rate curve ยังไม่ implement จริง
- [ ] ⬜ Inventory UI ยังไม่มี standalone screen
- [ ] ⬜ Mobile touch optimization (pinch, swipe)

---

## Progress Summary (อัปเดต 2026-05-23)

```
Phase 1 (Core MVP):     20/20 ✅ DONE
Phase 2 (Depth):         3/22 ✅
Phase 3 (Endgame):       2/10 ✅
Phase 4 (Story):         0/5  ⬜
Infra/Auth/Shell:       18/18 ✅ DONE

Total: ~43/75 features complete (57%)
```

### Phase 1 Files ที่ live แล้ว

| Screen | File | Status |
| --- | --- | --- |
| Battle | battle-live.jsx | ✅ GS.team + BattleEngine |
| Roster | roster-live.jsx | ✅ GS.ghosts + setTeam |
| Spirit Detail | spirit-detail-live.jsx | ✅ selectedGhostId |
| Map | map-live.jsx | ✅ GS.save zone/chapter |
| Corruption Ending | corruption-ending.jsx | ✅ GS.save live |
| Login | login.jsx | ✅ Supabase Auth |
