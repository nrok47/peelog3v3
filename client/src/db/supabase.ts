import { createClient } from '@supabase/supabase-js';
import type { Ghost, Player, Save, Decision } from '../types';

const URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const ANON = import.meta.env.VITE_SUPABASE_ANON as string;

export const db = createClient(URL, ANON);

// ── AUTH ──────────────────────────────────────────────────────
export const Auth = {
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await db.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await db.from('players').insert({
        user_id: data.user.id,
        username,
        title: 'นักเดินทาง',
        spirit_dust: 100,
        focus_pts: 0,
        inventory: [],
      });
    }
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    await db.auth.signOut();
  },

  async getSession() {
    const { data } = await db.auth.getSession();
    return data.session;
  },

  async getPlayer(): Promise<Player | null> {
    const session = await this.getSession();
    if (!session) return null;
    const { data } = await db.from('players').select('*').eq('user_id', session.user.id).single();
    return data as Player | null;
  },
};

// ── GHOST SERVICE ─────────────────────────────────────────────
export const GhostService = {
  async getAll(playerId: string): Promise<Ghost[]> {
    const { data } = await db.from('ghosts').select('*').eq('player_id', playerId);
    return (data ?? []) as Ghost[];
  },

  async getTeam(playerId: string): Promise<Ghost[]> {
    const { data } = await db
      .from('ghosts')
      .select('*')
      .eq('player_id', playerId)
      .eq('is_in_team', true)
      .order('team_slot');
    return (data ?? []) as Ghost[];
  },

  async add(playerId: string, ghostType: string): Promise<Ghost> {
    const { data, error } = await db.from('ghosts').insert({
      player_id: playerId,
      ghost_type: ghostType,
      nickname: '',
      evo_stage: 0,
      level: 1,
      exp: 0,
      bond: 0,
      corruption: 0,
      stat_points: 0,
      is_in_team: false,
      team_slot: null,
    }).select().single();
    if (error) throw error;
    return data as Ghost;
  },

  async update(ghostId: string, changes: Partial<Ghost>): Promise<void> {
    const { error } = await db.from('ghosts').update(changes).eq('id', ghostId);
    if (error) throw error;
  },

  async setTeam(playerId: string, slots: { ghostId: string; slot: number }[]): Promise<void> {
    await db.from('ghosts').update({ is_in_team: false, team_slot: null }).eq('player_id', playerId);
    for (const { ghostId, slot } of slots) {
      await db.from('ghosts').update({ is_in_team: true, team_slot: slot }).eq('id', ghostId);
    }
  },


};

// ── SAVE SERVICE ──────────────────────────────────────────────
export const SaveService = {
  async getCurrent(playerId: string): Promise<Save | null> {
    const { data } = await db.from('saves').select('*').eq('player_id', playerId).eq('is_active', true).single();
    return data as Save | null;
  },

  async createNew(playerId: string): Promise<Save> {
    const { data, error } = await db.from('saves').insert({
      player_id: playerId,
      chapter: 1,
      chapter_step: 0,
      corruption_score: 0,
      zone_id: 'zone_01',
      steps_taken: 0,
      zone_cleared: false,
      mentor_bonds: { phra: 0, chee: 0, mo_jeen: 0, mo_farang: 0 },
      decisions: [],
      resources: { coins: 200, necro_fluid: 0 },
      current_ending: 'good',
      is_active: true,
    }).select().single();
    if (error) throw error;
    return data as Save;
  },

  async checkpoint(saveId: string, updates: Partial<Save>): Promise<void> {
    const { error } = await db.from('saves').update(updates).eq('id', saveId);
    if (error) throw error;
  },

  async addDecision(saveId: string, existing: Decision[], newDecision: Decision): Promise<void> {
    const decisions = [...existing, newDecision];
    const corruption = decisions.reduce((s, d) => s + d.corruption_delta, 0);
    await db.from('saves').update({
      decisions,
      corruption_score: Math.min(100, Math.max(0, corruption)),
    }).eq('id', saveId);
  },
};

// ── LEADERBOARD ───────────────────────────────────────────────
export const LeaderboardService = {
  async getTop(limit = 20) {
    const { data } = await db.from('leaderboard').select('*').order('score', { ascending: false }).limit(limit);
    return data ?? [];
  },

  async submit(playerId: string, username: string, score: number, ending: string) {
    await db.from('leaderboard').insert({ player_id: playerId, username, score, ending, season: '2026-S1' });
  },
};
