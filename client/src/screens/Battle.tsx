import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { LeaderboardService } from '../db/supabase';
import { GHOST_REG } from '../data/ghosts';
import { ZONE_DEFS, getZoneDef, getZoneIndex, buildZoneEnemies } from '../data/zones';
import Chibi from '../components/Chibi';
import SpriteChar, { GHOST_SPRITE } from '../components/SpriteChar';
import type { AnimState } from '../components/SpriteChar';
import ScreenHeader from '../components/ScreenHeader';
import type { Ghost, GhostStats } from '../types';

// ═══════════════════════════════════════════════════════════════
//  Spirit Parade Arena — real-time 3v3 coach-battle
//  (รื้อจาก ATB turn-based เดิม — ดูแผนเต็มที่ CONCEPT-spirit-parade-expansion.md §8)
//  พอร์ต skill/damage logic เดิมของผีทั้ง 12 ตัวมาเกือบทั้งหมด
//  เปลี่ยนแค่ "เปลือก": ATB gauge → ตำแหน่ง real-time + คูลดาวน์ + ยก/พัก + โค้ช
// ═══════════════════════════════════════════════════════════════

type Role = 'melee' | 'ranged' | 'healer';

// ── บทบาท: ตามกฎ §8.2 — ไม่ hardcode รายตัว ใช้ classType + skill[0].type ────
function deriveRole(ghostType: string): Role {
  const def = GHOST_REG[ghostType];
  if (!def) return 'melee';
  if (def.classType === 'healer') return 'healer';
  return def.skills[0]?.type === 'magical' ? 'ranged' : 'melee';
}

// ── องค์กร 4 ฝ่าย แทนธาตุเดิม (§8.3 — ร่างจับคู่ที่ CK อนุมัติ) ──────────────
type Faction = 'deptOccult' | 'temple' | 'nilkal' | 'silverThread';
const FACTION_MAP: Record<string, Faction> = {
  // กรมสรรพอาคม
  scoutBull: 'deptOccult', kumantong: 'deptOccult', occultMarksman: 'deptOccult', motherSpirit: 'deptOccult',
  // แก๊งศิษย์วัด
  watBoyJuk: 'temple', nangTani: 'temple', maeNak: 'temple', kongGhostArm: 'temple',
  // เครือข่ายใยเงิน
  silverMarionette: 'silverThread', wireArachnid: 'silverThread', kalakinee: 'silverThread', silverParagon: 'silverThread',
  // สมาคมนิลกาล
  pob: 'nilkal', phiDib: 'nilkal', krasue: 'nilkal', pret: 'nilkal',
  pisaj: 'nilkal', phiTaiHong: 'nilkal', asurakay: 'nilkal',
};
const FACTION_NAME: Record<Faction, string> = {
  deptOccult: 'กรมสรรพอาคม', temple: 'ศิษย์วัด', nilkal: 'นิลกาล', silverThread: 'ใยเงิน',
};
const FACTION_COLOR: Record<Faction, string> = {
  deptOccult: '#f5c518', temple: '#26de81', nilkal: '#a55eea', silverThread: '#4d9fff',
};
const FACTION_CYCLE: Faction[] = ['deptOccult', 'temple', 'nilkal', 'silverThread'];
function factionMultiplier(attacker: Faction, defender: Faction): number {
  if (attacker === defender) return 1.0;
  const i = FACTION_CYCLE.indexOf(attacker);
  const beats = FACTION_CYCLE[(i + 1) % 4];
  const losesTo = FACTION_CYCLE[(i + 3) % 4];
  if (defender === beats) return 1.33;
  if (defender === losesTo) return 0.75;
  return 1.0;
}

// ── ค่าคงที่ real-time (ยืม ATB_K เดิมไว้ กันสมดุลพังตอนสลับเอนจิ้น — §8.4) ──
const ATB_K = 30;
const ROUND_MS = 22000;
const REST_MS = 6000;
const MELEE_RANGE = 9;   // % ของความกว้างสนาม
const RANGED_RANGE = 38;

interface StatusEffects {
  stunTurns: number; defDebuffPct: number; atkDebuffPct: number;
  shieldPct: number; dotDmg: number; dotTurns: number;
}
const EMPTY_STATUS: StatusEffects = { stunTurns: 0, defDebuffPct: 0, atkDebuffPct: 0, shieldPct: 0, dotDmg: 0, dotTurns: 0 };

interface LogEntry { text: string; type: 'hit' | 'skill' | 'heal' | 'info' }

interface RTCombatant {
  ghost: Ghost;
  role: Role;
  faction: Faction;
  currentHp: number;
  maxHp: number;
  guts: number;
  isPlayer: boolean;
  alive: boolean;
  boostedStats: GhostStats;
  gutsMultiplier: number;
  regenPct: number;
  cooldowns: Record<string, number>;
  statusEffects: StatusEffects;
  critRate: number;
  // ── real-time ──
  x: number; y: number;         // % ของสนาม
  spawnX: number; spawnY: number;
  cdLeft: number;                // ms จนกว่าจะโจมตีพื้นฐานได้อีกครั้ง
  targetId: string | null;
  attacking: boolean;
  hurt: boolean;
  dotTickLeft: number;
  // ── coach stance (ลุยเลย!/ตั้งรับ!) ──
  atkMult: number; dodgeMult: number; cdMult: number; critBonus: number; buffUntil: number;
  listenChance: number;          // โอกาสฟังคำสั่งโค้ช (แล้วแต่นิสัย)
}

interface FxEvent { id: number; kind: 'hit' | 'heal' | 'crit' | 'dodge' | 'proj'; x: number; y: number; tx?: number; ty?: number; text?: string }

function getSkillBonuses(ghost: Ghost) {
  const SKILL_STAT_BONUSES: Record<string, Partial<GhostStats>> = {
    atk1: { str: 5 }, atk2: { str: 10 }, mag1: { mag: 5 },
    def1: { def: 5 }, def2: { def: 10 }, hp1: { hp: 100 }, spd1: { spd: 5 },
  };
  const nodes = ghost.skill_tree?.nodes_taken ?? [];
  const s = { hp: 0, str: 0, mag: 0, def: 0, spr: 0, spd: 0 };
  for (const id of nodes) {
    const b = SKILL_STAT_BONUSES[id];
    if (!b) continue;
    if (b.hp) s.hp += b.hp; if (b.str) s.str += b.str; if (b.mag) s.mag += b.mag;
    if (b.def) s.def += b.def; if (b.spr) s.spr += b.spr; if (b.spd) s.spd += b.spd;
  }
  return {
    statBonus: s,
    gutsMultiplier: 1 + (nodes.includes('guts1') ? 0.15 : 0) + (nodes.includes('guts2') ? 0.15 : 0),
    regenPct: nodes.includes('regen') ? 0.02 : 0,
  };
}

const LISTEN_BY_ROLE: Record<Role, number> = { melee: 0.4, ranged: 0.7, healer: 0.55 };

function makeCombatant(ghost: Ghost, isPlayer: boolean, idx: number, fieldAmuletId?: string | null): RTCombatant {
  const ghostDef = GHOST_REG[ghost.ghost_type];
  const fallback = ghostDef?.baseStats ?? { hp: 1000, str: 30, mag: 20, def: 20, spr: 20, spd: 20 };
  const saved = ghost.stats ?? {};
  const { statBonus, gutsMultiplier: skillGutsMulti, regenPct } = isPlayer
    ? getSkillBonuses(ghost)
    : { statBonus: { hp: 0, str: 0, mag: 0, def: 0, spr: 0, spd: 0 }, gutsMultiplier: 1, regenPct: 0 };

  let hp = (saved.hp ?? fallback.hp) + statBonus.hp;
  let str = (saved.str ?? fallback.str) + statBonus.str;
  let mag = (saved.mag ?? fallback.mag) + statBonus.mag;
  let def = (saved.def ?? fallback.def) + statBonus.def;
  let spr = (saved.spr ?? fallback.spr) + statBonus.spr;
  let spd = (saved.spd ?? fallback.spd) + statBonus.spd;
  let massGutsMulti = 1;

  if (isPlayer) {
    const stage = ghost.evo_stage ?? 0;
    if (stage > 0) {
      hp += stage * 200;
      str = Math.round(str * (1 + stage * 0.08));
      mag = Math.round(mag * (1 + stage * 0.08));
      spd += stage * 5;
    }
    if (ghost.frame?.enhancement > 0) { def = ghost.frame.base_def; spr = ghost.frame.base_spr; }
    for (const affix of ghost.spirit_mass?.affixes ?? []) {
      const num = parseInt(affix.match(/\d+/)?.[0] ?? '0', 10);
      if (!num) continue;
      if (affix.includes('ATK') && affix.includes('%')) str = Math.round(str * (1 + num / 100));
      else if (affix.includes('DEF') && affix.includes('%')) def = Math.round(def * (1 + num / 100));
      else if (affix.includes('MAG') && affix.includes('%')) mag = Math.round(mag * (1 + num / 100));
      else if (affix.includes('SPR') && affix.includes('%')) spr = Math.round(spr * (1 + num / 100));
      else if (affix.includes('SPD')) spd += num;
      else if (affix.includes('HP') && !affix.includes('%')) hp += num;
      else if (affix.includes('GUTS')) massGutsMulti *= (1 + num / 100);
    }
    if (fieldAmuletId) {
      if (fieldAmuletId === 'a_hp') hp += 300;
      if (fieldAmuletId === 'a_atk') str += 15;
      if (fieldAmuletId === 'a_mag') mag += 15;
      if (fieldAmuletId === 'a_spd') spd += 10;
      if (fieldAmuletId === 'a_curse') mag += 25;
      if (fieldAmuletId === 'a_guts') massGutsMulti *= 1.25;
    }
  }

  const boostedStats: GhostStats = { hp, str, mag, def, spr, spd };
  const gutsMultiplier = skillGutsMulti * massGutsMulti;
  const hasCrit = isPlayer && (ghost.skill_tree?.nodes_taken ?? []).includes('crit');
  const role = deriveRole(ghost.ghost_type);
  const faction = FACTION_MAP[ghost.ghost_type] ?? 'nilkal';

  const spawnX = isPlayer ? 10 + idx * 3 : 90 - idx * 3;
  const spawnY = 18 + idx * 32;

  return {
    ghost, role, faction,
    currentHp: boostedStats.hp, maxHp: boostedStats.hp,
    guts: 0, isPlayer, alive: true,
    boostedStats, gutsMultiplier, regenPct,
    cooldowns: {}, statusEffects: { ...EMPTY_STATUS },
    critRate: hasCrit ? 0.2 : 0.1,
    x: spawnX, y: spawnY, spawnX, spawnY,
    cdLeft: (ATB_K * 1000) / Math.max(1, boostedStats.spd) * (0.3 + Math.random() * 0.4),
    targetId: null, attacking: false, hurt: false, dotTickLeft: 1000,
    atkMult: 1, dodgeMult: 1, cdMult: 1, critBonus: 0, buffUntil: 0,
    listenChance: LISTEN_BY_ROLE[role],
  };
}

function getAnimState(c: RTCombatant): AnimState {
  if (!c.alive) return 'death';
  if (c.hurt) return 'hurt';
  if (c.attacking) return 'attack';
  return 'idle';
}

function buildArenaEnemies(teamAvgLevel: number, count: number): Ghost[] {
  const types = Object.keys(GHOST_REG);
  const picked = [...types].sort(() => Math.random() - 0.5).slice(0, Math.max(1, count));
  return picked.map((type, i) => {
    const def = GHOST_REG[type];
    const lvl = Math.max(1, teamAvgLevel + Math.floor(Math.random() * 6) - 2);
    const scale = 1 + (lvl - 1) * 0.05;
    const base = def.baseStats;
    return {
      id: `arena_ai_${i}`, player_id: 'arena', ghost_type: type, nickname: '',
      evo_stage: 0 as const, level: lvl, exp: 0, bond: 0, corruption: 0, stat_points: 0,
      stats: {
        hp: Math.round(base.hp * scale), str: Math.round(base.str * scale),
        mag: Math.round(base.mag * scale), def: Math.round(base.def * scale),
        spr: Math.round(base.spr * scale), spd: base.spd,
      },
      soul_core: { element: def.element, classType: def.classType, baseStats: base },
      frame: { enhancement: 0, base_def: base.def, base_spr: base.spr, sockets: [] },
      spirit_mass: { affixes: [], tier_history: [] },
      skill_tree: { points_spent: 0, nodes_taken: [], branches: { offense: 0, resource: 0, defense: 0 } },
      is_in_team: false, team_slot: null,
    };
  });
}

const SKILL_FLAVOR: Record<string, string> = {
  pob_curse: '🔥 ไฟปอบ!!', phidib_taunt: '📣 ท้าทาย! รับ Shield', krasue_curse: '💀 คำสาปกระสือ!',
  kmt_heal: '💚 พรทิพย์! ฮีลทั้งทีม', tani_sleep: '😴 ต้นกล้วยสะกด! ศัตรูง่วงหมด~',
  pret_feast: '🍖 กินวิญญาณ!!', nak_shield: '💙 รักนิรันดร์! Shield ทั้งทีม',
  kala_hex: '⚡ คำสาปกาล! ตัด GUTS ศัตรู', pisaj_inferno: '🌋 นรกลุกโชน!!',
  pth_rampage: '💢 โหมกระหน่ำ 3 ครั้ง!', asura_titan: '🗿 ไททันกร้าว! โดนทั้งทีม',
  ms_revive: '✨ ฟื้นคืนชีพ!!',
  // สกิลใหม่ 4 องค์กร
  bull_patrol: '🐂 ตรวจการกระแทก! สตั๊นชนแหลก',
  sniper_pierce: '🎯 สไนเปอร์ยันต์เจาะเกราะ!',
  juk_slingshot: '👦 หนังสติ๊กอาคม! ป่วนระยะไกล',
  kong_burst: '🦾 หมัดระเบิดวิญญาณ!! ระเบิดพลังอสูร',
  needle_barrage: '🪆 พายุเข็มเงิน! ทะลวงม่านพลัง',
  wire_trap: '🕷️ กับดักใยเงิน! ช็อตตรึงร่าง',
  paragon_aegis: '🪞 เกราะกระจกใยเงิน! ม่านสะท้อนอาคม',
};

export default function Battle() {
  const { ghosts, team, player, save, addBattleRewards, advanceZoneStep, submitArenaScore } = useGameStore();
  const navigate = useNavigate();
  const location = useLocation();
  const arenaMode = (location.state as { arenaMode?: boolean } | null)?.arenaMode ?? false;

  const [phase, setPhase] = useState<'select' | 'battle' | 'end'>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [combatants, setCombatants] = useState<RTCombatant[]>([]);
  const [fx, setFx] = useState<FxEvent[]>([]);
  const [round, setRound] = useState(1);
  const [battlePhase, setBattlePhase] = useState<'fight' | 'rest'>('fight');
  const [phaseMsLeft, setPhaseMsLeft] = useState(ROUND_MS);
  const [shake, setShake] = useState(false);
  const [critFlash, setCritFlash] = useState(false);
  const [battleRewards, setBattleRewards] = useState<{ expGained: number; levelUps: string[]; dustGained: number; zoneCleared: boolean; coinsGained: number; fluidGained: number } | null>(null);
  const [arenaScore, setArenaScore] = useState(0);
  const [opponent, setOpponent] = useState<{ username: string; team: Ghost[] } | null>(null);
  const [fleeing, setFleeing] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState<1 | 2 | 3 | 4>(1);
  const [cmdReady, setCmdReady] = useState<Record<string, boolean>>({ allout: true, defense: true, front: true, ranged: true, healerFocus: true, item: true });
  const [showTutorial, setShowTutorial] = useState(false);

  const TUTORIAL_KEY = 'spirit_master_battle_tutorial_seen';
  function handleStartClick() {
    if (!localStorage.getItem(TUTORIAL_KEY)) { setShowTutorial(true); return; }
    startBattle();
  }
  function dismissTutorial() {
    localStorage.setItem(TUTORIAL_KEY, '1');
    setShowTutorial(false);
    startBattle();
  }

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const rewardDoneRef = useRef(false);
  const enemyGhostsRef = useRef<Ghost[]>([]);
  const fxIdRef = useRef(0);
  const battlePhaseRef = useRef<'fight' | 'rest'>('fight');
  const roundRef = useRef(1);
  const phaseMsLeftRef = useRef(ROUND_MS);

  useEffect(() => {
    if (arenaMode && team.length > 0 && selectedIds.length === 0) {
      setSelectedIds(team.slice(0, 3).map(g => g.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenaMode]);

  useEffect(() => {
    if (!arenaMode || !player) return;
    const avgLv = team.length > 0 ? Math.round(team.reduce((s, g) => s + g.level, 0) / team.length) : 1;
    const estimatedScore = Math.min(9999, ghosts.length * 30 + avgLv * 50);
    LeaderboardService.findOpponent(player.id, estimatedScore).then(opp => { if (opp) setOpponent(opp); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenaMode]);

  const zone = getZoneDef(save?.zone_id ?? 'zone_01');
  const stepsDone = save?.steps_taken ?? 0;
  const isBoss = stepsDone === zone.steps - 1;
  const zoneIdx = getZoneIndex(save?.zone_id ?? 'zone_01');

  const playerTeam = ghosts.filter(g => selectedIds.includes(g.id));

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  }

  function pushLog(text: string, type: LogEntry['type'] = 'info') {
    setLog(l => [...l.slice(-30), { text, type }]);
  }

  function spawnFx(e: Omit<FxEvent, 'id'>) {
    const id = ++fxIdRef.current;
    setFx(f => [...f.slice(-12), { ...e, id }]);
    setTimeout(() => setFx(f => f.filter(x => x.id !== id)), e.kind === 'proj' ? 280 : 600);
  }

  function triggerShake() { setShake(true); setTimeout(() => setShake(false), 260); }
  function triggerCritFlash() { setCritFlash(true); setTimeout(() => setCritFlash(false), 180); }

  function startBattle() {
    if (playerTeam.length < 1) return;
    rewardDoneRef.current = false;
    setBattleRewards(null);
    setRound(1);
    setBattlePhase('fight');
    setPhaseMsLeft(ROUND_MS);
    battlePhaseRef.current = 'fight';
    roundRef.current = 1;
    phaseMsLeftRef.current = ROUND_MS;
    setCmdReady({ allout: true, defense: true, front: true, ranged: true, healerFocus: true, item: true });

    const avgTeamLv = playerTeam.length > 0 ? Math.round(playerTeam.reduce((s, g) => s + g.level, 0) / playerTeam.length) : 1;
    let enemies: Ghost[];
    let isPvpTeam = false;
    if (arenaMode) {
      const validOpponentTeam = (opponent?.team ?? []).filter(g => GHOST_REG[g.ghost_type]);
      if (validOpponentTeam.length > 0) {
        enemies = validOpponentTeam.slice(0, playerTeam.length).map((g, i) => ({ ...g, id: `arena_pvp_${i}`, player_id: 'pvp' }));
        isPvpTeam = true;
      } else {
        enemies = buildArenaEnemies(avgTeamLv, playerTeam.length);
      }
    } else {
      enemies = buildZoneEnemies(zone, stepsDone, playerTeam.length);
    }
    enemyGhostsRef.current = enemies;

    const fieldAmulets = player?.inventory?.field_amulets ?? [null, null, null];
    const initial: RTCombatant[] = [
      ...playerTeam.slice(0, 3).map((g, idx) => makeCombatant(g, true, idx, fieldAmulets[idx])),
      ...enemies.map((g, idx) => isPvpTeam
        ? { ...makeCombatant(g, true, idx, null), isPlayer: false, x: 90 - idx * 3, spawnX: 90 - idx * 3 }
        : makeCombatant(g, false, idx)
      ),
    ];
    setCombatants(initial);
    setFx([]);
    setLog([{ text: arenaMode ? `🏆 Arena Battle เริ่ม! VS ${opponent ? opponent.username : 'AI'}...`
      : `⚔️ ${isBoss ? '👑 BOSS FIGHT! ' : ''}การต่อสู้เริ่มต้น — ${zone.name} (${stepsDone + 1}/${zone.steps})`, type: 'info' }]);
    setPhase('battle');
    setWinner(null);
  }

  // ── Reward trigger ────────────────────────────────────────────
  useEffect(() => {
    if (winner !== 'player' || rewardDoneRef.current) return;
    rewardDoneRef.current = true;
    const snapshotEnemies = enemyGhostsRef.current;
    const avgEnemyLv = snapshotEnemies.length > 0
      ? Math.round(snapshotEnemies.reduce((s, g) => s + g.level, 0) / snapshotEnemies.length) : zone.bossLevel;

    if (arenaMode) {
      addBattleRewards(selectedIds, avgEnemyLv).then(rewards => {
        if (rewards) {
          const sc = avgEnemyLv * 50 + rewards.dustGained * 2;
          setArenaScore(sc);
          setBattleRewards({ ...rewards, zoneCleared: false, coinsGained: 0, fluidGained: 0 });
          submitArenaScore(sc);
        }
      });
    } else {
      Promise.all([addBattleRewards(selectedIds, avgEnemyLv), advanceZoneStep()]).then(([rewards, zoneResult]) => {
        if (rewards) setBattleRewards({ ...rewards, zoneCleared: zoneResult?.zoneCleared ?? false, coinsGained: zoneResult?.coinsGained ?? 0, fluidGained: zoneResult?.fluidGained ?? 0 });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner]);

  // ── Resolve one unit's basic/special action (พอร์ตจาก ATB logic เดิม) ───
  function resolveAction(actorId: string) {
    setCombatants(prev => {
      const actor = prev.find(c => c.ghost.id === actorId);
      if (!actor || !actor.alive) return prev;

      const ghostDef = GHOST_REG[actor.ghost.ghost_type];
      const actorName = ghostDef?.nameTh ?? '';
      const skills = ghostDef?.skills ?? [];
      const basic = skills[0];
      const special = skills[1];
      const useSpecial = !!special && actor.guts >= special.gutsCost && (actor.cooldowns[special.id] ?? 0) <= 0;
      const skill = (useSpecial ? special : basic) ?? basic;
      if (!skill) return prev;

      const aliveEnemies = prev.filter(c => c.alive && c.isPlayer !== actor.isPlayer);
      const aliveAllies = prev.filter(c => c.alive && c.isPlayer === actor.isPlayer && c.ghost.id !== actor.ghost.id);
      if (aliveEnemies.length === 0) return prev;

      const rnd = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
      function calcDmg(t: RTCombatant, pwr: number, useStr: boolean) {
        const mult = factionMultiplier(actor!.faction, t.faction);
        const rawAtk = (useStr ? actor!.boostedStats.str : actor!.boostedStats.mag) * actor!.atkMult * (1 - actor!.statusEffects.atkDebuffPct);
        const rawDef = useStr ? t.boostedStats.def : t.boostedStats.spr;
        const raw = Math.max(1, rawAtk * (pwr / 100) * mult);
        const reduced = raw * (100 / (100 + rawDef * (1 - t.statusEffects.defDebuffPct)));
        const dodgeChance = Math.min(0.85, Math.max(0.03, t.boostedStats.spr / 200) * t.dodgeMult);
        if (Math.random() < dodgeChance) return { dmg: 0, isCrit: false, dodged: true };
        const isCrit = Math.random() < (actor!.critRate + actor!.critBonus);
        const floor = Math.ceil(t.maxHp * 0.03);
        return { dmg: Math.floor(Math.max(floor, reduced * (isCrit ? 1.8 : 1) * (1 - t.statusEffects.shieldPct))), isCrit, dodged: false };
      }

      const hpDelta: Record<string, number> = {};
      const statChgs: Record<string, Partial<StatusEffects>> = {};
      const gutsSet: Record<string, number> = {};
      let fxTarget: RTCombatant = aliveEnemies[0];
      let didHit = false;

      if (skill.type === 'physical' || skill.type === 'magical') {
        const useStr = skill.type === 'physical';
        if (skill.id === 'pth_rampage') {
          for (let i = 0; i < 3; i++) {
            const t = rnd(aliveEnemies);
            const r = calcDmg(t, Math.floor(skill.power / 3), useStr);
            if (!r.dodged) hpDelta[t.ghost.id] = (hpDelta[t.ghost.id] ?? 0) - r.dmg;
          }
          pushLog(`${SKILL_FLAVOR[skill.id]} ${actorName} ระดมตี!`, 'skill');
        } else if (skill.id === 'asura_titan') {
          for (const t of aliveEnemies) {
            const r = calcDmg(t, skill.power, useStr);
            if (!r.dodged) hpDelta[t.ghost.id] = (hpDelta[t.ghost.id] ?? 0) - r.dmg;
          }
          pushLog(`${SKILL_FLAVOR[skill.id]}`, 'skill');
        } else {
          const target = (prev.find(c => c.ghost.id === actor.targetId && c.alive && c.isPlayer !== actor.isPlayer)) ?? rnd(aliveEnemies);
          fxTarget = target;
          const r = calcDmg(target, skill.power, useStr);
          const tName = GHOST_REG[target.ghost.ghost_type]?.nameTh ?? '';
          if (r.dodged) {
            spawnFx({ kind: 'dodge', x: target.x, y: target.y, text: 'หลบ!' });
            pushLog(`💨 ${tName} หลบท่าของ ${actorName} ได้`, 'hit');
          } else {
            didHit = true;
            hpDelta[target.ghost.id] = -r.dmg;
            if (r.isCrit) { triggerShake(); triggerCritFlash(); }
            spawnFx({ kind: r.isCrit ? 'crit' : 'hit', x: target.x, y: target.y, text: `-${r.dmg}` });
            if (skill.id === 'pret_feast') {
              const drain = Math.floor(r.dmg * 0.15);
              hpDelta[actor.ghost.id] = (hpDelta[actor.ghost.id] ?? 0) + drain;
              pushLog(`${SKILL_FLAVOR[skill.id]} → ${tName} -${r.dmg} | ดูด +${drain}`, 'skill');
            } else if (skill.id === 'pisaj_inferno') {
              statChgs[target.ghost.id] = { dotDmg: Math.floor(r.dmg * 0.3), dotTurns: 3 };
              pushLog(`${SKILL_FLAVOR[skill.id]} → ${tName} -${r.dmg} 🔥DoT×3`, 'skill');
            } else if (skill.id === 'bull_patrol') {
              statChgs[target.ghost.id] = { stunTurns: 1 };
              pushLog(`${SKILL_FLAVOR[skill.id]} → ${tName} -${r.dmg} 💫สตั๊น 1 วิ!`, 'skill');
            } else if (skill.id === 'sniper_pierce') {
              statChgs[target.ghost.id] = { defDebuffPct: 0.25 };
              pushLog(`${SKILL_FLAVOR[skill.id]} → ${tName} -${r.dmg} 🛡️ลดเกราะ 25%!`, 'skill');
            } else if (skill.id === 'juk_slingshot') {
              statChgs[target.ghost.id] = { atkDebuffPct: 0.20 };
              pushLog(`${SKILL_FLAVOR[skill.id]} → ${tName} -${r.dmg} 💢ลดพลังโจมตี!`, 'skill');
            } else if (useSpecial) {
              pushLog(`${SKILL_FLAVOR[skill.id] ?? `⚡ ${actorName} ใช้ ${skill.name}!`} → ${tName} -${r.dmg}`, 'skill');
            } else {
              pushLog(`${actorName} โจมตี ${tName} (-${r.dmg})${r.isCrit ? ' 💥CRIT!' : ''}`, 'hit');
            }
          }
        }
      } else if (skill.type === 'heal') {
        if (skill.id === 'ms_revive') {
          const lowest = [...aliveAllies, actor].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0];
          if (lowest) {
            hpDelta[lowest.ghost.id] = lowest.maxHp - lowest.currentHp;
            fxTarget = lowest;
            spawnFx({ kind: 'heal', x: lowest.x, y: lowest.y, text: 'เต็ม!' });
            pushLog(`${SKILL_FLAVOR[skill.id]} ${GHOST_REG[lowest.ghost.ghost_type]?.nameTh ?? ''} กลับมาเต็ม HP!`, 'heal');
          }
        } else {
          const healAmt = Math.floor(actor.boostedStats.mag * (skill.power / 180));
          for (const a of [...aliveAllies, actor]) {
            hpDelta[a.ghost.id] = healAmt;
            spawnFx({ kind: 'heal', x: a.x, y: a.y, text: `+${healAmt}` });
          }
          pushLog(`${SKILL_FLAVOR[skill.id] ?? '💚 ฮีล'} +${healAmt} ทุกคน`, 'heal');
          if (aliveAllies.length > 0) fxTarget = aliveAllies[0];
        }
      } else if (skill.type === 'buff') {
        if (skill.id === 'nak_shield') {
          for (const a of [...aliveAllies, actor]) statChgs[a.ghost.id] = { shieldPct: 0.4 };
          pushLog(SKILL_FLAVOR[skill.id], 'skill');
        } else if (skill.id === 'phidib_taunt') {
          statChgs[actor.ghost.id] = { shieldPct: 0.5 };
          pushLog(SKILL_FLAVOR[skill.id], 'skill');
        } else if (skill.id === 'paragon_aegis') {
          for (const a of [...aliveAllies, actor]) {
            statChgs[a.ghost.id] = { shieldPct: 0.35, atkDebuffPct: 0, defDebuffPct: 0, dotTurns: 0 };
          }
          pushLog(SKILL_FLAVOR[skill.id] ?? '🪞 ม่านใยเงินปกป้องทั้งทีม!', 'skill');
        }
      } else if (skill.type === 'debuff') {
        if (skill.id === 'krasue_curse') {
          for (const t of aliveEnemies) statChgs[t.ghost.id] = { defDebuffPct: 0.25 };
          pushLog(SKILL_FLAVOR[skill.id], 'skill');
        } else if (skill.id === 'tani_sleep') {
          for (const t of aliveEnemies) statChgs[t.ghost.id] = { stunTurns: 2 };
          pushLog(SKILL_FLAVOR[skill.id], 'skill');
        } else if (skill.id === 'kala_hex') {
          for (const t of aliveEnemies) { statChgs[t.ghost.id] = { atkDebuffPct: 0.25 }; gutsSet[t.ghost.id] = 0; }
          pushLog(SKILL_FLAVOR[skill.id], 'skill');
        } else if (skill.id === 'wire_trap') {
          const target = (prev.find(c => c.ghost.id === actor.targetId && c.alive && c.isPlayer !== actor.isPlayer)) ?? rnd(aliveEnemies);
          statChgs[target.ghost.id] = { stunTurns: 1, atkDebuffPct: 0.20 };
          pushLog(`${SKILL_FLAVOR[skill.id]} → ${GHOST_REG[target.ghost.ghost_type]?.nameTh ?? ''} 🕸️ช็อตสตั๊น!`, 'skill');
        }
      }

      if (didHit) { actor.hurt = false; }
      const newCooldowns: Record<string, number> = { ...actor.cooldowns };
      if (useSpecial) newCooldowns[skill.id] = skill.cooldown;

      return prev.map(c => {
        if (!c.alive) return c;
        const dHp = hpDelta[c.ghost.id] ?? 0;
        const newHp = Math.max(0, Math.min(c.maxHp, c.currentHp + dHp));
        const alive = newHp > 0;
        const sPatch = statChgs[c.ghost.id];
        const newSt = sPatch ? { ...c.statusEffects, ...sPatch } : c.statusEffects;
        const newGuts = c.ghost.id in gutsSet ? gutsSet[c.ghost.id] : c.guts;
        if (c.alive && !alive) pushLog(`☠ ${GHOST_REG[c.ghost.ghost_type]?.nameTh ?? ''} ถูกน็อค`, 'info');

        if (c.ghost.id === actor.ghost.id) {
          const baseCd = (ATB_K * 1000) / Math.max(1, c.boostedStats.spd) * c.cdMult;
          return {
            ...c, attacking: true, targetId: fxTarget.ghost.id,
            guts: useSpecial ? Math.max(0, c.guts - skill.gutsCost) : c.guts,
            cooldowns: newCooldowns, currentHp: newHp, alive, statusEffects: newSt,
            cdLeft: baseCd + Math.random() * 200,
          };
        }
        if (c.ghost.id === fxTarget.ghost.id && didHit) {
          return { ...c, currentHp: newHp, alive, guts: newGuts, statusEffects: newSt, hurt: true };
        }
        return { ...c, currentHp: newHp, alive, guts: newGuts, statusEffects: newSt };
      });
    });

    // เคลียร์ attacking/hurt หลัง animation เล่นจบ
    setTimeout(() => {
      setCombatants(prev => prev.map(c => c.ghost.id === actorId ? { ...c, attacking: false } : c));
    }, 300);
  }

  // ── Main real-time loop ──────────────────────────────────────
  useEffect(() => {
    if (phase !== 'battle') return;

    function loop(ts: number) {
      try {
        tick(ts);
      } catch (err) {
        console.error('[BattleLoop] crashed on a frame — continuing anyway:', err);
        pushLog(`⚠️ เกิดปัญหาระหว่างสู้ (${err instanceof Error ? err.message : String(err)}) — ลองกด "ถอย" แล้วเข้าใหม่ถ้าค้าง`, 'info');
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    function tick(ts: number) {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min(80, ts - lastTsRef.current) * battleSpeed;
      lastTsRef.current = ts;

      setCombatants(prev => {
        if (prev.length === 0) return prev;
        const next = prev.map(c => ({ ...c }));

        for (const u of next) {
          if (u.buffUntil && Date.now() > u.buffUntil) {
            u.atkMult = 1; u.dodgeMult = 1; u.cdMult = 1; u.critBonus = 0; u.buffUntil = 0;
          }
        }

        for (const u of next) {
          if (!u.alive) continue;

          // DoT + regen (ต่อเนื่องทุก ~1 วิ)
          u.dotTickLeft -= dt;
          if (u.dotTickLeft <= 0) {
            u.dotTickLeft = 1000;
            if (u.statusEffects.dotTurns > 0) {
              u.currentHp = Math.max(0, u.currentHp - u.statusEffects.dotDmg);
              u.statusEffects = { ...u.statusEffects, dotTurns: u.statusEffects.dotTurns - 1 };
              if (u.currentHp <= 0) u.alive = false;
            }
          }
          if (u.regenPct > 0) u.currentHp = Math.min(u.maxHp, u.currentHp + u.maxHp * u.regenPct * (dt / 1000) * 3);

          if (!u.alive) continue;

          if (u.statusEffects.stunTurns > 0) {
            u.statusEffects = { ...u.statusEffects, stunTurns: Math.max(0, u.statusEffects.stunTurns - dt / 1000) } as StatusEffects;
            continue;
          }

          u.guts = Math.min(100, u.guts + u.boostedStats.spd * 0.02 * u.gutsMultiplier * (dt / 100));

          const foes = next.filter(o => o.alive && o.isPlayer !== u.isPlayer);
          if (foes.length === 0) continue;
          let target = next.find(o => o.ghost.id === u.targetId && o.alive && o.isPlayer !== u.isPlayer);
          if (!target) { target = foes[Math.floor(Math.random() * foes.length)]; u.targetId = target.ghost.id; }

          const range = u.role === 'melee' ? MELEE_RANGE : RANGED_RANGE;
          const dx = target.x - u.x, dy = target.y - u.y;
          const dist = Math.hypot(dx, dy);

          if (dist > range) {
            const len = dist || 1;
            u.x += (dx / len) * 0.018 * dt;
            u.y += (dy / len) * 0.018 * dt;
          } else {
            u.cdLeft -= dt;
            if (u.cdLeft <= 0 && !u.attacking) {
              if (u.role === 'ranged') {
                spawnFx({ kind: 'proj', x: u.x, y: u.y, tx: target.x, ty: target.y });
              }
              setTimeout(() => resolveAction(u.ghost.id), u.role === 'ranged' ? 180 : 0);
              u.cdLeft = 99999; // กันยิงซ้ำระหว่างรอ resolveAction (reset จริงใน resolveAction)
            }
          }
          u.x = Math.max(4, Math.min(96, u.x));
          u.y = Math.max(8, Math.min(92, u.y));
        }
        return next;
      });

      // ── win/lose check ──
      setCombatants(prev => {
        const pAlive = prev.filter(c => c.isPlayer && c.alive).length;
        const eAlive = prev.filter(c => !c.isPlayer && c.alive).length;
        if (prev.length > 0 && (pAlive === 0 || eAlive === 0) && phase === 'battle') {
          const w = pAlive > 0 ? 'player' : 'ai';
          setPhase('end');
          setWinner(w);
          pushLog(w === 'player' ? '🏆 ชนะการต่อสู้!' : '💀 พ่ายแพ้...', 'info');
        }
        return prev;
      });

      // ── round/rest timer (ref-driven กัน stale closure ใน rAF loop) ──
      phaseMsLeftRef.current -= dt;
      if (phaseMsLeftRef.current <= 0) {
        if (battlePhaseRef.current === 'fight') {
          battlePhaseRef.current = 'rest';
          phaseMsLeftRef.current = REST_MS;
          setCombatants(prev => {
            const pAlive = prev.filter(c => c.isPlayer && c.alive).length;
            const eAlive = prev.filter(c => !c.isPlayer && c.alive).length;
            if (pAlive === 0 || eAlive === 0) return prev;
            return prev.map(c => c.alive ? {
              ...c, x: c.spawnX, y: c.spawnY, targetId: null,
              statusEffects: { ...EMPTY_STATUS }, atkMult: 1, dodgeMult: 1, cdMult: 1, critBonus: 0, buffUntil: 0,
            } : c);
          });
          setCmdReady(r => ({ ...r, item: true }));
          pushLog('🔔 หมดยก! กลับมุมเติมพลัง 6 วิ', 'info');
        } else {
          const nextRound = roundRef.current + 1;
          if (nextRound > 2) {
            setCombatants(prev => {
              const pHp = prev.filter(c => c.isPlayer).reduce((s, c) => s + c.currentHp, 0);
              const eHp = prev.filter(c => !c.isPlayer).reduce((s, c) => s + c.currentHp, 0);
              const w = pHp >= eHp ? 'player' : 'ai';
              setPhase('end'); setWinner(w);
              pushLog(w === 'player' ? '🏆 ชนะคะแนน! (HP รวมมากกว่า)' : '💀 แพ้คะแนน...', 'info');
              return prev;
            });
            phaseMsLeftRef.current = 0;
          } else {
            roundRef.current = nextRound;
            battlePhaseRef.current = 'fight';
            phaseMsLeftRef.current = ROUND_MS;
            setRound(nextRound);
            pushLog(`🔔 ยกที่ ${nextRound} เริ่ม!`, 'info');
          }
        }
        setBattlePhase(battlePhaseRef.current);
      }
      setPhaseMsLeft(Math.max(0, phaseMsLeftRef.current));
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); lastTsRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, battleSpeed]);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);

  // ── Coach commands ───────────────────────────────────────────
  function teamStance(kind: 'allout' | 'defense') {
    if (battlePhase !== 'fight' || !cmdReady[kind]) return;
    const cfg = kind === 'allout'
      ? { atkMult: 1.45, dodgeMult: 0.75, cdMult: 0.8, critBonus: 0.1, label: 'ลุยเลย!' }
      : { atkMult: 0.9, dodgeMult: 1.7, cdMult: 1, critBonus: 0, label: 'ตั้งรับ!' };
    let listened = 0;
    setCombatants(prev => prev.map(c => {
      if (!c.isPlayer || !c.alive) return c;
      if (Math.random() < c.listenChance) {
        listened++;
        return { ...c, atkMult: cfg.atkMult, dodgeMult: cfg.dodgeMult, cdMult: cfg.cdMult, critBonus: cfg.critBonus, buffUntil: Date.now() + 5500 };
      }
      return c;
    }));
    pushLog(`📣 ตะโกน "${cfg.label}" — มีคนฟัง`, 'info');
    setCmdReady(r => ({ ...r, [kind]: false }));
    setTimeout(() => setCmdReady(r => ({ ...r, [kind]: true })), 7000);
  }

  function focusCommand(kind: 'front' | 'ranged' | 'healerFocus') {
    if (battlePhase !== 'fight' || !cmdReady[kind]) return;
    setCombatants(prev => {
      const enemies = prev.filter(c => !c.isPlayer && c.alive);
      if (enemies.length === 0) return prev;
      let chosen = kind === 'ranged' ? enemies.find(e => e.role === 'ranged')
        : kind === 'healerFocus' ? enemies.find(e => e.role === 'healer')
        : null;
      if (!chosen) chosen = kind === 'front'
        ? enemies.reduce((closest, e) => e.x < closest.x ? e : closest, enemies[0])
        : enemies[Math.floor(Math.random() * enemies.length)];
      const label = kind === 'front' ? 'ตัวหน้า' : kind === 'ranged' ? 'ตัวตีไกล' : 'ตัวฮีล';
      pushLog(`📣 สั่งโฟกัส "${label}" → เล็งไปที่ ${GHOST_REG[chosen.ghost.ghost_type]?.nameTh ?? ''}`, 'info');
      return prev.map(c => (c.isPlayer && c.alive && c.role !== 'healer' && Math.random() < c.listenChance)
        ? { ...c, targetId: chosen!.ghost.id } : c);
    });
    setCmdReady(r => ({ ...r, [kind]: false }));
    setTimeout(() => setCmdReady(r => ({ ...r, [kind]: true })), 6000);
  }

  function useItem() {
    if (battlePhase !== 'rest' || !cmdReady.item) return;
    setCombatants(prev => {
      const allies = prev.filter(c => c.isPlayer && c.alive);
      if (allies.length === 0) return prev;
      const target = allies.reduce((low, c) => c.currentHp / c.maxHp < low.currentHp / low.maxHp ? c : low, allies[0]);
      pushLog(`🎒 ส่งไอเทมเติมพลังให้ ${GHOST_REG[target.ghost.ghost_type]?.nameTh ?? ''} +30%`, 'heal');
      spawnFx({ kind: 'heal', x: target.x, y: target.y, text: '+30%' });
      return prev.map(c => c.ghost.id === target.ghost.id ? { ...c, currentHp: Math.min(c.maxHp, c.currentHp + c.maxHp * 0.3) } : c);
    });
    setCmdReady(r => ({ ...r, item: false }));
  }

  function resetToSelect() {
    if (arenaMode) { navigate('/arena'); return; }
    setPhase('select'); setSelectedIds([]); setCombatants([]); enemyGhostsRef.current = [];
    setLog([]); setWinner(null); setBattleRewards(null); setArenaScore(0); setFx([]);
  }

  // ── TEAM SELECT PHASE ──────────────────────────────────────────
  if (phase === 'select') {
    const nextStepIsBoss = (save?.steps_taken ?? 0) === zone.steps - 1;
    const ROLE_ICON: Record<Role, string> = { melee: '⚔️', ranged: '➹', healer: '✚' };
    return (
      <div className="screen fade-in">
        <ScreenHeader title={arenaMode ? '🏆 Arena — เลือกทีม' : '⚔️ เลือกทีม'} back={arenaMode ? '/arena' : '/home'} />
        <div className="screen-content">
          {arenaMode ? (
            <div style={{ background: 'linear-gradient(135deg, rgba(245,197,24,0.10), var(--bg-card))', border: '1.5px solid rgba(245,197,24,0.35)', borderRadius: 'var(--r-lg)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28 }}>{opponent ? '⚔️' : '🏆'}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold)' }}>{opponent ? `VS ${opponent.username}` : 'Arena VS AI'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {opponent ? `ทีมตั้งรับของ ${opponent.username} — ผี ${opponent.team.length} ตัว` : 'ศัตรู AI สุ่มจาก ghost pool — ระดับใกล้เคียงทีมคุณ'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: nextStepIsBoss ? 'linear-gradient(135deg, rgba(255,71,87,0.12), rgba(255,71,87,0.04))' : 'linear-gradient(135deg, rgba(38,222,129,0.08), var(--bg-card))',
              border: `1.5px solid ${nextStepIsBoss ? 'rgba(255,71,87,0.4)' : 'rgba(38,222,129,0.25)'}`, borderRadius: 'var(--r-lg)', padding: '12px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{nextStepIsBoss ? '👑 BOSS BATTLE' : `บทที่ ${zone.chapter} — ${zone.name}`}</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{nextStepIsBoss ? `⚠️ บอสประจำโซน — ${zone.name}` : zone.desc}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  ศัตรู: {(nextStepIsBoss ? zone.bossTypes : zone.enemies).map(t => GHOST_REG[t]?.nameTh ?? t).join(', ')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', marginBottom: 4 }}>{stepsDone}/{zone.steps} การต่อสู้</div>
                <div style={{ width: 60, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${(stepsDone / zone.steps) * 100}%`, background: nextStepIsBoss ? 'var(--red)' : 'var(--green)' }} />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>เลือกผีไปสู้สด — ทุกตัวขยับ/ตีกันเองอัตโนมัติ ดูเพลินๆ ได้เลย</span>
            <span style={{ fontWeight: 700, color: selectedIds.length > 0 ? 'var(--gold)' : 'var(--text-muted)' }}>{selectedIds.length}/3</span>
          </div>

          {ghosts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>😶</div>
              <div className="text-muted">ยังไม่มีวิญญาณ — ไปเชิญผีก่อน</div>
            </div>
          ) : (
            <div className="grid-2" style={{ marginBottom: 16 }}>
              {ghosts.map(ghost => {
                const def = GHOST_REG[ghost.ghost_type];
                if (!def) return null;
                const isSelected = selectedIds.includes(ghost.id);
                const rank = isSelected ? selectedIds.indexOf(ghost.id) + 1 : null;
                const role = deriveRole(ghost.ghost_type);
                const faction = FACTION_MAP[ghost.ghost_type] ?? 'nilkal';
                return (
                  <div key={ghost.id} onClick={() => toggleSelect(ghost.id)} style={{
                    background: isSelected ? 'linear-gradient(135deg, rgba(245,197,24,0.15), rgba(245,197,24,0.05))' : 'var(--bg-card)',
                    border: isSelected ? '2px solid rgba(245,197,24,0.6)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--r-lg)', padding: '10px 8px',
                    cursor: !isSelected && selectedIds.length >= 3 ? 'not-allowed' : 'pointer',
                    opacity: !isSelected && selectedIds.length >= 3 ? 0.4 : 1,
                    display: 'flex', alignItems: 'center', gap: 10, position: 'relative', transition: 'all 0.15s',
                  }}>
                    {rank && (
                      <div style={{ position: 'absolute', top: 6, right: 8, width: 20, height: 20, borderRadius: '50%', background: 'var(--gold)', color: '#000', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{rank}</div>
                    )}
                    <Chibi emoji={def.emoji} element={def.element} size={44} evoStage={ghost.evo_stage} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ghost.nickname || def.nameTh}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>Lv.{ghost.level}</span>
                        <span>{ROLE_ICON[role]} {role === 'melee' ? 'ตีใกล้ (บุกเร็ว)' : role === 'ranged' ? 'ตีไกล (ยิงจากระยะ)' : 'ฮีล (รักษาเพื่อน)'}</span>
                        <span style={{ color: FACTION_COLOR[faction] }}>· {FACTION_NAME[faction]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button type="button" className="btn btn-full btn-lg btn-red" disabled={selectedIds.length < 1} onClick={handleStartClick} style={{ opacity: selectedIds.length < 1 ? 0.5 : 1 }}>
            {selectedIds.length < 1 ? 'เลือกผีอย่างน้อย 1 ตัว' : arenaMode ? `🏆 ท้าชิง! (${selectedIds.length} ตัว)` : nextStepIsBoss ? `👑 เข้าสู้บอส! (${selectedIds.length} ตัว)` : `⚔️ เริ่มต่อสู้! (${selectedIds.length} ตัว)`}
          </button>

          {showTutorial && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,17,32,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }}>
              <div style={{ width: '100%', maxWidth: 360, background: 'var(--bg-card)', border: '1.5px solid rgba(245,197,24,0.4)', borderRadius: 'var(--r-lg)', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>⚔️ ก่อนลงสนามครั้งแรก</div>
                {[
                  { icon: '🏃', title: 'ไม่ต้องกดอะไรก็ได้', desc: 'ผีสู้กันเองอัตโนมัติทั้งหมด ดูเพลินๆ ได้เลย' },
                  { icon: '⚔️➹✚', title: 'ผีแต่ละตัวมีบทบาท', desc: 'ตีใกล้ (บุกเร็ว) · ตีไกล (ยิงจากระยะ) · ฮีล (รักษาเพื่อน)' },
                  { icon: '🔮', title: 'อยากช่วยก็กดปุ่มโค้ชได้', desc: 'ลุยเลย/ตั้งรับ/โฟกัสเป้า ระหว่างชก · ไอเทมใช้ได้ตอนพักยกเท่านั้น' },
                  { icon: '🥊', title: 'สู้ 2 ยก', desc: 'ยกละ ~20 วิ พักยก 6 วิ ใครชนะหมดก่อน หรือ HP รวมเยอะกว่าตอนครบ 2 ยก คือผู้ชนะ' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 20, flex: 'none', width: 28, textAlign: 'center' }}>{s.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-gold btn-full" style={{ marginTop: 4 }} onClick={dismissTutorial}>
                  เข้าใจแล้ว ลุยเลย!
                </button>
              </div>
            </div>
          )}

          {!arenaMode && <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
            {Array.from({ length: zone.steps }).map((_, i) => (
              <div key={i} style={{ width: i < stepsDone ? 18 : 12, height: 6, borderRadius: 3, background: i < stepsDone ? 'var(--green)' : i === stepsDone ? (nextStepIsBoss ? 'var(--red)' : 'var(--gold)') : 'rgba(255,255,255,0.1)', transition: 'all 0.2s' }} />
            ))}
          </div>}
        </div>
      </div>
    );
  }

  // ── BATTLE / END PHASE ─────────────────────────────────────────
  return (
    <div className="screen fade-in" style={{ paddingBottom: 0 }}>
      <ScreenHeader
        title={arenaMode ? `🏆 ${opponent ? `VS ${opponent.username}` : 'Arena Battle'}` : `⚔️ ${isBoss ? '👑 BOSS — ' : ''}${zone.name}`}
        back={arenaMode ? '/arena' : '/home'}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 12px', gap: 8, minHeight: 0, position: 'relative' }}>

        {/* ── Arena ── */}
        <div style={{
          position: 'relative', height: 230, background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--r-lg)', overflow: 'hidden',
          animation: shake ? 'battleShake 0.25s ease' : 'none',
        }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.06)' }} />
          {critFlash && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.4, zIndex: 20, animation: 'critFade 0.18s ease-out' }} />}

          {/* round/rest banner */}
          <div style={{ position: 'absolute', top: 4, left: 6, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', zIndex: 15 }}>
            ยกที่ {round}/2 · {battlePhase === 'fight' ? `กำลังชก ${Math.ceil(phaseMsLeft / 1000)}s` : `พักยก ${Math.ceil(phaseMsLeft / 1000)}s`}
          </div>

          {battlePhase === 'rest' && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 18, background: 'rgba(11,17,32,0.78)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, textAlign: 'center', padding: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>🛎 หมดยก — พักมุม</div>
              <div style={{ fontSize: 26, fontFamily: 'JetBrains Mono, monospace' }}>{Math.ceil(phaseMsLeft / 1000)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 260 }}>ฟื้น HP เอง — ส่งไอเทมได้ด้านล่าง หรือไม่กดอะไรก็ชกต่อเองอัตโนมัติ</div>
            </div>
          )}

          {/* fighters */}
          {combatants.map(c => {
            const def = GHOST_REG[c.ghost.ghost_type];
            if (!def) return null;
            const hasSprite = !!GHOST_SPRITE[c.ghost.ghost_type];
            return (
              <div key={c.ghost.id} style={{
                position: 'absolute', left: `${c.x}%`, top: `${c.y}%`, transform: 'translate(-50%,-50%)',
                opacity: c.alive ? 1 : 0.25, filter: c.alive ? 'none' : 'grayscale(1)',
                transition: 'left 0.18s linear, top 0.18s linear', zIndex: 5,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <div style={{ fontSize: 8, color: c.isPlayer ? 'var(--green)' : 'var(--red)', fontWeight: 700, marginBottom: 1, whiteSpace: 'nowrap' }}>
                  {def.nameTh}{c.statusEffects.stunTurns > 0 ? ' 💫' : ''}
                </div>
                <div style={{ width: 26, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.12)', marginBottom: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(0, (c.currentHp / c.maxHp) * 100)}%`, height: '100%', background: c.isPlayer ? 'var(--green)' : 'var(--red)' }} />
                </div>
                {hasSprite
                  ? <SpriteChar ghostType={c.ghost.ghost_type} animState={getAnimState(c)} size={40} flip={!c.isPlayer} />
                  : <Chibi emoji={def.emoji} element={def.element} size={34} evoStage={c.ghost.evo_stage} />}
              </div>
            );
          })}

          {/* FX layer */}
          {fx.map(e => (
            <div key={e.id} style={{ position: 'absolute', left: `${e.x}%`, top: `${e.y}%`, transform: 'translate(-50%,-50%)', zIndex: 25, pointerEvents: 'none' }}>
              {e.kind === 'proj' ? (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#fff',
                  boxShadow: '0 0 8px 3px #4fd1c5',
                  animation: 'projFly 0.26s linear forwards',
                  // @ts-expect-error CSS custom props
                  '--tx': `${(e.tx! - e.x) * 2.3}px`, '--ty': `${(e.ty! - e.y) * 2.3}px`,
                }} />
              ) : (
                <div style={{
                  fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  color: e.kind === 'heal' ? 'var(--green)' : e.kind === 'crit' ? 'var(--red)' : e.kind === 'dodge' ? 'var(--text-muted)' : 'var(--gold)',
                  animation: 'floatUp 0.6s ease forwards', whiteSpace: 'nowrap',
                }}>{e.text}</div>
              )}
            </div>
          ))}
        </div>

        {/* battle log */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', border: '1px solid rgba(255,255,255,0.07)', padding: '8px 10px', display: 'flex', flexDirection: 'column', minHeight: 56, maxHeight: 84, overflow: 'hidden' }}>
          <div ref={logRef} style={{ overflowY: 'auto', flex: 1 }}>
            {log.map((entry, i) => (
              <div key={i} style={{ fontSize: 10.5, marginBottom: 2, color: entry.type === 'info' ? 'var(--gold)' : entry.type === 'heal' ? 'var(--green)' : 'var(--text-light)', fontWeight: entry.type === 'info' ? 700 : 400 }}>{entry.text}</div>
            ))}
          </div>
        </div>

        {/* coach panel */}
        {phase === 'battle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 12 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 'var(--r-lg)', padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>🔮 คำสั่งจอมขมังเวท — ไม่กดก็สู้ต่อเองได้</div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                {([
                  { k: 'allout' as const, label: 'ลุยเลย!' },
                  { k: 'defense' as const, label: 'ตั้งรับ!' },
                ]).map(b => (
                  <button key={b.k} type="button" disabled={battlePhase !== 'fight' || !cmdReady[b.k]} onClick={() => teamStance(b.k)}
                    style={{ flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 700, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)', borderRadius: 6, color: '#c084fc', cursor: 'pointer', opacity: battlePhase !== 'fight' || !cmdReady[b.k] ? 0.4 : 1 }}>
                    {b.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                {([
                  { k: 'front' as const, label: '🎯 ตัวหน้า' },
                  { k: 'ranged' as const, label: '🎯 ตีไกล' },
                  { k: 'healerFocus' as const, label: '🎯 ตัวฮีล' },
                ]).map(b => (
                  <button key={b.k} type="button" disabled={battlePhase !== 'fight' || !cmdReady[b.k]} onClick={() => focusCommand(b.k)}
                    style={{ flex: 1, padding: '6px 0', fontSize: 10.5, fontWeight: 700, background: 'rgba(245,197,24,0.12)', border: '1px solid rgba(245,197,24,0.35)', borderRadius: 6, color: 'var(--gold)', cursor: 'pointer', opacity: battlePhase !== 'fight' || !cmdReady[b.k] ? 0.4 : 1 }}>
                    {b.label}
                  </button>
                ))}
              </div>
              <button type="button" disabled={battlePhase !== 'rest' || !cmdReady.item} onClick={useItem}
                style={{ width: '100%', padding: '7px 0', fontSize: 11, fontWeight: 700, background: 'rgba(38,222,129,0.12)', border: '1px solid rgba(38,222,129,0.35)', borderRadius: 6, color: 'var(--green)', cursor: 'pointer', opacity: battlePhase !== 'rest' || !cmdReady.item ? 0.4 : 1 }}>
                🎒 ไอเทมเติมพลัง (ใช้ได้ตอนพักยกเท่านั้น)
              </button>
            </div>

            {!fleeing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: '7px 10px' }}>
                {([1, 2, 3, 4] as const).map(s => (
                  <button key={s} type="button" onClick={() => setBattleSpeed(s)} style={{ padding: '4px 7px', fontSize: 11, fontWeight: 700, borderRadius: 5, cursor: 'pointer', background: battleSpeed === s ? 'rgba(245,197,24,0.25)' : 'rgba(255,255,255,0.06)', border: `1px solid ${battleSpeed === s ? 'rgba(245,197,24,0.7)' : 'rgba(255,255,255,0.1)'}`, color: battleSpeed === s ? 'var(--gold)' : 'var(--text-muted)' }}>x{s}</button>
                ))}
                <span style={{ flex: 1, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>⚔️ Real-time Arena</span>
                <button type="button" onClick={() => setFleeing(true)} style={{ background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.35)', borderRadius: 6, color: 'var(--red)', fontSize: 11, fontWeight: 700, padding: '4px 9px', cursor: 'pointer' }}>🏳️ ถอย</button>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.4)', borderRadius: 'var(--r-lg)', padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 10 }}>🏳️ ยืนยันถอยทัพ? (ไม่ได้รับรางวัล)</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1, fontSize: 12 }} onClick={() => setFleeing(false)}>สู้ต่อ</button>
                  <button type="button" style={{ flex: 2, fontSize: 12, fontWeight: 700, padding: '8px', background: 'rgba(255,71,87,0.25)', border: '1px solid rgba(255,71,87,0.6)', borderRadius: 8, color: 'var(--red)', cursor: 'pointer' }}
                    onClick={() => { setFleeing(false); setWinner('ai'); setPhase('end'); pushLog('🏳️ ถอยทัพแล้ว...', 'info'); }}>
                    🏳️ ยืนยันถอยทัพ
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* end overlay */}
        {phase === 'end' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(11,17,32,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                textAlign: 'center', padding: '28px 16px',
                background: winner === 'player' ? 'linear-gradient(135deg, rgba(38,222,129,0.18), rgba(38,222,129,0.05))' : 'linear-gradient(135deg, rgba(255,71,87,0.18), rgba(255,71,87,0.05))',
                border: `2px solid ${winner === 'player' ? 'rgba(38,222,129,0.5)' : 'rgba(255,71,87,0.5)'}`, borderRadius: 'var(--r-lg)',
              }}>
                <div style={{ fontSize: 52, marginBottom: 8 }}>{winner === 'player' ? '🏆' : '💀'}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: winner === 'player' ? 'var(--green)' : 'var(--red)' }}>{winner === 'player' ? 'ชนะแล้ว!' : 'พ่ายแพ้...'}</div>
              </div>

              {winner === 'player' && battleRewards?.zoneCleared && (
                <div style={{ background: 'linear-gradient(135deg, rgba(245,197,24,0.2), rgba(245,197,24,0.05))', border: '1.5px solid rgba(245,197,24,0.5)', borderRadius: 'var(--r-lg)', padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gold)' }}>🎉 โซนผ่านแล้ว!</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {ZONE_DEFS[zoneIdx + 1] ? `บทที่ ${ZONE_DEFS[zoneIdx + 1].chapter} — ${ZONE_DEFS[zoneIdx + 1].name} ปลดล็อกแล้ว!` : 'คุณผ่านทุกโซนแล้ว! 🏆'}
                  </div>
                </div>
              )}

              {winner === 'player' && battleRewards && (
                <div style={{ background: 'rgba(245,197,24,0.07)', border: '1px solid rgba(245,197,24,0.25)', borderRadius: 'var(--r-lg)', padding: '14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 2 }}>{arenaMode ? '🏆 Arena Rewards' : '✨ รางวัลการต่อสู้'}</div>
                  {arenaMode && <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--gold)' }}>+{arenaScore.toLocaleString()} pts</div>}
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-light)' }}>
                    <span>⚡ EXP +{battleRewards.expGained}</span>
                    <span>🌀 +{battleRewards.dustGained} ฝุ่น</span>
                    {battleRewards.coinsGained > 0 && <span>🪙 +{battleRewards.coinsGained} เหรียญผี</span>}
                    {battleRewards.fluidGained > 0 && <span>🧪 +{battleRewards.fluidGained} น้ำสาปหายาก</span>}
                    <span>💞 Bond +2</span>
                  </div>
                  {battleRewards.levelUps.map((ghostType, i) => (
                    <div key={i} style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>🎉 {GHOST_REG[ghostType]?.nameTh ?? ghostType} เลเวลอัพ! (+3 Skill Points)</div>
                  ))}
                </div>
              )}

              {winner === 'player' && !battleRewards && <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>กำลังบันทึกรางวัล...</div>}

              <button type="button" className="btn btn-gold btn-full" style={{ fontSize: 16, padding: '14px' }} onClick={resetToSelect}>
                {arenaMode ? '🏆 กลับ Arena' : winner === 'player' ? '🔄 สู้ต่อ' : '🔄 ลองใหม่'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
