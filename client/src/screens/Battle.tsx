import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GHOST_REG, ELEMENT_CHART } from '../data/ghosts';
import { ZONE_DEFS, getZoneDef, getZoneIndex, buildZoneEnemies } from '../data/zones';
import Chibi from '../components/Chibi';
import SpriteChar, { GHOST_SPRITE } from '../components/SpriteChar';
import type { AnimState } from '../components/SpriteChar';
import ScreenHeader from '../components/ScreenHeader';
import type { Ghost, GhostStats } from '../types';

interface AttackAnim {
  key: number;
  attackerGhostId: string;
  targetGhostId: string;
  fromPlayer: boolean;   // true = player attacks enemy (orb goes up)
  fromIdx: number;       // attacker's index in their side
  fromCount: number;     // total on attacker's side
  element: string;
}

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#ff4757', water: '#4d9fff', wood: '#26de81', earth: '#fd9644',
  metal: '#eccc68', dark: '#a55eea', light: '#f5c518',
};
const ELEMENT_EMOJI: Record<string, string> = {
  fire: '🔥', water: '💧', wood: '🌿', earth: '💥',
  metal: '⚡', dark: '💜', light: '✨',
};

interface StatusEffects {
  stunTurns:    number;
  defDebuffPct: number;
  atkDebuffPct: number;
  shieldPct:    number;
  dotDmg:       number;
  dotTurns:     number;
}

const EMPTY_STATUS: StatusEffects = {
  stunTurns: 0, defDebuffPct: 0, atkDebuffPct: 0, shieldPct: 0, dotDmg: 0, dotTurns: 0,
};

interface Combatant {
  ghost: Ghost;
  currentHp: number;
  maxHp: number;
  atb: number;
  guts: number;
  isPlayer: boolean;
  alive: boolean;
  boostedStats: GhostStats;
  gutsMultiplier: number;
  regenPct: number;
  cooldowns: Record<string, number>;
  statusEffects: StatusEffects;
  critRate: number;
}

interface LogEntry { text: string; type: 'hit' | 'skill' | 'heal' | 'info' }

const BASIC_FLAVOR: Record<string, string[]> = {
  pob:         ['ปอบอ้าปากกว้าง โจมตี', 'กลิ่นตับดิบโชยไปที่', 'ปอบกระโจนใส่'],
  phiDib:      ['ผีดิบฟัดโครมใส่', 'ซอมบี้หิวแล้ว โถมใส่', 'ผีดิบแหกปาก กัด'],
  krasue:      ['หัวลอยเข้าหา', 'กระสือดูด HP จาก', 'ไส้ห้อยแกว่งใส่'],
  kumantong:   ['กุมารตบหน้า', 'เด็กน้อยกรีดร้อง ตี', 'กุมารโกรธแล้วนะ!! ตี'],
  nangTani:    ['เถาวัลย์รัดแน่น ใส่', 'นางตานีเหวี่ยงกิ่งไม้ใส่', 'ต้นกล้วยพุ่งไปที่'],
  pret:        ['เล็บเปรตข่วน', 'เปรตหิวโหย จิก', 'ตัวสูงเอี้ยวตีหัว'],
  maeNak:      ['แม่นาคซัดน้ำใส่', 'แขนยาวผิดปกติ ตบ', 'แม่นาคยิ้มน่ากลัว โจมตี'],
  kalakinee:   ['ฟ้าผ่าลงใส่', 'กาลกิณีส่งความซวยไปที่', 'โดนแล้วซวยเลย!'],
  pisaj:       ['ปีศาจพ่นไฟใส่', 'เผา! เผา! เผา! โจมตี', 'ปีศาจโจมตีด้วยความสนุก'],
  phiTaiHong:  ['ผีตายโหงคลั้มคลั่ง ตี', 'ความแค้นล้นใจ ระเบิดใส่', 'โกรธมาก! ตบ'],
  asurakay:    ['อสุรกายก้าวย่าง ทับ', 'ยักษ์บดขยี้', 'แผ่นดินสั่น โจมตี'],
  motherSpirit:['แม่เจ้าของกรีดร้อง ใส่', 'พลังศักดิ์สิทธิ์ โจมตี', 'แม่ผีลอยมาใกล้ ตี'],
};

const SKILL_FLAVOR: Record<string, string> = {
  pob_curse:      '🔥 ไฟปอบ!! ลุกโชนใส่',
  phidib_taunt:   '📣 ท้าทาย! ผีดิบตะโกน "มาตีฉันสิ!!" รับ Shield',
  krasue_curse:   '💀 คำสาปกระสือ! ดูดพลังป้องกันทั้งทีมศัตรู!',
  kmt_heal:       '💚 พรทิพย์! กุมารอวยพรเพื่อนร่วมทีม',
  tani_sleep:     '😴 ต้นกล้วยสะกด! ทีมศัตรูง่วงนอนหมดเลย~',
  pret_feast:     '🍖 กินวิญญาณ!! เปรตกินอาหารมื้อพิเศษ',
  nak_shield:     '💙 รักนิรันดร์! แม่นาคกางปีกปกป้องทีม +40% Shield',
  kala_hex:       '⚡ คำสาปกาล! ทุกคนจะซวยตั้งแต่นี้... ตัด GUTS!',
  pisaj_inferno:  '🌋 นรกลุกโชน!! ไฟนรกลุกท่วม',
  pth_rampage:    '💢 โหมกระหน่ำ!! ผีตายโหงคลุ้มคลั่ง 3 ครั้ง!',
  asura_titan:    '🗿 ไททันกร้าว!! อสุรยักษ์กระจายพลังทั้งสนาม!',
  ms_revive:      '✨ ฟื้นคืนชีพ!! แม่เจ้าของดึงวิญญาณกลับมา',
};

const CRIT_SUFFIX = ['💥 CRITICAL!!!', '🔥 โหดมาก!', '💀 กระดูกร้าว!', '⚡ ซวยจัง~', '😱 โอ้โห!!'];
const KILL_MSG    = ['ลาก่อนนะ~', 'เอ็งหมดแล้ว!', 'อย่าโกรธกันนะ~', 'เจ็บไหม? เจ็บไหม?'];

const SKILL_STAT_BONUSES: Record<string, Partial<GhostStats>> = {
  atk1: { str: 5  },
  atk2: { str: 10 },
  mag1: { mag: 5  },
  def1: { def: 5  },
  def2: { def: 10 },
  hp1:  { hp: 100 },
  spd1: { spd: 5  },
};

function getSkillBonuses(ghost: Ghost) {
  const nodes = ghost.skill_tree?.nodes_taken ?? [];
  const s = { hp: 0, str: 0, mag: 0, def: 0, spr: 0, spd: 0 };
  for (const id of nodes) {
    const b = SKILL_STAT_BONUSES[id];
    if (!b) continue;
    if (b.hp)  s.hp  += b.hp;
    if (b.str) s.str += b.str;
    if (b.mag) s.mag += b.mag;
    if (b.def) s.def += b.def;
    if (b.spr) s.spr += b.spr;
    if (b.spd) s.spd += b.spd;
  }
  return {
    statBonus:      s,
    gutsMultiplier: 1 + (nodes.includes('guts1') ? 0.15 : 0) + (nodes.includes('guts2') ? 0.15 : 0),
    atbStart:       nodes.includes('rush') ? 30 : 0,
    regenPct:       nodes.includes('regen') ? 0.02 : 0,
  };
}

function makeCombatant(ghost: Ghost, isPlayer: boolean, fieldAmuletId?: string | null): Combatant {
  const ghostDef  = GHOST_REG[ghost.ghost_type];
  const fallback  = ghostDef?.baseStats ?? { hp: 1000, str: 30, mag: 20, def: 20, spr: 20, spd: 20 };
  const saved     = ghost.stats ?? {};
  const { statBonus, gutsMultiplier: skillGutsMulti, atbStart, regenPct } = isPlayer
    ? getSkillBonuses(ghost)
    : { statBonus: { hp: 0, str: 0, mag: 0, def: 0, spr: 0, spd: 0 }, gutsMultiplier: 1, atbStart: 0, regenPct: 0 };

  let hp  = (saved.hp  ?? fallback.hp)  + statBonus.hp;
  let str = (saved.str ?? fallback.str) + statBonus.str;
  let mag = (saved.mag ?? fallback.mag) + statBonus.mag;
  let def = (saved.def ?? fallback.def) + statBonus.def;
  let spr = (saved.spr ?? fallback.spr) + statBonus.spr;
  let spd = (saved.spd ?? fallback.spd) + statBonus.spd;
  let massGutsMulti = 1;

  if (isPlayer) {
    // Evolution: HP flat + STR/MAG % + SPD flat per stage
    const stage = ghost.evo_stage ?? 0;
    if (stage > 0) {
      hp  += stage * 200;
      str  = Math.round(str * (1 + stage * 0.08));
      mag  = Math.round(mag * (1 + stage * 0.08));
      spd += stage * 5;
    }

    // Frame: accumulated DEF/SPR stored in frame.base_def / frame.base_spr
    if (ghost.frame?.enhancement > 0) {
      def = ghost.frame.base_def;
      spr = ghost.frame.base_spr;
    }

    // Spirit Mass affixes (simple numeric ones only)
    for (const affix of ghost.spirit_mass?.affixes ?? []) {
      const num = parseInt(affix.match(/\d+/)?.[0] ?? '0', 10);
      if (!num) continue;
      if      (affix.includes('ATK') && affix.includes('%')) str = Math.round(str * (1 + num / 100));
      else if (affix.includes('DEF') && affix.includes('%')) def = Math.round(def * (1 + num / 100));
      else if (affix.includes('MAG') && affix.includes('%')) mag = Math.round(mag * (1 + num / 100));
      else if (affix.includes('SPR') && affix.includes('%')) spr = Math.round(spr * (1 + num / 100));
      else if (affix.includes('SPD'))                        spd += num;
      else if (affix.includes('HP') && !affix.includes('%')) hp  += num;
      else if (affix.includes('GUTS'))                       massGutsMulti *= (1 + num / 100);
    }

    // Field amulet (1 slot per field position)
    if (fieldAmuletId) {
      if (fieldAmuletId === 'a_hp')    hp  += 300;
      if (fieldAmuletId === 'a_atk')   str += 15;
      if (fieldAmuletId === 'a_mag')   mag += 15;
      if (fieldAmuletId === 'a_spd')   spd += 10;
      if (fieldAmuletId === 'a_curse') mag += 25;
      if (fieldAmuletId === 'a_guts')  massGutsMulti *= 1.25;
    }
  }

  const boostedStats: GhostStats = { hp, str, mag, def, spr, spd };
  const gutsMultiplier = skillGutsMulti * massGutsMulti;
  const hasCrit = isPlayer && (ghost.skill_tree?.nodes_taken ?? []).includes('crit');

  return {
    ghost, currentHp: boostedStats.hp, maxHp: boostedStats.hp,
    atb: atbStart, guts: 0, isPlayer, alive: true,
    boostedStats, gutsMultiplier, regenPct,
    cooldowns: {}, statusEffects: { ...EMPTY_STATUS }, critRate: hasCrit ? 0.2 : 0.1,
  };
}

function getAnimState(com: Combatant, attackAnim: AttackAnim | null): AnimState {
  if (!com.alive) return 'death';
  if (attackAnim?.attackerGhostId === com.ghost.id) return 'attack';
  if (attackAnim?.targetGhostId   === com.ghost.id) return 'hurt';
  return 'idle';
}

function buildArenaEnemies(teamAvgLevel: number, count: number): import('../types').Ghost[] {
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
        hp:  Math.round(base.hp  * scale), str: Math.round(base.str * scale),
        mag: Math.round(base.mag * scale), def: Math.round(base.def * scale),
        spr: Math.round(base.spr * scale), spd: base.spd,
      },
      soul_core:   { element: def.element, classType: def.classType, baseStats: base },
      frame:       { enhancement: 0, base_def: base.def, base_spr: base.spr, sockets: [] },
      spirit_mass: { affixes: [], tier_history: [] },
      skill_tree:  { points_spent: 0, nodes_taken: [], branches: { offense: 0, resource: 0, defense: 0 } },
      is_in_team: false, team_slot: null,
    };
  });
}

export default function Battle() {
  const { ghosts, team, player, save, addBattleRewards, advanceZoneStep } = useGameStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const arenaMode = (location.state as { arenaMode?: boolean } | null)?.arenaMode ?? false;
  const [phase, setPhase]             = useState<'select' | 'battle' | 'end'>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [winner, setWinner]           = useState<'player' | 'ai' | null>(null);
  const [log, setLog]                 = useState<LogEntry[]>([]);
  const [combatants, setCombatants]   = useState<Combatant[]>([]);
  const [enemyGhosts, setEnemyGhosts] = useState<Ghost[]>([]);
  const [battleRewards, setBattleRewards] = useState<{ expGained: number; levelUps: string[]; dustGained: number; zoneCleared: boolean } | null>(null);
  const [arenaScore, setArenaScore] = useState(0);
  const [attackAnim, setAttackAnim] = useState<AttackAnim | null>(null);
  const tickRef       = useRef<number | null>(null);
  const logRef        = useRef<HTMLDivElement>(null);
  const rewardDoneRef = useRef(false);

  // Arena mode: auto-select current team
  useEffect(() => {
    if (arenaMode && team.length > 0 && selectedIds.length === 0) {
      setSelectedIds(team.slice(0, 3).map(g => g.id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenaMode]);

  // Auto-clear attack animation after it plays
  useEffect(() => {
    if (!attackAnim) return;
    const t = setTimeout(() => setAttackAnim(null), 420);
    return () => clearTimeout(t);
  }, [attackAnim?.key]);

  const zone      = getZoneDef(save?.zone_id ?? 'zone_01');
  const stepsDone = save?.steps_taken ?? 0;
  const isBoss    = stepsDone === zone.steps - 1;
  const zoneIdx   = getZoneIndex(save?.zone_id ?? 'zone_01');

  const playerTeam = ghosts.filter(g => selectedIds.includes(g.id));
  const enemySide  = combatants.filter(c => !c.isPlayer);
  const playerSide = combatants.filter(c =>  c.isPlayer);

  function toggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  }

  function startBattle() {
    if (playerTeam.length < 1) return;
    rewardDoneRef.current = false;
    setBattleRewards(null);

    // Generate enemies (arena = random AI, story = zone-based)
    const avgTeamLv = playerTeam.length > 0
      ? Math.round(playerTeam.reduce((s, g) => s + g.level, 0) / playerTeam.length)
      : 1;
    const enemies = arenaMode
      ? buildArenaEnemies(avgTeamLv, playerTeam.length)
      : buildZoneEnemies(zone, stepsDone, playerTeam.length);
    setEnemyGhosts(enemies);

    const fieldAmulets = player?.inventory?.field_amulets ?? [null, null, null];
    const initial: Combatant[] = [
      ...playerTeam.slice(0, 3).map((g, idx) => makeCombatant(g, true, fieldAmulets[idx])),
      ...enemies.map(g => makeCombatant(g, false)),
    ];
    setCombatants(initial);
    setLog([{ text: arenaMode
      ? `🏆 Arena Battle เริ่ม! ทีม AI กำลังมา...`
      : `⚔️ ${isBoss ? '👑 BOSS FIGHT! ' : ''}การต่อสู้เริ่มต้น — ${zone.name} (${stepsDone + 1}/${zone.steps})`,
      type: 'info' }]);
    setPhase('battle');
    setWinner(null);
  }

  // Reward trigger — fires once when player wins
  useEffect(() => {
    if (winner !== 'player' || rewardDoneRef.current) return;
    rewardDoneRef.current = true;

    const avgEnemyLv = enemyGhosts.length > 0
      ? Math.round(enemyGhosts.reduce((s, g) => s + g.level, 0) / enemyGhosts.length)
      : zone.bossLevel;

    if (arenaMode) {
      addBattleRewards(selectedIds, avgEnemyLv).then(rewards => {
        if (rewards) {
          const sc = avgEnemyLv * 50 + rewards.dustGained * 2;
          setArenaScore(sc);
          setBattleRewards({ ...rewards, zoneCleared: false });
        }
      });
    } else {
      Promise.all([
        addBattleRewards(selectedIds, avgEnemyLv),
        advanceZoneStep(),
      ]).then(([rewards, zoneResult]) => {
        if (rewards) {
          setBattleRewards({ ...rewards, zoneCleared: zoneResult?.zoneCleared ?? false });
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner]);

  // ATB battle tick
  useEffect(() => {
    if (phase !== 'battle') return;

    tickRef.current = window.setInterval(() => {
      setCombatants(prev => {
        const rnd = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

        // ── Step 1: Passive ticks ─────────────────────────────────
        const ticked = prev.map(c => {
          if (!c.alive) return c;
          const spd     = c.boostedStats.spd;
          const regenHp = c.regenPct > 0 ? Math.floor(c.maxHp * c.regenPct) : 0;
          const dot     = c.statusEffects.dotTurns > 0 ? c.statusEffects.dotDmg : 0;
          const newHp   = Math.max(0, Math.min(c.maxHp, c.currentHp + regenHp - dot));
          return {
            ...c,
            atb:  Math.min(100, c.atb + spd / 10),
            guts: Math.min(100, c.guts + spd * 0.067 * c.gutsMultiplier),
            currentHp: newHp,
            alive: newHp > 0,
            statusEffects: dot > 0
              ? { ...c.statusEffects, dotTurns: c.statusEffects.dotTurns - 1 }
              : c.statusEffects,
          };
        });

        // ── Step 2: Find actor ────────────────────────────────────
        const actor = ticked.find(c => c.alive && c.atb >= 100);
        if (!actor) return ticked;

        // Handle stun: skip turn, decrement counter
        if (actor.statusEffects.stunTurns > 0) {
          const n = GHOST_REG[actor.ghost.ghost_type]?.nameTh ?? '';
          setLog(l => [...l.slice(-30), { text: `😴 ${n} ยังงัวเงียอยู่... ข้ามเทิร์น`, type: 'info' }]);
          return ticked.map(c => c.ghost.id === actor.ghost.id
            ? { ...c, atb: 0, statusEffects: { ...c.statusEffects, stunTurns: c.statusEffects.stunTurns - 1 } }
            : c
          );
        }

        // ── Step 3: Choose skill ──────────────────────────────────
        const ghostDef  = GHOST_REG[actor.ghost.ghost_type];
        const actorEl   = ghostDef?.element ?? 'dark';
        const actorName = ghostDef?.nameTh ?? '';
        const skills    = ghostDef?.skills ?? [];
        const special   = skills[1];
        const basic     = skills[0];
        const useSpecial = !!special
          && actor.guts >= special.gutsCost
          && (actor.cooldowns[special.id] ?? 0) <= 0;
        const skill = (useSpecial ? special : basic) ?? basic;
        if (!skill) return ticked.map(c => c.ghost.id === actor.ghost.id ? { ...c, atb: 0 } : c);

        // Decrement cooldowns, set new cooldown if using special
        const newCooldowns: Record<string, number> = {};
        for (const [k, v] of Object.entries(actor.cooldowns)) { if (v > 0) newCooldowns[k] = v - 1; }
        if (useSpecial) newCooldowns[skill.id] = skill.cooldown;

        const aliveEnemies = ticked.filter(c => c.alive && c.isPlayer !== actor.isPlayer);
        const aliveAllies  = ticked.filter(c => c.alive && c.isPlayer === actor.isPlayer);
        if (aliveEnemies.length === 0) return ticked;

        // ── Damage helper ─────────────────────────────────────────
        const act = actor;
        function calcDmg(t: Combatant, pwr: number, useStr: boolean) {
          const targetEl = GHOST_REG[t.ghost.ghost_type]?.element ?? 'dark';
          const elem     = (ELEMENT_CHART as Record<string, Record<string, number>>)[actorEl]?.[targetEl] ?? 1.0;
          const rawAtk   = (useStr ? act.boostedStats.str : act.boostedStats.mag) * (1 - act.statusEffects.atkDebuffPct);
          const rawDef   = (useStr ? t.boostedStats.def   : t.boostedStats.spr)   * (1 - t.statusEffects.defDebuffPct);
          const raw      = Math.max(1, rawAtk * (pwr / 100) * elem - rawDef * 0.3 + Math.random() * 15);
          const isCrit   = Math.random() < act.critRate;
          return { dmg: Math.floor(Math.max(1, raw * (isCrit ? 1.8 : 1) * (1 - t.statusEffects.shieldPct))), isCrit };
        }

        // ── Accumulators ──────────────────────────────────────────
        const hpDelta:  Record<string, number>                = {};
        const statChgs: Record<string, Partial<StatusEffects>> = {};
        const gutsSet:  Record<string, number>                = {};
        const logQ:     LogEntry[]                            = [];
        let   animTgt   = aliveEnemies[0];

        // ── Route by skill type ───────────────────────────────────
        if (skill.type === 'physical' || skill.type === 'magical') {
          const useStr = skill.type === 'physical';

          if (skill.id === 'pth_rampage') {
            const hits: string[] = [];
            for (let i = 0; i < 3; i++) {
              const t = rnd(aliveEnemies);
              const { dmg, isCrit } = calcDmg(t, Math.floor(skill.power / 3), useStr);
              hpDelta[t.ghost.id] = (hpDelta[t.ghost.id] ?? 0) - dmg;
              hits.push(`-${dmg}${isCrit ? '💥' : ''}`);
            }
            logQ.push({ text: `${SKILL_FLAVOR['pth_rampage']} [${hits.join(' ')}]`, type: 'skill' });

          } else if (skill.id === 'asura_titan') {
            const hits: string[] = [];
            for (const t of aliveEnemies) {
              const { dmg, isCrit } = calcDmg(t, skill.power, useStr);
              hpDelta[t.ghost.id] = (hpDelta[t.ghost.id] ?? 0) - dmg;
              hits.push(`${GHOST_REG[t.ghost.ghost_type]?.nameTh ?? ''} -${dmg}${isCrit ? '💥' : ''}`);
            }
            logQ.push({ text: `${SKILL_FLAVOR['asura_titan']} ${hits.join(' / ')}`, type: 'skill' });

          } else {
            const target = rnd(aliveEnemies);
            const { dmg, isCrit } = calcDmg(target, skill.power, useStr);
            hpDelta[target.ghost.id] = -dmg;
            animTgt = target;
            const tName   = GHOST_REG[target.ghost.ghost_type]?.nameTh ?? '';
            const critStr = isCrit ? ' ' + rnd(CRIT_SUFFIX) : '';

            if (skill.id === 'pret_feast') {
              const drain = Math.floor(dmg * 0.3);
              hpDelta[actor.ghost.id] = drain;
              logQ.push({ text: `${SKILL_FLAVOR['pret_feast']} → ${tName} -${dmg}${critStr} | ดูด HP +${drain}`, type: 'skill' });
            } else if (skill.id === 'pisaj_inferno') {
              statChgs[target.ghost.id] = { dotDmg: Math.floor(dmg * 0.3), dotTurns: 3 };
              logQ.push({ text: `${SKILL_FLAVOR['pisaj_inferno']} → ${tName} -${dmg}${critStr} 🔥DoT×3`, type: 'skill' });
            } else if (useSpecial) {
              logQ.push({ text: `${SKILL_FLAVOR[skill.id] ?? `⚡ ${actorName} ใช้ ${skill.name}!`} → ${tName} -${dmg}${critStr}`, type: 'skill' });
            } else {
              const flavor = rnd(BASIC_FLAVOR[actor.ghost.ghost_type] ?? [`${actorName} โจมตี`]);
              logQ.push({ text: `${flavor} ${tName} (-${dmg})${critStr}`, type: 'hit' });
            }
          }

        } else if (skill.type === 'heal') {
          if (skill.id === 'ms_revive') {
            const lowest = [...aliveAllies, actor].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0];
            if (lowest) {
              hpDelta[lowest.ghost.id] = lowest.maxHp - lowest.currentHp;
              logQ.push({ text: `${SKILL_FLAVOR['ms_revive']} ${GHOST_REG[lowest.ghost.ghost_type]?.nameTh ?? ''} กลับมาเต็ม HP!`, type: 'heal' });
              animTgt = lowest;
            }
          } else {
            const healAmt = Math.floor(actor.boostedStats.mag * (skill.power / 100));
            for (const a of [...aliveAllies, actor]) hpDelta[a.ghost.id] = healAmt;
            logQ.push({ text: `${SKILL_FLAVOR['kmt_heal']} ฮีล +${healAmt} ทุกคน`, type: 'heal' });
            if (aliveAllies.length > 0) animTgt = aliveAllies[0];
          }

        } else if (skill.type === 'buff') {
          if (skill.id === 'nak_shield') {
            for (const a of [...aliveAllies, actor]) statChgs[a.ghost.id] = { shieldPct: 0.4 };
            logQ.push({ text: SKILL_FLAVOR['nak_shield'], type: 'skill' });
            if (aliveAllies.length > 0) animTgt = aliveAllies[0];
          } else if (skill.id === 'phidib_taunt') {
            statChgs[actor.ghost.id] = { shieldPct: 0.5 };
            logQ.push({ text: SKILL_FLAVOR['phidib_taunt'], type: 'skill' });
            animTgt = actor;
          }

        } else if (skill.type === 'debuff') {
          if (skill.id === 'krasue_curse') {
            for (const t of aliveEnemies) statChgs[t.ghost.id] = { defDebuffPct: 0.25 };
            logQ.push({ text: SKILL_FLAVOR['krasue_curse'], type: 'skill' });
          } else if (skill.id === 'tani_sleep') {
            for (const t of aliveEnemies) statChgs[t.ghost.id] = { stunTurns: 2 };
            logQ.push({ text: SKILL_FLAVOR['tani_sleep'], type: 'skill' });
          } else if (skill.id === 'kala_hex') {
            for (const t of aliveEnemies) { statChgs[t.ghost.id] = { atkDebuffPct: 0.25 }; gutsSet[t.ghost.id] = 0; }
            logQ.push({ text: SKILL_FLAVOR['kala_hex'], type: 'skill' });
          }
        }

        // ── Fire anim ────────────────────────────────────────────
        const attackerSide = ticked.filter(c => c.isPlayer === actor.isPlayer);
        const fromIdx      = attackerSide.findIndex(c => c.ghost.id === actor.ghost.id);
        setAttackAnim({
          key: Date.now(),
          attackerGhostId: actor.ghost.id,
          targetGhostId:   animTgt.ghost.id,
          fromPlayer:      actor.isPlayer,
          fromIdx:         Math.max(0, fromIdx),
          fromCount:       attackerSide.length,
          element:         actorEl,
        });
        for (const entry of logQ) setLog(l => [...l.slice(-30), entry]);

        // ── Apply changes ────────────────────────────────────────
        const result = ticked.map(c => {
          if (!c.alive) return c;
          const dHp   = hpDelta[c.ghost.id] ?? 0;
          const newHp = Math.max(0, Math.min(c.maxHp, c.currentHp + dHp));
          const alive = newHp > 0;
          const sPatch = statChgs[c.ghost.id];
          const newSt  = sPatch ? { ...c.statusEffects, ...sPatch } : c.statusEffects;
          const newGuts = c.ghost.id in gutsSet ? gutsSet[c.ghost.id] : c.guts;

          if (c.alive && !alive) {
            const n = GHOST_REG[c.ghost.ghost_type]?.nameTh ?? '';
            setLog(l => [...l.slice(-30), { text: `💀 ${n} สิ้นชีพ... ${rnd(KILL_MSG)}`, type: 'info' }]);
          }

          if (c.ghost.id === actor.ghost.id) {
            return { ...c, atb: 0, guts: useSpecial ? Math.max(0, c.guts - skill.gutsCost) : c.guts,
              cooldowns: newCooldowns, currentHp: newHp, alive, statusEffects: newSt };
          }
          return { ...c, currentHp: newHp, alive, guts: newGuts, statusEffects: newSt };
        });

        // ── Win check ────────────────────────────────────────────
        const pAlive = result.filter(c =>  c.isPlayer && c.alive).length;
        const eAlive = result.filter(c => !c.isPlayer && c.alive).length;
        if (pAlive === 0 || eAlive === 0) {
          clearInterval(tickRef.current!);
          const w = pAlive > 0 ? 'player' : 'ai';
          setPhase('end');
          setWinner(w);
          setLog(l => [...l, { text: w === 'player' ? '🏆 ชนะการต่อสู้!' : '💀 พ่ายแพ้...', type: 'info' }]);
        }
        return result;
      });
    }, 100);

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [phase]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  function resetToSelect() {
    if (arenaMode) { navigate('/arena'); return; }
    setPhase('select');
    setSelectedIds([]);
    setCombatants([]);
    setEnemyGhosts([]);
    setLog([]);
    setWinner(null);
    setBattleRewards(null);
    setArenaScore(0);
  }

  // ── TEAM SELECT PHASE ──────────────────────────────────────────
  if (phase === 'select') {
    const nextStepIsBoss = (save?.steps_taken ?? 0) === zone.steps - 1;
    return (
      <div className="screen fade-in">
        <ScreenHeader title={arenaMode ? '🏆 Arena — เลือกทีม' : '⚔️ เลือกทีม'} back={arenaMode ? '/arena' : '/home'} />
        <div className="screen-content">

          {/* Zone / Arena context */}
          {arenaMode ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245,197,24,0.10), var(--bg-card))',
              border: '1.5px solid rgba(245,197,24,0.35)',
              borderRadius: 'var(--r-lg)', padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 28 }}>🏆</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold)' }}>Arena VS AI</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  ศัตรู AI สุ่มจาก ghost pool — ระดับใกล้เคียงทีมคุณ
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: nextStepIsBoss
                ? 'linear-gradient(135deg, rgba(255,71,87,0.12), rgba(255,71,87,0.04))'
                : 'linear-gradient(135deg, rgba(38,222,129,0.08), var(--bg-card))',
              border: `1.5px solid ${nextStepIsBoss ? 'rgba(255,71,87,0.4)' : 'rgba(38,222,129,0.25)'}`,
              borderRadius: 'var(--r-lg)',
              padding: '12px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                  {nextStepIsBoss ? '👑 BOSS BATTLE' : `บทที่ ${zone.chapter} — ${zone.name}`}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {nextStepIsBoss ? `⚠️ บอสประจำโซน — ${zone.name}` : zone.desc}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  ศัตรู: {(nextStepIsBoss ? zone.bossTypes : zone.enemies)
                    .map(t => GHOST_REG[t]?.nameTh ?? t).join(', ')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', marginBottom: 4 }}>
                  {stepsDone}/{zone.steps} การต่อสู้
                </div>
                <div style={{ width: 60, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${(stepsDone / zone.steps) * 100}%`,
                    background: nextStepIsBoss ? 'var(--red)' : 'var(--green)',
                  }} />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>เลือกผีที่จะส่งสู้</span>
            <span style={{ fontWeight: 700, color: selectedIds.length > 0 ? 'var(--gold)' : 'var(--text-muted)' }}>
              {selectedIds.length}/3
            </span>
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
                return (
                  <div
                    key={ghost.id}
                    onClick={() => toggleSelect(ghost.id)}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(245,197,24,0.15), rgba(245,197,24,0.05))'
                        : 'var(--bg-card)',
                      border: isSelected ? '2px solid rgba(245,197,24,0.6)' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 'var(--r-lg)',
                      padding: '10px 8px',
                      cursor: !isSelected && selectedIds.length >= 3 ? 'not-allowed' : 'pointer',
                      opacity: !isSelected && selectedIds.length >= 3 ? 0.4 : 1,
                      display: 'flex', alignItems: 'center', gap: 10,
                      position: 'relative', transition: 'all 0.15s',
                    }}
                  >
                    {rank && (
                      <div style={{
                        position: 'absolute', top: 6, right: 8,
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'var(--gold)', color: '#000',
                        fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{rank}</div>
                    )}
                    <Chibi emoji={def.emoji} element={def.element} size={44} evoStage={ghost.evo_stage} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ghost.nickname || def.nameTh}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        Lv.{ghost.level} · {def.classType.toUpperCase()}{ghost.stat_points > 0 && (
                          <span style={{ color: 'var(--gold)' }}> · {ghost.stat_points}pt</span>
                        )}
                      </div>
                      <div className="bar-track thin" style={{ marginTop: 4 }}>
                        <div className="bar-fill bar-hp" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            className={`btn btn-full btn-lg ${nextStepIsBoss ? 'btn-red' : 'btn-red'}`}
            disabled={selectedIds.length < 1}
            onClick={startBattle}
            style={{ opacity: selectedIds.length < 1 ? 0.5 : 1 }}
          >
            {selectedIds.length < 1
              ? 'เลือกผีอย่างน้อย 1 ตัว'
              : arenaMode
                ? `🏆 ท้าชิง! (${selectedIds.length} ตัว)`
                : nextStepIsBoss
                  ? `👑 เข้าสู้บอส! (${selectedIds.length} ตัว)`
                  : `⚔️ เริ่มต่อสู้! (${selectedIds.length} ตัว)`}
          </button>

          {/* Zone progression overview (hidden in arena mode) */}
          {!arenaMode && <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
            {Array.from({ length: zone.steps }).map((_, i) => (
              <div key={i} style={{
                width: i < stepsDone ? 18 : 12,
                height: 6,
                borderRadius: 3,
                background: i < stepsDone
                  ? 'var(--green)'
                  : i === stepsDone
                    ? (nextStepIsBoss ? 'var(--red)' : 'var(--gold)')
                    : 'rgba(255,255,255,0.1)',
                transition: 'all 0.2s',
              }} />
            ))}
          </div>}
        </div>
      </div>
    );
  }

  // ── BATTLE / END PHASE ─────────────────────────────────────────
  return (
    <div className="screen fade-in" style={{ paddingBottom: 0 }}>
      <ScreenHeader title={arenaMode ? '🏆 Arena Battle' : `⚔️ ${isBoss ? '👑 BOSS — ' : ''}${zone.name}`} back={arenaMode ? '/arena' : '/home'} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 12px', gap: 8, minHeight: 0, position: 'relative' }}>

        {/* ── Attack projectile overlay ── */}
        {attackAnim && phase === 'battle' && (() => {
          const color   = ELEMENT_COLORS[attackAnim.element] ?? '#fff';
          const emoji   = ELEMENT_EMOJI[attackAnim.element] ?? '✦';
          const leftPct = ((attackAnim.fromIdx + 0.5) / attackAnim.fromCount) * 100;
          const anim    = attackAnim.fromPlayer ? 'projUp' : 'projDown';
          // Player is at bottom (~70% from top), enemy at top (~12%)
          const topPct  = attackAnim.fromPlayer ? 70 : 12;
          return (
            <div
              key={attackAnim.key}
              style={{
                position: 'absolute',
                top: `${topPct}%`,
                left: `${leftPct}%`,
                width: 32, height: 32,
                pointerEvents: 'none',
                zIndex: 50,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: `${anim} 0.38s ease-out forwards`,
              }}
            >
              {/* Glow orb */}
              <div style={{
                position: 'absolute',
                width: 32, height: 32,
                borderRadius: '50%',
                background: color,
                opacity: 0.55,
                filter: `blur(6px)`,
                boxShadow: `0 0 12px ${color}, 0 0 24px ${color}`,
              }} />
              {/* Emoji */}
              <span style={{ fontSize: 16, position: 'relative', zIndex: 1 }}>{emoji}</span>
            </div>
          );
        })()}

        {/* Enemy team */}
        <div>
          <div className="label-sm" style={{ marginBottom: 6, color: 'var(--red)' }}>💀 ฝ่ายศัตรู</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {enemySide.map(com => {
              const def = GHOST_REG[com.ghost.ghost_type];
              if (!def) return null;
              const isAttacking = attackAnim?.attackerGhostId === com.ghost.id;
              const isHit       = attackAnim?.targetGhostId   === com.ghost.id;
              const hasSprite   = !!GHOST_SPRITE[com.ghost.ghost_type];
              return (
                <div key={com.ghost.id} style={{
                  flex: 1, background: !com.alive ? 'rgba(255,255,255,0.03)' : 'var(--bg-card)',
                  border: '1px solid rgba(255,71,87,0.2)', borderRadius: 'var(--r-lg)',
                  padding: '8px 6px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 5, opacity: !com.alive ? 0.35 : 1, transition: 'opacity 0.3s',
                  animation: isAttacking ? 'cardAttack 0.32s ease-out' : isHit ? 'cardHit 0.38s ease-out' : 'none',
                }}>
                  {hasSprite
                    ? <SpriteChar ghostType={com.ghost.ghost_type} animState={getAnimState(com, attackAnim)} size={64} flip />
                    : <Chibi emoji={def.emoji} element={def.element} size={42} />
                  }
                  <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center' }}>{def.nameTh}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {com.currentHp}/{com.maxHp}
                  </div>
                  <div className="bar-track thin" style={{ width: '100%' }}>
                    <div className={`bar-fill ${(com.currentHp / com.maxHp) < 0.3 ? 'bar-hp-low' : 'bar-hp'}`}
                      style={{ width: `${(com.currentHp / com.maxHp) * 100}%` }} />
                  </div>
                  <div className="bar-track thin" style={{ width: '100%' }}>
                    <div className="bar-fill bar-atb" style={{ width: `${com.atb}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Battle log */}
        <div style={{
          flex: 1, background: 'var(--bg-card)', borderRadius: 'var(--r-lg)',
          border: '1px solid rgba(255,255,255,0.07)', padding: '10px',
          display: 'flex', flexDirection: 'column', minHeight: 80, maxHeight: 140, overflow: 'hidden',
        }}>
          <div ref={logRef} style={{ overflowY: 'auto', flex: 1 }}>
            {log.map((entry, i) => (
              <div key={i} style={{
                fontSize: 11, marginBottom: 2,
                color: entry.type === 'info' ? 'var(--gold)' : entry.type === 'heal' ? 'var(--green)' : 'var(--text-light)',
                fontFamily: entry.type === 'info' ? 'Bai Jamjuree, sans-serif' : 'inherit',
                fontWeight: entry.type === 'info' ? 700 : 400,
              }}>
                {entry.text}
              </div>
            ))}
          </div>
        </div>

        {/* Player team */}
        <div>
          <div className="label-sm" style={{ marginBottom: 6, color: 'var(--green)' }}>⚔️ ทีมของคุณ</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {playerSide.map(com => {
              const def = GHOST_REG[com.ghost.ghost_type];
              if (!def) return null;
              const isAttacking = attackAnim?.attackerGhostId === com.ghost.id;
              const isHit       = attackAnim?.targetGhostId   === com.ghost.id;
              const hasSprite   = !!GHOST_SPRITE[com.ghost.ghost_type];
              return (
                <div key={com.ghost.id} style={{
                  flex: 1,
                  background: !com.alive ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, rgba(38,222,129,0.08), var(--bg-card))',
                  border: '1px solid rgba(38,222,129,0.2)', borderRadius: 'var(--r-lg)',
                  padding: '8px 6px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 5, opacity: !com.alive ? 0.35 : 1, transition: 'opacity 0.3s',
                  animation: isAttacking ? 'cardAttack 0.32s ease-out' : isHit ? 'cardHit 0.38s ease-out' : 'none',
                }}>
                  {hasSprite
                    ? <SpriteChar ghostType={com.ghost.ghost_type} animState={getAnimState(com, attackAnim)} size={64} />
                    : <Chibi emoji={def.emoji} element={def.element} size={42} evoStage={com.ghost.evo_stage} />
                  }
                  <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center' }}>{com.ghost.nickname || def.nameTh}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {com.currentHp}/{com.maxHp}
                  </div>
                  <div className="bar-track thin" style={{ width: '100%' }}>
                    <div className={`bar-fill ${(com.currentHp / com.maxHp) < 0.3 ? 'bar-hp-low' : 'bar-hp'}`}
                      style={{ width: `${(com.currentHp / com.maxHp) * 100}%` }} />
                  </div>
                  <div className="bar-track thin" style={{ width: '100%' }}>
                    <div className="bar-fill bar-atb" style={{ width: `${com.atb}%` }} />
                  </div>
                  <div className="bar-track thin" style={{ width: '100%' }}>
                    <div className="bar-fill bar-guts" style={{ width: `${com.guts}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action / end */}
        <div style={{ paddingBottom: 12 }}>
          {phase === 'battle' && (
            <div style={{
              textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
              padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--r-lg)',
            }}>
              <span className="pulse">⏳ กำลังต่อสู้ (Auto ATB)...</span>
            </div>
          )}

          {phase === 'end' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Win/lose banner */}
              <div style={{
                textAlign: 'center', padding: '14px',
                background: winner === 'player'
                  ? 'linear-gradient(135deg, rgba(38,222,129,0.15), rgba(38,222,129,0.05))'
                  : 'linear-gradient(135deg, rgba(255,71,87,0.15), rgba(255,71,87,0.05))',
                border: `1.5px solid ${winner === 'player' ? 'rgba(38,222,129,0.4)' : 'rgba(255,71,87,0.4)'}`,
                borderRadius: 'var(--r-lg)', fontSize: 20, fontWeight: 700,
                fontFamily: 'Bai Jamjuree, sans-serif',
              }}>
                {winner === 'player' ? '🏆 ชนะแล้ว!' : '💀 พ่ายแพ้...'}
              </div>

              {/* Zone cleared banner */}
              {winner === 'player' && battleRewards?.zoneCleared && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245,197,24,0.2), rgba(245,197,24,0.05))',
                  border: '1.5px solid rgba(245,197,24,0.5)',
                  borderRadius: 'var(--r-lg)', padding: '12px 14px',
                  textAlign: 'center', animation: 'popIn 0.4s ease-out',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>🎉</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gold)', fontFamily: 'Bai Jamjuree, sans-serif' }}>
                    โซนผ่านแล้ว!
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {ZONE_DEFS[zoneIdx + 1]
                      ? `บทที่ ${ZONE_DEFS[zoneIdx + 1].chapter} — ${ZONE_DEFS[zoneIdx + 1].name} ปลดล็อกแล้ว!`
                      : 'คุณผ่านทุกโซนแล้ว! 🏆'}
                  </div>
                </div>
              )}

              {/* Rewards box */}
              {winner === 'player' && battleRewards && (
                <div style={{
                  background: arenaMode ? 'rgba(245,197,24,0.09)' : 'rgba(245,197,24,0.07)',
                  border: `1px solid rgba(245,197,24,0.25)`,
                  borderRadius: 'var(--r-lg)', padding: '12px 14px',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 2 }}>
                    {arenaMode ? '🏆 Arena Rewards' : '✨ รางวัลการต่อสู้'}
                  </div>
                  {arenaMode && (
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--gold)' }}>
                      +{arenaScore.toLocaleString()} pts
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--text-light)', display: 'flex', gap: 16 }}>
                    <span>⚡ EXP +{battleRewards.expGained}</span>
                    <span>🌀 +{battleRewards.dustGained} ฝุ่น</span>
                    <span>💞 Bond +2</span>
                  </div>
                  {battleRewards.levelUps.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      {battleRewards.levelUps.map((ghostType, i) => (
                        <div key={i} style={{
                          fontSize: 12, fontWeight: 700, color: 'var(--gold)',
                          animation: 'popIn 0.4s ease-out',
                        }}>
                          🎉 {GHOST_REG[ghostType]?.nameTh ?? ghostType} เลเวลอัพ! (+3 Skill Points)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {winner === 'player' && !battleRewards && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                  กำลังบันทึกรางวัล...
                </div>
              )}

              <button type="button" className="btn btn-gold btn-full" onClick={resetToSelect}>
                {arenaMode ? '🏆 กลับ Arena' : '🔄 สู้ต่อ'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
