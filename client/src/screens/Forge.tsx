import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GHOST_REG } from '../data/ghosts';
import Chibi from '../components/Chibi';
import ScreenHeader from '../components/ScreenHeader';
import BottomNav from '../components/BottomNav';

type ForgeTab = 'frame' | 'mass';

const MASS_AFFIXES = [
  'ATK +12%', 'DEF +15%', 'SPD +8', 'MAG +10%',
  'HP +200', 'GUTS 회복 +20%', 'Bond XP +25%', 'SPR +12%',
  'เมื่อ HP < 30%: ATK +25%', 'สกิลพิเศษ CD -1',
  'ดูด HP 5% ต่อโจมตี', 'ดื้อยา 1 ครั้ง/การต่อสู้',
];

export default function Forge() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { ghosts, team, updateGhost, player, spendDust } = useGameStore();
  const [tab, setTab]         = useState<ForgeTab>(() =>
    (location.state as { ghostId?: string } | null)?.ghostId ? 'mass' : 'frame'
  );
  const [selectedId, setSelectedId] = useState<string>(() => {
    const fromNav = (location.state as { ghostId?: string } | null)?.ghostId;
    return fromNav ?? team[0]?.id ?? '';
  });
  const [msg, setMsg]         = useState('');
  const [rolling, setRolling] = useState(false);

  const ghost = ghosts.find(g => g.id === selectedId) ?? team[0];
  const def   = ghost ? GHOST_REG[ghost.ghost_type] : null;
  const frame = ghost?.frame ?? { enhancement: 0, base_def: def?.baseStats.def ?? 20, base_spr: def?.baseStats.spr ?? 20, sockets: [] };
  const mass  = ghost?.spirit_mass ?? { affixes: [], tier_history: [] };
  const dust  = player?.spirit_dust ?? 0;

  const frameCost = (frame.enhancement + 1) * 150;
  const massCost  = 200;

  async function enhanceFrame() {
    if (!ghost) return;
    if (dust < frameCost) { setMsg(`❌ ต้องการ ✨ ${frameCost}`); return; }
    const ok = await spendDust(frameCost);
    if (!ok) { setMsg('❌ ตัดฝุ่นไม่สำเร็จ'); return; }
    const newFrame = { ...frame, enhancement: frame.enhancement + 1, base_def: frame.base_def + 3, base_spr: frame.base_spr + 3 };
    await updateGhost(ghost.id, { frame: newFrame });
    setMsg(`✅ Frame +${newFrame.enhancement}! DEF/SPR +3`);
    setTimeout(() => setMsg(''), 2500);
  }

  async function rerollMass() {
    if (!ghost) return;
    if (dust < massCost) { setMsg(`❌ ต้องการ ✨ ${massCost}`); return; }
    const ok = await spendDust(massCost);
    if (!ok) { setMsg('❌ ตัดฝุ่นไม่สำเร็จ'); return; }
    setRolling(true);

    const count   = 2 + Math.floor(Math.random() * 2);
    const pool    = [...MASS_AFFIXES].sort(() => Math.random() - 0.5);
    const affixes = pool.slice(0, count);

    await new Promise(r => setTimeout(r, 600));
    await updateGhost(ghost.id, {
      spirit_mass: { affixes, tier_history: [...mass.tier_history, new Date().toISOString()] },
    });
    setRolling(false);
    setMsg(`🎲 Reroll สำเร็จ! ได้ ${count} Affixes`);
    setTimeout(() => setMsg(''), 2500);
  }

  return (
    <div className="screen fade-in">
      <ScreenHeader title="🔨 Forge" />

      <div className="screen-content">
        {/* Ghost selector */}
        <div>
          <div className="label-sm" style={{ marginBottom: 6 }}>เลือกวิญญาณ</div>
          <div className="chip-row">
            {ghosts.map(g => {
              const d = GHOST_REG[g.ghost_type];
              return (
                <button
                  key={g.id}
                  className={`chip${selectedId === g.id ? ' active' : ''}`}
                  onClick={() => setSelectedId(g.id)}
                >
                  {d?.emoji} {g.nickname || d?.nameTh} Lv.{g.level}
                </button>
              );
            })}
            {ghosts.length === 0 && (
              <button className="chip" onClick={() => navigate('/roster')}>
                ➕ เพิ่มวิญญาณก่อน
              </button>
            )}
          </div>
        </div>

        {/* Selected ghost hero */}
        {ghost && def && (
          <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Chibi emoji={def.emoji} element={def.element} size={52} evoStage={ghost.evo_stage} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{ghost.nickname || def.nameTh}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>Lv.{ghost.level} · Frame +{frame.enhancement}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ color: 'var(--gold)', fontWeight: 700 }}>✨ {dust}</div>
              <div className="label-sm">ฝุ่นวิญญาณ</div>
            </div>
          </div>
        )}

        {msg && (
          <div style={{
            padding: '10px 14px',
            background: msg.startsWith('❌') ? 'rgba(255,71,87,0.1)' : 'rgba(38,222,129,0.1)',
            border: `1px solid ${msg.startsWith('❌') ? 'rgba(255,71,87,0.3)' : 'rgba(38,222,129,0.3)'}`,
            borderRadius: 'var(--r-md)',
            color: msg.startsWith('❌') ? 'var(--red)' : 'var(--green)',
            fontWeight: 700,
            fontSize: 13,
          }}>
            {msg}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 'var(--r-md)', padding: 3 }}>
          {([['frame','🛡️ Frame'], ['mass','🔮 Mass']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '9px', border: 'none', borderRadius: 'calc(var(--r-md) - 2px)',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: tab === key ? 'linear-gradient(135deg, #f5c518, #e09f10)' : 'transparent',
                color: tab === key ? '#0b1120' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* FRAME TAB */}
        {tab === 'frame' && ghost && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 40,
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                color: frame.enhancement >= 10 ? 'var(--gold)' : 'var(--text-white)',
                marginBottom: 4,
              }}>
                +{frame.enhancement}
              </div>
              <div className="label-sm" style={{ marginBottom: 12 }}>ระดับ Frame ({frame.enhancement}/15)</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <div className="stat-chip"><span className="val" style={{ color: 'var(--blue)' }}>{frame.base_def}</span><span className="lbl">DEF</span></div>
                <div className="stat-chip"><span className="val" style={{ color: 'var(--cyan)' }}>{frame.base_spr}</span><span className="lbl">SPR</span></div>
              </div>
            </div>

            {frame.enhancement < 15 ? (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>อัปเกรด Frame</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>+3 DEF, +3 SPR ต่อระดับ</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: dust >= frameCost ? 'var(--gold)' : 'var(--red)', fontWeight: 700 }}>
                      ✨ {frameCost}
                    </div>
                    <div className="label-sm">ค่าใช้จ่าย</div>
                  </div>
                </div>
                <button
                  className={`btn ${dust >= frameCost ? 'btn-gold' : 'btn-outline'} btn-full`}
                  onClick={enhanceFrame}
                  disabled={dust < frameCost}
                >
                  ⚒️ อัปเกรด Frame
                </button>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', border: '1.5px solid rgba(245,197,24,0.5)' }}>
                <div style={{ fontSize: 24 }}>🏅</div>
                <div style={{ fontWeight: 700, color: 'var(--gold)', marginTop: 4 }}>Frame เต็มระดับ MAX!</div>
              </div>
            )}
          </div>
        )}

        {/* MASS TAB */}
        {tab === 'mass' && ghost && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="card">
              <div className="label-sm" style={{ marginBottom: 10 }}>Affixes ปัจจุบัน</div>
              {mass.affixes.length === 0 ? (
                <div className="text-muted" style={{ textAlign: 'center', padding: '16px 0', fontSize: 13 }}>
                  ยังไม่มี Affix — กด Reroll เพื่อสุ่ม
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {mass.affixes.map((a, i) => (
                    <div key={i} style={{
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, rgba(165,94,234,0.1), var(--bg-elevated))',
                      border: '1px solid rgba(165,94,234,0.25)',
                      borderRadius: 'var(--r-md)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-white)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                      <span style={{ color: 'var(--purple)' }}>◆</span>
                      {a}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>🎲 Spirit Mass Reroll</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>สุ่ม Affix ใหม่ทั้งหมด (2-3 Affixes)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: dust >= massCost ? 'var(--gold)' : 'var(--red)', fontWeight: 700 }}>✨ {massCost}</div>
                  <div className="label-sm">ค่าใช้จ่าย</div>
                </div>
              </div>
              <button
                className={`btn ${dust >= massCost ? 'btn-purple' : 'btn-outline'} btn-full`}
                onClick={rerollMass}
                disabled={dust < massCost || rolling}
              >
                {rolling ? (
                  <span className="pulse">🎲 กำลังสุ่ม...</span>
                ) : '🔮 Reroll Mass'}
              </button>
            </div>

            {mass.tier_history.length > 0 && (
              <div className="text-muted" style={{ fontSize: 11, textAlign: 'center' }}>
                Reroll แล้ว {mass.tier_history.length} ครั้ง
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
