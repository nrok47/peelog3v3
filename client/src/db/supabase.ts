import { createClient } from '@supabase/supabase-js';
import type { Ghost, Player, Save, Decision, Guild, GuildMember, GuildMessage } from '../types';
import { CURRENT_SEASON } from '../lib/season';

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
    const { data } = await db.from('players').select('*').eq('user_id', session.user.id).maybeSingle();
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
    const { data } = await db.from('saves').select('*').eq('player_id', playerId).eq('is_active', true).maybeSingle();
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
    const { data } = await db.from('leaderboard')
      .select('*')
      .eq('season', CURRENT_SEASON)
      .order('score', { ascending: false })
      .limit(limit);
    return data ?? [];
  },

  async getPlayerEntry(playerId: string): Promise<{ score: number | null; hasDefenseTeam: boolean }> {
    const { data } = await db.from('leaderboard')
      .select('score, defense_team')
      .eq('player_id', playerId)
      .eq('season', CURRENT_SEASON)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle();
    return { score: data?.score ?? null, hasDefenseTeam: !!data?.defense_team };
  },

  async saveDefenseTeam(playerId: string, username: string, team: Ghost[]): Promise<void> {
    const { data: existing } = await db.from('leaderboard')
      .select('id')
      .eq('player_id', playerId)
      .eq('season', CURRENT_SEASON)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      await db.from('leaderboard').update({ defense_team: team }).eq('id', existing.id);
    } else {
      await db.from('leaderboard').insert({
        player_id: playerId, username, score: 0, ending: 'neutral', season: CURRENT_SEASON, defense_team: team,
      });
    }
  },

  async findOpponent(myPlayerId: string, myScore: number): Promise<{ username: string; team: Ghost[] } | null> {
    const { data } = await db.from('leaderboard')
      .select('username, defense_team, player_id')
      .not('defense_team', 'is', null)
      .neq('player_id', myPlayerId)
      .gte('score', myScore - 300)
      .lte('score', myScore + 300)
      .eq('season', CURRENT_SEASON)
      .limit(10);
    if (!data || data.length === 0) return null;
    const opp = data[Math.floor(Math.random() * data.length)];
    return { username: opp.username as string, team: opp.defense_team as Ghost[] };
  },

  async submit(playerId: string, username: string, score: number, ending: string) {
    const { data: existing } = await db
      .from('leaderboard')
      .select('id, score')
      .eq('player_id', playerId)
      .eq('season', CURRENT_SEASON)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      if (score > (existing.score ?? 0)) {
        await db.from('leaderboard')
          .update({ score, username, ending })
          .eq('id', existing.id);
      }
    } else {
      await db.from('leaderboard').insert({ player_id: playerId, username, score, ending, season: CURRENT_SEASON });
    }
  },
};

// ── GUILD ─────────────────────────────────────────────────────
// V1: create/join/leave + roster + guild leaderboard. ไม่มี chat/war/donation/kick.
export const GuildService = {
  async getMyGuild(playerId: string): Promise<{ guild: Guild; role: 'leader' | 'member' } | null> {
    const { data } = await db.from('guild_members')
      .select('role, guild:guilds(*)')
      .eq('player_id', playerId)
      .maybeSingle();
    if (!data?.guild) return null;
    return { guild: data.guild as unknown as Guild, role: data.role as 'leader' | 'member' };
  },

  async listGuilds(limit = 30): Promise<Guild[]> {
    const { data } = await db.from('guilds').select('*').order('created_at', { ascending: false }).limit(limit);
    return (data ?? []) as Guild[];
  },

  async create(playerId: string, username: string, name: string, tag: string): Promise<Guild> {
    const { data: guild, error } = await db.from('guilds')
      .insert({ name, tag, leader_id: playerId })
      .select().single();
    if (error) throw error;
    const { error: memberErr } = await db.from('guild_members')
      .insert({ guild_id: guild.id, player_id: playerId, username, role: 'leader' });
    if (memberErr) throw memberErr;
    return guild as Guild;
  },

  async join(guildId: string, playerId: string, username: string): Promise<void> {
    const { error } = await db.from('guild_members')
      .insert({ guild_id: guildId, player_id: playerId, username, role: 'member' });
    if (error) throw error;
  },

  async leave(playerId: string, guildId: string): Promise<void> {
    await db.from('guild_members').delete().eq('player_id', playerId);
    const { count } = await db.from('guild_members')
      .select('id', { count: 'exact', head: true })
      .eq('guild_id', guildId);
    if (!count) await db.from('guilds').delete().eq('id', guildId);
  },

  async getRoster(guildId: string): Promise<GuildMember[]> {
    const { data } = await db.from('guild_members')
      .select('player_id, username, role')
      .eq('guild_id', guildId)
      .order('role');
    return (data ?? []) as GuildMember[];
  },

  async getGuildLeaderboard(): Promise<{ guild: Guild; totalScore: number; memberCount: number }[]> {
    const [{ data: guilds }, { data: members }, { data: scores }] = await Promise.all([
      db.from('guilds').select('*'),
      db.from('guild_members').select('guild_id, player_id'),
      db.from('leaderboard').select('player_id, score').eq('season', CURRENT_SEASON),
    ]);
    const scoreByPlayer = new Map((scores ?? []).map(s => [s.player_id as string, s.score as number]));
    const result = (guilds ?? []).map(g => {
      const myMembers = (members ?? []).filter(m => m.guild_id === g.id);
      const totalScore = myMembers.reduce((sum, m) => sum + (scoreByPlayer.get(m.player_id as string) ?? 0), 0);
      return { guild: g as Guild, totalScore, memberCount: myMembers.length };
    });
    return result.sort((a, b) => b.totalScore - a.totalScore);
  },

  async getMessages(guildId: string, limit = 50): Promise<GuildMessage[]> {
    const { data } = await db.from('guild_messages')
      .select('*')
      .eq('guild_id', guildId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return ((data ?? []) as GuildMessage[]).reverse();
  },

  async sendMessage(guildId: string, playerId: string, username: string, message: string): Promise<void> {
    const trimmed = message.trim().slice(0, 300);
    if (!trimmed) return;
    const { error } = await db.from('guild_messages')
      .insert({ guild_id: guildId, player_id: playerId, username, message: trimmed });
    if (error) throw error;
  },

  // ต้อง enable Realtime ให้ตาราง guild_messages ใน Supabase Dashboard ก่อน (Database → Replication)
  subscribeMessages(guildId: string, onMessage: (m: GuildMessage) => void) {
    const channel = db
      .channel(`guild_chat_${guildId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guild_messages', filter: `guild_id=eq.${guildId}` },
        (payload) => onMessage(payload.new as GuildMessage)
      )
      .subscribe();
    return () => { db.removeChannel(channel); };
  },
};
