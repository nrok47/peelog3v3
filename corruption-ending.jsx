// corruption-ending.jsx — Phase 3 Endgame: Corruption Ending Preview
// Corruption 0–30 → Good End (ผู้พิทักษ์)
// Corruption 31–69 → Neutral End (ผู้เดินระหว่างโลก)
// Corruption 70–100 → Bad End (ปีศาจสมบูรณ์)
// Special unlock → True End (ปลดล็อกเงื่อนไขพิเศษ)

const ENDING_DATA = [
  {
    id: "good",
    threshold: [0, 30],
    label: "GOOD END",
    thaiTitle: "ผู้พิทักษ์",
    subtitle: "Bearer of Darkness",
    color: "#7df096",
    accent: "#3aad5c",
    corruptionLabel: "อาถรรพ์ต่ำ",
    bgGlow: "#0a2e14",
    icon: "☽",
    quote: `"คุณเอาชนะได้ — แต่ไม่ใช่มนุษย์ 100% อีกต่อไป
ความมืดที่คุณแบกไว้กลายเป็นโล่กำบัง
คุณเดินต่อไปในฐานะผู้พิทักษ์
ที่โลกไม่มีวันลืม…"`,
    rewards: [
      { icon: "✦", text: "ปลดล็อก: แม่เจ้าของ Mythic VI★" },
      { icon: "◆", text: "ตำแหน่ง: จอมขมังเวทแห่งแสง" },
      { icon: "◇", text: "Spirit Dust ×50,000" },
    ],
    statusEffects: [
      { label: "Bond ทีม", value: "+25 ทุกตัว", good: true },
      { label: "Corruption", value: "ล้างสะอาด", good: true },
      { label: "New Game+", value: "ผีเริ่มที่ Lv.15", good: true },
    ],
  },
  {
    id: "neutral",
    threshold: [31, 69],
    label: "NEUTRAL END",
    thaiTitle: "ผู้เดินระหว่างโลก",
    subtitle: "Walker Between Worlds",
    color: "#e8c764",
    accent: "#d4af37",
    corruptionLabel: "อาถรรพ์กลาง",
    bgGlow: "#2a1e04",
    icon: "✸",
    quote: `"คุณยืนอยู่บนเส้นบางๆ
ระหว่างแสงและความมืด
ทั้งสองโลกต้องการคุณ
แต่ไม่มีใครไว้วางใจคุณได้…"`,
    rewards: [
      { icon: "✦", text: "ปลดล็อก: ผีตายโหง · Corrupted Form" },
      { icon: "◆", text: "ตำแหน่ง: ผู้ส่งสาร" },
      { icon: "◇", text: "Spirit Dust ×28,000" },
    ],
    statusEffects: [
      { label: "Bond ทีม", value: "+8 ทุกตัว", good: true },
      { label: "Corruption", value: "ลด 30%", good: true },
      { label: "New Game+", value: "ผีเริ่มที่ Lv.10", good: false },
    ],
  },
  {
    id: "bad",
    threshold: [70, 100],
    label: "BAD END",
    thaiTitle: "ปีศาจสมบูรณ์",
    subtitle: "The Consumed",
    color: "#e879f9",
    accent: "#c026d3",
    corruptionLabel: "อาถรรพ์เต็มขีด",
    bgGlow: "#2a0830",
    icon: "⬡",
    quote: `"พลังกลืนกินคุณสมบูรณ์แบบ
คุณไม่ใช่จอมขมังเวทอีกต่อไป
คุณคือสิ่งที่ทุกคนหวาดกลัว
โลกเข้าสู่ยุคมืด…"`,
    rewards: [
      { icon: "✦", text: "ปลดล็อก: Demon Form · ผีทุกตัว" },
      { icon: "◆", text: "ตำแหน่ง: เจ้าแห่งความมืด" },
      { icon: "◇", text: "Spirit Dust ×15,000" },
    ],
    statusEffects: [
      { label: "Bond ทีม", value: "รีเซ็ต", good: false },
      { label: "Corruption", value: "MAX ถาวร", good: false },
      { label: "New Game+", value: "Hard Mode บังคับ", good: false },
    ],
  },
  {
    id: "true",
    threshold: null, // unlock condition
    label: "TRUE END",
    thaiTitle: "ตำนานขมังเวท",
    subtitle: "The Ascended",
    color: "#ff9f7d",
    accent: "#ff6b35",
    corruptionLabel: "เงื่อนไขพิเศษ",
    bgGlow: "#2a1408",
    icon: "⬟",
    quote: `"บอนด์ 100 · Corruption ≤ 20
ชนะ 4 Mentor battle
ปลด ending อื่นทั้งหมด"`,
    rewards: [
      { icon: "✦", text: "ปลดล็อก: อสุรกาย Mythic VII★" },
      { icon: "◆", text: "ตำแหน่ง: จอมขมังเวทตำนาน" },
      { icon: "◇", text: "Spirit Dust ×∞" },
    ],
    locked: true,
  },
];

// ── Corruption meter arc (SVG donut)
function CorruptionArc({ value = 45 }) {
  const R = 58, CX = 70, CY = 70;
  const circ = 2 * Math.PI * R;
  const filled = (value / 100) * circ;
  const col = value < 31 ? "#7df096" : value < 70 ? "#e8c764" : "#e879f9";
  const label = value < 31 ? "ต่ำ" : value < 70 ? "กลาง" : "วิกฤต";

  return (
    <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Track */}
        <circle cx={CX} cy={CY} r={R} fill="none"
          stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        {/* Fill */}
        <circle cx={CX} cy={CY} r={R} fill="none"
          stroke={col} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          transform={`rotate(-90 ${CX} ${CY})`}
          style={{ filter: `drop-shadow(0 0 6px ${col}88)` }}
        />
        {/* Tick marks */}
        {[30, 70].map((pct, i) => {
          const ang = ((pct / 100) * 360 - 90) * (Math.PI / 180);
          const x1 = CX + (R - 6) * Math.cos(ang);
          const y1 = CY + (R - 6) * Math.sin(ang);
          const x2 = CX + (R + 4) * Math.cos(ang);
          const y2 = CY + (R + 4) * Math.sin(ang);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="var(--hairline-strong)" strokeWidth="1" />;
        })}
      </svg>
      {/* Center */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontFamily: "var(--f-mono)", fontSize: 26, fontWeight: 700, color: col, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontFamily: "var(--f-mono)", fontSize: 9, color: col, opacity: 0.7, marginTop: 2 }}>
          {label}
        </div>
        <div className="eyebrow-mute" style={{ fontSize: 7, marginTop: 3 }}>CORRUPTION</div>
      </div>
    </div>
  );
}

// ── Ending card (one of 4)
function EndingCard({ ending, active, currentCorruption }) {
  const inRange = ending.threshold
    ? currentCorruption >= ending.threshold[0] && currentCorruption <= ending.threshold[1]
    : false;
  const isActive = active || inRange;

  return (
    <div style={{
      border: `1px solid ${isActive ? ending.color : "var(--hairline)"}`,
      background: isActive
        ? `linear-gradient(135deg, ${ending.bgGlow || "rgba(0,0,0,0.4)"}, rgba(0,0,0,0.6))`
        : "rgba(0,0,0,0.3)",
      padding: "8px 10px",
      position: "relative",
      opacity: ending.locked ? 0.55 : 1,
      transition: "all 0.2s",
    }}>
      {/* Active glow top border */}
      {isActive && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1.5,
          background: `linear-gradient(90deg, transparent, ${ending.color}, transparent)`,
        }} />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        {/* Icon */}
        <div style={{
          width: 30, height: 30, flexShrink: 0,
          border: `1px solid ${isActive ? ending.color : "var(--hairline)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: isActive ? `${ending.accent}22` : "rgba(0,0,0,0.4)",
          fontSize: 14,
          color: isActive ? ending.color : "var(--bone-mute)",
          fontFamily: "var(--f-mono)",
          boxShadow: isActive ? `0 0 10px ${ending.color}44` : "none",
        }}>
          {ending.locked ? "🔒" : ending.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              fontFamily: "var(--f-mono)", fontSize: 8, fontWeight: 700,
              color: isActive ? ending.color : "var(--bone-mute)",
              letterSpacing: 0.15,
            }}>{ending.label}</span>
            {isActive && !ending.locked && (
              <span style={{
                background: ending.color, color: "var(--ink)",
                fontFamily: "var(--f-mono)", fontSize: 7, fontWeight: 700,
                padding: "1px 5px", letterSpacing: 0.1,
              }}>▶ NOW</span>
            )}
            {ending.locked && (
              <span style={{
                border: "1px solid var(--gold)", color: "var(--gold-soft)",
                fontFamily: "var(--f-mono)", fontSize: 7, padding: "1px 5px",
              }}>SECRET</span>
            )}
          </div>

          <div className="thai-display" style={{
            fontSize: 14, lineHeight: 1.1, marginTop: 2,
            color: isActive ? "var(--bone)" : "var(--bone-mute)",
          }}>{ending.thaiTitle}</div>
          <div style={{ fontSize: 9, color: ending.locked ? "var(--bone-mute)" : ending.accent, marginTop: 1 }}>
            {ending.locked ? ending.quote : ending.subtitle}
          </div>

          {/* Threshold badge */}
          {ending.threshold && (
            <div style={{
              marginTop: 4, display: "inline-flex", alignItems: "center", gap: 3,
              border: `1px solid ${ending.color}66`, padding: "1px 5px",
              background: `${ending.color}11`,
            }}>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 7, color: ending.color }}>
                CORRUPTION {ending.threshold[0]}–{ending.threshold[1]}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main screen (live — reads window.GS.save)
function CorruptionEndingScreen() {
  // ── Live data from GS
  const save       = window.GS?.save;
  const corruption = save?.corruption_score ?? 45;
  const activeEnding = ENDING_DATA.find(e =>
    e.threshold && corruption >= e.threshold[0] && corruption <= e.threshold[1]
  ) || ENDING_DATA[1];

  // ── True End unlock check
  const mentorBonds = save?.mentor_bonds || {};
  const allMentorBonded = Object.values(mentorBonds).every(v => v >= 60);
  const trueEndUnlocked = corruption <= 20 && allMentorBonded;

  // ── Real decisions from save, fallback to demo
  const rawDecisions = save?.decisions || [];
  const decisions = rawDecisions.length > 0
    ? rawDecisions.map(d => ({
        turn:   d.turn   || 'บท ?',
        choice: d.choice || d.effect || '?',
        effect: d.effect || '',
        bad:    (d.corruption_delta || 0) > 0,
      }))
    : [
        { turn: "บท 2", choice: "ใช้ท่าต้องห้าม", effect: "+18 Corruption", bad: true },
        { turn: "บท 2", choice: "ช่วยชี", effect: "Bond +12, −5 Corruption", bad: false },
        { turn: "บท 3", choice: "ปล่อยปีศาจในร่างแม่", effect: "+22 Corruption", bad: true },
        { turn: "บท 3", choice: "ฟังพระ", effect: "−10 Corruption", bad: false },
      ];

  return (
    <div className="screen" style={{
      background: `radial-gradient(ellipse 100% 55% at 50% 20%, ${activeEnding.bgGlow || "#0a0a20"}, var(--void) 65%)`,
    }}>
      <div className="noise" />
      <StatusBar />

      {/* Header */}
      <div style={{ padding: "0 14px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", width: 28, height: 28, color: "var(--bone)", borderRadius: 2 }}>
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6.5 1 L2 5 L6.5 9" /></svg>
        </button>
        <div style={{ textAlign: "center" }}>
          <div className="eyebrow">ENDING PREVIEW · บทสรุป</div>
          <div className="thai-display" style={{ fontSize: 15, color: activeEnding.color, lineHeight: 1.1, marginTop: 1,
            textShadow: `0 0 12px ${activeEnding.color}66` }}>
            {activeEnding.thaiTitle}
          </div>
        </div>
        <div style={{ width: 28 }} />
      </div>

      <Ornament />

      {/* Corruption arc + active ending info */}
      <div style={{ padding: "8px 14px 6px", display: "flex", alignItems: "center", gap: 12 }}>
        <CorruptionArc value={corruption} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--f-mono)", fontSize: 8,
            color: activeEnding.color, letterSpacing: 0.15, marginBottom: 3,
          }}>{activeEnding.label} · {activeEnding.corruptionLabel}</div>
          <div className="thai-display" style={{ fontSize: 18, lineHeight: 1.1, color: "var(--bone)" }}>
            {activeEnding.thaiTitle}
          </div>
          <div style={{ fontSize: 9, color: activeEnding.accent, marginTop: 2 }}>
            {activeEnding.subtitle}
          </div>

          {/* Status effects */}
          {activeEnding.statusEffects && (
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
              {activeEnding.statusEffects.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: s.good ? "#7df096" : "#ff7777", width: 5 }}>
                    {s.good ? "▲" : "▼"}
                  </span>
                  <span style={{ fontSize: 9, color: "var(--bone-mute)" }}>{s.label}</span>
                  <span style={{ fontSize: 9, color: s.good ? "#7df096" : "#ff9f9f", marginLeft: "auto" }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quote */}
      <div style={{ padding: "0 14px 6px" }}>
        <div style={{
          background: "rgba(0,0,0,0.45)",
          border: `1px solid ${activeEnding.color}33`,
          borderLeft: `3px solid ${activeEnding.color}`,
          padding: "7px 10px",
        }}>
          <div style={{ fontSize: 10, color: "var(--bone-mute)", fontStyle: "italic", lineHeight: 1.5, whiteSpace: "pre-line" }}>
            {activeEnding.quote}
          </div>
        </div>
      </div>

      {/* All endings overview */}
      <div style={{ padding: "0 14px 4px" }}>
        <div className="eyebrow-mute" style={{ fontSize: 8, marginBottom: 5 }}>ฉากจบที่เป็นไปได้ · POSSIBLE ENDINGS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {ENDING_DATA.map(e => (
            <EndingCard key={e.id} ending={e} currentCorruption={corruption}
              active={e.id==='true' ? trueEndUnlocked : undefined} />
          ))}
        </div>
      </div>

      {/* Decision log */}
      <div style={{ padding: "6px 14px 4px" }}>
        <div className="eyebrow-mute" style={{ fontSize: 8, marginBottom: 4 }}>การตัดสินใจสำคัญ · KEY DECISIONS</div>
        <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", padding: "4px 8px" }}>
          {decisions.map((d, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "50px 1fr auto",
              gap: 6, padding: "3px 0",
              borderBottom: i < decisions.length - 1 ? "1px dashed var(--faint)" : "none",
              alignItems: "baseline",
            }}>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 8, color: "var(--bone-mute)" }}>{d.turn}</span>
              <span style={{ fontSize: 9, color: "var(--bone)" }}>{d.choice}</span>
              <span style={{ fontSize: 9, color: d.bad ? "#e879f9" : "#7df096", fontFamily: "var(--f-mono)" }}>
                {d.effect}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards */}
      <div style={{ padding: "0 14px 4px" }}>
        <div className="eyebrow-mute" style={{ fontSize: 8, marginBottom: 4 }}>รางวัลฉากจบ · END REWARDS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {activeEnding.rewards.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ color: activeEnding.color, fontSize: 11, width: 14, textAlign: "center" }}>{r.icon}</span>
              <span style={{ fontSize: 10, color: "var(--bone)" }}>{r.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        padding: "8px 14px 16px",
        background: "linear-gradient(180deg, transparent, var(--ink) 30%)",
        display: "flex", gap: 6,
      }}>
        <button style={{
          flex: 1,
          background: "rgba(0,0,0,0.6)",
          border: "1px solid var(--hairline-strong)",
          color: "var(--bone-soft)",
          fontFamily: "var(--f-display)",
          fontSize: 12, padding: "9px 8px",
          cursor: "pointer",
        }}>
          ↺ เล่นใหม่
        </button>
        <button style={{
          flex: 2,
          background: `linear-gradient(180deg, ${activeEnding.color}cc, ${activeEnding.accent})`,
          border: `1px solid ${activeEnding.color}`,
          color: "var(--ink)",
          fontFamily: "var(--f-display)",
          fontWeight: 700, fontSize: 13,
          padding: "9px 12px", letterSpacing: 0.3,
          boxShadow: `0 0 18px ${activeEnding.color}44`,
          cursor: "pointer",
        }}>
          ✦ ชมฉากจบ · {activeEnding.thaiTitle}
        </button>
      </div>
    </div>
  );
}

window.CorruptionEndingScreen = CorruptionEndingScreen;
