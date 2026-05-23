export type ElementType = 'fire' | 'water' | 'wood' | 'earth' | 'metal' | 'dark' | 'light';
export type ClassType  = 'dps' | 'tank' | 'mage' | 'healer' | 'debuffer' | 'berserker' | 'boss_tank';
export type EvoStage   = 0 | 1 | 2;
export type EndingType = 'good' | 'neutral' | 'bad' | 'true';

export interface SkillDef {
  id: string;
  name: string;
  type: 'physical' | 'magical' | 'heal' | 'buff' | 'debuff';
  power: number;
  gutsCost: number;
  cooldown: number;
  desc: string;
}

export interface GhostDef {
  id: string;
  name: string;
  nameTh: string;
  element: ElementType;
  classType: ClassType;
  emoji: string;
  baseStats: {
    hp: number; str: number; mag: number;
    def: number; spr: number; spd: number;
  };
  skills: SkillDef[];
  lore: string;
}

export interface GhostStats {
  hp: number; str: number; mag: number;
  def: number; spr: number; spd: number;
}

export interface SoulCore {
  element: ElementType;
  classType: ClassType;
  baseStats: GhostStats;
}

export interface Frame {
  enhancement: number;
  base_def: number;
  base_spr: number;
  sockets: (string | null)[];
}

export interface SpiritMass {
  affixes: string[];
  tier_history: string[];
}

export interface SkillTree {
  points_spent: number;
  nodes_taken: string[];
  branches: { offense: number; resource: number; defense: number };
}

export interface Ghost {
  id: string;
  player_id: string;
  ghost_type: string;
  nickname: string;
  evo_stage: EvoStage;
  level: number;
  exp: number;
  bond: number;
  corruption: number;
  stat_points: number;
  stats: GhostStats;
  soul_core: SoulCore;
  frame: Frame;
  spirit_mass: SpiritMass;
  skill_tree: SkillTree;
  amulet_slots: (string | null)[];
  is_in_team: boolean;
  team_slot: number | null;
}

export interface Player {
  id: string;
  user_id: string;
  username: string;
  title: string;
  spirit_dust: number;
  focus_pts: number;
  inventory: { id: string; type: string; qty: number }[];
}

export interface MentorBonds {
  phra: number; chee: number; mo_jeen: number; mo_farang: number;
}

export interface Decision {
  node_id: string;
  choice: string;
  corruption_delta: number;
}

export interface Resources {
  coins: number;
  necro_fluid: number;
}

export interface Save {
  id: string;
  player_id: string;
  chapter: number;
  chapter_step: number;
  corruption_score: number;
  zone_id: string;
  steps_taken: number;
  zone_cleared: boolean;
  mentor_bonds: MentorBonds;
  decisions: Decision[];
  resources: Resources;
  current_ending: EndingType;
  is_active: boolean;
}

export interface GameState {
  player: Player | null;
  ghosts: Ghost[];
  team: Ghost[];
  save: Save | null;
  isLoading: boolean;
  isAuth: boolean;
}
