import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { GHOST_REG } from '../data/ghosts';
import { ZONE_DEFS, getZoneDef, getZoneIndex, buildZoneEnemies } from '../data/zones';
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
    statBonus:      s,
    gutsMultiplier: 1 + (nodes.includes('guts1') ? 0.15 : 0) + (nodes.includes('guts2') ? 0.15 : 0),
    atbStart:       nodes.includes('rush') ? 30 : 0,
    regenPct:       nodes.includes('regen') ? 0.02 : 0,
  };
}

function makeCombatant(ghost: Ghost, isPlayer: boolean): Combatant {
  const def      = GHOST_REG[ghost.ghost_type];
  const fallback = def?.baseStats ?? { hp: 1000, str: 30, mag: 20, def: 20, spr: 20, spd: 20 };
  const saved    = ghost.stats ?? {};
  const { statBonus, gutsMultiplier, atbStart, regenPct } = isPlayer
    ? getSkillBonuses(ghost)
    : { statBonus: { hp: 0, str: 0, mag: 0, def: 0, spr: 0, spd: 0 }, gutsMultiplier: 1, atbStart: 0, regenPct: 0 };

  const boostedStats: GhostStats = {
    hp:  (saved.hp  ?? fallback.hp)  + statBonus.hp,
    str: (saved.str ?? fallback.str) + statBonus.str,
    mag: (saved.mag ?? fallback.mag) + statBonus.mag,
    def: (saved.def ?? fallback.def) + statBonus.def,
    spr: (saved.spr ?? fallback.spr) + statBonus.spr,
    spd: (saved.spd ?? fallback.spd) + statBonus.spd,
  };
  return {
    ghost, currentHp: boostedStats.hp, maxHp: boostedStats.hp,
    atb: atbStart, guts: 0, isPlayer, alive: true,
    boostedStats, gutsMultiplier, regenPct,
  };
}

export default function Battle() {
  const { ghosts, save, addBattleRewards, advanceZoneStep } = useGameStore();
  const [phase, setPhase]             = useState<'select' | 'battle' | 'end'>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [winner, setWinner]           = useState<'player' | 'ai' | null>(null);
  const [log, setLog]                 = useState<LogEntry[]>([]);
  const [combatants, setCombatants]   = useState<Combatant[]>([]);
  const [enemyGhosts, setEnemyGhosts] = useState<Ghost[]>([]);
  const [battleRewards, setBattleRewards] = useState<{ expGained: number; levelUps: string[]; dustGained: number; zoneCleared: boolean } | null>(null);
  const tickRef       = useRef<number | null>(null);
  const logRef        = useRef<HTMLDivElement>(null);
  const rewardDoneRef = useRef(false);

  const zone      = getZoneDef(save?.zone_id ?? 'zone_01');
  const stepsDone = save?.steps_taken ?? 0;
  const isBoss    = stepsDone === zone.steps - 1;
  const zoneIdx   = getZoneIndex(save?.zone_id ?? 'zone_01');

  const playerTeam = ghosts.filter(g => selectedIds.includes(g.id));
  const enemySide  = combatants.filter(c => !c.isPlayer);
  const playerSide = combatants.filter(c =>  c.isPlayer);

  function toggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  }

  function startBattle() {
    if (playerTeam.length < 1) return;
    rewardDoneRef.current = false;
    setBattleRewards(null);

    // Generate zone enemies for this step
    const enemies = buildZoneEnemies(zone, stepsDone, playerTeam.length);
    setEnemyGhosts(enemies);

    const initial: Combatant[] = [
      ...playerTeam.slice(0, 3).map(g => makeCombatant(g, true)),
      ...enemies.map(g => makeCombatant(g, false)),
    ];
    setCombatants(initial);
    setLog([{ text: `⚔️ ${isBoss ? '👑 BOSS FIGHT! ' : ''}การต่อสู้เริ่มต้น — ${zone.name} (${stepsDone + 1}/${zone.steps})`, type: 'info' }]);
    setPhase('battle');
    setWinner(null);
  }

  // Reward trigger — fires once when player wins
  useEffect(() => {
    if (winner !== 'player' || rewardDoneRef.current) return;
    rewardDoneRef.current = true;

    const avgEnemyLv = enemyGhosts.length > 0
      ? Math.round(enemyGhosts.reduce((s, g) => s + g.level, 0) / enemyGhosts.length)
      : zone.bossLevel;

    Promise.all([
      addBattleRewards(selectedIds, avgEnemyLv),
      advanceZoneStep(),
    ]).then(([rewards, zoneResult]) => {
      if (rewards) {
        setBattleRewards({ ...rewards, zoneCleared: zoneResult?.zoneCleared ?? false });
      }
    });
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
          text: `${GHOST_REG[actor.ghost.ghost_type]?.nameTh} โจมตี ${GHOST_REG[target.ghost.ghost_type]?.nameTh} (-${dmg})`,
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

  function resetToSelect() {
    setPhase('select');
    setSelectedIds([]);
    setCombatants([]);
    setEnemyGhosts([]);
    setLog([]);
    setWinner(null);
    setBattleRewards(null);
  }

  // ── TEAM SELECT PHASE ──────────────────────────────────────────
  if (phase === 'select') {
    const nextStepIsBoss = (save?.steps_taken ?? 0) === zone.steps - 1;
    return (
      <div className="screen fade-in">
        <ScreenHeader title="⚔️ เลือกทีม" back="/home" />
        <div className="screen-content">

          {/* Zone context */}
          <div style={{
            background: nextStepIsBoss
              ? 'linear-gradient(135deg, rgba(255,71,87,0.12), rgba(255,71,87,0.04))'
              : 'linear-gradient(135deg, rgba(38,222,129,0.08), var(--bg-card))',
            border: `1.5px solid ${nextStepIsBoss ? 'rgba(255,71,87,0.4)' : 'rgba(38,222,129,0.25)'}`,
            borderRadius: 'var(--r-lg)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                {nextStepIsBoss ? '👑 BOSS BATTLE' : `บทที่ ${zone.chapter} — ${zone.name}`}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {nextStepIsBoss ? `⚠️ บอสประจำโซน — ${zone.name}` : zone.desc}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                ศัตรู: {(nextStepIsBoss ? zone.bossTypes : zone.enemies)
                  .map(t => GHOST_REG[t]?.nameTh ?? t).join(', ')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', marginBottom: 4 }}>
                {stepsDone}/{zone.steps} การต่อสู้
              </div>
              <div style={{ width: 60, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${(stepsDone / zone.steps) * 100}%`,
                  background: nextStepIsBoss ? 'var(--red)' : 'var(--green)',
                }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>เลือกผีที่จะส่งสู้</span>
            <span style={{ fontWeight: 700, color: selectedIds.length > 0 ? 'var(--gold)' : 'var(--text-muted)' }}>
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
                        Lv.{ghost.level} · {def.classType.toUpperCase()}{ghost.stat_points > 0 && (
                          <span style={{ color: 'var(--gold)' }}> · {ghost.stat_points}pt</span>
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
            className={`btn btn-full btn-lg ${nextStepIsBoss ? 'btn-red' : 'btn-red'}`}
            disabled={selectedIds.length < 1}
            onClick={startBattle}
            style={{ opacity: selectedIds.length < 1 ? 0.5 : 1 }}
          >
            {selectedIds.length < 1
              ? 'เลือกผีอย่างน้อย 1 ตัว'
              : nextStepIsBoss
                ? `👑 เข้าสู้บอส! (${selectedIds.length} ตัว)`
                : `⚔️ เริ่มต่อสู้! (${selectedIds.length} ตัว)`}
          </button>

          {/* Zone progression overview */}
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
            {Array.from({ length: zone.steps }).map((_, i) => (
              <div key={i} style={{
                width: i < stepsDone ? 18 : 12,
                height: 6,
                borderRadius: 3,
                background: i < stepsDone
                  ? 'var(--green)'
                  : i === stepsDone
                    ? (nextStepIsBoss ? 'var(--red)' : 'var(--gold)')
                    : 'rgba(255,255,255,0.1)',
                transition: 'all 0.2s',
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── BATTLE / END PHASE ─────────────────────────────────────────
  return (
    <div className="screen fade-in" style={{ paddingBottom: 0 }}>
      <ScreenHeader title={`⚔️ ${isBoss ? '👑 BOSS — ' : ''}${zone.name}`} back="/home" />

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
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {com.currentHp}/{com.maxHp}
                  </div>
                  <div className="bar-track thin" style={{ width: '100%' }}>
                    <div className={`bar-fill ${(com.currentHp / com.maxHp) < 0.3 ? 'bar-hp-low' : 'bar-hp'}`}
                      style={{ width: `${(com.currentHp / com.maxHp) * 100}%` }} />
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

              {/* Zone cleared banner */}
              {winner === 'player' && battleRewards?.zoneCleared && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245,197,24,0.2), rgba(245,197,24,0.05))',
                  border: '1.5px solid rgba(245,197,24,0.5)',
                  borderRadius: 'var(--r-lg)', padding: '12px 14px',
                  textAlign: 'center', animation: 'popIn 0.4s ease-out',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>🎉</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gold)', fontFamily: 'Bai Jamjuree, sans-serif' }}>
                    โซนผ่านแล้ว!
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {ZONE_DEFS[zoneIdx + 1]
                      ? `บทที่ ${ZONE_DEFS[zoneIdx + 1].chapter} — ${ZONE_DEFS[zoneIdx + 1].name} ปลดล็อกแล้ว!`
                      : 'คุณผ่านทุกโซนแล้ว! 🏆'}
                  </div>
                </div>
              )}

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
                    <span>⚡ EXP +{battleRewards.expGained}</span>
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
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                  กำลังบันทึกรางวัล...
                </div>
              )}

              <button type="button" className="btn btn-gold btn-full" onClick={resetToSelect}>
                🔄 สู้ต่อ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
