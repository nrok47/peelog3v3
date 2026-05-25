import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import ScreenHeader from '../components/ScreenHeader';

export const AMULET_POOL = [
  { id: 'a_hp',     name: 'ลูกประคำสีแดง',  icon: '📿', power: 'HP +300',        tier: 'rare'   },
  { id: 'a_atk',    name: 'เขี้ยวเสือดาว',  icon: '🦷', power: 'STR +15',        tier: 'rare'   },
  { id: 'a_mag',    name: 'ตะกรุดเวทมนตร์', icon: '📜', power: 'MAG +15',        tier: 'epic'   },
  { id: 'a_spd',    name: 'เท้าลม',         icon: '💨', power: 'SPD +10',        tier: 'rare'   },
  { id: 'a_guts',   name: 'หัวใจนักรบ',     icon: '❤️‍🔥', power: 'GUTS fill +25%', tier: 'epic'   },
  { id: 'a_bond',   name: 'สร้อยผูกใจ',     icon: '💞', power: 'Bond XP +50%',   tier: 'legend' },
  { id: 'a_curse',  name: 'มงกุฎสาป',       icon: '👑', power: 'MAG +25',        tier: 'legend' },
  { id: 'a_shield', name: 'เกราะวิญญาณ',    icon: '🔵', power: 'Shield 5% HP/เทิร์น', tier: 'epic' },
];

const TIER_COLORS: Record<string, string> = {
  common: 'var(--t-common)', rare: 'var(--t-rare)',
  epic: 'var(--t-epic)', legend: 'var(--t-legend)',
};

const SLOT_LABELS = ['ตำแหน่ง 1', 'ตำแหน่ง 2', 'ตำแหน่ง 3'];

export default function Amulet() {
  const { player, setFieldAmulet } = useGameStore();
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const fieldAmulets: (string | null)[] = player?.inventory?.field_amulets ?? [null, null, null];

  async function pick(amuletId: string) {
    if (activeSlot === null) return;
    const current = fieldAmulets[activeSlot];
    await setFieldAmulet(activeSlot, current === amuletId ? null : amuletId);
    setActiveSlot(null);
  }

  return (
    <div className="screen fade-in">
      <ScreenHeader title="📿 ยันต์" back />

      <div className="screen-content">
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
          วางยันต์บนตำแหน่ง — ผีที่ยืนตรงนั้นได้รับ effect
        </div>

        {/* 3 field slots */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[0, 1, 2].map(pos => {
            const amuletId = fieldAmulets[pos] ?? null;
            const amulet   = AMULET_POOL.find(a => a.id === amuletId);
            const isActive = activeSlot === pos;

            return (
              <button
                key={pos}
                onClick={() => setActiveSlot(isActive ? null : pos)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '14px 8px',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(245,197,24,0.2), var(--bg-card))'
                    : amulet
                      ? `linear-gradient(135deg, ${TIER_COLORS[amulet.tier]}15, var(--bg-card))`
                      : 'var(--bg-card)',
                  border: isActive
                    ? '2px solid var(--gold)'
                    : amulet
                      ? `1.5px solid ${TIER_COLORS[amulet.tier]}50`
                      : '1.5px dashed rgba(255,255,255,0.15)',
                  borderRadius: 'var(--r-lg)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  minHeight: 96,
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: 10, color: isActive ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 700 }}>
                  {SLOT_LABELS[pos]}
                </div>
                {amulet ? (
                  <>
                    <div style={{ fontSize: 28 }}>{amulet.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', color: TIER_COLORS[amulet.tier], lineHeight: 1.3 }}>
                      {amulet.name}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>
                      {amulet.power}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 22, color: 'var(--text-muted)' }}>+</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Picker */}
        {activeSlot !== null && (
          <div>
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: 'var(--gold)', marginBottom: 8,
            }}>
              เลือกยันต์ → {SLOT_LABELS[activeSlot]}
            </div>

            {/* Clear slot option */}
            {fieldAmulets[activeSlot] && (
              <button
                className="btn btn-outline btn-full"
                style={{ marginBottom: 8, fontSize: 12 }}
                onClick={() => { setFieldAmulet(activeSlot, null); setActiveSlot(null); }}
              >
                ✕ ถอดยันต์ออก
              </button>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {AMULET_POOL.map(amulet => {
                const isEquipped = fieldAmulets[activeSlot] === amulet.id;
                const usedElsewhere = fieldAmulets.some((id, i) => id === amulet.id && i !== activeSlot);
                return (
                  <div
                    key={amulet.id}
                    onClick={() => !usedElsewhere && pick(amulet.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      background: isEquipped
                        ? `linear-gradient(135deg, ${TIER_COLORS[amulet.tier]}20, var(--bg-card))`
                        : 'var(--bg-card)',
                      border: isEquipped
                        ? `2px solid ${TIER_COLORS[amulet.tier]}80`
                        : '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 'var(--r-lg)',
                      cursor: usedElsewhere ? 'not-allowed' : 'pointer',
                      opacity: usedElsewhere ? 0.4 : 1,
                      transition: 'all 0.1s',
                    }}
                  >
                    <div style={{ fontSize: 24 }}>{amulet.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: TIER_COLORS[amulet.tier] }}>
                        {amulet.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{amulet.power}</div>
                      {usedElsewhere && (
                        <div style={{ fontSize: 10, color: 'var(--orange)' }}>ใช้ที่ช่องอื่นอยู่</div>
                      )}
                    </div>
                    <span className={`badge badge-${amulet.tier}`}>{amulet.tier}</span>
                    {isEquipped && (
                      <div style={{ color: 'var(--green)', fontSize: 16, fontWeight: 700 }}>✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
