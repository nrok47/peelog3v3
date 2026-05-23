// ═══════════════════════════════════════════════
//  Supabase Client — Spirit Master
//  ใช้ใน browser โดยตรง (ไม่ต้อง npm/build)
//  CDN: @supabase/supabase-js@2
// ═══════════════════════════════════════════════

const SUPABASE_URL  = 'https://miffompdtiasgssndayp.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZmZvbXBkdGlhc2dzc25kYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjI0NjgsImV4cCI6MjA5NTAzODQ2OH0.iMvbuKnoBjYyLMyrkL5oOBgr-3FGEma7fa_V4WwLJUU';
// หา key ได้ที่: Supabase Dashboard → Project Settings → API → anon public

const { createClient } = supabase;  // from CDN global
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ═══════════════════════════════════════════════
//  AUTH HELPERS
// ═══════════════════════════════════════════════
const Auth = {
  // สมัครด้วย email + password
  async signUp(email, password, username) {
    const { data, error } = await db.auth.signUp({ email, password });
    if (error) throw error;

    // data.user เป็น null ถ้า Supabase ต้องการ email confirmation
    if (!data.user) {
      return { status: 'confirm_email', message: 'กรุณาตรวจสอบ email เพื่อยืนยันบัญชี' };
    }

    // สร้าง player record
    const { error: pErr } = await db.from('players').insert({
      user_id:  data.user.id,
      username: username,
    });
    if (pErr) throw pErr;
    return { status: 'ok', user: data.user };
  },

  // เข้าสู่ระบบ
  async signIn(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // ออกจากระบบ
  async signOut() {
    await db.auth.signOut();
  },

  // ดู session ปัจจุบัน
  async getSession() {
    const { data } = await db.auth.getSession();
    return data.session;
  },

  // ดู player record จาก auth user
  async getPlayer() {
    const session = await this.getSession();
    if (!session) return null;
    const { data } = await db.from('players')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    return data;
  },
};

// ═══════════════════════════════════════════════
//  GHOST SERVICE — CRUD ผี
// ═══════════════════════════════════════════════
const GhostService = {

  // ดึงผีทั้งหมดของผู้เล่น
  async getAll(playerId) {
    const { data, error } = await db
      .from('ghosts')
      .select('*')
      .eq('player_id', playerId)
      .order('level', { ascending: false });
    if (error) throw error;
    return data;
  },

  // ดึงทีมปัจจุบัน (3 ตัว)
  async getTeam(playerId) {
    const { data, error } = await db
      .from('ghosts')
      .select('*')
      .eq('player_id', playerId)
      .eq('is_in_team', true)
      .order('team_slot');
    if (error) throw error;
    return data;
  },

  // เพิ่มผีใหม่ (จับได้จาก adventure)
  async add(playerId, ghostType, initialData = {}) {
    const baseStats = GHOST_REG[ghostType]?.baseStats || {};
    const { data, error } = await db
      .from('ghosts')
      .insert({
        player_id:  playerId,
        ghost_type: ghostType,
        soul_core:  { type: ghostType, ...GHOST_REG[ghostType] },
        stats:      { ...baseStats, hp: baseStats.maxHp },
        ...initialData,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // อัปเดต ghost (level up, equip, enhance)
  async update(ghostId, changes) {
    const { data, error } = await db
      .from('ghosts')
      .update(changes)
      .eq('id', ghostId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // จัดทีม (set 3 slots)
  async setTeam(playerId, slots) {
    // slots = [{ ghostId, slot: 0|1|2 }, ...]
    // ล้างทีมเก่าก่อน
    await db.from('ghosts')
      .update({ is_in_team: false, team_slot: null })
      .eq('player_id', playerId);

    // set ทีมใหม่
    for (const s of slots) {
      await db.from('ghosts')
        .update({ is_in_team: true, team_slot: s.slot })
        .eq('id', s.ghostId);
    }
  },

  // ตีบวก Frame (+1 ขึ้นไป)
  async enhanceFrame(ghostId, currentFrame) {
    const nextLevel = (currentFrame.enhancement || 0) + 1;
    if (nextLevel > 15) throw new Error('Max enhancement reached');
    const updated = { ...currentFrame, enhancement: nextLevel };
    return this.update(ghostId, { frame: updated });
  },

  // วิวัฒนาการ (evo stage +1)
  async evolve(ghostId, currentStage) {
    if (currentStage >= 2) throw new Error('Max evolution reached');
    return this.update(ghostId, {
      evo_stage:   currentStage + 1,
      corruption:  (prev) => prev + 10,  // evo เพิ่ม corruption
    });
  },

  // query ตัวอย่าง: ผีธาตุไฟ bond > 70
  async queryByElement(playerId, element, minBond = 0) {
    const { data, error } = await db
      .from('ghosts')
      .select('*')
      .eq('player_id', playerId)
      .filter('soul_core->>element', 'eq', element)
      .gte('bond', minBond);
    if (error) throw error;
    return data;
  },
};

// ═══════════════════════════════════════════════
//  SAVE SERVICE — Adventure / Story progress
// ═══════════════════════════════════════════════
const SaveService = {

  // ดึง save ปัจจุบัน
  async getCurrent(playerId) {
    const { data, error } = await db
      .from('saves')
      .select('*')
      .eq('player_id', playerId)
      .eq('is_active', true)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // สร้าง save ใหม่
  async createNew(playerId) {
    // deactivate save เก่า
    await db.from('saves')
      .update({ is_active: false })
      .eq('player_id', playerId);

    const { data, error } = await db
      .from('saves')
      .insert({ player_id: playerId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // บันทึก checkpoint (เดิน 1 ก้าว)
  async checkpoint(saveId, updates) {
    // updates: { steps_taken, zone_id, resources, ... }
    const { data, error } = await db
      .from('saves')
      .update(updates)
      .eq('id', saveId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // บันทึก decision (กดเลือก choice ใน adventure)
  async addDecision(saveId, currentDecisions, newDecision) {
    // newDecision = { turn, choice, effect, corruption_delta }
    const updated = [...currentDecisions, {
      ...newDecision,
      timestamp: new Date().toISOString(),
    }];

    // คำนวณ corruption ใหม่
    const totalCorruption = updated.reduce(
      (sum, d) => sum + (d.corruption_delta || 0), 0
    );

    return this.checkpoint(saveId, {
      decisions:       updated,
      corruption_score: Math.max(0, Math.min(100, totalCorruption)),
      current_ending:  totalCorruption < 31 ? 'good'
                     : totalCorruption < 70 ? 'neutral' : 'bad',
    });
  },

  // อัปเดต mentor bond
  async updateMentorBond(saveId, currentBonds, mentor, delta) {
    const updated = {
      ...currentBonds,
      [mentor]: Math.max(0, Math.min(100, (currentBonds[mentor] || 0) + delta)),
    };
    return this.checkpoint(saveId, { mentor_bonds: updated });
  },
};

// ═══════════════════════════════════════════════
//  LEADERBOARD
// ═══════════════════════════════════════════════
const LeaderboardService = {
  async getTop(limit = 20) {
    const { data, error } = await db
      .from('leaderboard')
      .select('username, score, ending, created_at')
      .order('score', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async submit(playerId, username, score, ending) {
    const { data, error } = await db
      .from('leaderboard')
      .insert({ player_id: playerId, username, score, ending })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// Export to global (browser use)
window.SpiritDB = { db, Auth, GhostService, SaveService, LeaderboardService };
