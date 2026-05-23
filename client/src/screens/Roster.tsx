import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GHOST_REG, ELEMENT_LABELS, CLASS_LABELS } from '../data/ghosts';
import Chibi from '../components/Chibi';
import ScreenHeader from '../components/ScreenHeader';
import BottomNav from '../components/BottomNav';

const EL_FILTERS = ['ทั้งหมด', 'fire', 'water', 'wood', 'earth', 'metal', 'dark', 'light'];

export default function Roster() {
  const navigate = useNavigate();
  const { ghosts, team } = useGameStore();

  const [elFilter, setElFilter] = useState('ทั้งหมด');
  const [sort, setSort] = useState<'level' | 'bond' | 'element'>('level');

  const filtered = ghosts
    .filter(g => elFilter === 'ทั้งหมด' || GHOST_REG[g.ghost_type]?.element === elFilter)
    .sort((a, b) => {
      if (sort === 'level')   return b.level - a.level;
      if (sort === 'bond')    return b.bond - a.bond;
      if (sort === 'element') return (GHOST_REG[a.ghost_type]?.element ?? '').localeCompare(GHOST_REG[b.ghost_type]?.element ?? '');
      return 0;
    });

  const teamIds = new Set(team.map(g => g.id));

  return (
    <div className="screen fade-in">
      <ScreenHeader
        title={`👻 วิญญาณ (${ghosts.length})`}
        right={
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            ทีม {team.length}/3
          </span>
        }
      />

      <div className="screen-content">
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
          <span className="label-sm">เรียงตาม:</span>
          {(['level', 'bond', 'element'] as const).map(s => (
            <button
              key={s}
              className={`chip${sort === s ? ' active' : ''}`}
              style={{ padding: '3px 10px', fontSize: 11 }}
              onClick={() => setSort(s)}
            >
              {s === 'level' ? 'Lv' : s === 'bond' ? 'Bond' : 'ธาตุ'}
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

              return (
                <div
                  key={ghost.id}
                  onClick={() => navigate(`/spirit/${ghost.id}`)}
                  style={{
                    background: inTeam
                      ? 'linear-gradient(135deg, rgba(245,197,24,0.1), rgba(245,197,24,0.05))'
                      : 'var(--bg-card)',
                    border: inTeam
                      ? '1.5px solid rgba(245,197,24,0.4)'
                      : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--r-lg)',
                    padding: '12px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  {inTeam && (
                    <span style={{
                      position: 'absolute', top: 6, right: 8,
                      fontSize: 10, fontWeight: 700, color: 'var(--gold)',
                    }}>⚔️ ทีม</span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Chibi emoji={def.emoji} element={def.element} size={52} evoStage={ghost.evo_stage} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ghost.nickname || def.nameTh}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Lv.{ghost.level}
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <span className={`badge badge-${def.element}`}>
                      {ELEMENT_LABELS[def.element]}
                    </span>
                    <span className={`badge badge-${def.classType}`}>
                      {CLASS_LABELS[def.classType]}
                    </span>
                  </div>

                  {/* HP bar */}
                  <div>
                    <div className="bar-track thin">
                      <div
                        className={`bar-fill ${hpPct < 30 ? 'bar-hp-low' : 'bar-hp'}`}
                        style={{ width: `${hpPct}%` }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                      <span className="label-sm">Bond {ghost.bond}</span>
                      <span className="label-sm">Lv.{ghost.level}</span>
                    </div>
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
