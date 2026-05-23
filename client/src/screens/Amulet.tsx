import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GHOST_REG } from '../data/ghosts';
import Chibi from '../components/Chibi';
import ScreenHeader from '../components/ScreenHeader';

const AMULET_POOL = [
  { id: 'a_hp',     name: 'ลูกประคำสีแดง',  icon: '📿', power: 'HP +300',        tier: 'rare' },
  { id: 'a_atk',    name: 'เขี้ยวเสือดาว',  icon: '🦷', power: 'STR +15',        tier: 'rare' },
  { id: 'a_mag',    name: 'ตะกรุดเวทมนตร์', icon: '📜', power: 'MAG +15',        tier: 'epic' },
  { id: 'a_spd',    name: 'เท้าลม',         icon: '💨', power: 'SPD +10',        tier: 'rare' },
  { id: 'a_guts',   name: 'หัวใจนักรบ',     icon: '❤️‍🔥', power: 'GUTS fill +25%', tier: 'epic' },
  { id: 'a_bond',   name: 'สร้อยผูกใจ',     icon: '💞', power: 'Bond XP +50%',   tier: 'legend' },
  { id: 'a_curse',  name: 'มงกุฎสาป',       icon: '👑', power: 'MAG +25, Corruption +5/การต่อสู้', tier: 'legend' },
  { id: 'a_shield', name: 'เกราะวิญญาณ',    icon: '🔵', power: 'Shield 5% HP/เทิร์น', tier: 'epic' },
];

export default function Amulet() {
  const { ghosts, team, updateGhost } = useGameStore();
  const [selectedId, setSelectedId] = useState(team[0]?.id ?? '');
  const [msg, setMsg] = useState('');

  const ghost = ghosts.find(g => g.id === selectedId) ?? team[0];
  const def   = ghost ? GHOST_REG[ghost.ghost_type] : null;
  const slots: (string | null)[] = ghost?.amulet_slots ?? [null, null, null, null];

  async function equip(slot: number, amuletId: string) {
    if (!ghost) return;
    const newSlots = [...slots];
    newSlots[slot] = newSlots[slot] === amuletId ? null : amuletId;
    await updateGhost(ghost.id, { amulet_slots: newSlots });
    setMsg(`✅ ใส่ ${AMULET_POOL.find(a => a.id === amuletId)?.name ?? ''} สำเร็จ`);
    setTimeout(() => setMsg(''), 2000);
  }

  const TIER_COLORS: Record<string, string> = {
    common: 'var(--t-common)', rare: 'var(--t-rare)',
    epic: 'var(--t-epic)', legend: 'var(--t-legend)',
  };

  return (
    <div className="screen fade-in">
      <ScreenHeader title="📿 เครื่องราง" back />

      <div className="screen-content">
        {/* Ghost selector */}
        <div className="chip-row">
          {ghosts.map(g => {
            const d = GHOST_REG[g.ghost_type];
            return (
              <button
                key={g.id}
                className={`chip${selectedId === g.id ? ' active' : ''}`}
                onClick={() => setSelectedId(g.id)}
              >
                {d?.emoji} {g.nickname || d?.nameTh}
              </button>
            );
          })}
        </div>

        {msg && (
          <div style={{
            padding: '10px 14px', background: 'rgba(38,222,129,0.1)',
            border: '1px solid rgba(38,222,129,0.3)', borderRadius: 'var(--r-md)',
            color: 'var(--green)', fontWeight: 700, fontSize: 13,
          }}>{msg}</div>
        )}

        {/* Current slots */}
        {ghost && def && (
          <div>
            <div className="section-hd">
              <span className="section-title">Slot ที่ใส่อยู่</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Chibi emoji={def.emoji} element={def.element} size={28} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ghost.nickname || def.nameTh}</span>
              </div>
            </div>
            <div className="grid-2">
              {slots.map((slotItem, i) => {
                const amulet = AMULET_POOL.find(a => a.id === slotItem);
                return (
                  <div
                    key={i}
                    style={{
                      background: amulet ? `linear-gradient(135deg, ${TIER_COLORS[amulet.tier]}15, var(--bg-card))` : 'var(--bg-card)',
                      border: amulet ? `1.5px solid ${TIER_COLORS[amulet.tier]}40` : '1.5px dashed rgba(255,255,255,0.15)',
                      borderRadius: 'var(--r-lg)',
                      padding: '12px',
                      minHeight: 80,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    {amulet ? (
                      <>
                        <div style={{ fontSize: 24 }}>{amulet.icon}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', color: TIER_COLORS[amulet.tier] }}>
                          {amulet.name}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>{amulet.power}</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 20, color: 'var(--text-muted)' }}>+</div>
                        <div className="label-sm">Slot {i + 1}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Amulet pool */}
        <div>
          <div className="section-hd">
            <span className="section-title">คลัง</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {AMULET_POOL.map(amulet => {
              const isEquipped = slots.includes(amulet.id);
              return (
                <div
                  key={amulet.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    background: isEquipped ? `rgba(${amulet.tier === 'legend' ? '245,197,24' : '77,159,255'},0.08)` : 'var(--bg-card)',
                    border: `1px solid ${isEquipped ? TIER_COLORS[amulet.tier] + '40' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 'var(--r-lg)',
                  }}
                >
                  <div style={{ fontSize: 24 }}>{amulet.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{amulet.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{amulet.power}</div>
                  </div>
                  <span className={`badge badge-${amulet.tier}`}>{amulet.tier}</span>
                  {ghost && (
                    <button
                      className={`btn btn-sm ${isEquipped ? 'btn-outline' : 'btn-gold'}`}
                      onClick={() => {
                        const emptySlot = slots.findIndex(s => s === null);
                        if (isEquipped) {
                          const slotIdx = slots.findIndex(s => s === amulet.id);
                          equip(slotIdx, amulet.id);
                        } else if (emptySlot !== -1) {
                          equip(emptySlot, amulet.id);
                        } else {
                          setMsg('❌ Slot เต็มแล้ว! ถอดอันเก่าก่อน');
                          setTimeout(() => setMsg(''), 2000);
                        }
                      }}
                    >
                      {isEquipped ? 'ถอด' : 'ใส่'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
