import { useGameStore } from '../store/gameStore';
import ScreenHeader from '../components/ScreenHeader';
import BottomNav from '../components/BottomNav';

const ZONES = [
  { id: 'zone_01', name: 'ป่าผีสิง',       icon: '🌲', status: 'current',   desc: 'ป่าลึกเต็มไปด้วยวิญญาณ' },
  { id: 'zone_02', name: 'วัดร้าง',         icon: '⛩️', status: 'locked',    desc: 'วัดเก่าแก่ที่มีพลังมืดแฝงอยู่' },
  { id: 'zone_03', name: 'บึงสาปมรณะ',     icon: '🌊', status: 'locked',    desc: 'น้ำดำเต็มไปด้วยวิญญาณจมน้ำ' },
  { id: 'zone_04', name: 'ป่าช้าโบราณ',    icon: '💀', status: 'locked',    desc: 'ป่าช้าเก่าแก่ อาณาจักรของเปรต' },
  { id: 'zone_05', name: 'เมืองล่างดิน',   icon: '🗿', status: 'locked',    desc: 'โลกใต้ดิน บ้านของอสุรกาย' },
];

export default function Map() {
  const { save } = useGameStore();
  const currentZone = save?.zone_id ?? 'zone_01';
  const resources   = save?.resources ?? { coins: 0, necro_fluid: 0 };

  return (
    <div className="screen fade-in">
      <ScreenHeader title="🗺️ แผนที่" />

      <div className="screen-content">
        {/* Resources */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { icon: '🪙', label: 'เหรียญผี',    val: resources.coins,       color: 'var(--gold)' },
            { icon: '🧪', label: 'น้ำสาปหายาก', val: resources.necro_fluid, color: 'var(--purple)' },
          ].map(r => (
            <div key={r.label} className="card" style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{r.icon}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: r.color }}>
                {r.val}
              </div>
              <div className="label-sm">{r.label}</div>
            </div>
          ))}
        </div>

        {/* Chapter info */}
        <div className="card" style={{ border: '1px solid rgba(245,197,24,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="label-sm">บทปัจจุบัน</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Bai Jamjuree, sans-serif', marginTop: 2 }}>
                บทที่ {save?.chapter ?? 1}: สัมผัสแรก
              </div>
            </div>
            <div style={{
              fontSize: 36,
              animation: 'float 3s ease-in-out infinite',
            }}>📜</div>
          </div>
        </div>

        {/* Zone list */}
        <div>
          <div className="section-hd">
            <span className="section-title">🗺️ โซน</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ZONES.map(zone => {
              const isCurrent = zone.id === currentZone;
              const isLocked  = zone.status === 'locked' && !isCurrent;
              return (
                <div
                  key={zone.id}
                  style={{
                    background: isCurrent
                      ? 'linear-gradient(135deg, rgba(38,222,129,0.1), var(--bg-card))'
                      : 'var(--bg-card)',
                    border: isCurrent
                      ? '1.5px solid rgba(38,222,129,0.4)'
                      : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 'var(--r-lg)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    opacity: isLocked ? 0.5 : 1,
                  }}
                >
                  <div style={{ fontSize: 28 }}>{isLocked ? '🔒' : zone.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{zone.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{zone.desc}</div>
                  </div>
                  {isCurrent && (
                    <span style={{
                      padding: '4px 10px',
                      background: 'rgba(38,222,129,0.2)',
                      borderRadius: 'var(--r-full)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--green)',
                    }}>
                      อยู่ที่นี่
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Steps */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="label-sm">ก้าวเดิน</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: 'var(--cyan)' }}>
              {save?.steps_taken ?? 0}
            </div>
          </div>
          <div className="divider" style={{ margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="label-sm">โซนสำเร็จ</div>
            <div style={{ color: save?.zone_cleared ? 'var(--green)' : 'var(--text-muted)', fontWeight: 700, fontSize: 13 }}>
              {save?.zone_cleared ? '✅ สำเร็จ' : '⏳ กำลังสำรวจ'}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
