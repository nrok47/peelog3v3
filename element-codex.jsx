// element-codex.jsx — Element wheel + damage formula screen

const ELEMENTS = [
  { id: "fire", thai: "ไฟ", name: "หทัย", romaji: "FIRE", color: "var(--el-fire)", glyph: "🜂", angle: -90, beats: "wind" },
  { id: "wind", thai: "ลม", name: "วาโย", romaji: "WIND", color: "var(--el-wind)", glyph: "🜁", angle: -18, beats: "earth" },
  { id: "earth", thai: "ดิน", name: "ปฐพี", romaji: "EARTH", color: "var(--el-earth)", glyph: "🜃", angle: 54, beats: "water" },
  { id: "water", thai: "น้ำ", name: "วารี", romaji: "WATER", color: "var(--el-water)", glyph: "🜄", angle: 126, beats: "fire" },
  { id: "occult", thai: "อาถรรพ์", name: "อาถรรพ์", romaji: "OCCULT", color: "var(--el-occult)", glyph: "✸", angle: -90, isCenter: true },
];

function ElementWheel({ size = 280, highlighted = "fire" }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.34;       // node distance from center
  const rOuter = size * 0.46;  // outer ring radius

  const positions = {};
  ELEMENTS.filter(e => !e.isCenter).forEach(e => {
    const rad = (e.angle * Math.PI) / 180;
    positions[e.id] = { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r };
  });
  positions.occult = { x: cx, y: cy };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ display: "block" }}>
      <defs>
        {ELEMENTS.filter(e => !e.isCenter).map(e => (
          <radialGradient id={`g-${e.id}`} key={e.id}>
            <stop offset="0%" stopColor={e.color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={e.color} stopOpacity="0" />
          </radialGradient>
        ))}
        <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--gold)" />
        </marker>
      </defs>

      {/* outer ring */}
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="var(--hairline-strong)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={rOuter - 4} fill="none" stroke="var(--gold)" strokeWidth="0.3" strokeDasharray="1 5" opacity="0.5" />
      <circle cx={cx} cy={cy} r={r - 14} fill="none" stroke="var(--hairline)" strokeWidth="0.4" />

      {/* yantra cardinal ticks */}
      {[0, 1, 2, 3, 4].map(i => {
        const a = ((i * 72 - 90) * Math.PI) / 180;
        return (
          <line key={i}
            x1={cx + Math.cos(a) * (rOuter - 8)}
            y1={cy + Math.sin(a) * (rOuter - 8)}
            x2={cx + Math.cos(a) * (rOuter + 4)}
            y2={cy + Math.sin(a) * (rOuter + 4)}
            stroke="var(--gold)"
            strokeWidth="0.6"
            opacity="0.5"
          />
        );
      })}

      {/* arrows between elements (rock-paper-scissors cycle) */}
      {ELEMENTS.filter(e => !e.isCenter).map(e => {
        const from = positions[e.id];
        const to = positions[e.beats];
        // shorten line endpoints so arrow doesn't overlap circles
        const dx = to.x - from.x, dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len, uy = dy / len;
        const pad = 28;
        return (
          <g key={`a-${e.id}`}>
            <line
              x1={from.x + ux * pad}
              y1={from.y + uy * pad}
              x2={to.x - ux * pad}
              y2={to.y - uy * pad}
              stroke="var(--gold)"
              strokeWidth="0.7"
              opacity="0.5"
              markerEnd="url(#arrowhead)"
            />
          </g>
        );
      })}

      {/* occult center — special */}
      <g>
        <circle cx={cx} cy={cy} r="22" fill="rgba(192,38,211,0.12)" stroke="var(--el-occult)" strokeWidth="0.8" strokeDasharray="2 2" />
        <circle cx={cx} cy={cy} r="14" fill="rgba(192,38,211,0.25)" stroke="var(--el-occult)" strokeWidth="0.5" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="16" fill="var(--corruption-soft)">✸</text>
      </g>

      {/* element nodes */}
      {ELEMENTS.filter(e => !e.isCenter).map(e => {
        const p = positions[e.id];
        const isHi = e.id === highlighted;
        return (
          <g key={e.id} transform={`translate(${p.x}, ${p.y})`}>
            <circle r="32" fill={`url(#g-${e.id})`} opacity={isHi ? 1 : 0.4} />
            <circle r="22" fill="rgba(0,0,0,0.6)" stroke={e.color} strokeWidth={isHi ? 1.6 : 0.8} />
            <text textAnchor="middle" y="-1" fontSize="14" fill={e.color}>{e.glyph}</text>
            <text textAnchor="middle" y="14" fontSize="9" fill={e.color} fontFamily="var(--f-mono)" fontWeight="600">{e.romaji}</text>
            <text textAnchor="middle" y="38" fontSize="11" fill={isHi ? "var(--bone)" : "var(--bone-mute)"} fontFamily="var(--f-display)" fontWeight="600">{e.thai}</text>
          </g>
        );
      })}
    </svg>
  );
}

function FormulaLine({ children, color }) {
  return (
    <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: color || "var(--bone)", letterSpacing: 0.02, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

function FormulaBox() {
  return (
    <div style={{ background: "rgba(0,0,0,0.45)", border: "1px solid var(--hairline-strong)", padding: "8px 10px", position: "relative" }}>
      <div style={{ position: "absolute", top: -1, left: -1, width: 8, height: 8, borderTop: "1px solid var(--gold)", borderLeft: "1px solid var(--gold)" }} />
      <div style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderBottom: "1px solid var(--gold)", borderRight: "1px solid var(--gold)" }} />

      <div className="eyebrow" style={{ marginBottom: 4 }}>DAMAGE FORMULA · สูตรดาเมจ</div>

      {/* Formula expression */}
      <div style={{ padding: "6px 0", borderTop: "1px dashed var(--faint)", borderBottom: "1px dashed var(--faint)", marginBottom: 6 }}>
        <FormulaLine>
          <span style={{ color: "var(--bone-mute)" }}>DMG = </span>
          <span style={{ color: "var(--gold-soft)" }}>(BaseATK + AffixBonus × LvScale)</span>
        </FormulaLine>
        <div style={{ paddingLeft: 50, display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <div style={{ flex: 1, borderTop: "1px solid var(--gold)" }} />
          <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--bone-mute)" }}>×</span>
          <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--el-fire)" }}>ElementMult</span>
          <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--bone-mute)" }}>×</span>
          <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--corruption-soft)" }}>Corrupt</span>
        </div>
        <FormulaLine color="var(--bone-mute)">
          <span style={{ paddingLeft: 50 }}>DEF × 0.5 + 1</span>
        </FormulaLine>
      </div>

      {/* Worked example */}
      <div>
        <div className="eyebrow-mute" style={{ fontSize: 7, marginBottom: 4 }}>EXAMPLE · กระสือ → ผีตายโหง (fire vs fire)</div>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "2px 8px", alignItems: "baseline" }}>
          <span className="eyebrow-mute" style={{ fontSize: 9 }}>BaseATK</span>
          <span style={{ borderBottom: "1px dotted var(--faint)" }} />
          <span className="num" style={{ fontSize: 11, color: "var(--bone)" }}>284</span>

          <span className="eyebrow-mute" style={{ fontSize: 9 }}>+ Affix (×Lv32)</span>
          <span style={{ borderBottom: "1px dotted var(--faint)" }} />
          <span className="num" style={{ fontSize: 11, color: "var(--gold-soft)" }}>+ 178</span>

          <span className="eyebrow-mute" style={{ fontSize: 9 }}>× Element (fire→fire)</span>
          <span style={{ borderBottom: "1px dotted var(--faint)" }} />
          <span className="num" style={{ fontSize: 11, color: "var(--bone-mute)" }}>× 1.00</span>

          <span className="eyebrow-mute" style={{ fontSize: 9 }}>× Corruption (42%)</span>
          <span style={{ borderBottom: "1px dotted var(--faint)" }} />
          <span className="num" style={{ fontSize: 11, color: "var(--corruption-soft)" }}>× 1.08</span>

          <span className="eyebrow-mute" style={{ fontSize: 9 }}>÷ Defense 142</span>
          <span style={{ borderBottom: "1px dotted var(--faint)" }} />
          <span className="num" style={{ fontSize: 11, color: "var(--bone-mute)" }}>÷ 72.0</span>
        </div>

        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--gold)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="eyebrow" style={{ color: "var(--gold)" }}>FINAL DMG</span>
          <span className="num thai-display" style={{ fontSize: 22, color: "var(--gold-glow)", textShadow: "0 0 6px rgba(255,224,138,0.5)" }}>
            6.93<span style={{ fontSize: 14, color: "var(--gold-soft)", marginLeft: 2 }}>×</span> 
            <span style={{ color: "var(--bone)" }}> = </span>
            <span style={{ color: "var(--gold-glow)" }}>692</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function ElementCodexScreen() {
  return (
    <div className="screen" style={{
      background: `radial-gradient(ellipse 100% 50% at 50% 0%, #2a1632, var(--void) 60%)`,
    }}>
      <div className="noise" />
      <StatusBar />

      {/* Header */}
      <div style={{ padding: "0 14px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", width: 30, height: 30, color: "var(--bone)", borderRadius: 2 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6.5 1 L2 5 L6.5 9" /></svg>
        </button>
        <div className="eyebrow-mute">CODEX · 02 / 08</div>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", width: 30, height: 30, color: "var(--bone)", borderRadius: 2, fontSize: 14 }}>★</button>
      </div>

      <div style={{ padding: "0 18px 6px", textAlign: "center" }}>
        <div className="eyebrow">CODEX OF ELEMENTS · ตำราธาตุห้า</div>
        <div className="thai-display" style={{ fontSize: 22, color: "var(--gold-soft)", lineHeight: 1.1, marginTop: 2 }}>
          วงล้อธาตุห้า
        </div>
        <div style={{ fontSize: 10, color: "var(--bone-mute)", marginTop: 3 }}>
          วงจร +33% / −33% · อาถรรพ์ลด GUTS แต่ไม่กินทาง
        </div>
      </div>

      <Ornament />

      {/* Wheel */}
      <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 0" }}>
        <ElementWheel size={240} highlighted="fire" />
      </div>

      {/* Legend chips */}
      <div style={{ padding: "0 14px 6px", display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9, color: "var(--bone-mute)", fontFamily: "var(--f-mono)" }}>
          <span style={{ color: "var(--el-fire)" }}>ไฟ</span> ▸ <span style={{ color: "var(--el-wind)" }}>ลม</span> ▸ <span style={{ color: "var(--el-earth)" }}>ดิน</span> ▸ <span style={{ color: "var(--el-water)" }}>น้ำ</span> ▸ <span style={{ color: "var(--el-fire)" }}>ไฟ</span>
        </span>
      </div>

      {/* Multiplier matrix */}
      <div style={{ padding: "0 14px 6px" }}>
        <div className="eyebrow" style={{ marginBottom: 3 }}>MULTIPLIER MATRIX</div>
        <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", padding: "6px 8px", display: "grid", gridTemplateColumns: "auto repeat(5, 1fr)", gap: "3px 4px", fontFamily: "var(--f-mono)", fontSize: 9, alignItems: "center" }}>
          <span></span>
          {["ไฟ", "ลม", "ดิน", "น้ำ", "อาถรรพ์"].map(t => <span key={t} style={{ textAlign: "center", color: "var(--bone-mute)" }}>{t}</span>)}

          {[
            { row: "ไฟ", cells: ["1.00", "1.33", "1.00", "0.67", "1.00"], color: "var(--el-fire)" },
            { row: "ลม", cells: ["0.67", "1.00", "1.33", "1.00", "1.00"], color: "var(--el-wind)" },
            { row: "ดิน", cells: ["1.00", "0.67", "1.00", "1.33", "1.00"], color: "var(--el-earth)" },
            { row: "น้ำ", cells: ["1.33", "1.00", "0.67", "1.00", "1.00"], color: "var(--el-water)" },
            { row: "อาถรรพ์", cells: ["1.00", "1.00", "1.00", "1.00", "1.00"], color: "var(--el-occult)" },
          ].map((r, i) => (
            <React.Fragment key={i}>
              <span style={{ color: r.color, fontWeight: 600 }}>{r.row}</span>
              {r.cells.map((v, j) => {
                const isAdv = v === "1.33";
                const isWeak = v === "0.67";
                return (
                  <span key={j} style={{
                    textAlign: "center",
                    padding: "2px 0",
                    background: isAdv ? "rgba(212,175,55,0.15)" : isWeak ? "rgba(192,57,43,0.12)" : "transparent",
                    color: isAdv ? "var(--gold-glow)" : isWeak ? "var(--blood)" : "var(--bone-mute)",
                    fontWeight: isAdv || isWeak ? 600 : 400,
                  }}>{v}</span>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <div className="eyebrow-mute" style={{ fontSize: 7, marginTop: 4 }}>
          <span style={{ color: "var(--el-occult)" }}>อาถรรพ์</span> เป็นธาตุพิเศษ · ไม่แพ้-ชนะทาง แต่ลด GUTS ศัตรู 8 / ตี
        </div>
      </div>

      {/* Formula */}
      <div style={{ padding: "0 14px 14px" }}>
        <FormulaBox />
      </div>
    </div>
  );
}

window.ElementCodexScreen = ElementCodexScreen;
window.ElementWheel = ElementWheel;
