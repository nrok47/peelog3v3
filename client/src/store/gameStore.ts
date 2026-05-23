import { create } from 'zustand';
import type { Ghost, GameState } from '../types';
import { db, Auth, GhostService, SaveService } from '../db/supabase';

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
}

export const useGameStore = create<GameStore>((set, get) => ({
  player:    null,
  ghosts:    [],
  team:      [],
  save:      null,
  isLoading: false,
  isAuth:    false,

  async loadAll() {
    set({ isLoading: true });
    try {
      const player = await Auth.getPlayer();
      if (!player) { set({ isLoading: false, isAuth: false }); return; }

      const [ghosts, save] = await Promise.all([
        GhostService.getAll(player.id),
        SaveService.getCurrent(player.id),
      ]);

      const team = ghosts
        .filter(g => g.is_in_team)
        .sort((a, b) => (a.team_slot ?? 0) - (b.team_slot ?? 0));

      set({ player, ghosts, team, save, isAuth: true, isLoading: false });
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
