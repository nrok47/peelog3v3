import type { Ghost } from '../types';
import { GHOST_REG } from './ghosts';

export interface ZoneDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  chapter: number;
  steps: number;           // battles to clear (last step = boss)
  enemies: string[];       // ghost types in regular battles
  levelRange: [number, number];
  bossTypes: string[];     // ghost types in boss battle
  bossLevel: number;
}

export const ZONE_DEFS: ZoneDef[] = [
  {
    id: 'zone_01', name: 'ป่าผีสิง', icon: '🌲', chapter: 1, steps: 5,
    desc: 'ป่าลึกเต็มไปด้วยวิญญาณ',
    enemies: ['pob', 'phiDib', 'krasue'], levelRange: [3, 6],
    bossTypes: ['krasue', 'phiDib', 'pob'], bossLevel: 7,
  },
  {
    id: 'zone_02', name: 'วัดร้าง', icon: '⛩️', chapter: 2, steps: 5,
    desc: 'วัดเก่าแก่ที่มีพลังมืดแฝงอยู่',
    enemies: ['kumantong', 'nangTani', 'pret'], levelRange: [8, 11],
    bossTypes: ['nangTani', 'pret', 'kumantong'], bossLevel: 12,
  },
  {
    id: 'zone_03', name: 'บึงสาปมรณะ', icon: '🌊', chapter: 3, steps: 5,
    desc: 'น้ำดำเต็มไปด้วยวิญญาณจมน้ำ',
    enemies: ['maeNak', 'kalakinee', 'krasue'], levelRange: [13, 16],
    bossTypes: ['maeNak', 'kalakinee', 'pisaj'], bossLevel: 17,
  },
  {
    id: 'zone_04', name: 'ป่าช้าโบราณ', icon: '💀', chapter: 4, steps: 5,
    desc: 'ป่าช้าเก่าแก่ อาณาจักรของเปรต',
    enemies: ['pisaj', 'phiTaiHong', 'pret'], levelRange: [18, 22],
    bossTypes: ['phiTaiHong', 'pisaj', 'kalakinee'], bossLevel: 23,
  },
  {
    id: 'zone_05', name: 'เมืองล่างดิน', icon: '🗿', chapter: 5, steps: 5,
    desc: 'โลกใต้ดิน บ้านของอสุรกาย',
    enemies: ['asurakay', 'motherSpirit', 'phiTaiHong'], levelRange: [23, 28],
    bossTypes: ['asurakay', 'motherSpirit'], bossLevel: 30,
  },
];

export function getZoneDef(zoneId: string): ZoneDef {
  return ZONE_DEFS.find(z => z.id === zoneId) ?? ZONE_DEFS[0];
}

export function getZoneIndex(zoneId: string): number {
  return ZONE_DEFS.findIndex(z => z.id === zoneId);
}

/** Scale baseStats by level (12% per level above 1) */
function scaleStats(base: { hp: number; str: number; mag: number; def: number; spr: number; spd: number }, level: number) {
  const scale = 1 + (level - 1) * 0.12;
  return {
    hp:  Math.round(base.hp  * scale),
    str: Math.round(base.str * scale),
    mag: Math.round(base.mag * scale),
    def: Math.round(base.def * scale),
    spr: Math.round(base.spr * scale),
    spd: Math.round(base.spd * scale),
  };
}

function makeEnemy(ghostType: string, level: number): Ghost {
  const def = GHOST_REG[ghostType];
  const base = def?.baseStats ?? { hp: 1000, str: 30, mag: 20, def: 20, spr: 20, spd: 20 };
  return {
    id: `enemy_${ghostType}_${level}_${Math.random().toString(36).slice(2, 7)}`,
    player_id: 'enemy',
    ghost_type: ghostType,
    nickname: '',
    evo_stage: 0,
    level,
    exp: 0,
    bond: 0,
    corruption: 0,
    stat_points: 0,
    stats: scaleStats(base, level),
    is_in_team: false,
    team_slot: null,
    skill_tree: { points_spent: 0, nodes_taken: [], branches: { offense: 0, resource: 0, defense: 0 } },
    amulet_slots: [],
    soul_core: { element: def?.element ?? 'dark', classType: def?.classType ?? 'dps', baseStats: base },
    frame: { enhancement: 0, base_def: 0, base_spr: 0, sockets: [] },
    spirit_mass: { affixes: [], tier_history: [] },
  } as Ghost;
}

/** Build enemy team for the current zone step. isBoss = final step. */
export function buildZoneEnemies(zone: ZoneDef, stepsDone: number, playerCount: number): Ghost[] {
  const isBoss = stepsDone === zone.steps - 1;
  const count  = Math.min(Math.max(playerCount, 1), 3);

  if (isBoss) {
    return zone.bossTypes.slice(0, count).map((t, i) =>
      makeEnemy(t, zone.bossLevel + i)
    );
  }

  // Regular: pick `count` random types, random level in range
  const pool    = [...zone.enemies].sort(() => Math.random() - 0.5);
  const [lo, hi] = zone.levelRange;
  return pool.slice(0, count).map(t =>
    makeEnemy(t, lo + Math.floor(Math.random() * (hi - lo + 1)))
  );
}
