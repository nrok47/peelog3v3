// ═══════════════════════════════════════════════════
//  Spirit Master — Browser Seed
//  รันใน console หลัง login สำเร็จ:
//  await SpiritDB.seed()
// ═══════════════════════════════════════════════════

window.SpiritDB.seed = async function() {
  console.log('🌱 เริ่ม seed data...');

  // ── ดึง player ปัจจุบัน
  const player = await SpiritDB.Auth.getPlayer();
  if (!player) { console.error('❌ ยังไม่ได้ login'); return; }
  console.log('👤 Player:', player.username, '| id:', player.id);

  const pid = player.id;

  // ── อัปเดต player resources + inventory
  await SpiritDB.db.from('players').update({
    title:       'จอมขมังเวทแห่งอุบล',
    spirit_dust: 48500,
    scrolls:     18,
    inventory: [
      { id:'item-001', type:'amulet', slot_type:'active',  name:'ยันต์เพลิงพิโรธ',      tier:'epic',   level:5, element:'fire',   stats:{ power:180, guts_cost:30, cooldown:8 },    desc:'ยันต์ไฟ AoE damage' },
      { id:'item-002', type:'amulet', slot_type:'passive', name:'ยันต์เกราะมหาอุด',     tier:'rare',   level:3,               stats:{ def_pct:22, spr_pct:12 },                    desc:'โล่ป้องกัน DEF+SPR' },
      { id:'item-003', type:'amulet', slot_type:'passive', name:'ยันต์พุทธรักษา',       tier:'legend', level:7,               stats:{ hp_regen:15, bond_gain:5 },                  desc:'ฮีล HP ทุกเทิร์น' },
      { id:'item-004', type:'amulet', slot_type:'active',  name:'ยันต์ดูดวิญญาณ',       tier:'rare',   level:4, element:'dark', stats:{ power:120, drain_pct:50, guts_cost:40 },   desc:'โจมตีและดูด HP 50%' },
      { id:'item-005', type:'amulet', slot_type:'utility', name:'ยันต์เร่งอามรณ์',       tier:'epic',   level:5,               stats:{ guts_regen_pct:40, spd_bonus:8 },            desc:'GUTS regen +40%' },
      { id:'item-006', type:'material', name:'ผงอาถรรพ์บริสุทธิ์', tier:'common', qty:12, desc:'ใช้สุ่ม Affix' },
      { id:'item-007', type:'scroll',   name:'ตำราวิชาอาคม · ไฟ',    tier:'rare',  qty:2,  skill_element:'fire',   skill_level:3, desc:'สอนสกิลไฟ Lv3' },
      { id:'item-008', type:'scroll',   name:'ตำราวิชาอาคม · อาถรรพ์', tier:'rare', qty:1, skill_element:'occult', skill_level:2, desc:'สอนสกิลอาถรรพ์ Lv2' },
      { id:'item-009', type:'key_item', name:'ดวงตาคนตาย',          tier:'epic',   qty:1,  desc:'วัตถุดิบวิวัฒนาการกระสือ' },
      { id:'item-010', type:'material', name:'ยันต์กันแตก',          tier:'rare',   qty:3,  desc:'ป้องกันของแตกตีบวก +7+' },
    ]
  }).eq('id', pid);
  console.log('✅ อัปเดต player resources + 10 items');

  // ── ลบผีเก่า (ถ้ามี)
  await SpiritDB.db.from('ghosts').delete().eq('player_id', pid);

  // ── ผี 5 ตัว
  const ghostsData = [
    {
      player_id: pid, ghost_type:'krasue',    nickname:'กระสือสาวคร่ำครวญ',
      evo_stage:0, level:18, exp:2400, bond:65, corruption:12, is_in_team:true,  team_slot:0,
      stats:      { str:15, mag:62,  def:18, spr:48, spd:42, hp:1260, maxHp:1260 },
      soul_core:  { type:'krasue',    element:'dark',  class:'mage'   },
      frame:      { enhancement:9,  base_def:18, base_spr:42, sockets:['item-001','item-003',null,null] },
      spirit_mass:{ affixes:[{stat:'mag',value:14,tier:2},{stat:'crit',value:6,tier:2}] },
      skill_tree: { points_spent:8, nodes_taken:['root','m-c1','m-c2','n-C','m-c3'], branches:{offense:2,resource:4,defense:0} },
      amulet_slots: ['item-001','item-003',null,null],
    },
    {
      player_id: pid, ghost_type:'maeNak',    nickname:'แม่นาคพระโขนง',
      evo_stage:0, level:22, exp:5800, bond:80, corruption:5,  is_in_team:true,  team_slot:1,
      stats:      { str:40, mag:25,  def:58, spr:45, spd:24, hp:2600, maxHp:2600 },
      soul_core:  { type:'maeNak',    element:'water', class:'tank'   },
      frame:      { enhancement:12, base_def:50, base_spr:40, sockets:['item-002',null,null,null] },
      spirit_mass:{ affixes:[{stat:'def',value:20,tier:1},{stat:'hp',value:8,tier:2}] },
      skill_tree: { points_spent:12,nodes_taken:['root','m-r1','m-r2','n-R','m-r4'], branches:{offense:0,resource:2,defense:8} },
      amulet_slots: ['item-002',null,null,null],
    },
    {
      player_id: pid, ghost_type:'nangTani',  nickname:'นางตานีกล้วยทอง',
      evo_stage:0, level:15, exp:1200, bond:55, corruption:3,  is_in_team:true,  team_slot:2,
      stats:      { str:20, mag:52,  def:24, spr:40, spd:38, hp:1200, maxHp:1200 },
      soul_core:  { type:'nangTani',  element:'wood',  class:'mage'   },
      frame:      { enhancement:6,  base_def:22, base_spr:36, sockets:['item-005','item-003',null,null] },
      spirit_mass:{ affixes:[{stat:'mag',value:9,tier:3},{stat:'spd',value:4,tier:2}] },
      skill_tree: { points_spent:5, nodes_taken:['root','m-c1','m-c2'], branches:{offense:2,resource:2,defense:0} },
      amulet_slots: ['item-005','item-003',null,null],
    },
    {
      player_id: pid, ghost_type:'pob',       nickname:'ปอบอักขระ',
      evo_stage:0, level:28, exp:9200, bond:72, corruption:22, is_in_team:false, team_slot:null,
      stats:      { str:55, mag:22,  def:28, spr:20, spd:36, hp:1580, maxHp:1580 },
      soul_core:  { type:'pob',       element:'fire',  class:'dps'    },
      frame:      { enhancement:13, base_def:25, base_spr:18, sockets:['item-004',null,null,null] },
      spirit_mass:{ affixes:[{stat:'crit',value:9,tier:1},{stat:'str',value:18,tier:1}] },
      skill_tree: { points_spent:16,nodes_taken:['root','m-l1','m-l2','m-l3','n-L','m-l4'], branches:{offense:10,resource:2,defense:0} },
      amulet_slots: ['item-004',null,null,null],
    },
    {
      player_id: pid, ghost_type:'kumantong', nickname:'กุมารทองซุกซน',
      evo_stage:0, level:12, exp:650,  bond:45, corruption:0,  is_in_team:false, team_slot:null,
      stats:      { str:22, mag:40,  def:30, spr:44, spd:32, hp:1180, maxHp:1180 },
      soul_core:  { type:'kumantong', element:'light', class:'healer' },
      frame:      { enhancement:3,  base_def:28, base_spr:40, sockets:[null,null,null,null] },
      spirit_mass:{ affixes:[{stat:'spr',value:7,tier:3}] },
      skill_tree: { points_spent:2, nodes_taken:['root','m-c1'], branches:{offense:0,resource:2,defense:0} },
      amulet_slots: [null,null,null,null],
    },
  ];

  const { data: inserted, error: gErr } = await SpiritDB.db
    .from('ghosts').insert(ghostsData).select('id, ghost_type, nickname, level, is_in_team');
  if (gErr) { console.error('❌ Ghost insert error:', gErr.message); return; }
  console.log('✅ เพิ่มผี 5 ตัว:');
  inserted.forEach(g => console.log(`   ${g.is_in_team ? '⚔️  ทีม' : '📦 คลัง'} | ${g.ghost_type} Lv${g.level} — ${g.nickname}`));

  // ── Save
  await SpiritDB.db.from('saves').delete().eq('player_id', pid);
  await SpiritDB.db.from('saves').insert({
    player_id:       pid,
    chapter:         2,
    chapter_step:    4,
    corruption_score:35,
    zone_id:         'zone_02_temple',
    steps_taken:     42,
    mentor_bonds:    { phra:60, chee:45, mo_jeen:20, mo_farang:30 },
    decisions: [
      { turn:'บท 1', choice:'ยอมรับพลัง',    corruption_delta:8,   effect:'+8 Corruption' },
      { turn:'บท 2', choice:'ช่วยชี',         corruption_delta:-5,  effect:'Bond ชี +12, −5 Corruption' },
      { turn:'บท 2', choice:'ใช้ท่าต้องห้าม', corruption_delta:18,  effect:'+18 Corruption' },
      { turn:'บท 2', choice:'ฟังพระ',         corruption_delta:-10, effect:'Bond พระ +15, −10 Corruption' },
    ],
    resources:    { coins:840, necro_fluid:12 },
    current_ending:'neutral',
  });
  console.log('✅ สร้าง save (บท 2 · Corruption 35%)');

  console.log('\n🎉 Seed เสร็จ! ทดสอบได้เลย:');
  console.log('   SpiritDB.GhostService.getTeam("' + pid + '")');
  console.log('   SpiritDB.SaveService.getCurrent("' + pid + '")');
  return { player, ghostCount: inserted.length };
};
