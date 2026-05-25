import { create } from 'zustand';
import type { Ghost, GameState, Decision } from '../types';
import { db, Auth, GhostService, SaveService } from '../db/supabase';
import { GHOST_LIST } from '../data/ghosts';
import { ZONE_DEFS, getZoneIndex } from '../data/zones';

interface GameStore extends GameState {
  // Actions
  loadAll: () => Promise<void>;
  signIn:  (email: string, password: string) => Promise<void>;
  signUp:  (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateGhost: (ghostId: string, changes: Partial<Ghost>) => Promise<void>;
  setTeam: (slots: { ghostId: string; slot: number }[]) => void;
  addSpiritDust: (amount: number) => void;
  spendDust: (amount: number) => Promise<boolean>;
  summonGhost: (ghostType: string, cost: number) => Promise<Ghost>;
  addBattleRewards: (playerGhostIds: string[], avgEnemyLevel: number) => Promise<{ expGained: number; levelUps: string[]; dustGained: number }>;
  applyAdventureChoice: (eventId: string, choiceId: string, corruptionDelta: number, dustReward: number, bondGain: number) => Promise<void>;
  advanceZoneStep: () => Promise<{ zoneCleared: boolean; newZoneId: string | null }>;
  passiveDustEarned: number;
  passiveRate: number;        // dust/hour current rate (bond-based)
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
  passiveRate: 30,

  async loadAll() {
    set({ isLoading: true });
    try {
      let player = await Auth.getPlayer();
      if (!player) { set({ isLoading: false, isAuth: false }); return; }

      const [ghosts, rawSave] = await Promise.all([
        GhostService.getAll(player.id),
        SaveService.getCurrent(player.id),
      ]);
      // Auto-create save for brand-new players
      const save = rawSave ?? await SaveService.createNew(player.id);

      const team = ghosts
        .filter(g => g.is_in_team)
        .sort((a, b) => (a.team_slot ?? 0) - (b.team_slot ?? 0));

      // ── Passive dust regen (bond-based rate) ─────────────────
      const avgBond = team.length > 0
        ? Math.floor(team.reduce((s, g) => s + g.bond, 0) / team.length)
        : 0;
      const passiveRate = DUST_PER_HOUR + Math.floor(avgBond / 10);

      let passiveDustEarned = 0;
      const now = Date.now();
      const lastSync = parseInt(localStorage.getItem(SYNC_KEY) ?? '0', 10);
      if (lastSync > 0) {
        const elapsedHours = Math.min((now - lastSync) / 3_600_000, MAX_OFFLINE_HOURS);
        passiveDustEarned = Math.floor(elapsedHours * passiveRate);
      }
      localStorage.setItem(SYNC_KEY, String(now));

      if (passiveDustEarned > 0) {
        const newDust = player.spirit_dust + passiveDustEarned;
        await db.from('players').update({ spirit_dust: newDust }).eq('id', player.id);
        player = { ...player, spirit_dust: newDust };
      }
      // ─────────────────────────────────────────────────────────

      set({ player, ghosts, team, save, isAuth: true, isLoading: false, passiveDustEarned, passiveRate });
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

  async spendDust(amount) {
    const { player } = get();
    if (!player || player.spirit_dust < amount) return false;
    const newDust = player.spirit_dust - amount;
    const { error } = await db.from('players').update({ spirit_dust: newDust }).eq('id', player.id);
    if (error) return false;
    set(state => ({
      player: state.player ? { ...state.player, spirit_dust: newDust } : null,
    }));
    return true;
  },

  async addBattleRewards(playerGhostIds, avgEnemyLevel) {
    const { ghosts, player } = get();
    if (!player) return { expGained: 0, levelUps: [], dustGained: 0 };

    const EXP_PER_BATTLE = avgEnemyLevel * 15;
    const DUST_REWARD    = Math.floor(avgEnemyLevel * 2);
    const BOND_GAIN      = 2;
    const levelUps: string[] = [];

    type Update = { ghostId: string; changes: Partial<Ghost> };
    const updates: Update[] = [];

    for (const ghostId of playerGhostIds) {
      const g = ghosts.find(g => g.id === ghostId);
      if (!g) continue;
      const changes: Partial<Ghost> = { bond: Math.min(100, g.bond + BOND_GAIN) };
      if (g.level < 30) {
        const newExp    = g.exp + EXP_PER_BATTLE;
        const expNeeded = g.level * 80;
        if (newExp >= expNeeded) {
          changes.exp         = newExp - expNeeded;
          changes.level       = g.level + 1;
          changes.stat_points = g.stat_points + 3;
          levelUps.push(g.ghost_type);
        } else {
          changes.exp = newExp;
        }
      }
      updates.push({ ghostId, changes });
    }

    await Promise.all(updates.map(u => GhostService.update(u.ghostId, u.changes)));
    const newDust = player.spirit_dust + DUST_REWARD;
    await db.from('players').update({ spirit_dust: newDust }).eq('id', player.id);

    set(state => ({
      player: state.player ? { ...state.player, spirit_dust: newDust } : null,
      ghosts: state.ghosts.map(g => {
        const upd = updates.find(u => u.ghostId === g.id);
        return upd ? { ...g, ...upd.changes } : g;
      }),
      team: state.team.map(g => {
        const upd = updates.find(u => u.ghostId === g.id);
        return upd ? { ...g, ...upd.changes } : g;
      }),
    }));

    return { expGained: EXP_PER_BATTLE, levelUps, dustGained: DUST_REWARD };
  },

  async applyAdventureChoice(eventId, choiceId, corruptionDelta, dustReward, bondGain) {
    const { save, player, team } = get();
    if (!player) return;

    if (save && corruptionDelta !== 0) {
      const decision: Decision = { node_id: eventId, choice: choiceId, corruption_delta: corruptionDelta };
      await SaveService.addDecision(save.id, save.decisions, decision);
      set(state => ({
        save: state.save ? {
          ...state.save,
          corruption_score: Math.min(100, Math.max(0, state.save.corruption_score + corruptionDelta)),
          decisions: [...state.save.decisions, decision],
        } : null,
      }));
    }

    if (dustReward > 0) {
      const newDust = player.spirit_dust + dustReward;
      await db.from('players').update({ spirit_dust: newDust }).eq('id', player.id);
      set(state => ({
        player: state.player ? { ...state.player, spirit_dust: newDust } : null,
      }));
    }

    if (bondGain > 0 && team.length > 0) {
      await Promise.all(team.map(g =>
        GhostService.update(g.id, { bond: Math.min(100, g.bond + bondGain) })
      ));
      set(state => ({
        ghosts: state.ghosts.map(g =>
          team.some(t => t.id === g.id) ? { ...g, bond: Math.min(100, g.bond + bondGain) } : g
        ),
        team: state.team.map(g => ({ ...g, bond: Math.min(100, g.bond + bondGain) })),
      }));
    }
  },

  async advanceZoneStep() {
    const { save } = get();
    if (!save) return { zoneCleared: false, newZoneId: null };

    const zoneIdx  = getZoneIndex(save.zone_id);
    const zoneDef  = ZONE_DEFS[zoneIdx];
    const newSteps = save.steps_taken + 1;

    // Boss battle clears the zone
    if (newSteps >= (zoneDef?.steps ?? 5)) {
      const nextZone = ZONE_DEFS[zoneIdx + 1];
      if (nextZone) {
        const updates = {
          zone_id: nextZone.id,
          steps_taken: 0,
          zone_cleared: false,
          chapter: save.chapter + 1,
        };
        await SaveService.checkpoint(save.id, updates);
        set(state => ({ save: state.save ? { ...state.save, ...updates } : null }));
        return { zoneCleared: true, newZoneId: nextZone.id };
      } else {
        // Final zone
        await SaveService.checkpoint(save.id, { zone_cleared: true, steps_taken: newSteps });
        set(state => ({ save: state.save ? { ...state.save, zone_cleared: true, steps_taken: newSteps } : null }));
        return { zoneCleared: true, newZoneId: null };
      }
    }

    await SaveService.checkpoint(save.id, { steps_taken: newSteps });
    set(state => ({ save: state.save ? { ...state.save, steps_taken: newSteps } : null }));
    return { zoneCleared: false, newZoneId: null };
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
