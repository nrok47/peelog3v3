# Spirit Master — Thai Ghost RPG
## CLAUDE.md · Project Reference (updated 2026-05-24)

---

## Overview

**จอมขมังเวทน้อย: ผีไทยป่วนเมือง**
Thai Ghost Collector × 3v3 Auto ATB Battle × Corruption story

Concept:
- ภายนอก = Chibi น่ารัก
- ข้างใน = Dark story สไตล์ Devilman (4 บท, Corruption system)
- เป้าหมาย = Mobile-first web game, deploy บน GitHub Pages

---

## Tech Stack (Vite branch — ปัจจุบัน)

| ชั้น | Technology |
|------|-----------|
| UI | React 18 + TypeScript + Vite |
| State | Zustand (`useGameStore`) |
| Styling | CSS custom properties (`global.css`) |
| DB | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password) |
| Deploy | GitHub Actions → GitHub Pages |

> หมายเหตุ: โฟลเดอร์ root มีไฟล์ `.jsx` เก่า (game.html, *.jsx) — เป็น prototype เก่า ไม่ใช้งานแล้ว
> Project จริงอยู่ที่ `client/` ทั้งหมด

---

## URLs

| | URL |
|-|-----|
| Dev server | `http://localhost:5173/peelog3v3/` |
| Production | `https://nrok47.github.io/peelog3v3/` |
| Supabase dashboard | `https://supabase.com/dashboard/project/miffompdtiasgssndayp` |
| GitHub repo | `https://github.com/nrok47/peelog3v3` |

---

## File Structure

```
peelog3v3/
├── CLAUDE.md                      ← This file
├── .github/workflows/deploy.yml   ← GitHub Actions CI/CD
│
└── client/                        ← Vite app (ทุกอย่างอยู่นี่)
    ├── index.html
    ├── vite.config.ts             ← base: '/peelog3v3/', HashRouter compat
    ├── .env                       ← GITIGNORED: VITE_SUPABASE_URL, VITE_SUPABASE_ANON
    │
    └── src/
        ├── main.tsx               ← Entry: HashRouter wrap
        ├── App.tsx                ← Routes (/, /roster, /battle, /spirit/:id, ...)
        │
        ├── types/index.ts         ← GhostDef, Ghost, Player, Save, Rarity types
        ├── data/ghosts.ts         ← GHOST_REG, ELEMENT_CHART, SUMMON_POOLS, rollRarity()
        ├── db/supabase.ts         ← Auth, GhostService, SaveService, LeaderboardService
        ├── store/gameStore.ts     ← Zustand store (loadAll, summonGhost, setTeam, ...)
        │
        ├── components/
        │   ├── Chibi.tsx          ← Emoji ghost with element glow + evo ring
        │   ├── BottomNav.tsx      ← Fixed bottom nav (home/roster/battle/map)
        │   └── ScreenHeader.tsx   ← Back button + title + right slot
        │
        ├── screens/
        │   ├── Login.tsx          ← ✅ Auth (sign in / sign up)
        │   ├── Home.tsx           ← ✅ Dashboard + team preview + menu grid
        │   ├── Roster.tsx         ← ✅ Ghost list + 3-pool gacha summon
        │   ├── SpiritDetail.tsx   ← ✅ Ghost stats + team toggle
        │   ├── Battle.tsx         ← ✅ Team select phase + ATB battle engine
        │   ├── ElementCodex.tsx   ← ✅ Static element chart (no changes needed)
        │   ├── CorruptionEnding.tsx ← 🟡 Reads corruption score, story static
        │   ├── Map.tsx            ← 🟡 UI ready, zones hardcoded/locked
        │   ├── Forge.tsx          ← 🟡 UI ready, frame/mass logic UI-only
        │   ├── SkillTree.tsx      ← 🟡 UI ready, points not wired to battle stats
        │   ├── Adventure.tsx      ← 🟡 UI ready, event outcomes not persisted
        │   ├── Evolution.tsx      ← 🟡 Partially wired (updateGhost evo_stage)
        │   └── Amulet.tsx         ← 🟡 Partially wired (updateGhost amulet_slots)
        │
        └── styles/global.css      ← CSS vars, utility classes, animations
```

**สถานะ**: ✅ = fully connected | 🟡 = UI ready แต่ logic ยังไม่ complete | 🔴 = hardcoded

---

## Global State (Zustand — `useGameStore`)

```ts
// State
player: Player | null        // { id, username, title, spirit_dust, focus_pts }
ghosts: Ghost[]              // ghost ทั้งหมดของผู้เล่น
team:   Ghost[]              // subset ที่ is_in_team=true (sorted by team_slot)
save:   Save | null          // { chapter, corruption_score, zone_id, ... }
isAuth: boolean
isLoading: boolean
passiveDustEarned: number    // dust ที่ได้ offline ใน session นี้ (เพื่อแสดง notif)

// Actions
loadAll()                    // โหลดทุกอย่างจาก Supabase + passive dust regen
signIn(email, password)
signUp(email, password, username)
signOut()
updateGhost(ghostId, changes)
setTeam(slots[])             // [{ghostId, slot}] → sync DB
summonGhost(ghostType, cost) // deduct dust + add ghost to DB + state
addSpiritDust(amount)        // local update เท่านั้น (ใช้ summonGhost ถ้าต้องการ sync)
```

---

## Passive Dust System

- `30 dust/ชั่วโมง`, cap `8 ชั่วโมง = 240 dust` สูงสุดต่อ session
- ใช้ `localStorage` key `spirit_master_dust_sync` เก็บ timestamp
- คำนวณใน `loadAll()` → update DB → set `passiveDustEarned` → Home แสดง banner

---

## Summon / Gacha

```ts
SUMMON_POOLS = {
  basic:    { common:65, uncommon:28, rare:6,  legendary:1  }  // 50🌀
  premium:  { common:25, uncommon:45, rare:24, legendary:6  }  // 150🌀
  festival: { common:5,  uncommon:30, rare:45, legendary:20 }  // 300🌀
}
```
Flow: select pool → `handleSummon()` → 1.5s spin timer (useRef cancel guard) → reveal rarity badge

---

## DB Schema (Supabase)

```
players     id, user_id, username, title, spirit_dust, focus_pts, inventory(jsonb)

ghosts      id, player_id, ghost_type, nickname, evo_stage,
            level, exp, bond, corruption, stat_points,
            stats(jsonb), frame(jsonb), spirit_mass(jsonb),
            skill_tree(jsonb), amulet_slots(jsonb),
            is_in_team, team_slot

saves       id, player_id, chapter, chapter_step, corruption_score,
            zone_id, steps_taken, zone_cleared,
            mentor_bonds(jsonb), decisions(jsonb), resources(jsonb),
            current_ending, is_active

leaderboard id, player_id, username, score, ending, season
```

---

## Ghost Roster (GHOST_REG)

| id | ชื่อ | Class | Element | Rarity |
|----|------|-------|---------|--------|
| pob | ปอบ | dps | fire | common |
| phiDib | ผีดิบ | tank | earth | common |
| krasue | กระสือ | mage | dark | uncommon |
| kumantong | กุมารทอง | healer | light | uncommon |
| nangTani | นางตานี | mage | wood | uncommon |
| pret | เปรต | dps | dark | uncommon |
| maeNak | แม่นาค | tank | water | rare |
| kalakinee | กาลกิณี | debuffer | metal | rare |
| pisaj | ปีศาจ | dps | fire | rare |
| phiTaiHong | ผีตายโหง | berserker | dark | rare |
| asurakay | อสุรกาย | boss_tank | earth | legendary |
| motherSpirit | แม่เจ้าของ | healer | light | legendary |

---

## Battle Engine (ATB)

```
fill_rate = spd / 30   (ATB_K = 30)
GUTS recovery = +spd * 0.02 per 100ms tick
Bond AI: bond < 50 = random | 50-79 = class-logic | 80+ = smart element-aware
Damage = (power/100) * (STR or MAG) * elementMultiplier (ELEMENT_CHART)
elementMultiplier: ชนะ = 1.33, แพ้ = 0.75, neutral = 1.0
```

Battle phases: `select` → `battle` → `end`
- select: เลือกผี 3 ตัวจาก roster (rank badge 1/2/3)
- battle: ATB 100ms tick loop, auto skill when GUTS ≥ cost + cooldown = 0
- end: ชนะ/แพ้ banner + ปุ่มเลือกทีมใหม่

---

## Element Chart

```
ไฟ   → ชนะ ลม/ไม้ (×1.33)  แพ้ น้ำ   (×0.75)
น้ำ  → ชนะ ไฟ    (×1.33)  แพ้ ดิน   (×0.75)
ลม   → ชนะ ดิน   (×1.33)  แพ้ โลหะ  (×0.75)
ดิน  → ชนะ น้ำ   (×1.33)  แพ้ ลม    (×0.75)
โลหะ → ชนะ ลม    (×1.33)  แพ้ ไฟ    (×0.75)
แสง  → ชนะ มืด   (×1.33)
มืด  → ชนะ แสง   (×1.33)
```

---

## Dev Commands

```bash
# Dev
cd client && npm run dev        # http://localhost:5173/peelog3v3/

# Build + check TS errors
npm run build

# Deploy (auto via GitHub Actions on push to main)
git push origin main
```

---

## CI/CD

- Push to `main` → GitHub Actions runs `npm run build` → deploy to `gh-pages` branch
- GitHub Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON`
- SPA routing: HashRouter (`/#/path`) → ไม่ต้อง 404.html hack

---

## Known Issues / Tech Debt

- chunk size warning: main bundle ~535KB → ควร lazy-import หน้า battle ในอนาคต
- `stat_points` field in ghosts ยังไม่มี UI ใช้งาน
- `focus_pts` ใน players ยังไม่มีระบบ

---

## Development Roadmap

ดูหัวข้อ "Roadmap" ด้านล่างสำหรับ sprint plan ที่เหลือ

---

# Roadmap — Sprint Plan (2026)

## สถานะรวม: ~55% complete

### ✅ Done (Sprints 1-3)

| Feature | หมายเหตุ |
|---------|----------|
| Auth (sign in/up/out) | starter ghost ให้อัตโนมัติ |
| Ghost Roster + filters | sort level/bond/element |
| 3-Pool Gacha Summon | rarity system, spin animation |
| ATB Battle Engine | 100ms tick, GUTS, element multiplier |
| Team Select before battle | rank badge, max 3 |
| SpiritDetail + Team Toggle | เพิ่ม/ถอดจากทีมต่อผี |
| Passive Dust Regen | localStorage, 30/hr, cap 240 |
| Offline Notif Banner | 4s auto-dismiss |
| HP bar fix (null stats) | optional chaining |
| Summon double-fire guard | useRef timer cancel |

---

### 🔴 Sprint 4 — Battle Rewards + Leveling (สำคัญมาก)

ปัญหา: ชนะแล้ว ไม่มีอะไรเกิดขึ้น → ผู้เล่นไม่มีแรงจูงใจ

| Task | Details | ยาก |
|------|---------|-----|
| **EXP + Level up** | battle ชนะ → ผีใน team ได้ EXP → `level` up → stat scale | ⭐⭐ |
| **Bond gain** | ทุก battle → `bond += 1-3` → unlock AI mode ดีขึ้น | ⭐ |
| **Dust reward** | ชนะ → ได้ 10-30 dust → addSpiritDust + sync DB | ⭐ |
| **Enemy scaling** | enemy stats scale ตาม avg team level | ⭐⭐ |
| **Battle log** | แสดง damage text บน HP bar แทน log list | ⭐⭐ |

**Files:** `Battle.tsx`, `gameStore.ts` (addBattleRewards action)

---

### 🔴 Sprint 5 — Adventure Mode (story engine)

ปัญหา: adventure.tsx มี event nodes แต่ outcomes ไม่ได้ถูก save

| Task | Details | ยาก |
|------|---------|-----|
| **Wire outcomes** | choice → `SaveService.addDecision()` → corruption + bond apply จริง | ⭐⭐ |
| **Dust/coins reward** | event outcomes ให้ resources จริง (`save.resources`) | ⭐ |
| **Bond gain** | บาง event เพิ่ม bond กับผีที่ relate | ⭐ |
| **Event gating** | บาง event unlock เมื่อ chapter หรือ corruption ถึง threshold | ⭐⭐ |
| **Chapter progression** | clear zone → chapter advance → unlock zone ใหม่ใน Map | ⭐⭐⭐ |

**Files:** `Adventure.tsx`, `Map.tsx`, `gameStore.ts` (addDecision action)

---

### 🟡 Sprint 6 — Forge (Frame + Mass Reroll)

ปัญหา: UI พร้อมแล้ว แต่ไม่ได้ apply ค่าจริงเข้า battle stats

| Task | Details | ยาก |
|------|---------|-----|
| **Frame enhance → DEF/SPR** | `frame.enhancement` → +DEF/SPR ตาม formula เข้า `ghost.stats` | ⭐⭐ |
| **Mass affixes → stats** | parse affixes string → apply HP/STR/MAG/SPD modifier ก่อนเข้า battle | ⭐⭐⭐ |
| **Cost deduction** | ตัด spirit_dust ใน DB จริง (ตอนนี้แค่ check ไม่ตัด) | ⭐ |
| **Socket system** | frame สามารถใส่ amulet socket ได้ (ยืดหยุ่น) | ⭐⭐⭐ |

**Files:** `Forge.tsx`, `Battle.tsx` (stat calculation ก่อน start)

---

### 🟡 Sprint 7 — Skill Tree

ปัญหา: nodes มี UI และ cost แต่ไม่ถูก apply เข้า battle

| Task | Details | ยาก |
|------|---------|-----|
| **Save unlocked nodes** | `ghost.skill_tree` JSONB → store array ของ node IDs | ⭐ |
| **Apply node bonuses** | ก่อนเข้า battle → sum bonuses จาก unlocked nodes | ⭐⭐⭐ |
| **Cost deduction** | ตัด `stat_points` (ยังไม่มีระบบให้ stat_points) | ⭐⭐ |
| **stat_points gain** | level up → +1 stat_point | ⭐ (ต้องทำ Sprint 4 ก่อน) |

**Files:** `SkillTree.tsx`, `Battle.tsx` (combatant stat builder)

---

### 🟡 Sprint 8 — Amulet + Evolution

**Amulet** (UI พร้อม, equip ทำงานแล้ว แต่ไม่ apply ใน battle):
| Task | ยาก |
|------|-----|
| Parse amulet power string → stat modifier object | ⭐⭐ |
| Apply equipped amulets ก่อนเข้า battle | ⭐⭐ |

**Evolution** (updateGhost evo_stage ทำงาน แต่ขาด visual + stat scale):
| Task | ยาก |
|------|-----|
| Evo stage → stat multiplier (stage 0=1.0, 1=1.3, 2=1.6) | ⭐⭐ |
| Deduct dust จริง | ⭐ |
| Chibi visual: evo ring สี + glow เพิ่มขึ้น | ⭐ (Chibi.tsx มี evoStage แล้ว) |

**Files:** `Amulet.tsx`, `Evolution.tsx`, `Battle.tsx`

---

### 🔵 Sprint 9 — Map + Chapter System

| Task | Details | ยาก |
|------|---------|-----|
| **Zone unlock** | ชนะ battle ใน zone → `zone_cleared=true` → zone ถัดไป unlock | ⭐⭐ |
| **Zone-specific enemies** | แต่ละ zone มี enemy pool ของตัวเอง | ⭐⭐ |
| **Steps tracker** | zone มี N steps → battle/adventure สลับกัน | ⭐⭐⭐ |
| **Boss battle** | ท้าย zone = boss (stat สูง, ผีพิเศษ) | ⭐⭐ |

**Files:** `Map.tsx`, `Battle.tsx` (enemy pool by zone), `gameStore.ts`

---

### 🔵 Sprint 10 — Corruption Ending + Leaderboard

| Task | Details | ยาก |
|------|---------|-----|
| **4 endings** | corruption 0-25/26-50/51-75/76-100 → ending แตกต่าง | ⭐⭐ |
| **Score calculation** | chapter × bond × ghost count → `LeaderboardService.submit()` | ⭐ |
| **Leaderboard screen** | top 20 ดึงจาก DB แสดงผล | ⭐⭐ |
| **New game+** | reset save แต่เก็บ ghosts | ⭐⭐ |

**Files:** `CorruptionEnding.tsx`, `gameStore.ts`, new `Leaderboard.tsx`

---

## Priority Order (ถ้าจะทำทีละอัน)

```
Sprint 4 (Rewards)   ← สำคัญสุด ทำให้ game loop สมบูรณ์
Sprint 5 (Adventure) ← story content, เพิ่มความลึก
Sprint 6 (Forge)     ← progression ระบบ gear
Sprint 7 (Skill Tree)← ต้องรอ Sprint 4 (stat_points)
Sprint 8 (Amulet+Evo)← polish
Sprint 9 (Map)       ← โครงสร้างใหญ่
Sprint 10 (Ending)   ← endgame
```

---

## Quick Reference — Common Patterns

```tsx
// อ่าน store
const { ghosts, player, team, updateGhost } = useGameStore();

// อัปเดต ghost แล้ว sync DB
await updateGhost(ghost.id, { level: ghost.level + 1, exp: 0 });

// ตัด dust + sync DB (ผ่าน store)
await summonGhost(ghostType, cost);  // ตัดฝุ่นใน DB ด้วย

// navigate
const navigate = useNavigate();
navigate(`/spirit/${ghost.id}`);
navigate(-1);  // back

// ดู ghost definition
const def = GHOST_REG[ghost.ghost_type];
def.baseStats.hp, def.element, def.emoji
```
