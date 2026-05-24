import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { GHOST_REG } from '../data/ghosts';
import Chibi from '../components/Chibi';
import ScreenHeader from '../components/ScreenHeader';
import type { Ghost } from '../types';

interface Combatant {
  ghost: Ghost;
  currentHp: number;
  maxHp: number;
  atb: number;
  guts: number;
  isPlayer: boolean;
  alive: boolean;
}

interface LogEntry { text: string; type: 'hit' | 'skill' | 'heal' | 'info' }

function makeCombatant(ghost: Ghost, isPlayer: boolean): Combatant {
  const def = GHOST_REG[ghost.ghost_type];
  const maxHp = ghost.stats?.hp ?? def?.baseStats.hp ?? 1000;
  return { ghost, currentHp: maxHp, maxHp, atb: 0, guts: 0, isPlayer, alive: true };
}

const DUMMY_ENEMIES: Ghost[] = [
  { id: 'e1', ghost_type: 'krasue',    level: 5, stats: { hp:900,  str:15, mag:50, def:18, spr:42, spd:38 } } as Ghost,
  { id: 'e2', ghost_type: 'phiTaiHong',level: 4, stats: { hp:1400, str:52, mag:15, def:22, spr:15, spd:26 } } as Ghost,
  { id: 'e3', ghost_type: 'pisaj',     level: 5, stats: { hp:1300, str:45, mag:36, def:28, spr:25, spd:30 } } as Ghost,
];

export default function Battle() {
  const { ghosts } = useGameStore();
  const [phase, setPhase]       = useState<'select' | 'battle' | 'end'>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [winner, setWinner]     = useState<'player' | 'ai' | null>(null);
  const [log, setLog]           = useState<LogEntry[]>([]);
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const tickRef = useRef<number | null>(null);
  const logRef  = useRef<HTMLDivElement>(null);

  const playerTeam = ghosts.filter(g => selectedIds.includes(g.id));
  const enemyTeam  = DUMMY_ENEMIES;

  function toggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  }

  function startBattle() {
    if (playerTeam.length < 3) return;
    const initial: Combatant[] = [
      ...playerTeam.slice(0, 3).map(g => makeCombatant(g, true)),
      ...enemyTeam.map(g => makeCombatant(g, false)),
    ];
    setCombatants(initial);
    setLog([{ text: '⚔️ การต่อสู้เริ่มต้นแล้ว!', type: 'info' }]);
    setPhase('battle');
    setWinner(null);
  }

  useEffect(() => {
    if (phase !== 'battle') return;

    tickRef.current = window.setInterval(() => {
      setCombatants(prev => {
        const next = prev.map(c => {
          if (!c.alive) return c;
          const def = GHOST_REG[c.ghost.ghost_type];
          const spd = c.ghost.stats?.spd ?? def?.baseStats.spd ?? 20;
          return {
            ...c,
            atb:  Math.min(100, c.atb + spd / 30),
            guts: Math.min(100, c.guts + spd * 0.02),
          };
        });

        // Find who acts (ATB = 100)
        const actor = next.find(c => c.alive && c.atb >= 100);
        if (!actor) return next;

        const enemies = next.filter(c => c.alive && c.isPlayer !== actor.isPlayer);
        if (enemies.length === 0) return next;

        const target = enemies[Math.floor(Math.random() * enemies.length)];
        const def   = GHOST_REG[actor.ghost.ghost_type];
        const stats = actor.ghost.stats ?? def?.baseStats ?? {};
        const dmg   = Math.max(1, Math.floor((stats.str ?? 30) * 0.8 + Math.random() * 20 - (target.ghost.stats?.def ?? 20) * 0.4));

        const newLog: LogEntry = {
          text: `${GHOST_REG[actor.ghost.ghost_type]?.nameTh ?? actor.ghost.ghost_type} โจมตี ${GHOST_REG[target.ghost.ghost_type]?.nameTh ?? target.ghost.ghost_type} (-${dmg} HP)`,
          type: 'hit',
        };

        setLog(l => [...l.slice(-30), newLog]);

        const result = next.map(c => {
          if (c.ghost.id === actor.ghost.id) return { ...c, atb: 0 };
          if (c.ghost.id === target.ghost.id) {
            const newHp = Math.max(0, c.currentHp - dmg);
            return { ...c, currentHp: newHp, alive: newHp > 0 };
          }
          return c;
        });

        // Check win condition
        const pAlive = result.filter(c => c.isPlayer  && c.alive).length;
        const eAlive = result.filter(c => !c.isPlayer && c.alive).length;
        if (pAlive === 0 || eAlive === 0) {
          clearInterval(tickRef.current!);
          setPhase('end');
          setWinner(pAlive > 0 ? 'player' : 'ai');
          setLog(l => [...l, {
            text: pAlive > 0 ? '🏆 ชนะการต่อสู้!' : '💀 พ่ายแพ้...',
            type: 'info',
          }]);
        }

        return result;
      });
    }, 100);

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [phase]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const playerSide = combatants.filter(c => c.isPlayer);
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
                        Lv.{ghost.level} · {def.classType.toUpperCase()}
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
            disabled={selectedIds.length < 3}
            onClick={startBattle}
            style={{ opacity: selectedIds.length < 3 ? 0.5 : 1 }}
          >
            {selectedIds.length < 3 ? `เลือกผีอีก ${3 - selectedIds.length} ตัว` : '⚔️ เริ่มต่อสู้!'}
          </button>
        </div>
      </div>
    );
  }

  // ── BATTLE / END PHASE ─────────────────────────────────────────
  return (
    <div className="screen fade-in" style={{ paddingBottom: 0 }}>
      <ScreenHeader title="⚔️ Battle" back="/home" />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '10px 12px', gap: 8, minHeight: 0,
      }}>
        {/* Enemy team */}
        <div>
          <div className="label-sm" style={{ marginBottom: 6, color: 'var(--red)' }}>💀 ฝ่ายศัตรู</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {enemySide.map((com) => {
              const g   = com.ghost;
              const def = GHOST_REG[g.ghost_type];
              if (!def) return null;
              return (
                <div key={g.id} style={{
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
                  {com && (
                    <div className="bar-track thin" style={{ width: '100%' }}>
                      <div className="bar-fill bar-atb" style={{ width: `${com.atb}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Battle log */}
        <div style={{
          flex: 1,
          background: 'var(--bg-card)',
          borderRadius: 'var(--r-lg)',
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 80,
          maxHeight: 140,
          overflow: 'hidden',
        }}>
          <div ref={logRef} style={{ overflowY: 'auto', flex: 1 }}>
              {log.map((entry, i) => (
                <div key={i} style={{
                  fontSize: 11,
                  color: entry.type === 'info' ? 'var(--gold)' : entry.type === 'heal' ? 'var(--green)' : 'var(--text-light)',
                  marginBottom: 2,
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
              {playerSide.map((com) => {
                const g   = com.ghost;
                const def = GHOST_REG[g.ghost_type];
                if (!def) return null;
                return (
                  <div key={g.id} style={{
                    flex: 1,
                    background: com && !com.alive ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, rgba(38,222,129,0.08), var(--bg-card))',
                    border: '1px solid rgba(38,222,129,0.2)',
                    borderRadius: 'var(--r-lg)',
                    padding: '8px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    opacity: com && !com.alive ? 0.35 : 1,
                    transition: 'opacity 0.3s',
                  }}>
                    <Chibi emoji={def.emoji} element={def.element} size={42} evoStage={g.evo_stage} />
                    <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center' }}>{g.nickname || def.nameTh}</div>
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

        {/* Action button */}
        <div style={{ paddingBottom: 12 }}>
          {phase === 'battle' && (
            <div style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
              padding: '12px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--r-lg)',
            }}>
              <span className="pulse">⏳ กำลังต่อสู้ (Auto ATB)...</span>
            </div>
          )}
          {phase === 'end' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                textAlign: 'center',
                padding: '14px',
                background: winner === 'player'
                  ? 'linear-gradient(135deg, rgba(38,222,129,0.15), rgba(38,222,129,0.05))'
                  : 'linear-gradient(135deg, rgba(255,71,87,0.15), rgba(255,71,87,0.05))',
                border: `1.5px solid ${winner === 'player' ? 'rgba(38,222,129,0.4)' : 'rgba(255,71,87,0.4)'}`,
                borderRadius: 'var(--r-lg)',
                fontSize: 20,
                fontWeight: 700,
                fontFamily: 'Bai Jamjuree, sans-serif',
              }}>
                {winner === 'player' ? '🏆 ชนะแล้ว!' : '💀 พ่ายแพ้...'}
              </div>
              <button type="button" className="btn btn-gold btn-full"
                onClick={() => { setPhase('select'); setSelectedIds([]); setCombatants([]); setLog([]); }}>
                🔄 เลือกทีมใหม่
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
