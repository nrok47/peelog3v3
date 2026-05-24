import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { ZONE_DEFS, getZoneIndex } from '../data/zones';
import { GHOST_REG } from '../data/ghosts';
import ScreenHeader from '../components/ScreenHeader';
import BottomNav from '../components/BottomNav';

const CHAPTER_TITLES: Record<number, string> = {
  1: 'สัมผัสแรก',
  2: 'เงาแห่งอดีต',
  3: 'ห้วงน้ำมรณะ',
  4: 'กระดูกของคนตาย',
  5: 'ความมืดแห่งโลกล่าง',
};

export default function Map() {
  const navigate = useNavigate();
  const { save }  = useGameStore();

  const currentZoneId = save?.zone_id ?? 'zone_01';
  const currentIdx    = getZoneIndex(currentZoneId);
  const resources     = save?.resources ?? { coins: 0, necro_fluid: 0 };
  const stepsDone     = save?.steps_taken ?? 0;
  const zoneFinal     = save?.zone_cleared ?? false;

  const currentZone   = ZONE_DEFS[currentIdx];
  const isBossNext    = stepsDone === currentZone.steps - 1;

  return (
    <div className="screen fade-in">
      <ScreenHeader title="🗺️ แผนที่" />

      <div className="screen-content">
        {/* Resources */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { icon: '🪙', label: 'เหรียญผี',    val: resources.coins,       color: 'var(--gold)'   },
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

        {/* Chapter card */}
        <div className="card" style={{ border: '1px solid rgba(245,197,24,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="label-sm">บทปัจจุบัน</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Bai Jamjuree, sans-serif', marginTop: 2 }}>
                บทที่ {save?.chapter ?? 1}: {CHAPTER_TITLES[save?.chapter ?? 1] ?? ''}
              </div>
            </div>
            <div style={{ fontSize: 36, animation: 'float 3s ease-in-out infinite' }}>📜</div>
          </div>

          {/* Zone progress bar */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>{currentZone.icon} {currentZone.name}</span>
              <span style={{ color: isBossNext ? 'var(--red)' : 'var(--text-muted)' }}>
                {isBossNext ? '👑 บอส!' : `${stepsDone}/${currentZone.steps} การต่อสู้`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {Array.from({ length: currentZone.steps }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 8, borderRadius: 4,
                  background: i < stepsDone
                    ? 'var(--green)'
                    : i === stepsDone
                      ? (isBossNext ? 'rgba(255,71,87,0.8)' : 'rgba(245,197,24,0.6)')
                      : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
            {isBossNext && (
              <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 6, fontWeight: 700 }}>
                ⚠️ การต่อสู้ถัดไปเป็น BOSS — เตรียมทีมให้พร้อม!
              </div>
            )}
          </div>

          {/* CTA button */}
          <button
            type="button"
            className="btn btn-full btn-red"
            style={{ marginTop: 14 }}
            onClick={() => navigate('/battle')}
          >
            {zoneFinal
              ? '🏆 โซนนี้ผ่านแล้ว — เดินทางต่อ'
              : isBossNext
                ? `👑 สู้บอส — ${currentZone.name}`
                : `⚔️ สำรวจ ${currentZone.name} (${stepsDone}/${currentZone.steps})`}
          </button>
        </div>

        {/* Zone list */}
        <div>
          <div className="section-hd">
            <span className="section-title">🗺️ โซนทั้งหมด</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ZONE_DEFS.map((zone, idx) => {
              const isCleared = idx < currentIdx || (idx === currentIdx && zoneFinal);
              const isCurrent = idx === currentIdx && !zoneFinal;
              const isLocked  = idx > currentIdx;

              return (
                <div
                  key={zone.id}
                  onClick={() => isCurrent && navigate('/battle')}
                  style={{
                    background: isCleared
                      ? 'linear-gradient(135deg, rgba(38,222,129,0.06), var(--bg-card))'
                      : isCurrent
                        ? 'linear-gradient(135deg, rgba(245,197,24,0.1), var(--bg-card))'
                        : 'var(--bg-card)',
                    border: isCleared
                      ? '1px solid rgba(38,222,129,0.3)'
                      : isCurrent
                        ? '1.5px solid rgba(245,197,24,0.4)'
                        : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 'var(--r-lg)',
                    padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    opacity: isLocked ? 0.45 : 1,
                    cursor: isCurrent ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ fontSize: 28 }}>
                    {isLocked ? '🔒' : isCleared ? '✅' : zone.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {zone.name}
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>บทที่ {zone.chapter}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: isCurrent ? 6 : 0 }}>
                      {zone.desc}
                    </div>
                    {isCurrent && (
                      <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                        {Array.from({ length: zone.steps }).map((_, i) => (
                          <div key={i} style={{
                            flex: 1, height: 5, borderRadius: 3,
                            background: i < stepsDone
                              ? 'var(--green)'
                              : i === stepsDone
                                ? (isBossNext ? 'rgba(255,71,87,0.7)' : 'rgba(245,197,24,0.5)')
                                : 'rgba(255,255,255,0.08)',
                          }} />
                        ))}
                      </div>
                    )}
                    {isCurrent && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        ศัตรู: {zone.enemies.map(t => GHOST_REG[t]?.nameTh ?? t).join(', ')}
                      </div>
                    )}
                  </div>
                  {isCurrent && (
                    <span style={{
                      padding: '4px 10px',
                      background: 'rgba(245,197,24,0.15)',
                      borderRadius: 'var(--r-full)',
                      fontSize: 11, fontWeight: 700,
                      color: 'var(--gold)',
                      whiteSpace: 'nowrap',
                    }}>
                      อยู่ที่นี่
                    </span>
                  )}
                  {isCleared && (
                    <span style={{
                      padding: '4px 10px',
                      background: 'rgba(38,222,129,0.12)',
                      borderRadius: 'var(--r-full)',
                      fontSize: 11, fontWeight: 700,
                      color: 'var(--green)',
                      whiteSpace: 'nowrap',
                    }}>
                      ผ่านแล้ว
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
