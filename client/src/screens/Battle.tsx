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
  const { team } = useGameStore();
  const [phase, setPhase]   = useState<'prep' | 'battle' | 'end'>('prep');
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [log, setLog]       = useState<LogEntry[]>([]);
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const tickRef = useRef<number | null>(null);
  const logRef  = useRef<HTMLDivElement>(null);

  const playerTeam  = team.length > 0 ? team : [];
  const enemyTeam   = DUMMY_ENEMIES;

  function startBattle() {
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

  return (
    <div className="screen fade-in" style={{ paddingBottom: 0 }}>
      <ScreenHeader title="⚔️ Battle" back="/home" />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '10px 12px',
        gap: 8,
        minHeight: 0,
      }}>
        {/* Enemy team */}
        <div>
          <div className="label-sm" style={{ marginBottom: 6, color: 'var(--red)' }}>💀 ฝ่ายศัตรู</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(phase === 'prep' ? enemyTeam : enemySide.map(c => c.ghost)).map((g, i) => {
              const com = enemySide[i];
              const def = GHOST_REG[g.ghost_type];
              if (!def) return null;
              return (
                <div key={g.id} style={{
                  flex: 1,
                  background: com && !com.alive ? 'rgba(255,255,255,0.03)' : 'var(--bg-card)',
                  border: '1px solid rgba(255,71,87,0.2)',
                  borderRadius: 'var(--r-lg)',
                  padding: '8px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  opacity: com && !com.alive ? 0.35 : 1,
                  transition: 'opacity 0.3s',
                }}>
                  <Chibi emoji={def.emoji} element={def.element} size={42} />
                  <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center' }}>{def.nameTh}</div>
                  <div className="bar-track thin" style={{ width: '100%' }}>
                    <div
                      className="bar-fill bar-hp"
                      style={{ width: com ? `${(com.currentHp / com.maxHp) * 100}%` : '100%' }}
                    />
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
          {phase === 'prep' && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              เตรียมพร้อมต่อสู้...
            </div>
          )}
          {phase !== 'prep' && (
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
          )}
        </div>

        {/* Player team */}
        <div>
          <div className="label-sm" style={{ marginBottom: 6, color: 'var(--green)' }}>⚔️ ทีมของคุณ</div>
          {playerTeam.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: 13 }}>
              ยังไม่มีผีในทีม — ไปที่หน้าวิญญาณก่อน
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              {(phase === 'prep' ? playerTeam : playerSide.map(c => c.ghost)).map((g, i) => {
                const com = playerSide[i];
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
                    {com ? (
                      <>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {com.currentHp}/{com.maxHp}
                        </div>
                        <div className="bar-track thin" style={{ width: '100%' }}>
                          <div
                            className={`bar-fill ${(com.currentHp / com.maxHp) < 0.3 ? 'bar-hp-low' : 'bar-hp'}`}
                            style={{ width: `${(com.currentHp / com.maxHp) * 100}%` }}
                          />
                        </div>
                        <div className="bar-track thin" style={{ width: '100%' }}>
                          <div className="bar-fill bar-atb" style={{ width: `${com.atb}%` }} />
                        </div>
                        <div className="bar-track thin" style={{ width: '100%' }}>
                          <div className="bar-fill bar-guts" style={{ width: `${com.guts}%` }} />
                        </div>
                      </>
                    ) : (
                      <div className="bar-track thin" style={{ width: '100%' }}>
                        <div className="bar-fill bar-hp" style={{ width: '100%' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action button */}
        <div style={{ paddingBottom: 12 }}>
          {phase === 'prep' && (
            <button
              className="btn btn-red btn-full btn-lg"
              onClick={startBattle}
              disabled={playerTeam.length === 0}
            >
              ⚔️ เริ่มต่อสู้!
            </button>
          )}
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
              <button className="btn btn-gold btn-full" onClick={startBattle}>
                ⚔️ รีแมทช์
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
