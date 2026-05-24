import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { GHOST_REG } from '../data/ghosts';
import Chibi from '../components/Chibi';
import ScreenHeader from '../components/ScreenHeader';
import type { Ghost, GhostStats } from '../types';

interface Combatant {
  ghost: Ghost;
  currentHp: number;
  maxHp: number;
  atb: number;
  guts: number;
  isPlayer: boolean;
  alive: boolean;
  boostedStats: GhostStats;
  gutsMultiplier: number;
  regenPct: number;
}

interface LogEntry { text: string; type: 'hit' | 'skill' | 'heal' | 'info' }

// Skill tree → stat bonuses applied before battle
const SKILL_STAT_BONUSES: Record<string, Partial<GhostStats>> = {
  atk1: { str: 5  },
  atk2: { str: 10 },
  mag1: { mag: 5  },
  def1: { def: 5  },
  def2: { def: 10 },
  hp1:  { hp: 100 },
  spd1: { spd: 5  },
};

function getSkillBonuses(ghost: Ghost) {
  const nodes = ghost.skill_tree?.nodes_taken ?? [];
  const s = { hp: 0, str: 0, mag: 0, def: 0, spr: 0, spd: 0 };
  for (const id of nodes) {
    const b = SKILL_STAT_BONUSES[id];
    if (!b) continue;
    if (b.hp)  s.hp  += b.hp;
    if (b.str) s.str += b.str;
    if (b.mag) s.mag += b.mag;
    if (b.def) s.def += b.def;
    if (b.spr) s.spr += b.spr;
    if (b.spd) s.spd += b.spd;
  }
  return {
    statBonus:       s,
    gutsMultiplier:  1 + (nodes.includes('guts1') ? 0.15 : 0) + (nodes.includes('guts2') ? 0.15 : 0),
    atbStart:        nodes.includes('rush') ? 30 : 0,
    regenPct:        nodes.includes('regen') ? 0.02 : 0,
  };
}

function makeCombatant(ghost: Ghost, isPlayer: boolean): Combatant {
  const def  = GHOST_REG[ghost.ghost_type];
  const base = ghost.stats ?? def?.baseStats ?? { hp: 1000, str: 30, mag: 20, def: 20, spr: 20, spd: 20 };
  const { statBonus, gutsMultiplier, atbStart, regenPct } = isPlayer
    ? getSkillBonuses(ghost)
    : { statBonus: { hp: 0, str: 0, mag: 0, def: 0, spr: 0, spd: 0 }, gutsMultiplier: 1, atbStart: 0, regenPct: 0 };

  const boostedStats: GhostStats = {
    hp:  base.hp  + statBonus.hp,
    str: base.str + statBonus.str,
    mag: base.mag + statBonus.mag,
    def: base.def + statBonus.def,
    spr: base.spr + statBonus.spr,
    spd: base.spd + statBonus.spd,
  };
  return {
    ghost, currentHp: boostedStats.hp, maxHp: boostedStats.hp,
    atb: atbStart, guts: 0, isPlayer, alive: true,
    boostedStats, gutsMultiplier, regenPct,
  };
}

const DUMMY_ENEMIES: Ghost[] = [
  { id: 'e1', ghost_type: 'krasue',     level: 5, stats: { hp: 900,  str: 15, mag: 50, def: 18, spr: 42, spd: 38 } } as Ghost,
  { id: 'e2', ghost_type: 'phiTaiHong', level: 4, stats: { hp: 1400, str: 52, mag: 15, def: 22, spr: 15, spd: 26 } } as Ghost,
  { id: 'e3', ghost_type: 'pisaj',      level: 5, stats: { hp: 1300, str: 45, mag: 36, def: 28, spr: 25, spd: 30 } } as Ghost,
];

const AVG_ENEMY_LV = Math.round(DUMMY_ENEMIES.reduce((s, g) => s + g.level, 0) / DUMMY_ENEMIES.length);

export default function Battle() {
  const { ghosts, addBattleRewards } = useGameStore();
  const [phase, setPhase]             = useState<'select' | 'battle' | 'end'>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [winner, setWinner]           = useState<'player' | 'ai' | null>(null);
  const [log, setLog]                 = useState<LogEntry[]>([]);
  const [combatants, setCombatants]   = useState<Combatant[]>([]);
  const [battleRewards, setBattleRewards] = useState<{ expGained: number; levelUps: string[]; dustGained: number } | null>(null);
  const tickRef        = useRef<number | null>(null);
  const logRef         = useRef<HTMLDivElement>(null);
  const rewardDoneRef  = useRef(false);

  const playerTeam = ghosts.filter(g => selectedIds.includes(g.id));
  const enemyTeam  = DUMMY_ENEMIES;

  function toggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  }

  function startBattle() {
    if (playerTeam.length < 1) return;
    rewardDoneRef.current = false;
    setBattleRewards(null);
    const initial: Combatant[] = [
      ...playerTeam.slice(0, 3).map(g => makeCombatant(g, true)),
      ...enemyTeam.map(g => makeCombatant(g, false)),
    ];
    setCombatants(initial);
    setLog([{ text: '⚔️ การต่อสู้เริ่มต้นแล้ว!', type: 'info' }]);
    setPhase('battle');
    setWinner(null);
  }

  // Reward trigger — fires once when player wins
  useEffect(() => {
    if (winner !== 'player' || rewardDoneRef.current) return;
    rewardDoneRef.current = true;
    addBattleRewards(selectedIds, AVG_ENEMY_LV).then(r => { if (r) setBattleRewards(r); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner]);

  // ATB battle tick
  useEffect(() => {
    if (phase !== 'battle') return;

    tickRef.current = window.setInterval(() => {
      setCombatants(prev => {
        const next = prev.map(c => {
          if (!c.alive) return c;
          const spd = c.boostedStats.spd;
          const regenHp = c.regenPct > 0 ? Math.floor(c.maxHp * c.regenPct) : 0;
          return {
            ...c,
            atb:       Math.min(100, c.atb + spd / 30),
            guts:      Math.min(100, c.guts + spd * 0.02 * c.gutsMultiplier),
            currentHp: regenHp > 0 ? Math.min(c.maxHp, c.currentHp + regenHp) : c.currentHp,
          };
        });

        const actor = next.find(c => c.alive && c.atb >= 100);
        if (!actor) return next;

        const enemies = next.filter(c => c.alive && c.isPlayer !== actor.isPlayer);
        if (enemies.length === 0) return next;

        const target = enemies[Math.floor(Math.random() * enemies.length)];
        const dmg    = Math.max(1, Math.floor(
          actor.boostedStats.str * 0.8
          + Math.random() * 20
          - target.boostedStats.def * 0.4
        ));

        setLog(l => [...l.slice(-30), {
          text: `${GHOST_REG[actor.ghost.ghost_type]?.nameTh} โจมตี ${GHOST_REG[target.ghost.ghost_type]?.nameTh} (-${dmg} HP)`,
          type: 'hit',
        }]);

        const result = next.map(c => {
          if (c.ghost.id === actor.ghost.id) return { ...c, atb: 0 };
          if (c.ghost.id === target.ghost.id) {
            const newHp = Math.max(0, c.currentHp - dmg);
            return { ...c, currentHp: newHp, alive: newHp > 0 };
          }
          return c;
        });

        const pAlive = result.filter(c =>  c.isPlayer && c.alive).length;
        const eAlive = result.filter(c => !c.isPlayer && c.alive).length;
        if (pAlive === 0 || eAlive === 0) {
          clearInterval(tickRef.current!);
          const w = pAlive > 0 ? 'player' : 'ai';
          setPhase('end');
          setWinner(w);
          setLog(l => [...l, { text: w === 'player' ? '🏆 ชนะการต่อสู้!' : '💀 พ่ายแพ้...', type: 'info' }]);
        }

        return result;
      });
    }, 100);

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [phase]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const playerSide = combatants.filter(c =>  c.isPlayer);
  const enemySide  = combatants.filter(c => !c.isPlayer);

  // ── TEAM SELECT PHASE ──────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="screen fade-in">
        <ScreenHeader title="⚔️ เลือกทีม" back="/home" />
        <div className="screen-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>เลือกผี 3 ตัวเพื่อสู้</span>
            <span style={{ fontWeight: 700, color: selectedIds.length === 3 ? 'var(--gold)' : 'var(--text-muted)' }}>
              {selectedIds.length}/3
            </span>
          </div>

          {ghosts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>😶</div>
              <div className="text-muted">ยังไม่มีวิญญาณ — ไปเชิญผีก่อน</div>
            </div>
          ) : (
            <div className="grid-2" style={{ marginBottom: 16 }}>
              {ghosts.map(ghost => {
                const def = GHOST_REG[ghost.ghost_type];
                if (!def) return null;
                const isSelected = selectedIds.includes(ghost.id);
                const rank = isSelected ? selectedIds.indexOf(ghost.id) + 1 : null;
                return (
                  <div
                    key={ghost.id}
                    onClick={() => toggleSelect(ghost.id)}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(245,197,24,0.15), rgba(245,197,24,0.05))'
                        : 'var(--bg-card)',
                      border: isSelected ? '2px solid rgba(245,197,24,0.6)' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 'var(--r-lg)',
                      padding: '10px 8px',
                      cursor: !isSelected && selectedIds.length >= 3 ? 'not-allowed' : 'pointer',
                      opacity: !isSelected && selectedIds.length >= 3 ? 0.4 : 1,
                      display: 'flex', alignItems: 'center', gap: 10,
                      position: 'relative', transition: 'all 0.15s',
                    }}
                  >
                    {rank && (
                      <div style={{
                        position: 'absolute', top: 6, right: 8,
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'var(--gold)', color: '#000',
                        fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{rank}</div>
                    )}
                    <Chibi emoji={def.emoji} element={def.element} size={44} evoStage={ghost.evo_stage} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ghost.nickname || def.nameTh}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        Lv.{ghost.level} · {def.classType.toUpperCase()} · {ghost.stat_points > 0 && (
                          <span style={{ color: 'var(--gold)' }}>{ghost.stat_points}pt</span>
                        )}
                      </div>
                      <div className="bar-track thin" style={{ marginTop: 4 }}>
                        <div className="bar-fill bar-hp" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            className="btn btn-red btn-full btn-lg"
            disabled={selectedIds.length < 1}
            onClick={startBattle}
            style={{ opacity: selectedIds.length < 1 ? 0.5 : 1 }}
          >
            {selectedIds.length < 1 ? 'เลือกผีอย่างน้อย 1 ตัว' : `⚔️ เริ่มต่อสู้! (${selectedIds.length} ตัว)`}
          </button>
        </div>
      </div>
    );
  }

  // ── BATTLE / END PHASE ─────────────────────────────────────────
  return (
    <div className="screen fade-in" style={{ paddingBottom: 0 }}>
      <ScreenHeader title="⚔️ Battle" back="/home" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 12px', gap: 8, minHeight: 0 }}>
        {/* Enemy team */}
        <div>
          <div className="label-sm" style={{ marginBottom: 6, color: 'var(--red)' }}>💀 ฝ่ายศัตรู</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {enemySide.map(com => {
              const def = GHOST_REG[com.ghost.ghost_type];
              if (!def) return null;
              return (
                <div key={com.ghost.id} style={{
                  flex: 1, background: !com.alive ? 'rgba(255,255,255,0.03)' : 'var(--bg-card)',
                  border: '1px solid rgba(255,71,87,0.2)', borderRadius: 'var(--r-lg)',
                  padding: '8px 6px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 5, opacity: !com.alive ? 0.35 : 1, transition: 'opacity 0.3s',
                }}>
                  <Chibi emoji={def.emoji} element={def.element} size={42} />
                  <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center' }}>{def.nameTh}</div>
                  <div className="bar-track thin" style={{ width: '100%' }}>
                    <div className="bar-fill bar-hp" style={{ width: `${(com.currentHp / com.maxHp) * 100}%` }} />
                  </div>
                  <div className="bar-track thin" style={{ width: '100%' }}>
                    <div className="bar-fill bar-atb" style={{ width: `${com.atb}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Battle log */}
        <div style={{
          flex: 1, background: 'var(--bg-card)', borderRadius: 'var(--r-lg)',
          border: '1px solid rgba(255,255,255,0.07)', padding: '10px',
          display: 'flex', flexDirection: 'column', minHeight: 80, maxHeight: 140, overflow: 'hidden',
        }}>
          <div ref={logRef} style={{ overflowY: 'auto', flex: 1 }}>
            {log.map((entry, i) => (
              <div key={i} style={{
                fontSize: 11, marginBottom: 2,
                color: entry.type === 'info' ? 'var(--gold)' : entry.type === 'heal' ? 'var(--green)' : 'var(--text-light)',
                fontFamily: entry.type === 'info' ? 'Bai Jamjuree, sans-serif' : 'inherit',
                fontWeight: entry.type === 'info' ? 700 : 400,
              }}>
                {entry.text}
              </div>
            ))}
          </div>
        </div>

        {/* Player team */}
        <div>
          <div className="label-sm" style={{ marginBottom: 6, color: 'var(--green)' }}>⚔️ ทีมของคุณ</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {playerSide.map(com => {
              const def = GHOST_REG[com.ghost.ghost_type];
              if (!def) return null;
              return (
                <div key={com.ghost.id} style={{
                  flex: 1,
                  background: !com.alive ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, rgba(38,222,129,0.08), var(--bg-card))',
                  border: '1px solid rgba(38,222,129,0.2)', borderRadius: 'var(--r-lg)',
                  padding: '8px 6px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 5, opacity: !com.alive ? 0.35 : 1, transition: 'opacity 0.3s',
                }}>
                  <Chibi emoji={def.emoji} element={def.element} size={42} evoStage={com.ghost.evo_stage} />
                  <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center' }}>{com.ghost.nickname || def.nameTh}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {com.currentHp}/{com.maxHp}
                  </div>
                  <div className="bar-track thin" style={{ width: '100%' }}>
                    <div className={`bar-fill ${(com.currentHp / com.maxHp) < 0.3 ? 'bar-hp-low' : 'bar-hp'}`}
                      style={{ width: `${(com.currentHp / com.maxHp) * 100}%` }} />
                  </div>
                  <div className="bar-track thin" style={{ width: '100%' }}>
                    <div className="bar-fill bar-atb" style={{ width: `${com.atb}%` }} />
                  </div>
                  <div className="bar-track thin" style={{ width: '100%' }}>
                    <div className="bar-fill bar-guts" style={{ width: `${com.guts}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action / end */}
        <div style={{ paddingBottom: 12 }}>
          {phase === 'battle' && (
            <div style={{
              textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
              padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--r-lg)',
            }}>
              <span className="pulse">⏳ กำลังต่อสู้ (Auto ATB)...</span>
            </div>
          )}

          {phase === 'end' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Win/lose banner */}
              <div style={{
                textAlign: 'center', padding: '14px',
                background: winner === 'player'
                  ? 'linear-gradient(135deg, rgba(38,222,129,0.15), rgba(38,222,129,0.05))'
                  : 'linear-gradient(135deg, rgba(255,71,87,0.15), rgba(255,71,87,0.05))',
                border: `1.5px solid ${winner === 'player' ? 'rgba(38,222,129,0.4)' : 'rgba(255,71,87,0.4)'}`,
                borderRadius: 'var(--r-lg)', fontSize: 20, fontWeight: 700,
                fontFamily: 'Bai Jamjuree, sans-serif',
              }}>
                {winner === 'player' ? '🏆 ชนะแล้ว!' : '💀 พ่ายแพ้...'}
              </div>

              {/* Rewards box */}
              {winner === 'player' && battleRewards && (
                <div style={{
                  background: 'rgba(245,197,24,0.07)',
                  border: '1px solid rgba(245,197,24,0.25)',
                  borderRadius: 'var(--r-lg)', padding: '12px 14px',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 2 }}>
                    ✨ รางวัลการต่อสู้
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)', display: 'flex', gap: 16 }}>
                    <span>⚡ EXP +{battleRewards.expGained} ต่อตัว</span>
                    <span>🌀 +{battleRewards.dustGained} ฝุ่น</span>
                    <span>💞 Bond +2</span>
                  </div>
                  {battleRewards.levelUps.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      {battleRewards.levelUps.map((ghostType, i) => (
                        <div key={i} style={{
                          fontSize: 12, fontWeight: 700, color: 'var(--gold)',
                          animation: 'popIn 0.4s ease-out',
                        }}>
                          🎉 {GHOST_REG[ghostType]?.nameTh ?? ghostType} เลเวลอัพ! (+3 Skill Points)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {winner === 'player' && !battleRewards && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>กำลังบันทึกรางวัล...</div>
              )}

              <button type="button" className="btn btn-gold btn-full"
                onClick={() => { setPhase('select'); setSelectedIds([]); setCombatants([]); setLog([]); setWinner(null); setBattleRewards(null); }}>
                🔄 เลือกทีมใหม่
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
