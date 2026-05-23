// ghost-data.js — Ghost Registry for peelog3v3 React app
// plain JS, loaded before JSX files

const GHOST_REG = {
  pob:         { name:'ปอบ',         col:0xFF5533, element:'fire',  class:'dps',
    baseStats:{ maxHp:1200,str:38,mag:20,def:25,spr:18,spd:32 },
    skills:[
      { id:'pob_n',   name:'งับ',            type:'physical', power:80,  gutsCost:0,  cd:0 },
      { id:'pob_sig', name:'เลื่อยยนต์ฉีก',  type:'physical', power:200, gutsCost:60, cd:5 }]},

  phiDib:      { name:'ผีดิบ',       col:0x778844, element:'earth', class:'tank',
    baseStats:{ maxHp:1600,str:38,mag:10,def:44,spr:20,spd:18 },
    skills:[
      { id:'phid_n',   name:'ชนกาว',      type:'physical',     power:90,  gutsCost:0,  cd:0 },
      { id:'phid_sig', name:'ลุกฟุ้งซ่าน', type:'physical_aoe', power:150, gutsCost:65, cd:6 }]},

  krasue:      { name:'กระสือ',      col:0x88EE33, element:'dark',  class:'mage',
    baseStats:{ maxHp:900, str:15,mag:50,def:18,spr:42,spd:38 },
    skills:[
      { id:'kra_n',   name:'พ่นน้ำดี',     type:'magical', power:85,  gutsCost:0,  cd:0 },
      { id:'kra_sig', name:'ลำแสงถอดหัว', type:'magical', power:210, gutsCost:70, cd:6 }]},

  kumantong:   { name:'กุมารทอง',    col:0xFFDD88, element:'light', class:'healer',
    baseStats:{ maxHp:1000,str:20,mag:36,def:28,spr:40,spd:30 },
    skills:[
      { id:'kmt_n',   name:'ตบหัวเบาๆ',    type:'physical', power:60,  gutsCost:0,  cd:0 },
      { id:'kmt_h',   name:'บูชาเพชร',     type:'heal',     power:160, gutsCost:50, cd:4 },
      { id:'kmt_sig', name:'อ้อนวอนฟ้าดิน',type:'heal_all', power:100, gutsCost:80, cd:8 }]},

  nangTani:    { name:'นางตานี',     col:0x44CC66, element:'wood',  class:'mage',
    baseStats:{ maxHp:950, str:18,mag:46,def:22,spr:36,spd:36 },
    skills:[
      { id:'nta_n',   name:'ขว้างกล้วย',    type:'magical',     power:78,  gutsCost:0,  cd:0 },
      { id:'nta_d',   name:'มนต์สะกด',      type:'debuff',      power:0,   gutsCost:35, cd:4, effect:'slow' },
      { id:'nta_sig', name:'ระเบิดตะเคียน', type:'magical_aoe', power:175, gutsCost:75, cd:7 }]},

  pret:        { name:'เปรต',        col:0xAA44BB, element:'dark',  class:'dps',
    baseStats:{ maxHp:1100,str:44,mag:28,def:20,spr:18,spd:28 },
    skills:[
      { id:'pret_n',   name:'ข่วน',        type:'physical', power:85,  gutsCost:0,  cd:0 },
      { id:'pret_d',   name:'ดูดวิญญาณ',   type:'drain',    power:120, gutsCost:45, cd:4 },
      { id:'pret_sig', name:'กาลกิณีสาป',  type:'physical', power:260, gutsCost:90, cd:9 }]},

  maeNak:      { name:'แม่นาค',      col:0xDDAAFF, element:'water', class:'tank',
    baseStats:{ maxHp:2000,str:35,mag:25,def:50,spr:40,spd:22 },
    skills:[
      { id:'mn_n',   name:'ตะปบน้ำ',      type:'physical', power:75,  gutsCost:0,  cd:0 },
      { id:'mn_t',   name:'กรีดร้องสยอง', type:'debuff',   power:0,   gutsCost:40, cd:5, effect:'taunt' },
      { id:'mn_sig', name:'รักแท้ไม่ตาย', type:'physical', power:230, gutsCost:85, cd:8 }]},

  kalakinee:   { name:'กาลกิณี',    col:0xBBBBCC, element:'metal', class:'debuffer',
    baseStats:{ maxHp:800, str:25,mag:42,def:20,spr:30,spd:44 },
    skills:[
      { id:'kala_n',   name:'นินทา',      type:'magical',     power:70,  gutsCost:0,  cd:0 },
      { id:'kala_c',   name:'สาปอัปรีย์', type:'debuff',      power:0,   gutsCost:40, cd:4, effect:'atk_down' },
      { id:'kala_sig', name:'ฝนดาวตก',   type:'magical_aoe', power:160, gutsCost:80, cd:8 }]},

  pisaj:       { name:'ปีศาจ',       col:0xFF7700, element:'fire',  class:'dps',
    baseStats:{ maxHp:1300,str:45,mag:36,def:28,spr:25,spd:30 },
    skills:[
      { id:'pis_n',   name:'เปลวพิษ', type:'magical',  power:82,  gutsCost:0,  cd:0 },
      { id:'pis_b',   name:'สาดไฟ',   type:'magical',  power:130, gutsCost:45, cd:4, dot:'burn' },
      { id:'pis_sig', name:'อสุรภัย', type:'physical', power:270, gutsCost:85, cd:8 }]},

  phiTaiHong:  { name:'ผีตายโหง',   col:0xFF2244, element:'dark',  class:'berserker',
    baseStats:{ maxHp:1400,str:52,mag:15,def:22,spr:15,spd:26 },
    skills:[
      { id:'pth_n',    name:'ระบายแค้น',      type:'physical', power:95,  gutsCost:0,   cd:0 },
      { id:'pth_rage', name:'บ้าเลือด',        type:'buff',     power:0,   gutsCost:40,  cd:5, effect:'rage' },
      { id:'pth_sig',  name:'เจ็บตาย 7 ทิศ',  type:'physical', power:310, gutsCost:100, cd:10 }]},

  asurakay:    { name:'อสุรกาย',     col:0xBB4400, element:'earth', class:'boss_tank',
    baseStats:{ maxHp:3000,str:55,mag:40,def:56,spr:46,spd:20 },
    skills:[
      { id:'asu_n',   name:'กำปั้นยักษ์',     type:'physical',     power:100, gutsCost:0,   cd:0  },
      { id:'asu_s',   name:'กระทืบแผ่นดิน',  type:'physical_aoe', power:150, gutsCost:50,  cd:5  },
      { id:'asu_sig', name:'สะท้านสวรรค์',    type:'physical_aoe', power:360, gutsCost:100, cd:12 }]},

  motherSpirit:{ name:'แม่เจ้าของ',  col:0xFFFFAA, element:'light', class:'healer',
    baseStats:{ maxHp:1500,str:20,mag:52,def:35,spr:56,spd:28 },
    skills:[
      { id:'ms_n',      name:'อวยพร',       type:'magical',  power:65,  gutsCost:0,  cd:0  },
      { id:'ms_heal',   name:'ชำระวิญญาณ', type:'heal',     power:200, gutsCost:50, cd:4  },
      { id:'ms_revive', name:'คืนชีพ',      type:'revive',   power:50,  gutsCost:90, cd:12 },
      { id:'ms_sig',    name:'แสงสวรรค์',   type:'heal_all', power:180, gutsCost:80, cd:8  }]},
};

// createGhost helper
function createGhost(id, overrides = {}) {
  const tmpl = GHOST_REG[id];
  if (!tmpl) throw new Error('Unknown ghost: ' + id);
  return {
    ...JSON.parse(JSON.stringify(tmpl)),
    instanceId: id + '_' + Math.random().toString(36).slice(2),
    level:1, exp:0, bond:30,
    stats: { ...tmpl.baseStats, hp: tmpl.baseStats.maxHp },
    currentAtb:0, currentGuts:0,
    activeCooldowns:{}, statusEffects:[],
    ...overrides
  };
}

// ── Element chart (needed by BattleEngine)
const ELEM_CHART = {
  fire:  { wood:1.33, water:0.75 },
  water: { fire:1.33, earth:0.75 },
  wood:  { earth:1.33, metal:0.75 },
  earth: { water:1.33, wood:0.75 },
  metal: { wood:1.33, fire:0.75 },
  light: { dark:1.33 },
  dark:  { light:1.33 },
};

function getElemMod(atkElem, defElem) {
  return ELEM_CHART[atkElem]?.[defElem] ?? 1.0;
}

// ATB constant
const ATB_K = 30;

// Damage formula (used by BattleEngine)
function calcDamage(attacker, target, skill) {
  const eMod = getElemMod(attacker.element, target.element);
  let base;
  const aStat = attacker.stats || attacker;
  const tStat = target.stats || target;
  if (skill.type === 'physical' || skill.type === 'physical_aoe') {
    base = skill.power * ((aStat.str || 30) / 100) * eMod - ((tStat.def || 25) * 0.4);
  } else if (skill.type && (skill.type.includes('magical') || skill.type === 'drain')) {
    base = skill.power * ((aStat.mag || 30) / 100) * eMod - ((tStat.spr || 25) * 0.4);
  } else {
    base = skill.power;
  }
  return Math.max(1, Math.round(base));
}
