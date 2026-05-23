# Spirit Master — Thai Ghost RPG
## CLAUDE.md · Project Reference

---

## Overview

**จอมขมังเวทน้อย: ผีไทยป่วนเมือง**
Thai Ghost Collector × TinyRTS × 3v3 Auto ATB Battle

Concept:
- ภายนอก = Chibi น่ารัก (Loveable)
- ข้างใน = Dark story สไตล์ Devilman (4 บท, Corruption system)

---

## Tech Stack

| ชั้น | Technology |
|------|-----------|
| UI | React 18 + Babel (in-browser, ไม่ต้อง build) |
| Styling | CSS custom properties (styles.css) |
| DB | Supabase (PostgreSQL + RLS + Realtime) |
| Auth | Supabase Auth (email/password) |
| Server | XAMPP localhost |

**ไม่ต้องมี npm / build step** — เปิด `game.html` ใน browser ได้เลย

---

## URLs

| | URL |
|-|-----|
| Game (interactive) | `http://localhost/peelogGame/peelog3v3/game.html` |
| Design review | `http://localhost/peelogGame/peelog3v3/index.html` |
| Supabase dashboard | `https://supabase.com/dashboard/project/miffompdtiasgssndayp` |

---

## File Structure

```
peelog3v3/
├── game.html              ← Entry point (game shell + auth + routing)
├── index.html             ← Design canvas (all artboards side-by-side)
├── styles.css             ← Design tokens (--void, --gold, --bone, --corruption…)
│
├── CLAUDE.md              ← This file
├── CHECKLIST.md           ← Feature status checklist
│
│── chibi.jsx              ← Chibi ghost artwork components + SPIRITS display map
├── battle.jsx             ← Battle screen (design mockup, hardcoded)
├── battle-live.jsx        ← ⭐ Live battle screen (connected to GS.team + BattleEngine)
├── spirit-detail.jsx      ← Spirit detail (Core/Frame/Mass) — hardcoded
├── roster-map.jsx         ← Roster + Roguelike Map — hardcoded
├── element-codex.jsx      ← Element chart reference — static OK
├── forge.jsx              ← Forge (Frame enhance + Mass reroll) — hardcoded
├── adventure.jsx          ← Adventure event screen — hardcoded
├── skill-tree.jsx         ← Skill Tree UI — hardcoded nodes
├── amulet.jsx             ← Amulet Slots screen — hardcoded
├── evolution.jsx          ← Evolution/Awakening screen — hardcoded
├── corruption-ending.jsx  ← Corruption Ending preview — hardcoded
├── login.jsx              ← ⭐ Login/Register screen (connected to Supabase Auth)
├── design-canvas.jsx      ← Design canvas layout component
│
└── db/
    ├── ghost-data.js      ← ⭐ GHOST_REG (12 ผี + skills + baseStats)
    ├── supabase.js        ← ⭐ Supabase client + Auth/GhostService/SaveService
    ├── game-state.js      ← ⭐ window.GS singleton (load/cache all player data)
    ├── seed.js            ← Browser seed: await SpiritDB.seed()
    ├── seed.sql           ← SQL seed (Supabase SQL Editor)
    ├── schema.sql         ← DB schema (run once in Supabase SQL Editor)
    └── migrate-inventory.sql ← Migration: add inventory column
```

---

## Global State: window.GS

```js
window.GS = {
  player:    { id, username, title, spirit_dust, scrolls, inventory[] },
  ghosts:    [],           // all ghosts owned
  team:      [],           // 3 ghosts in active team (sorted by team_slot)
  save:      { chapter, chapter_step, corruption_score, zone_id,
               mentor_bonds, decisions[], resources, current_ending },
  inventory: [],           // items array (from player.inventory JSONB)

  // Methods
  updateGhost(ghostId, changes),    // update + sync cache
  addDecision(decision),            // save story choice + recalc corruption
  setTeam(slots),                   // set 3-slot team + sync cache
  refresh(),                        // reload all from DB
}
```

Access anywhere: `window.GS.team`, `window.GS.save.corruption_score` etc.

---

## DB Services (window.SpiritDB)

```js
// Auth
SpiritDB.Auth.signIn(email, password)
SpiritDB.Auth.signUp(email, password, username)
SpiritDB.Auth.signOut()
SpiritDB.Auth.getSession()
SpiritDB.Auth.getPlayer()           // returns players record

// Ghosts
SpiritDB.GhostService.getAll(playerId)
SpiritDB.GhostService.getTeam(playerId)
SpiritDB.GhostService.add(playerId, ghostType, initialData)
SpiritDB.GhostService.update(ghostId, changes)
SpiritDB.GhostService.setTeam(playerId, [{ghostId, slot}])
SpiritDB.GhostService.enhanceFrame(ghostId, currentFrame)
SpiritDB.GhostService.evolve(ghostId, currentStage)
SpiritDB.GhostService.queryByElement(playerId, element, minBond)

// Saves
SpiritDB.SaveService.getCurrent(playerId)
SpiritDB.SaveService.createNew(playerId)
SpiritDB.SaveService.checkpoint(saveId, updates)
SpiritDB.SaveService.addDecision(saveId, decisions, newDecision)
SpiritDB.SaveService.updateMentorBond(saveId, bonds, mentor, delta)

// Leaderboard
SpiritDB.LeaderboardService.getTop(limit)
SpiritDB.LeaderboardService.submit(playerId, username, score, ending)
```

---

## DB Schema (Supabase)

```
players    id, user_id, username, title, spirit_dust, scrolls,
           focus_pts, inventory(jsonb)

ghosts     id, player_id, ghost_type, nickname, evo_stage,
           level, exp, bond, corruption,
           stats(jsonb), soul_core(jsonb), frame(jsonb),
           spirit_mass(jsonb), skill_tree(jsonb), amulet_slots(jsonb),
           is_in_team, team_slot

saves      id, player_id, chapter, chapter_step, corruption_score,
           zone_id, steps_taken, zone_cleared,
           mentor_bonds(jsonb), decisions(jsonb), resources(jsonb),
           current_ending, is_active

leaderboard  id, player_id, username, score, ending, season
```

---

## Ghost Data (GHOST_REG)

12 ผีไทย defined in `db/ghost-data.js`:

| id | ชื่อ | Class | Element |
|----|------|-------|---------|
| pob | ปอบ | dps | fire |
| phiDib | ผีดิบ | tank | earth |
| krasue | กระสือ | mage | dark |
| kumantong | กุมารทอง | healer | light |
| nangTani | นางตานี | mage | wood |
| pret | เปรต | dps | dark |
| maeNak | แม่นาค | tank | water |
| kalakinee | กาลกิณี | debuffer | metal |
| pisaj | ปีศาจ | dps | fire |
| phiTaiHong | ผีตายโหง | berserker | dark |
| asurakay | อสุรกาย | boss_tank | earth |
| motherSpirit | แม่เจ้าของ | healer | light |

---

## Element Chart

```
ไฟ  → ชนะ ลม  (×1.33)  แพ้ น้ำ  (×0.75)
น้ำ → ชนะ ไฟ  (×1.33)  แพ้ ดิน  (×0.75)
ดิน → ชนะ น้ำ  (×1.33)  แพ้ ลม   (×0.75)
ลม  → ชนะ ดิน  (×1.33)  แพ้ ไฟ   (×0.75)
โลหะ → ชนะ ลม  (×1.33)  แพ้ ไฟ   (×0.75)
แสง → ชนะ มืด  (×1.33)
มืด → ชนะ แสง  (×1.33)
อาถรรพ์ = neutral (เน้น GUTS drain + debuff)
```

---

## Battle Engine (BattleEngine)

```js
const eng = new BattleEngine();
eng.start(playerTeam, enemyTeam, onTick, onEnd);
eng.pause();
eng.resume();
eng.stop();

// onTick(snap) → { player[3], enemy[3], log[] }
// onEnd(winner, log) → winner = 'player' | 'ai'
```

ATB formula: `fill_rate = spd / ATB_K` (ATB_K = 30)
GUTS recovery: `+spd * 0.02` per 100ms tick
Bond AI: `< 50` random, `50-79` class-logic, `80+` smart element-aware

---

## Navigation (window.goTo)

```js
window.goTo('battle')       // Live battle
window.goTo('roster')       // Ghost roster
window.goTo('map')          // Roguelike map
window.goTo('detail')       // Spirit detail
window.goTo('forge-frame')  // Frame enhancement
window.goTo('forge-mass')   // Mass reroll
window.goTo('skill-tree')   // Skill tree
window.goTo('amulet')       // Amulet slots
window.goTo('evolution')    // Evolution
window.goTo('adventure')    // Adventure event
window.goTo('codex')        // Element codex
window.goTo('ending')       // Corruption ending

// TODO: goTo('detail', { ghostId }) — ยังไม่รับ params
```

---

## Design Tokens (styles.css)

```css
--void: #0a0612          /* background หลัก */
--shrine: #160a1d
--panel: #241430
--gold: #d4af37          /* accent หลัก */
--gold-glow: #ffe08a
--bone: #f4ecd8          /* text หลัก */
--bone-mute: #a89c7a
--blood: #c0392b
--corruption: #c026d3    /* corruption system */
--corruption-soft: #e879f9
--el-fire: #ff5e3a
--el-water: #5aa6e8
--el-wind: #7dcfa0
--el-earth: #c69850
--el-occult: #c026d3
--f-display: "Bai Jamjuree"
--f-body: "IBM Plex Sans Thai Looped"
--f-mono: "JetBrains Mono"
```

---

## Dev Commands (Browser Console)

```js
// ดูข้อมูล live
window.GS.team
window.GS.save
window.GS.inventory
window.GS.player.spirit_dust

// Seed ข้อมูลทดสอบ (ต้อง login ก่อน)
await SpiritDB.seed()

// Reload game state
await window.GS.refresh()

// Navigate
window.goTo('battle')
```

---

## Setup / Run

1. เปิด XAMPP → Start Apache
2. วาง project ที่ `C:\xampp\htdocs\peelogGame\peelog3v3\`
3. เปิด `http://localhost/peelogGame/peelog3v3/game.html`
4. Login ด้วย `nrok47@gmail.com`

**First-time DB setup:**
1. Supabase Dashboard → SQL Editor → paste & run `db/schema.sql`
2. Run migration: `alter table players add column if not exists inventory jsonb default '[]'::jsonb;`
3. Login → console: `await SpiritDB.seed()`
