import { create } from 'zustand';
import type { Ghost, GameState } from '../types';
import { db, Auth, GhostService, SaveService } from '../db/supabase';
import { GHOST_LIST } from '../data/ghosts';

interface GameStore extends GameState {
  // Actions
  loadAll: () => Promise<void>;
  signIn:  (email: string, password: string) => Promise<void>;
  signUp:  (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateGhost: (ghostId: string, changes: Partial<Ghost>) => Promise<void>;
  setTeam: (slots: { ghostId: string; slot: number }[]) => void;
  addSpiritDust: (amount: number) => void;
  summonGhost: (ghostType: string, cost: number) => Promise<Ghost>;
  passiveDustEarned: number;  // dust earned this session (for notification)
}

const DUST_PER_HOUR = 30;
const MAX_OFFLINE_HOURS = 8;
const SYNC_KEY = 'spirit_master_dust_sync';

export const useGameStore = create<GameStore>((set, get) => ({
  player:    null,
  ghosts:    [],
  team:      [],
  save:      null,
  isLoading: false,
  isAuth:    false,
  passiveDustEarned: 0,

  async loadAll() {
    set({ isLoading: true });
    try {
      let player = await Auth.getPlayer();
      if (!player) { set({ isLoading: false, isAuth: false }); return; }

      const [ghosts, save] = await Promise.all([
        GhostService.getAll(player.id),
        SaveService.getCurrent(player.id),
      ]);

      const team = ghosts
        .filter(g => g.is_in_team)
        .sort((a, b) => (a.team_slot ?? 0) - (b.team_slot ?? 0));

      // ── Passive dust regen ────────────────────────────────────
      let passiveDustEarned = 0;
      const now = Date.now();
      const lastSync = parseInt(localStorage.getItem(SYNC_KEY) ?? '0', 10);
      if (lastSync > 0) {
        const elapsedHours = Math.min((now - lastSync) / 3_600_000, MAX_OFFLINE_HOURS);
        passiveDustEarned = Math.floor(elapsedHours * DUST_PER_HOUR);
      }
      localStorage.setItem(SYNC_KEY, String(now));

      if (passiveDustEarned > 0) {
        const newDust = player.spirit_dust + passiveDustEarned;
        await db.from('players').update({ spirit_dust: newDust }).eq('id', player.id);
        player = { ...player, spirit_dust: newDust };
      }
      // ─────────────────────────────────────────────────────────

      set({ player, ghosts, team, save, isAuth: true, isLoading: false, passiveDustEarned });
    } catch {
      set({ isLoading: false, isAuth: false });
    }
  },

  async signIn(email, password) {
    set({ isLoading: true });
    await Auth.signIn(email, password);
    await get().loadAll();
  },

  async signUp(email, password, username) {
    set({ isLoading: true });
    await Auth.signUp(email, password, username);
    await get().loadAll();
    // Give starter ghost (random common) to brand-new players
    const { player, ghosts } = get();
    if (player && ghosts.length === 0) {
      const commons = GHOST_LIST.filter(g => g.rarity === 'common');
      const starter = commons[Math.floor(Math.random() * commons.length)];
      const newGhost = await GhostService.add(player.id, starter.id);
      set(state => ({ ghosts: [...state.ghosts, newGhost] }));
    }
  },

  async signOut() {
    await Auth.signOut();
    set({ player: null, ghosts: [], team: [], save: null, isAuth: false });
  },

  async updateGhost(ghostId, changes) {
    await GhostService.update(ghostId, changes);
    set(state => ({
      ghosts: state.ghosts.map(g => g.id === ghostId ? { ...g, ...changes } : g),
      team:   state.team.map(g => g.id === ghostId ? { ...g, ...changes } : g),
    }));
  },

  setTeam(slots) {
    const { ghosts } = get();
    const team = slots
      .map(s => ghosts.find(g => g.id === s.ghostId))
      .filter(Boolean) as Ghost[];
    set({ team });
    if (get().player) {
      GhostService.setTeam(get().player!.id, slots).catch(console.error);
    }
  },

  addSpiritDust(amount) {
    set(state => ({
      player: state.player ? { ...state.player, spirit_dust: state.player.spirit_dust + amount } : null,
    }));
  },

  async summonGhost(ghostType, cost) {
    const { player } = get();
    if (!player) throw new Error('Not logged in');
    if (player.spirit_dust < cost) throw new Error('ฝุ่นวิญญาณไม่พอ');

    // Deduct dust
    const { error: dustErr } = await db
      .from('players')
      .update({ spirit_dust: player.spirit_dust - cost })
      .eq('id', player.id);
    if (dustErr) throw dustErr;

    const newGhost = await GhostService.add(player.id, ghostType);

    set(state => ({
      player: state.player ? { ...state.player, spirit_dust: state.player.spirit_dust - cost } : null,
      ghosts: [...state.ghosts, newGhost],
    }));

    return newGhost;
  },
}));
