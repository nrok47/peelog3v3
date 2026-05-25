const BASE = import.meta.env.BASE_URL;

// native frame size in the PNG files
const FRAME_W = 32;
const FRAME_H = 32;

interface SpriteAnim {
  file: string;
  frames: 4 | 6 | 8;
  duration: number;   // seconds
  loop: boolean;
}

interface SpriteConfig {
  idle:   SpriteAnim;
  attack: SpriteAnim;
  hurt:   SpriteAnim;
  death:  SpriteAnim;
}

const CONFIGS: Record<string, SpriteConfig> = {
  pink_monster: {
    idle:   { file: 'Pink_Monster_Idle_4.png',   frames: 4, duration: 0.64, loop: true  },
    attack: { file: 'Pink_Monster_Attack1_4.png', frames: 4, duration: 0.32, loop: false },
    hurt:   { file: 'Pink_Monster_Hurt_4.png',   frames: 4, duration: 0.32, loop: false },
    death:  { file: 'Pink_Monster_Death_8.png',  frames: 8, duration: 0.80, loop: false },
  },
  owlet_monster: {
    idle:   { file: 'Owlet_Monster_Idle_4.png',   frames: 4, duration: 0.64, loop: true  },
    attack: { file: 'Owlet_Monster_Attack1_4.png', frames: 4, duration: 0.32, loop: false },
    hurt:   { file: 'Owlet_Monster_Hurt_4.png',   frames: 4, duration: 0.32, loop: false },
    death:  { file: 'Owlet_Monster_Death_8.png',  frames: 8, duration: 0.80, loop: false },
  },
  dude_monster: {
    idle:   { file: 'Dude_Monster_Idle_4.png',   frames: 4, duration: 0.64, loop: true  },
    attack: { file: 'Dude_Monster_Attack1_4.png', frames: 4, duration: 0.32, loop: false },
    hurt:   { file: 'Dude_Monster_Hurt_4.png',   frames: 4, duration: 0.32, loop: false },
    death:  { file: 'Dude_Monster_Death_8.png',  frames: 8, duration: 0.80, loop: false },
  },
};

// Map ghost_type → sprite key (prototype: 3 sprites cover 12 ghosts)
const GHOST_SPRITE: Record<string, string> = {
  // cute / healer / nature
  kumantong:   'pink_monster',
  nangTani:    'pink_monster',
  motherSpirit:'pink_monster',
  maeNak:      'pink_monster',
  // dark / mage / debuffer
  krasue:      'owlet_monster',
  pret:        'owlet_monster',
  kalakinee:   'owlet_monster',
  // fighters / bosses
  pob:         'dude_monster',
  phiDib:      'dude_monster',
  pisaj:       'dude_monster',
  phiTaiHong:  'dude_monster',
  asurakay:    'dude_monster',
};

export type AnimState = 'idle' | 'attack' | 'hurt' | 'death';

interface Props {
  ghostType: string;
  animState?: AnimState;
  size?: number;       // display px (default 64)
  flip?: boolean;      // true = mirror horizontally (enemies face player)
}

export default function SpriteChar({ ghostType, animState = 'idle', size = 64, flip = false }: Props) {
  const spriteKey = GHOST_SPRITE[ghostType];
  if (!spriteKey) return null;   // no sprite → caller falls back to emoji

  const config = CONFIGS[spriteKey];
  const anim   = config[animState];
  const scale  = size / FRAME_W;

  const animName      = `spriteAnim${anim.frames}`;
  const iterationCount = anim.loop ? 'infinite' : '1';
  const fillMode       = anim.loop ? 'none' : 'forwards';

  return (
    <div style={{
      width:    size,
      height:   size,
      overflow: 'hidden',
      position: 'relative',
      display:  'inline-block',
      transform: flip ? 'scaleX(-1)' : undefined,
      flexShrink: 0,
    }}>
      <div style={{
        position:        'absolute',
        top: 0, left: 0,
        width:           FRAME_W,
        height:          FRAME_H,
        backgroundImage: `url(${BASE}sprites/${anim.file})`,
        backgroundRepeat:'no-repeat',
        backgroundSize:  `${FRAME_W * anim.frames}px ${FRAME_H}px`,
        imageRendering:  'pixelated',
        transformOrigin: 'top left',
        transform:       `scale(${scale})`,
        animation:       `${animName} ${anim.duration}s steps(${anim.frames}) ${iterationCount} ${fillMode}`,
      }} />
    </div>
  );
}

export { GHOST_SPRITE };
