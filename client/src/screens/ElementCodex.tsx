import ScreenHeader from '../components/ScreenHeader';

const ELEMENTS = [
  { id: 'fire',  label: '🔥 ไฟ',    color: 'var(--el-fire)',  strong: 'ลม/ไม้', weak: 'น้ำ' },
  { id: 'water', label: '💧 น้ำ',   color: 'var(--el-water)', strong: 'ไฟ',     weak: 'ดิน' },
  { id: 'wood',  label: '🌿 ลม/ไม้', color: 'var(--el-wood)', strong: 'ดิน',    weak: 'โลหะ' },
  { id: 'earth', label: '⛰️ ดิน',   color: 'var(--el-earth)', strong: 'น้ำ',    weak: 'ลม/ไม้' },
  { id: 'metal', label: '⚙️ โลหะ',  color: 'var(--el-metal)', strong: 'ลม/ไม้', weak: 'ไฟ' },
  { id: 'dark',  label: '🌑 มืด',   color: 'var(--el-dark)',  strong: 'แสง',    weak: 'แสง' },
  { id: 'light', label: '☀️ แสง',   color: 'var(--el-light)', strong: 'มืด',    weak: 'มืด' },
];

const EL_SHORT: Record<string, string> = {
  fire: '🔥', water: '💧', wood: '🌿', earth: '⛰️', metal: '⚙️', dark: '🌑', light: '☀️',
};

const CHART: Record<string, Record<string, number>> = {
  fire:  { fire:1, water:0.75, wood:1.33, earth:1, metal:0.75, dark:1, light:1 },
  water: { fire:1.33, water:1, wood:1, earth:0.75, metal:1, dark:1, light:1 },
  wood:  { fire:1, water:1, wood:1, earth:1.33, metal:0.75, dark:1, light:1 },
  earth: { fire:1, water:1.33, wood:0.75, earth:1, metal:1, dark:1, light:1 },
  metal: { fire:0.75, water:1, wood:1.33, earth:1, metal:1, dark:1, light:1 },
  dark:  { fire:1, water:1, wood:1, earth:1, metal:1, dark:1, light:1.33 },
  light: { fire:1, water:1, wood:1, earth:1, metal:1, dark:1.33, light:1 },
};

export default function ElementCodex() {
  return (
    <div className="screen fade-in">
      <ScreenHeader title="📚 ตำราธาตุ" back />

      <div className="screen-content">
        {/* Formula card */}
        <div className="card" style={{ border: '1px solid rgba(245,197,24,0.2)' }}>
          <div className="label-sm" style={{ marginBottom: 8 }}>สูตรความเสียหาย</div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            color: 'var(--cyan)',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--r-md)',
            padding: '10px 12px',
            lineHeight: 1.8,
          }}>
            Physical = power × (STR/100) × elemMod − (DEF × 0.4)<br />
            Magical   = power × (MAG/100) × elemMod − (SPR × 0.4)
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 32, height: 16, background: 'rgba(38,222,129,0.3)',
                border: '1px solid var(--green)', borderRadius: 4, display: 'inline-block',
              }} />
              <span style={{ fontSize: 11, color: 'var(--green)' }}>×1.33 (ชนะ)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 32, height: 16, background: 'rgba(255,71,87,0.3)',
                border: '1px solid var(--red)', borderRadius: 4, display: 'inline-block',
              }} />
              <span style={{ fontSize: 11, color: 'var(--red)' }}>×0.75 (แพ้)</span>
            </div>
          </div>
        </div>

        {/* Advantage list */}
        <div>
          <div className="section-hd">
            <span className="section-title">ตารางธาตุ</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ELEMENTS.map(el => (
              <div
                key={el.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: 'var(--bg-card)',
                  border: `1px solid ${el.color}25`,
                  borderRadius: 'var(--r-lg)',
                }}
              >
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 'var(--r-md)',
                  background: `${el.color}20`,
                  border: `1.5px solid ${el.color}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {el.label.split(' ')[0]}
                </div>
                <div style={{ minWidth: 60, fontWeight: 700, fontSize: 13 }}>{el.label.split(' ').slice(1).join(' ')}</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: 'var(--green)' }}>▲ ชนะ: </span>
                    <span style={{ color: 'var(--text-light)' }}>{el.strong}</span>
                  </div>
                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: 'var(--red)' }}>▼ แพ้:  </span>
                    <span style={{ color: 'var(--text-light)' }}>{el.weak}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Matrix */}
        <div>
          <div className="section-hd">
            <span className="section-title">Matrix (แนวนอน = ผู้โจมตี, แนวตั้ง = เป้าหมาย)</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 320 }}>
              {/* Header row */}
              <div style={{ display: 'flex', marginBottom: 2 }}>
                <div style={{ width: 36, flexShrink: 0 }} />
                {Object.keys(CHART).map(el => (
                  <div key={el} style={{
                    flex: 1, textAlign: 'center', fontSize: 14, padding: '4px 2px',
                  }}>{EL_SHORT[el]}</div>
                ))}
              </div>
              {/* Data rows */}
              {Object.entries(CHART).map(([defender, row]) => (
                <div key={defender} style={{ display: 'flex', marginBottom: 2 }}>
                  <div style={{ width: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                    {EL_SHORT[defender]}
                  </div>
                  {Object.values(row).map((mod, i) => (
                    <div key={i} style={{
                      flex: 1,
                      textAlign: 'center',
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 700,
                      padding: '5px 2px',
                      borderRadius: 4,
                      background: mod > 1
                        ? 'rgba(38,222,129,0.2)'
                        : mod < 1
                          ? 'rgba(255,71,87,0.2)'
                          : 'var(--bg-elevated)',
                      color: mod > 1 ? 'var(--green)' : mod < 1 ? 'var(--red)' : 'var(--text-muted)',
                      margin: 1,
                    }}>
                      {mod === 1 ? '—' : mod.toFixed(2).replace('0.', '.')}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
