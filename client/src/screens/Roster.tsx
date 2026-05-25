import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import {
  GHOST_REG, ELEMENT_LABELS, CLASS_LABELS,
  RARITY_LABELS, RARITY_COLOR, RARITY_TEXT,
  SUMMON_POOLS, POOL_COST, POOL_LABELS,
  rollRarity, pickGhostByRarity,
} from '../data/ghosts';

const RARITY_STARS: Record<string, string> = {
  common: '★', uncommon: '★★', rare: '★★★', legendary: '★★★★',
};
const EXP_TO_NEXT = (level: number) => Math.floor(100 * Math.pow(1.18, level - 1));
import Chibi from '../components/Chibi';
import ScreenHeader from '../components/ScreenHeader';
import BottomNav from '../components/BottomNav';

const EL_FILTERS = ['ทั้งหมด', 'fire', 'water', 'wood', 'earth', 'metal', 'dark', 'light'];
type PoolKey = keyof typeof SUMMON_POOLS;

export default function Roster() {
  const navigate = useNavigate();
  const { ghosts, team, player, summonGhost, saveDefenseTeam } = useGameStore();

  const [savingDefense, setSavingDefense] = useState(false);
  const [defenseSaved, setDefenseSaved] = useState(false);

  const [elFilter, setElFilter] = useState('ทั้งหมด');
  const [sort, setSort] = useState<'level' | 'bond' | 'element' | 'rarity'>('level');
  const [showSummon, setShowSummon] = useState(false);
  const [selectedPool, setSelectedPool] = useState<PoolKey>('basic');
  const [summonPhase, setSummonPhase] = useState<'select' | 'spinning' | 'reveal'>('select');
  const [summonResult, setSummonResult] = useState<{ ghostType: string; rarity: string; innateAffix?: string | null } | null>(null);
  const [summonErr, setSummonErr] = useState('');
  const summonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openSummon() {
    if (summonTimerRef.current) clearTimeout(summonTimerRef.current);
    setSummonPhase('select');
    setSummonResult(null);
    setSummonErr('');
    setShowSummon(true);
  }

  function handleSummon() {
    if (summonPhase === 'spinning') return;
    const cost = POOL_COST[selectedPool];
    setSummonPhase('spinning');
    setSummonErr('');
    summonTimerRef.current = setTimeout(async () => {
      try {
        const rarity = rollRarity(selectedPool);
        const ghostType = pickGhostByRarity(rarity);
        const newGhost = await summonGhost(ghostType, cost);
        const innateAffix = (newGhost.spirit_mass?.affixes as string[] ?? [])
          .find(a => typeof a === 'string') ?? null;
        setSummonResult({ ghostType, rarity, innateAffix });
        setSummonPhase('reveal');
      } catch (e: unknown) {
        setSummonErr(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
        setSummonPhase('select');
      }
    }, 1500);
  }

  const RARITY_ORDER: Record<string, number> = { legendary: 0, rare: 1, uncommon: 2, common: 3 };
  const filtered = ghosts
    .filter(g => elFilter === 'ทั้งหมด' || GHOST_REG[g.ghost_type]?.element === elFilter)
    .sort((a, b) => {
      if (sort === 'level')   return b.level - a.level;
      if (sort === 'bond')    return b.bond - a.bond;
      if (sort === 'element') return (GHOST_REG[a.ghost_type]?.element ?? '').localeCompare(GHOST_REG[b.ghost_type]?.element ?? '');
      if (sort === 'rarity')  return (RARITY_ORDER[GHOST_REG[a.ghost_type]?.rarity ?? 'common'] ?? 3) - (RARITY_ORDER[GHOST_REG[b.ghost_type]?.rarity ?? 'common'] ?? 3);
      return 0;
    });

  const teamIds = new Set(team.map(g => g.id));

  const dust = player?.spirit_dust ?? 0;

  return (
    <div className="screen fade-in">
      <ScreenHeader
        title={`👻 วิญญาณ (${ghosts.length})`}
        right={
          <button
            type="button"
            onClick={openSummon}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              border: 'none', borderRadius: 8, color: '#fff',
              fontSize: 12, fontWeight: 700, padding: '5px 10px', cursor: 'pointer',
            }}
          >
            ✨ เชิญผี
          </button>
        }
      />

      {/* Summon Modal */}
      {showSummon && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => summonPhase !== 'spinning' && setShowSummon(false)}
        >
          <div
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(168,85,247,0.4)',
              borderRadius: 18, padding: 20, width: 'min(360px, 92vw)', color: 'var(--text-main)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* PHASE: spinning */}
            {summonPhase === 'spinning' && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 64, animation: 'spin 0.8s linear infinite' }}>🔮</div>
                <div style={{ marginTop: 16, fontWeight: 700, fontSize: 16 }}>กำลังเรียกวิญญาณ...</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>พลังวิญญาณกำลังรวมตัว</div>
              </div>
            )}

            {/* PHASE: reveal */}
            {summonPhase === 'reveal' && summonResult && (() => {
              const def = GHOST_REG[summonResult.ghostType];
              const isLeg = summonResult.rarity === 'legendary';
              return (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>✨ ปรากฏกาย!</div>
                  <div style={{
                    background: isLeg
                      ? 'linear-gradient(135deg, rgba(255,136,0,0.25), rgba(255,200,0,0.1))'
                      : RARITY_COLOR[summonResult.rarity],
                    border: `2px solid ${RARITY_TEXT[summonResult.rarity]}`,
                    borderRadius: 14, padding: '20px 16px', marginBottom: 14,
                    animation: 'popIn 0.4s ease-out',
                  }}>
                    <div style={{ fontSize: 60, marginBottom: 8 }}>{def?.emoji ?? '👻'}</div>
                    <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>{def?.nameTh}</div>
                    <span style={{
                      display: 'inline-block', padding: '3px 12px', borderRadius: 20,
                      background: RARITY_COLOR[summonResult.rarity],
                      border: `1px solid ${RARITY_TEXT[summonResult.rarity]}`,
                      color: RARITY_TEXT[summonResult.rarity],
                      fontWeight: 700, fontSize: 12,
                    }}>
                      {'⭐'.repeat(
                        summonResult.rarity === 'common' ? 1 :
                        summonResult.rarity === 'uncommon' ? 2 :
                        summonResult.rarity === 'rare' ? 3 : 4
                      )} {RARITY_LABELS[summonResult.rarity]}
                    </span>
                    {isLeg && (
                      <div style={{ marginTop: 10, fontSize: 12, color: '#ff8800', fontWeight: 700 }}>
                        🎉 ยินดีด้วย! ได้ผีระดับตำนาน!
                      </div>
                    )}
                    {summonResult.innateAffix && (
                      <div style={{
                        marginTop: 10, fontSize: 12, fontWeight: 700,
                        background: 'rgba(168,85,247,0.2)',
                        border: '1px solid rgba(168,85,247,0.5)',
                        borderRadius: 8, padding: '5px 12px',
                        color: '#c084fc',
                        animation: 'popIn 0.5s ease-out 0.2s both',
                      }}>
                        ✨ Innate: {summonResult.innateAffix}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }}
                      onClick={() => setShowSummon(false)}>ปิด</button>
                    <button type="button" className="btn btn-primary" style={{ flex: 2 }}
                      onClick={() => { setSummonPhase('select'); setSummonResult(null); }}>
                      🔮 เชิญอีก
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* PHASE: select pool */}
            {summonPhase === 'select' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>🔮 พิธีเชิญวิญญาณ</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    ฝุ่นของคุณ: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>🌀 {dust}</span>
                  </div>
                </div>

                {/* Pool selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {(Object.keys(SUMMON_POOLS) as PoolKey[]).map(pool => {
                    const cost = POOL_COST[pool];
                    const weights = SUMMON_POOLS[pool];
                    const canAfford = dust >= cost;
                    const isSelected = selectedPool === pool;
                    return (
                      <button
                        key={pool}
                        type="button"
                        onClick={() => canAfford && setSelectedPool(pool)}
                        style={{
                          background: isSelected ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.04)',
                          border: `1.5px solid ${isSelected ? 'rgba(168,85,247,0.7)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 10, padding: '10px 14px', cursor: canAfford ? 'pointer' : 'not-allowed',
                          opacity: canAfford ? 1 : 0.45, textAlign: 'left', color: 'var(--text-main)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>
                            {pool === 'basic' ? '🌱' : pool === 'premium' ? '💎' : '🎪'} {POOL_LABELS[pool]}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                            ธ {weights.common}% · ไม่ธ {weights.uncommon}% · หา {weights.rare}% · ตำ {weights.legendary}%
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: canAfford ? 'var(--gold)' : 'var(--red)', fontSize: 13 }}>
                          🌀 {cost}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {summonErr && (
                  <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>
                    ⚠️ {summonErr}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }}
                    onClick={() => setShowSummon(false)}>ยกเลิก</button>
                  <button
                    type="button" className="btn btn-primary" style={{ flex: 2 }}
                    disabled={dust < POOL_COST[selectedPool]}
                    onClick={handleSummon}
                  >
                    ✨ เชิญ ({POOL_COST[selectedPool]} 🌀)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="screen-content">
        {/* Defense Team Card */}
        {team.length > 0 && (
          <div className="card" style={{ padding: '12px 14px', marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🛡️ ทีมตั้งรับ (Arena)</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {team.map(g => {
                    const def = GHOST_REG[g.ghost_type];
                    return (
                      <span key={g.id} title={g.nickname || def?.nameTh} style={{ fontSize: 22 }}>
                        {def?.emoji ?? '👻'}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
                disabled={savingDefense}
                onClick={async () => {
                  setSavingDefense(true);
                  setDefenseSaved(false);
                  try {
                    await saveDefenseTeam();
                    setDefenseSaved(true);
                    setTimeout(() => setDefenseSaved(false), 3000);
                  } finally {
                    setSavingDefense(false);
                  }
                }}
              >
                {savingDefense ? '⏳...' : defenseSaved ? '✅ บันทึกแล้ว' : '🔒 บันทึกทีมตั้งรับ'}
              </button>
            </div>
          </div>
        )}

        {/* Filter chips */}
        <div className="chip-row">
          {EL_FILTERS.map(f => (
            <button
              key={f}
              className={`chip${elFilter === f ? ' active' : ''}`}
              onClick={() => setElFilter(f)}
            >
              {f === 'ทั้งหมด' ? '🌐 ทั้งหมด' : ELEMENT_LABELS[f] ?? f}
            </button>
          ))}
        </div>

        {/* Sort row */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="label-sm">เรียง:</span>
          {(['level', 'bond', 'rarity', 'element'] as const).map(s => (
            <button
              key={s}
              className={`chip${sort === s ? ' active' : ''}`}
              style={{ padding: '3px 10px', fontSize: 11 }}
              onClick={() => setSort(s)}
            >
              {s === 'level' ? 'Lv' : s === 'bond' ? 'Bond' : s === 'rarity' ? 'Rarity' : 'ธาตุ'}
            </button>
          ))}
        </div>

        {/* Ghost grid */}
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>😶</div>
            <div className="text-muted">ยังไม่มีวิญญาณในคลัง</div>
          </div>
        ) : (
          <div className="grid-2">
            {filtered.map(ghost => {
              const def = GHOST_REG[ghost.ghost_type];
              if (!def) return null;
              const inTeam = teamIds.has(ghost.id);
              const hpPct = Math.min(100, (ghost.stats?.hp ?? def.baseStats.hp) / def.baseStats.hp * 100);

              const expNeeded = EXP_TO_NEXT(ghost.level);
              const expPct = Math.min(100, ((ghost.exp ?? 0) / expNeeded) * 100);
              return (
                <div
                  key={ghost.id}
                  onClick={() => navigate(`/spirit/${ghost.id}`)}
                  style={{
                    background: inTeam
                      ? 'linear-gradient(135deg, rgba(245,197,24,0.12), rgba(245,197,24,0.05))'
                      : RARITY_COLOR[def.rarity],
                    border: inTeam
                      ? '1.5px solid rgba(245,197,24,0.6)'
                      : `1.5px solid ${RARITY_TEXT[def.rarity]}55`,
                    borderRadius: 'var(--r-lg)',
                    padding: '12px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 7,
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  {/* Top-right badges */}
                  <div style={{ position: 'absolute', top: 6, right: 8, display: 'flex', gap: 4, alignItems: 'center' }}>
                    {(ghost.stat_points ?? 0) > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#fff',
                        background: '#7c3aed', borderRadius: 10, padding: '1px 6px',
                      }}>+{ghost.stat_points}pt</span>
                    )}
                    {inTeam && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)' }}>⚔️</span>
                    )}
                  </div>

                  {/* Chibi + name + rarity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Chibi emoji={def.emoji} element={def.element} size={52} evoStage={ghost.evo_stage} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ghost.nickname || def.nameTh}
                      </div>
                      <div style={{ fontSize: 11, color: RARITY_TEXT[def.rarity], fontWeight: 700 }}>
                        {RARITY_STARS[def.rarity]} {RARITY_LABELS[def.rarity]}
                      </div>
                    </div>
                  </div>

                  {/* Badges: element + class */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <span className={`badge badge-${def.element}`}>{ELEMENT_LABELS[def.element]}</span>
                    <span className={`badge badge-${def.classType}`}>{CLASS_LABELS[def.classType]}</span>
                  </div>

                  {/* EXP bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span className="label-sm">Lv.{ghost.level}</span>
                      <span className="label-sm">{ghost.exp ?? 0}/{expNeeded} EXP</span>
                    </div>
                    <div className="bar-track thin">
                      <div className="bar-fill" style={{ width: `${expPct}%`, background: 'linear-gradient(90deg, #a78bfa, #7c3aed)' }} />
                    </div>
                  </div>

                  {/* Bond + HP */}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="label-sm">💞 Bond {ghost.bond}</span>
                    <span className="label-sm" style={{ color: hpPct < 30 ? 'var(--red)' : 'var(--text-muted)' }}>
                      HP {ghost.stats?.hp ?? def.baseStats.hp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
