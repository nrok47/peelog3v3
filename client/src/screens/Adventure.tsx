import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { GHOST_REG } from '../data/ghosts';
import { getZoneDef } from '../data/zones';
import Chibi from '../components/Chibi';
import ScreenHeader from '../components/ScreenHeader';
import BottomNav from '../components/BottomNav';

// ─── Types ────────────────────────────────────────────────────────────────────
type AdvPhase = 'idle' | 'walking' | 'boon' | 'boss' | 'clear' | 'defeat';

interface LogLine { text: string; color: string }

interface Session {
  phase:           AdvPhase;
  step:            number;
  maxSteps:        number;
  hpPct:           number;
  dustEarned:      number;
  expEarned:       number;
  bondEarned:      number;
  corruptionGain:  number;
  activeBoons:     string[];
  log:             LogLine[];
}

interface BoonDef { id: string; name: string; icon: string; desc: string }

// ─── Data ─────────────────────────────────────────────────────────────────────
const BASE_TICK_MS = 1700;
const RUN_STEPS = { short: 8, normal: 15, long: 25 } as const;
type RunLength = keyof typeof RUN_STEPS;

const ALL_BOONS: BoonDef[] = [
  { id: 'fire_power',    name: 'ไฟแห่งปอบ',      icon: '🔥', desc: 'ดาเมจธาตุไฟ +20% ในด่านนี้' },
  { id: 'earth_shield',  name: 'โล่ผีดิบ',        icon: '🪨', desc: 'ลดดาเมจที่รับ 15%' },
  { id: 'ghost_speed',   name: 'เงาแห่งกระสือ',   icon: '💨', desc: 'ลด HP ที่สูญเสียจาก Combat ลง 50%' },
  { id: 'blood_regen',   name: 'น้ำตาแม่นาค',     icon: '💧', desc: 'ฟื้น HP +8% ทุก 3 ก้าว' },
  { id: 'crit_yant',     name: 'ยันต์ตาทิพย์',    icon: '✨', desc: 'Combat ชนะ: ได้ฝุ่น 2 เท่า' },
  { id: 'dust_bonus',    name: 'รอยยิ้มกุมาร',    icon: '😊', desc: 'ฝุ่นจาก Loot +60%' },
  { id: 'poison_debuff', name: 'พิษกาลกิณี',      icon: '🌑', desc: 'ชนะ Combat ทุกครั้ง + Corruption ลด 2' },
  { id: 'exp_boost',     name: 'บทเรียนสนาม',      icon: '📚', desc: 'EXP ที่ได้รับ +40%' },
  { id: 'dodge_hazard',  name: 'ตราคุ้มครอง',      icon: '📜', desc: 'หลีกเลี่ยง Hazard ถัดไป 1 ครั้ง' },
  { id: 'bond_warmth',   name: 'ไออุ่นผีน้อย',     icon: '🤝', desc: 'Bond ที่ได้รับจาก Adventure +5' },
];

const COMBAT_TEXTS: Record<string, string[]> = {
  zone_01: ['ปอบเร่ร่อนผุดขึ้น', 'ผีดิบลุกจากดิน', 'กระสือโฉบผ่านมา'],
  zone_02: ['กุมารทองกลับบ้านเก่า', 'นางตานีระบายโกรธ', 'เปรตออกจากวัด'],
  zone_03: ['แม่นาคออกจากบึง', 'กาลกิณีผุดกลางน้ำ', 'ศพน้ำลุกขึ้นสู้'],
  zone_04: ['ผีตายโหงจากป่าช้า', 'ปีศาจเฝ้าหลุมศพ', 'เปรตโบราณตื่น'],
  zone_05: ['อสุรกายลุกฮือ', 'แม่เจ้าของโกรธ', 'ทัพอสุรกายยกมา'],
};
const LOOT_TEXTS   = ['พบหีบศพเก่า', 'เจอของหายในพงหญ้า', 'ขุดเจอยันต์ฝังดิน', 'ผีนำทางหาสมบัติ', 'แสงวิบวับนำทาง'];
const HAZARD_TEXTS = ['เหยียบตะปูโลงศพ', 'ถูกสาปอาถรรพ์', 'ลมเสียงผีโห่', 'กับดักดึงดูดวิญญาณ'];

function pickBoons(n: number, exclude: string[]): BoonDef[] {
  return [...ALL_BOONS].filter(b => !exclude.includes(b.id)).sort(() => Math.random() - 0.5).slice(0, n);
}

// ─── Event roller ─────────────────────────────────────────────────────────────
function rollStep(s: Session, zoneId: string, teamAvgLv: number): {
  delta: Partial<Session>; lines: LogLine[]; boonCards: BoonDef[]
} {
  const r = Math.random();
  const lines: LogLine[] = [];
  let delta: Partial<Session> = {};
  let boonCards: BoonDef[] = [];

  const expMul  = s.activeBoons.includes('exp_boost')   ? 1.4  : 1;
  const dustMul = s.activeBoons.includes('dust_bonus')  ? 1.6  : 1;
  const dmgMul  = s.activeBoons.includes('ghost_speed') ? 0.5  : 1;
  const critDbl = s.activeBoons.includes('crit_yant');

  if (r < 0.40) {
    // ── COMBAT ──────────────────────────────────────────────
    const flavors = COMBAT_TEXTS[zoneId] ?? COMBAT_TEXTS['zone_01'];
    lines.push({ text: `⚔️  ${flavors[Math.floor(Math.random() * flavors.length)]}!`, color: '#fb7185' });
    const enemyLv  = Math.max(1, teamAvgLv + Math.floor(Math.random() * 4) - 2);
    const winChance = Math.min(0.88, Math.max(0.3, teamAvgLv / (enemyLv * 1.1)));
    const won = Math.random() < winChance;
    if (won) {
      const hp2  = Math.floor(Math.random() * 8 * dmgMul);
      let dust2  = Math.floor(enemyLv * 2 * (critDbl ? 2 : 1));
      const exp2 = Math.floor(enemyLv * 13 * expMul);
      const corrBonus = s.activeBoons.includes('poison_debuff') ? -2 : 0;
      const bondBonus = s.activeBoons.includes('bond_warmth') ? 6 : 1;
      lines.push({ text: `  ✅ ชนะ! EXP +${exp2}  ฝุ่น +${dust2}  💞+${bondBonus}  HP -${hp2}%`, color: '#34d399' });
      delta = {
        dustEarned:  s.dustEarned + dust2,
        expEarned:   s.expEarned  + exp2,
        bondEarned:  s.bondEarned + bondBonus,
        hpPct:       Math.max(0, s.hpPct - hp2),
        corruptionGain: s.corruptionGain + corrBonus,
      };
    } else {
      const hp2  = Math.floor((12 + Math.random() * 15) * dmgMul);
      const exp2 = Math.floor(enemyLv * 5 * expMul);
      lines.push({ text: `  ❌ แพ้! HP -${hp2}%  EXP +${exp2}`, color: '#f97316' });
      delta = { expEarned: s.expEarned + exp2, hpPct: Math.max(0, s.hpPct - hp2) };
    }

  } else if (r < 0.70) {
    // ── LOOT ────────────────────────────────────────────────
    const txt  = LOOT_TEXTS[Math.floor(Math.random() * LOOT_TEXTS.length)];
    const dust = Math.floor((8 + Math.random() * teamAvgLv * 3) * dustMul);
    lines.push({ text: `💰 ${txt}`, color: '#fbbf24' });
    lines.push({ text: `   🌀 ฝุ่นวิญญาณ +${dust}`, color: '#fcd34d' });
    delta = { dustEarned: s.dustEarned + dust };

  } else if (r < 0.90) {
    // ── BOON ────────────────────────────────────────────────
    lines.push({ text: '✨ พรศักดิ์สิทธิ์ปรากฏ! หยุดพักเพื่อเลือก...', color: '#a78bfa' });
    boonCards = pickBoons(3, s.activeBoons);
    delta = { phase: 'boon' };

  } else {
    // ── HAZARD ──────────────────────────────────────────────
    if (s.activeBoons.includes('dodge_hazard')) {
      lines.push({ text: '📜 ตราคุ้มครองปัดป้องภัย! รอดปลอดภัย ✓', color: '#94a3b8' });
      delta = { activeBoons: s.activeBoons.filter(b => b !== 'dodge_hazard') };
    } else {
      const txt  = HAZARD_TEXTS[Math.floor(Math.random() * HAZARD_TEXTS.length)];
      const hp2  = Math.floor(8 + Math.random() * 12);
      lines.push({ text: `⚠️  ${txt}! HP -${hp2}%  ☠️ +3`, color: '#f97316' });
      delta = { hpPct: Math.max(0, s.hpPct - hp2), corruptionGain: s.corruptionGain + 3 };
    }
  }

  // Blood regen boon: every 3 steps heal 8%
  if (s.activeBoons.includes('blood_regen') && (s.step + 1) % 3 === 0) {
    const heal = 8;
    const newHp = Math.min(100, (delta.hpPct ?? s.hpPct) + heal);
    lines.push({ text: `💧 น้ำตาแม่นาค ฟื้น HP +${heal}%`, color: '#60a5fa' });
    delta = { ...delta, hpPct: newHp };
  }

  return { delta, lines, boonCards };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Adventure() {
  const { save, team, applyAdventureChoice, addBattleRewards } = useGameStore();
  const zone     = getZoneDef(save?.zone_id ?? 'zone_01');
  const corruption = save?.corruption_score ?? 0;

  const [session,     setSession]     = useState<Session | null>(null);
  const [boonOptions, setBoonOptions] = useState<BoonDef[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [advSpeed,    setAdvSpeed]    = useState<1|2|3>(1);
  const [paused,      setPaused]      = useState(false);
  const [runLength,   setRunLength]   = useState<RunLength>('normal');

  const tickRef    = useRef<number | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const logRef     = useRef<HTMLDivElement>(null);

  // Keep ref in sync for use in setInterval (avoids stale closure)
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [session?.log.length]);

  // Restart interval when speed changes mid-walk
  useEffect(() => {
    if (!session || session.phase !== 'walking' || paused) return;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = window.setInterval(doTick, Math.floor(BASE_TICK_MS / advSpeed));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advSpeed]);

  // Handle pause/resume
  useEffect(() => {
    if (!session || session.phase !== 'walking') return;
    if (paused) {
      if (tickRef.current) clearInterval(tickRef.current);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = window.setInterval(doTick, Math.floor(BASE_TICK_MS / advSpeed));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // Cleanup on unmount
  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current); }, []);

  const teamAvgLv = team.length > 0
    ? Math.round(team.reduce((s, g) => s + g.level, 0) / team.length)
    : 1;

  const doTick = useCallback(() => {
    const s = sessionRef.current;
    if (!s || s.phase !== 'walking') return;

    const { delta, lines, boonCards } = rollStep(s, zone.id, teamAvgLv);
    const newStep  = s.step + 1;
    const newLog   = [...s.log, ...lines].slice(-30);

    // Determine next phase
    let nextPhase: AdvPhase = (delta.phase as AdvPhase) ?? 'walking';
    if (nextPhase === 'walking' && newStep >= s.maxSteps) nextPhase = 'boss';

    const newHp = delta.hpPct ?? s.hpPct;
    if (newHp <= 0) nextPhase = 'defeat';

    const next: Session = {
      ...s, ...delta,
      step:  newStep,
      phase: nextPhase,
      hpPct: newHp,
      log:   nextPhase === 'defeat'
        ? [...newLog, { text: '💀 HP หมด! การผจญภัยสิ้นสุดลง...', color: '#fb7185' }]
        : nextPhase === 'boss'
          ? [...newLog, { text: `👑 เดินทางมาถึงบอสประจำโซน — ${zone.name}!`, color: '#ff4757' }]
          : newLog,
    };

    setSession(next);
    if (boonCards.length > 0) setBoonOptions(boonCards);
    if (nextPhase !== 'walking') clearInterval(tickRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone.id, teamAvgLv]);

  function startAdventure() {
    if (tickRef.current) clearInterval(tickRef.current);
    setPaused(false);
    const steps = RUN_STEPS[runLength];
    const init: Session = {
      phase: 'walking', step: 0, maxSteps: steps,
      hpPct: 100, dustEarned: 0, expEarned: 0, bondEarned: 0, corruptionGain: 0,
      activeBoons: [],
      log: [{ text: `🗺️  ออกเดินทางสู่ ${zone.name}... (${steps} ก้าว)`, color: '#7dd3fc' }],
    };
    setSession(init);
    tickRef.current = window.setInterval(doTick, Math.floor(BASE_TICK_MS / advSpeed));
  }

  function chooseBoon(boon: BoonDef) {
    setSession(prev => {
      if (!prev) return prev;
      const bondBonus = boon.id === 'bond_warmth' ? 5 : 0;
      const next: Session = {
        ...prev,
        phase: 'walking',
        activeBoons: [...prev.activeBoons, boon.id],
        bondEarned: prev.bondEarned + bondBonus,
        log: [...prev.log, { text: `✨ เลือก: ${boon.icon} ${boon.name} — ${boon.desc}`, color: '#c4b5fd' }],
      };
      // Resume from next step if still have steps left
      if (next.step >= next.maxSteps) return { ...next, phase: 'boss' };
      return next;
    });
    setBoonOptions([]);
    tickRef.current = window.setInterval(doTick, Math.floor(BASE_TICK_MS / advSpeed));
  }

  function fightBoss() {
    const bossLv      = zone.bossLevel;
    const winChance   = Math.min(0.85, Math.max(0.25, teamAvgLv / (bossLv * 1.4)));
    const won         = Math.random() < winChance;
    const dustReward  = Math.floor(bossLv * 8);
    const expReward   = Math.floor(bossLv * 30);
    const bondReward  = 5;
    const s = sessionRef.current;
    if (!s) return;

    const bossLines: LogLine[] = [
      { text: `⚔️  บอส: ${zone.bossTypes.map(t => GHOST_REG[t]?.nameTh ?? t).join(', ')} Lv.${bossLv}`, color: '#fb7185' },
    ];

    if (won) {
      bossLines.push({ text: `🏆 ชนะบอส!  ฝุ่น +${dustReward}  EXP +${expReward}  Bond +${bondReward}`, color: '#34d399' });
      setSession({
        ...s,
        phase: 'clear',
        dustEarned: s.dustEarned + dustReward,
        expEarned:  s.expEarned  + expReward,
        bondEarned: s.bondEarned + bondReward,
        log: [...s.log, ...bossLines],
      });
    } else {
      bossLines.push({ text: `💀 แพ้บอส... ได้รางวัลระหว่างทาง 50%`, color: '#f97316' });
      setSession({
        ...s,
        phase: 'defeat',
        dustEarned: Math.floor(s.dustEarned * 0.5),
        expEarned:  Math.floor(s.expEarned  * 0.5),
        bondEarned: Math.floor(s.bondEarned * 0.5),
        log: [...s.log, ...bossLines],
      });
    }
  }

  async function collectRewards() {
    const s = session;
    if (!s || saving) return;
    setSaving(true);
    try {
      // Apply dust + corruption + bond via existing action
      await applyAdventureChoice(
        'adv_run', s.phase,
        s.corruptionGain, s.dustEarned, s.bondEarned,
      );
      // Apply EXP to team ghosts via battle rewards pattern
      if (s.expEarned > 0 && team.length > 0) {
        await addBattleRewards(team.map(g => g.id), Math.max(1, Math.floor(s.expEarned / 15)));
      }
    } finally {
      setSaving(false);
      setSession(null);
    }
  }

  // ── RENDER HELPERS ──────────────────────────────────────────────────────────
  function LogBox() {
    return (
      <div style={{
        background: 'rgba(2, 8, 20, 0.96)',
        border: '1px solid rgba(38,222,129,0.2)',
        borderRadius: 'var(--r-lg)',
        padding: '10px 12px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        maxHeight: 200,
        overflowY: 'auto',
        lineHeight: 1.7,
      }} ref={logRef}>
        {(session?.log ?? []).map((line, i) => (
          <div key={i} style={{ color: line.color }}>{line.text}</div>
        ))}
        {session?.phase === 'walking' && (
          <div style={{ color: '#475569' }} className="pulse">█</div>
        )}
      </div>
    );
  }

  function StatusBar() {
    const s = session!;
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        {/* HP */}
        <div style={{ flex: 2, background: 'var(--bg-card)', borderRadius: 'var(--r-md)', padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>HP ทีม</div>
          <div className="bar-track">
            <div className={`bar-fill ${s.hpPct < 30 ? 'bar-hp-low' : 'bar-hp'}`}
              style={{ width: `${s.hpPct}%`, transition: 'width 0.4s' }} />
          </div>
          <div style={{ fontSize: 11, color: s.hpPct < 30 ? 'var(--red)' : 'var(--text-muted)', marginTop: 3 }}>
            {Math.floor(s.hpPct)}%
          </div>
        </div>
        {/* Resources collected */}
        <div style={{ flex: 3, background: 'var(--bg-card)', borderRadius: 'var(--r-md)', padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>สะสมระหว่างทาง</div>
          <div style={{ display: 'flex', gap: 10, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
            <span style={{ color: 'var(--gold)' }}>🌀{s.dustEarned}</span>
            <span style={{ color: 'var(--green)' }}>⚡{s.expEarned}</span>
            <span style={{ color: '#a78bfa' }}>💞{s.bondEarned}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── IDLE ────────────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="screen fade-in">
        <ScreenHeader title="📜 ผจญภัย" />
        <div className="screen-content">
          {/* Corruption */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>☠️ Corruption</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: corruption >= 70 ? 'var(--red)' : corruption >= 40 ? 'var(--orange)' : 'var(--green)' }}>
                {corruption}%
              </span>
            </div>
            <div className="bar-track">
              <div className="bar-fill bar-corruption" style={{ width: `${corruption}%` }} />
            </div>
          </div>

          {/* Zone info */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(165,94,234,0.1), var(--bg-card))',
            border: '1px solid rgba(165,94,234,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 36 }}>{zone.icon}</span>
              <div>
                <div style={{ fontFamily: 'Bai Jamjuree, sans-serif', fontSize: 17, fontWeight: 700 }}>
                  {zone.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{zone.desc}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              <span>🚶 {RUN_STEPS[runLength]} ก้าว</span>
              <span>⚔️ ศัตรู Lv.{zone.levelRange[0]}-{zone.levelRange[1]}</span>
              <span>👑 บอส Lv.{zone.bossLevel}</span>
            </div>
            {/* Event type breakdown */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {[
                { label: '⚔️ Combat', pct: '40%', color: '#fb7185' },
                { label: '💰 Loot',   pct: '30%', color: '#fbbf24' },
                { label: '✨ Boon',   pct: '20%', color: '#a78bfa' },
                { label: '⚠️ Hazard', pct: '10%', color: '#f97316' },
              ].map(e => (
                <span key={e.label} style={{
                  padding: '3px 8px', borderRadius: 20, fontSize: 11,
                  background: 'rgba(255,255,255,0.05)',
                  color: e.color, fontWeight: 700,
                }}>
                  {e.label} {e.pct}
                </span>
              ))}
            </div>

            {/* Difficulty indicator */}
            {team.length > 0 && (() => {
              const diff = teamAvgLv - zone.bossLevel;
              const label = diff >= 5 ? { text: 'ง่าย', color: '#34d399' }
                : diff >= -2 ? { text: 'ท้าทาย', color: '#fbbf24' }
                : { text: 'ยากมาก', color: '#fb7185' };
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>ระดับความยาก:</span>
                  <span style={{ color: label.color, fontWeight: 700 }}>{label.text}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    (ทีม Lv.{teamAvgLv} vs บอส Lv.{zone.bossLevel})
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Run length selector */}
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>ระยะการผจญภัย</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { key: 'short',  label: 'สั้น',  steps: 8,  note: 'เร็ว ความเสี่ยงน้อย' },
                { key: 'normal', label: 'ปกติ',  steps: 15, note: 'สมดุล' },
                { key: 'long',   label: 'ยาว',   steps: 25, note: 'รางวัลมาก ความเสี่ยงสูง' },
              ] as const).map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setRunLength(opt.key)}
                  style={{
                    flex: 1,
                    padding: '10px 6px',
                    borderRadius: 'var(--r-md)',
                    border: runLength === opt.key
                      ? '1.5px solid rgba(165,94,234,0.7)'
                      : '1px solid rgba(255,255,255,0.08)',
                    background: runLength === opt.key
                      ? 'rgba(165,94,234,0.15)'
                      : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: runLength === opt.key ? '#c4b5fd' : 'var(--text-main)' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{opt.steps} ก้าว</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{opt.note}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Team preview */}
          {team.length > 0 && (
            <div>
              <div className="section-hd"><span className="section-title">⚔️ ทีมที่จะออกเดินทาง</span></div>
              <div style={{ display: 'flex', gap: 8 }}>
                {team.map(g => {
                  const def = GHOST_REG[g.ghost_type];
                  if (!def) return null;
                  return (
                    <div key={g.id} style={{
                      flex: 1, background: 'var(--bg-card)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 'var(--r-lg)', padding: '10px 8px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                      <Chibi emoji={def.emoji} element={def.element} size={44} evoStage={g.evo_stage} />
                      <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center' }}>{g.nickname || def.nameTh}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Lv.{g.level}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {team.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,71,87,0.07)', border: '1px solid rgba(255,71,87,0.2)' }}>
              <div style={{ fontSize: 13, color: 'var(--red)' }}>⚠️ ต้องมีผีในทีมก่อนออกผจญภัย</div>
            </div>
          )}

          <button
            type="button"
            className="btn btn-full btn-lg"
            disabled={team.length === 0}
            onClick={startAdventure}
            style={{
              background: team.length === 0 ? 'rgba(165,94,234,0.2)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
              border: 'none', color: '#fff', opacity: team.length === 0 ? 0.5 : 1,
            }}
          >
            🗺️ ออกพเนจร!
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── BOON SELECTION ──────────────────────────────────────────────────────────
  if (session.phase === 'boon') {
    return (
      <div className="screen fade-in">
        <ScreenHeader title="✨ เลือกพรศักดิ์สิทธิ์" />
        <div className="screen-content">
          <LogBox />
          <StatusBar />
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.05))',
            border: '1.5px solid rgba(168,85,247,0.4)',
            borderRadius: 'var(--r-lg)', padding: '14px',
            textAlign: 'center', animation: 'popIn 0.3s ease-out',
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>✨</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#c4b5fd', fontFamily: 'Bai Jamjuree, sans-serif' }}>
              พรศักดิ์สิทธิ์ปรากฏ!
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>เลือก 1 ใน 3 เพื่อเสริมพลังตลอดการผจญภัย</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {boonOptions.map(boon => (
              <button
                key={boon.id}
                type="button"
                onClick={() => chooseBoon(boon)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1.5px solid rgba(167,139,250,0.3)',
                  borderRadius: 'var(--r-lg)',
                  padding: '14px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 28 }}>{boon.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#c4b5fd', fontFamily: 'Bai Jamjuree, sans-serif' }}>
                    {boon.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{boon.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── BOSS ────────────────────────────────────────────────────────────────────
  if (session.phase === 'boss') {
    return (
      <div className="screen fade-in">
        <ScreenHeader title="👑 บอสประจำโซน" />
        <div className="screen-content">
          <LogBox />
          <StatusBar />
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,71,87,0.15), rgba(255,71,87,0.05))',
            border: '2px solid rgba(255,71,87,0.5)',
            borderRadius: 'var(--r-lg)', padding: '18px',
            textAlign: 'center', animation: 'popIn 0.3s ease-out',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{zone.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--red)', fontFamily: 'Bai Jamjuree, sans-serif', marginBottom: 4 }}>
              บอส: {zone.bossTypes.map(t => GHOST_REG[t]?.nameTh ?? t).join(' + ')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Lv.{zone.bossLevel} — {zone.bossTypes.length} ตัว
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              {zone.bossTypes.map(t => {
                const def = GHOST_REG[t];
                if (!def) return null;
                return <Chibi key={t} emoji={def.emoji} element={def.element} size={52} />;
              })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              รางวัลชนะ: 🌀 +{Math.floor(zone.bossLevel * 8)}  ⚡ +{Math.floor(zone.bossLevel * 30)}  💞 +5
            </div>
            {session.activeBoons.length > 0 && (
              <div style={{ fontSize: 11, color: '#a78bfa', marginBottom: 14 }}>
                พรที่ใช้งาน: {session.activeBoons.map(id => ALL_BOONS.find(b => b.id === id)?.icon ?? '').join(' ')}
              </div>
            )}
          </div>
          <button type="button" className="btn btn-red btn-full btn-lg" onClick={fightBoss}>
            ⚔️ เผชิญหน้าบอส!
          </button>
        </div>
      </div>
    );
  }

  // ── CLEAR / DEFEAT ──────────────────────────────────────────────────────────
  if (session.phase === 'clear' || session.phase === 'defeat') {
    const won = session.phase === 'clear';
    return (
      <div className="screen fade-in">
        <ScreenHeader title={won ? '🏆 ผจญภัยสำเร็จ!' : '💀 ล้มเหลว...'} />
        <div className="screen-content">
          <LogBox />
          <div style={{
            background: won
              ? 'linear-gradient(135deg, rgba(38,222,129,0.15), rgba(38,222,129,0.03))'
              : 'linear-gradient(135deg, rgba(255,71,87,0.12), rgba(255,71,87,0.03))',
            border: `1.5px solid ${won ? 'rgba(38,222,129,0.4)' : 'rgba(255,71,87,0.4)'}`,
            borderRadius: 'var(--r-lg)', padding: '18px', animation: 'popIn 0.4s ease-out',
          }}>
            <div style={{ textAlign: 'center', fontSize: 28, marginBottom: 8 }}>{won ? '🏆' : '💀'}</div>
            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 16, color: won ? 'var(--green)' : 'var(--red)', fontFamily: 'Bai Jamjuree, sans-serif', marginBottom: 16 }}>
              {won ? 'โซนผ่านแล้ว!' : 'กลับด้วยมือเปล่า...'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '🌀', label: 'ฝุ่นวิญญาณ',  val: `+${session.dustEarned}`,     color: 'var(--gold)' },
                { icon: '⚡', label: 'EXP ทีม',       val: `+${session.expEarned}`,      color: 'var(--green)' },
                { icon: '💞', label: 'Bond ทีม',       val: `+${session.bondEarned}`,     color: '#a78bfa' },
                { icon: '☠️', label: 'Corruption',     val: `+${session.corruptionGain}`, color: session.corruptionGain > 0 ? 'var(--red)' : 'var(--green)' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.icon} {r.label}</span>
                  <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: r.color }}>{r.val}</span>
                </div>
              ))}
            </div>
            {session.activeBoons.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                พรที่ใช้ไป: {session.activeBoons.map(id => {
                  const b = ALL_BOONS.find(x => x.id === id);
                  return b ? `${b.icon}${b.name}` : '';
                }).join('  ')}
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-gold btn-full btn-lg"
            disabled={saving}
            onClick={collectRewards}
          >
            {saving ? '⏳ กำลังบันทึก...' : `${won ? '🎉 รับรางวัลและกลับฐาน' : '↩️ กลับฐาน'}`}
          </button>
        </div>
      </div>
    );
  }

  // ── WALKING ─────────────────────────────────────────────────────────────────
  return (
    <div className="screen fade-in">
      <ScreenHeader title={`🗺️ ${zone.name}`} />
      <div className="screen-content">
        {/* Step progress */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)' }}>ก้าวที่ {session.step}/{session.maxSteps}</span>
            <span style={{ color: session.step >= session.maxSteps - 2 ? 'var(--red)' : 'var(--gold)', fontWeight: 700 }}>
              {session.step >= session.maxSteps - 1 ? '👑 บอสรออยู่!' : `${session.maxSteps - session.step} ก้าวถึงบอส`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: session.maxSteps }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 7, borderRadius: 4,
                background: i < session.step
                  ? 'var(--green)'
                  : i === session.step
                    ? 'rgba(245,197,24,0.7)'
                    : 'rgba(255,255,255,0.07)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>

        <StatusBar />

        {/* Active boons */}
        {session.activeBoons.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {session.activeBoons.map(id => {
              const b = ALL_BOONS.find(x => x.id === id);
              if (!b) return null;
              return (
                <span key={id} style={{
                  padding: '3px 8px', borderRadius: 20, fontSize: 11,
                  background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', fontWeight: 700,
                }}>
                  {b.icon} {b.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Speed + Pause controls */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {([1, 2, 3] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setAdvSpeed(s)}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--r-md)',
                border: advSpeed === s ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                background: advSpeed === s ? 'rgba(245,197,24,0.15)' : 'rgba(255,255,255,0.04)',
                color: advSpeed === s ? 'var(--gold)' : 'var(--text-muted)',
                fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              x{s}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPaused(p => !p)}
            style={{
              marginLeft: 'auto',
              padding: '5px 14px',
              borderRadius: 'var(--r-md)',
              border: '1px solid rgba(255,255,255,0.1)',
              background: paused ? 'rgba(245,197,24,0.12)' : 'rgba(255,255,255,0.04)',
              color: paused ? 'var(--gold)' : 'var(--text-muted)',
              fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {paused ? '▶️ ดำเนินต่อ' : '⏸ หยุด'}
          </button>
        </div>

        {/* Terminal log */}
        <LogBox />

        {/* Retreat button */}
        <button
          type="button"
          onClick={() => {
            clearInterval(tickRef.current!);
            setSession(prev => prev ? {
              ...prev,
              phase: 'defeat',
              dustEarned:  Math.floor(prev.dustEarned  * 0.5),
              expEarned:   Math.floor(prev.expEarned   * 0.5),
              bondEarned:  Math.floor(prev.bondEarned  * 0.5),
              log: [...prev.log, { text: '🏳️ ถอยทัพ... ได้รับรางวัล 50%', color: '#94a3b8' }],
            } : prev);
          }}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--r-md)',
            color: 'var(--text-muted)',
            padding: '8px',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
            width: '100%',
          }}
        >
          🏳️ ถอยทัพ (ได้รางวัล 50%)
        </button>
      </div>
    </div>
  );
}
