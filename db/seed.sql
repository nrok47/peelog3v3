-- ═══════════════════════════════════════════════════════
--  Spirit Master — Test Seed Data
--  รันใน: Supabase Dashboard → SQL Editor → New query
--  สร้าง: 1 ผู้เล่น (CK_dev) + ผี 5 ตัว + ไอเทม 10 อย่าง
-- ═══════════════════════════════════════════════════════

-- ── 0. ล้างข้อมูล test เก่า (ถ้ามี)
delete from saves   where player_id in (select id from players where username = 'CK_dev');
delete from ghosts  where player_id in (select id from players where username = 'CK_dev');
delete from players where username = 'CK_dev';
delete from auth.users where email = 'ck@spiritmaster.dev';

-- ── 1. สร้าง auth user (รหัส: dev1234)
insert into auth.users (
  id, instance_id,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  aud, role, confirmation_token, recovery_token,
  email_change_token_new, email_change
) values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'ck@spiritmaster.dev',
  crypt('dev1234', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"CK_dev"}',
  'authenticated', 'authenticated',
  '', '', '', ''
) on conflict (id) do nothing;

-- ── 2. สร้าง player
insert into players (id, user_id, username, title, spirit_dust, scrolls, focus_pts, inventory)
values (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'CK_dev',
  'จอมขมังเวทแห่งอุบล',
  48500,
  18,
  100,
  -- 10 inventory items
  '[
    {
      "id": "item-001",
      "type": "amulet",
      "slot_type": "active",
      "name": "ยันต์เพลิงพิโรธ",
      "tier": "epic",
      "level": 5,
      "element": "fire",
      "stats": { "power": 180, "guts_cost": 30, "cooldown": 8 },
      "desc": "ยันต์ไฟแผดเผาสร้าง AoE damage"
    },
    {
      "id": "item-002",
      "type": "amulet",
      "slot_type": "passive",
      "name": "ยันต์เกราะมหาอุด",
      "tier": "rare",
      "level": 3,
      "stats": { "def_pct": 22, "spr_pct": 12 },
      "desc": "โล่ป้องกันกายภาพและเวทย์"
    },
    {
      "id": "item-003",
      "type": "amulet",
      "slot_type": "passive",
      "name": "ยันต์พุทธรักษา",
      "tier": "legend",
      "level": 7,
      "stats": { "hp_regen": 15, "bond_gain": 5 },
      "desc": "ฮีล HP ทีละนิดทุกเทิร์น + เพิ่ม Bond"
    },
    {
      "id": "item-004",
      "type": "amulet",
      "slot_type": "active",
      "name": "ยันต์ดูดวิญญาณ",
      "tier": "rare",
      "level": 4,
      "element": "dark",
      "stats": { "power": 120, "drain_pct": 50, "guts_cost": 40 },
      "desc": "โจมตีและดูด HP 50% กลับ"
    },
    {
      "id": "item-005",
      "type": "amulet",
      "slot_type": "utility",
      "name": "ยันต์เร่งอามรณ์",
      "tier": "epic",
      "level": 5,
      "stats": { "guts_regen_pct": 40, "spd_bonus": 8 },
      "desc": "GUTS ฟื้นเร็วขึ้น 40% + SPD +8"
    },
    {
      "id": "item-006",
      "type": "material",
      "name": "ผงอาถรรพ์บริสุทธิ์",
      "tier": "common",
      "qty": 12,
      "desc": "ใช้สุ่ม Affix บน Spirit Mass"
    },
    {
      "id": "item-007",
      "type": "scroll",
      "name": "ตำราวิชาอาคม · ไฟ",
      "tier": "rare",
      "skill_element": "fire",
      "skill_level": 3,
      "qty": 2,
      "desc": "สอนสกิลไฟ Lv3 ให้ผีที่กำหนด"
    },
    {
      "id": "item-008",
      "type": "scroll",
      "name": "ตำราวิชาอาคม · อาถรรพ์",
      "tier": "rare",
      "skill_element": "occult",
      "skill_level": 2,
      "qty": 1,
      "desc": "สอนสกิลอาถรรพ์ Lv2 ให้ผีที่กำหนด"
    },
    {
      "id": "item-009",
      "type": "key_item",
      "name": "ดวงตาคนตาย",
      "tier": "epic",
      "qty": 1,
      "desc": "วัตถุดิบวิวัฒนาการ กระสือ → กระสือเฒ่า"
    },
    {
      "id": "item-010",
      "type": "material",
      "name": "ยันต์กันแตก",
      "tier": "rare",
      "qty": 3,
      "desc": "ป้องกันของแตกเมื่อตีบวก +7 ขึ้นไป"
    }
  ]'::jsonb
);

-- ── 3. ผี 5 ตัว
-- ─── 3-1. กระสือ (Mage) — ทีม slot 0
insert into ghosts (id, player_id, ghost_type, nickname, evo_stage, level, exp, bond, corruption,
  stats, soul_core, frame, spirit_mass, skill_tree, amulet_slots, is_in_team, team_slot)
values (
  'cccccccc-0000-0000-0001-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000001',
  'krasue', 'กระสือสาวคร่ำครวญ', 0, 18, 2400, 65, 12,
  '{"str":15,"mag":62,"def":18,"spr":48,"spd":42,"hp":1260,"maxHp":1260}'::jsonb,
  '{"type":"krasue","element":"dark","class":"mage"}'::jsonb,
  '{"enhancement":9,"base_def":18,"base_spr":42,"sockets":["item-001","item-003",null,null]}'::jsonb,
  '{"affixes":[{"stat":"mag","value":14,"tier":2},{"stat":"crit","value":6,"tier":2}]}'::jsonb,
  '{"points_spent":8,"nodes_taken":["root","m-c1","m-c2","n-C","m-c3"],"branches":{"offense":2,"resource":4,"defense":0}}'::jsonb,
  '["item-001","item-003",null,null]'::jsonb,
  true, 0
);

-- ─── 3-2. แม่นาค (Tank) — ทีม slot 1
insert into ghosts (id, player_id, ghost_type, nickname, evo_stage, level, exp, bond, corruption,
  stats, soul_core, frame, spirit_mass, skill_tree, amulet_slots, is_in_team, team_slot)
values (
  'cccccccc-0000-0000-0001-000000000002',
  'bbbbbbbb-0000-0000-0000-000000000001',
  'maeNak', 'แม่นาคพระโขนง', 0, 22, 5800, 80, 5,
  '{"str":40,"mag":25,"def":58,"spr":45,"spd":24,"hp":2600,"maxHp":2600}'::jsonb,
  '{"type":"maeNak","element":"water","class":"tank"}'::jsonb,
  '{"enhancement":12,"base_def":50,"base_spr":40,"sockets":["item-002",null,null,null]}'::jsonb,
  '{"affixes":[{"stat":"def","value":20,"tier":1},{"stat":"hp","value":8,"tier":2}]}'::jsonb,
  '{"points_spent":12,"nodes_taken":["root","m-r1","m-r2","n-R","m-r4"],"branches":{"offense":0,"resource":2,"defense":8}}'::jsonb,
  '["item-002",null,null,null]'::jsonb,
  true, 1
);

-- ─── 3-3. นางตานี (Support/Mage) — ทีม slot 2
insert into ghosts (id, player_id, ghost_type, nickname, evo_stage, level, exp, bond, corruption,
  stats, soul_core, frame, spirit_mass, skill_tree, amulet_slots, is_in_team, team_slot)
values (
  'cccccccc-0000-0000-0001-000000000003',
  'bbbbbbbb-0000-0000-0000-000000000001',
  'nangTani', 'นางตานีกล้วยทอง', 0, 15, 1200, 55, 3,
  '{"str":20,"mag":52,"def":24,"spr":40,"spd":38,"hp":1200,"maxHp":1200}'::jsonb,
  '{"type":"nangTani","element":"wood","class":"mage"}'::jsonb,
  '{"enhancement":6,"base_def":22,"base_spr":36,"sockets":["item-005","item-003",null,null]}'::jsonb,
  '{"affixes":[{"stat":"mag","value":9,"tier":3},{"stat":"spd","value":4,"tier":2}]}'::jsonb,
  '{"points_spent":5,"nodes_taken":["root","m-c1","m-c2"],"branches":{"offense":2,"resource":2,"defense":0}}'::jsonb,
  '["item-005","item-003",null,null]'::jsonb,
  true, 2
);

-- ─── 3-4. ปอบ (DPS) — ไม่ได้อยู่ในทีม
insert into ghosts (id, player_id, ghost_type, nickname, evo_stage, level, exp, bond, corruption,
  stats, soul_core, frame, spirit_mass, skill_tree, amulet_slots, is_in_team, team_slot)
values (
  'cccccccc-0000-0000-0001-000000000004',
  'bbbbbbbb-0000-0000-0000-000000000001',
  'pob', 'ปอบอักขระ', 0, 28, 9200, 72, 22,
  '{"str":55,"mag":22,"def":28,"spr":20,"spd":36,"hp":1580,"maxHp":1580}'::jsonb,
  '{"type":"pob","element":"fire","class":"dps"}'::jsonb,
  '{"enhancement":13,"base_def":25,"base_spr":18,"sockets":["item-004",null,null,null]}'::jsonb,
  '{"affixes":[{"stat":"crit","value":9,"tier":1},{"stat":"str","value":18,"tier":1}]}'::jsonb,
  '{"points_spent":16,"nodes_taken":["root","m-l1","m-l2","m-l3","n-L","m-l4"],"branches":{"offense":10,"resource":2,"defense":0}}'::jsonb,
  '["item-004",null,null,null]'::jsonb,
  false, null
);

-- ─── 3-5. กุมารทอง (Healer) — ไม่ได้อยู่ในทีม
insert into ghosts (id, player_id, ghost_type, nickname, evo_stage, level, exp, bond, corruption,
  stats, soul_core, frame, spirit_mass, skill_tree, amulet_slots, is_in_team, team_slot)
values (
  'cccccccc-0000-0000-0001-000000000005',
  'bbbbbbbb-0000-0000-0000-000000000001',
  'kumantong', 'กุมารทองซุกซน', 0, 12, 650, 45, 0,
  '{"str":22,"mag":40,"def":30,"spr":44,"spd":32,"hp":1180,"maxHp":1180}'::jsonb,
  '{"type":"kumantong","element":"light","class":"healer"}'::jsonb,
  '{"enhancement":3,"base_def":28,"base_spr":40,"sockets":[null,null,null,null]}'::jsonb,
  '{"affixes":[{"stat":"spr","value":7,"tier":3}]}'::jsonb,
  '{"points_spent":2,"nodes_taken":["root","m-c1"],"branches":{"offense":0,"resource":2,"defense":0}}'::jsonb,
  '[null,null,null,null]'::jsonb,
  false, null
);

-- ── 4. Save (adventure progress)
insert into saves (id, player_id, chapter, chapter_step, corruption_score,
  zone_id, steps_taken, mentor_bonds, decisions, resources, current_ending)
values (
  'dddddddd-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000001',
  2, 4, 35,
  'zone_02_temple', 42,
  '{"phra":60,"chee":45,"mo_jeen":20,"mo_farang":30}'::jsonb,
  '[
    {"turn":"บท 1","choice":"ยอมรับพลัง","corruption_delta":8,"effect":"+8 Corruption"},
    {"turn":"บท 2","choice":"ช่วยชี","corruption_delta":-5,"effect":"Bond ชี +12, −5 Corruption"},
    {"turn":"บท 2","choice":"ใช้ท่าต้องห้าม","corruption_delta":18,"effect":"+18 Corruption"},
    {"turn":"บท 2","choice":"ฟังพระ","corruption_delta":-10,"effect":"Bond พระ +15, −10 Corruption"}
  ]'::jsonb,
  '{"coins":840,"necro_fluid":12}'::jsonb,
  'neutral'
);

-- ── 5. ตรวจสอบ
select
  p.username,
  p.spirit_dust,
  p.scrolls,
  jsonb_array_length(p.inventory) as item_count,
  count(g.id) as ghost_count,
  sum(case when g.is_in_team then 1 else 0 end) as team_count
from players p
left join ghosts g on g.player_id = p.id
where p.username = 'CK_dev'
group by p.id;
