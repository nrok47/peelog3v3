-- เพิ่ม inventory column ให้ players
-- รันใน Supabase SQL Editor ก่อน seed

alter table players
  add column if not exists inventory jsonb default '[]'::jsonb,
  add column if not exists spirit_dust integer default 0,
  add column if not exists scrolls integer default 0;
