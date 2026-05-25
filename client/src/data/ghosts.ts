import type { GhostDef } from '../types';

export const GHOST_REG: Record<string, GhostDef> = {
  pob: {
    id: 'pob', name: 'Pob', nameTh: 'ปอบ',
    element: 'fire', classType: 'dps', rarity: 'common', emoji: '👻',
    baseStats: { hp:300, str:38, mag:20, def:25, spr:18, spd:32 },
    skills: [
      { id:'pob_bite', name:'กัดสาป', type:'physical', power:80, gutsCost:0, cooldown:0, desc:'โจมตีธรรมดา' },
      { id:'pob_curse', name:'ไฟปอบ', type:'magical', power:160, gutsCost:60, cooldown:3, desc:'ยิงลูกไฟสาปสังหาร' },
    ],
    lore: 'วิญญาณสาปที่กินตับคนเป็นอาหาร ไฟปอบร้อนแรงกว่าเตาเผา',
  },
  phiDib: {
    id: 'phiDib', name: 'Phi Dib', nameTh: 'ผีดิบ',
    element: 'earth', classType: 'tank', rarity: 'common', emoji: '🧟',
    baseStats: { hp:400, str:38, mag:10, def:44, spr:20, spd:18 },
    skills: [
      { id:'phidib_slam', name:'ฟัดโครม', type:'physical', power:90, gutsCost:0, cooldown:0, desc:'โจมตีธรรมดา' },
      { id:'phidib_taunt', name:'ท้าทาย', type:'buff', power:0, gutsCost:50, cooldown:5, desc:'บังคับศัตรูโจมตีตัวเอง' },
    ],
    lore: 'ศพฟื้นที่ไม่รู้จักตาย ยิ่งโดนตีก็ยิ่งแกร่ง',
  },
  krasue: {
    id: 'krasue', name: 'Krasue', nameTh: 'กระสือ',
    element: 'dark', classType: 'mage', rarity: 'uncommon', emoji: '💀',
    baseStats: { hp:225, str:15, mag:50, def:18, spr:42, spd:38 },
    skills: [
      { id:'krasue_drain', name:'ดูดพลัง', type:'magical', power:70, gutsCost:0, cooldown:0, desc:'โจมตีและดูด HP' },
      { id:'krasue_curse', name:'คำสาปกระสือ', type:'debuff', power:200, gutsCost:80, cooldown:4, desc:'สาปลด DEF/SPR ศัตรูทั้งทีม' },
    ],
    lore: 'หัวผีที่ลอยวนในยามดึก ตัดสาปเข้าถึงจิตใจ',
  },
  kumantong: {
    id: 'kumantong', name: 'Kumantong', nameTh: 'กุมารทอง',
    element: 'light', classType: 'healer', rarity: 'uncommon', emoji: '👼',
    baseStats: { hp:250, str:20, mag:36, def:28, spr:40, spd:30 },
    skills: [
      { id:'kmt_slap', name:'ตบมือ', type:'physical', power:60, gutsCost:0, cooldown:0, desc:'โจมตีธรรมดา' },
      { id:'kmt_heal', name:'พรทิพย์', type:'heal', power:220, gutsCost:70, cooldown:4, desc:'ฟื้นฟู HP เพื่อนทั้งทีม' },
    ],
    lore: 'กุมารน้อยจิตใสผู้คุ้มครอง รักษาแผลได้ด้วยน้ำพรทิพย์',
  },
  nangTani: {
    id: 'nangTani', name: 'Nang Tani', nameTh: 'นางตานี',
    element: 'wood', classType: 'mage', rarity: 'uncommon', emoji: '🌿',
    baseStats: { hp:240, str:18, mag:46, def:22, spr:36, spd:36 },
    skills: [
      { id:'tani_vine', name:'เถาวัลย์รัด', type:'magical', power:75, gutsCost:0, cooldown:0, desc:'โจมตีธรรมดา' },
      { id:'tani_sleep', name:'ต้นกล้วยสะกด', type:'debuff', power:0, gutsCost:90, cooldown:5, desc:'สะกดจิตศัตรูทั้งทีมหยุดนิ่ง 2 วินาที' },
    ],
    lore: 'นางไม้ผู้สถิตในต้นกล้วย รัดแน่นจนหายใจไม่ออก',
  },
  pret: {
    id: 'pret', name: 'Pret', nameTh: 'เปรต',
    element: 'dark', classType: 'dps', rarity: 'uncommon', emoji: '👁️',
    baseStats: { hp:275, str:44, mag:28, def:20, spr:18, spd:28 },
    skills: [
      { id:'pret_claws', name:'เล็บเปรต', type:'physical', power:95, gutsCost:0, cooldown:0, desc:'โจมตีธรรมดา' },
      { id:'pret_feast', name:'กินวิญญาณ', type:'physical', power:180, gutsCost:75, cooldown:3, desc:'โจมตีรุนแรงและดูด HP 30%' },
    ],
    lore: 'วิญญาณโลภที่หิวโหยไม่สิ้นสุด กินทุกอย่างที่ขวางหน้า',
  },
  maeNak: {
    id: 'maeNak', name: 'Mae Nak', nameTh: 'แม่นาค',
    element: 'water', classType: 'tank', rarity: 'rare', emoji: '🪭',
    baseStats: { hp:500, str:35, mag:25, def:50, spr:40, spd:22 },
    skills: [
      { id:'nak_splash', name:'ซัดน้ำ', type:'physical', power:85, gutsCost:0, cooldown:0, desc:'โจมตีธรรมดา' },
      { id:'nak_shield', name:'รักนิรันดร์', type:'buff', power:0, gutsCost:60, cooldown:6, desc:'ลดความเสียหายที่เพื่อนรับ 40% เป็นเวลา 3 วิ' },
    ],
    lore: 'แม่นาคผู้รักสามีไม่รู้จบ จะปกป้องทุกคนที่รักด้วยชีวิต',
  },
  kalakinee: {
    id: 'kalakinee', name: 'Kalakinee', nameTh: 'กาลกิณี',
    element: 'metal', classType: 'debuffer', rarity: 'rare', emoji: '⚡',
    baseStats: { hp:200, str:25, mag:42, def:20, spr:30, spd:44 },
    skills: [
      { id:'kala_zap', name:'ฟ้าผ่า', type:'magical', power:70, gutsCost:0, cooldown:0, desc:'โจมตีธรรมดา' },
      { id:'kala_hex', name:'คำสาปกาล', type:'debuff', power:0, gutsCost:85, cooldown:5, desc:'ลด STR/MAG ศัตรูทั้งทีม 25% และตัด GUTS' },
    ],
    lore: 'ดาวซวยแห่งโลกวิญญาณ สัมผัสแค่แว่วก็โชคร้ายได้',
  },
  pisaj: {
    id: 'pisaj', name: 'Pisaj', nameTh: 'ปีศาจ',
    element: 'fire', classType: 'dps', rarity: 'rare', emoji: '🔥',
    baseStats: { hp:325, str:45, mag:36, def:28, spr:25, spd:30 },
    skills: [
      { id:'pisaj_burn', name:'เผาไหม้', type:'physical', power:90, gutsCost:0, cooldown:0, desc:'โจมตีธรรมดา' },
      { id:'pisaj_inferno', name:'นรกลุกโชน', type:'magical', power:140, gutsCost:70, cooldown:3, desc:'ลุกไฟ DoT ไหม้ 3 วิ' },
    ],
    lore: 'ปีศาจแห่งไฟนรก ทิ้งรอยไหม้ทุกที่ที่เหยียบ',
  },
  phiTaiHong: {
    id: 'phiTaiHong', name: 'Phi Tai Hong', nameTh: 'ผีตายโหง',
    element: 'dark', classType: 'berserker', rarity: 'rare', emoji: '💢',
    baseStats: { hp:350, str:52, mag:15, def:22, spr:15, spd:26 },
    skills: [
      { id:'pth_rage', name:'คลุ้มคลั่ง', type:'physical', power:100, gutsCost:0, cooldown:0, desc:'โจมตีธรรมดา' },
      { id:'pth_rampage', name:'โหมกระหน่ำ', type:'physical', power:220, gutsCost:80, cooldown:4, desc:'โจมตีสุ่มศัตรู 3 ครั้งติดต่อกัน' },
    ],
    lore: 'ผีที่ตายด้วยความแค้น พลังพุ่งสูงยิ่งโกรธ',
  },
  asurakay: {
    id: 'asurakay', name: 'Asurakay', nameTh: 'อสุรกาย',
    element: 'earth', classType: 'boss_tank', rarity: 'legendary', emoji: '🗿',
    baseStats: { hp:750, str:55, mag:40, def:56, spr:46, spd:20 },
    skills: [
      { id:'asura_crush', name:'บดขยี้', type:'physical', power:110, gutsCost:0, cooldown:0, desc:'โจมตีธรรมดา' },
      { id:'asura_titan', name:'ไททันกร้าว', type:'physical', power:300, gutsCost:90, cooldown:6, desc:'ปล่อยพลังยักษ์กระจายทั้งทีม' },
    ],
    lore: 'อสูรยักษ์แห่งธรณี ก้าวหนึ่งสะเทือนทั้งป่าช้า',
  },
  motherSpirit: {
    id: 'motherSpirit', name: 'Mother Spirit', nameTh: 'แม่เจ้าของ',
    element: 'light', classType: 'healer', rarity: 'legendary', emoji: '✨',
    baseStats: { hp:375, str:20, mag:52, def:35, spr:56, spd:28 },
    skills: [
      { id:'ms_bless', name:'อวยพร', type:'magical', power:65, gutsCost:0, cooldown:0, desc:'โจมตีธรรมดา' },
      { id:'ms_revive', name:'ฟื้นคืนชีพ', type:'heal', power:0, gutsCost:100, cooldown:8, desc:'ฟื้นฟูสมาชิกที่ HP ต่ำสุดเต็ม' },
    ],
    lore: 'แม่ผีผู้ยิ่งใหญ่แห่งป่าช้า ความตายหยุดไม่ได้ถ้าเธอยังอยู่',
  },
};

export const ELEMENT_CHART: Record<string, Record<string, number>> = {
  fire:  { wood:1.33, water:0.75 },
  water: { fire:1.33, earth:0.75 },
  wood:  { earth:1.33, metal:0.75 },
  earth: { water:1.33, wind:0.75 },
  metal: { wood:1.33, fire:0.75 },
  dark:  { light:1.33 },
  light: { dark:1.33 },
};

export const ELEMENT_LABELS: Record<string, string> = {
  fire: 'ไฟ', water: 'น้ำ', wood: 'ลม/ไม้', earth: 'ดิน',
  metal: 'โลหะ', dark: 'มืด', light: 'แสง',
};

export const CLASS_LABELS: Record<string, string> = {
  dps: 'DPS', tank: 'แทงก์', mage: 'เมจ', healer: 'ฮีลเลอร์',
  debuffer: 'เดบัฟ', berserker: 'เบอร์เซิร์ก', boss_tank: 'บอสแทงก์',
};

export const GHOST_LIST = Object.values(GHOST_REG);

export const RARITY_LABELS: Record<string, string> = {
  common: 'ธรรมดา', uncommon: 'ไม่ธรรมดา', rare: 'หายาก', legendary: 'ตำนาน',
};

export const RARITY_COLOR: Record<string, string> = {
  common:    'rgba(160,160,160,0.3)',
  uncommon:  'rgba(68,170,68,0.3)',
  rare:      'rgba(68,68,255,0.35)',
  legendary: 'rgba(255,136,0,0.35)',
};

export const RARITY_TEXT: Record<string, string> = {
  common: '#aaa', uncommon: '#44aa44', rare: '#6688ff', legendary: '#ff8800',
};

// Summon pools: { rarity → weight }
export const SUMMON_POOLS = {
  basic:    { common: 65, uncommon: 28, rare: 6,  legendary: 1  },
  premium:  { common: 25, uncommon: 45, rare: 24, legendary: 6  },
  festival: { common: 5,  uncommon: 30, rare: 45, legendary: 20 },
} as const;

export const POOL_COST: Record<string, number> = {
  basic: 50, premium: 150, festival: 300,
};

export const POOL_LABELS: Record<string, string> = {
  basic: 'พื้นฐาน', premium: 'พิเศษ', festival: 'เทศกาล',
};

export function rollRarity(pool: keyof typeof SUMMON_POOLS): string {
  const weights = SUMMON_POOLS[pool];
  const roll = Math.random() * 100;
  if (roll < weights.legendary) return 'legendary';
  if (roll < weights.legendary + weights.rare) return 'rare';
  if (roll < weights.legendary + weights.rare + weights.uncommon) return 'uncommon';
  return 'common';
}

export function pickGhostByRarity(rarity: string): string {
  const candidates = GHOST_LIST.filter(g => g.rarity === rarity);
  if (candidates.length === 0) return GHOST_LIST[0].id;
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}
