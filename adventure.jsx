// adventure.jsx — Adventure Scene (text-based roguelike event)
// Hybrid engine: Twine narrative injected into Roguelike Map.
// Each scene = 1 visual stage + narrative text + 2-3 branching choices.

// ──────────────────────────────────────────────
// Atmospheric scene visual — abstract composition, no real art.
// Uses yantra circles + candle ovals + smoke wisps (primitive shapes only).
// ──────────────────────────────────────────────
function SceneFrame({ kind = "shrine", height = 200 }) {
  // Different palettes per scene type
  const palette = {
    shrine: { glow: "var(--gold)", fog: "rgba(212,175,55,0.18)", mood: "#3a2010" },
    encounter: { glow: "var(--blood)", fog: "rgba(192,57,43,0.22)", mood: "#2a0e10" },
    rest: { glow: "var(--el-wind)", fog: "rgba(125,207,160,0.15)", mood: "#0e2a1a" },
    discovery: { glow: "var(--corruption-soft)", fog: "rgba(232,121,249,0.18)", mood: "#28102e" },
  }[kind];

  return (
    <div style={{
      position: "relative",
      height,
      background: `radial-gradient(ellipse 60% 80% at 50% 50%, ${palette.mood}, var(--ink) 80%)`,
      overflow: "hidden",
    }}>
      {/* Vignette stripes — implies dark alleyway / temple aisle */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "repeating-linear-gradient(90deg, transparent 0, transparent 18px, rgba(0,0,0,0.18) 18px, rgba(0,0,0,0.18) 19px)",
        opacity: 0.4,
        pointerEvents: "none",
      }} />

      {/* Top fade */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 30, background: "linear-gradient(180deg, var(--void), transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(0deg, var(--void), transparent)" }} />

      {/* SVG composition */}
      <svg viewBox="0 0 390 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="sceneGlow">
            <stop offset="0%" stopColor={palette.glow} stopOpacity="0.6" />
            <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sceneFog">
            <stop offset="0%" stopColor={palette.fog} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Background fog */}
        <circle cx="195" cy="120" r="160" fill="url(#sceneFog)" />
        <circle cx="195" cy="110" r="80" fill="url(#sceneGlow)" />

        {kind === "shrine" && (
          <>
            {/* Floating yantra ring above shrine */}
            <g transform="translate(195, 75)" opacity="0.7">
              <circle r="40" fill="none" stroke="var(--gold)" strokeWidth="0.5" strokeDasharray="2 3" />
              <circle r="30" fill="none" stroke="var(--gold)" strokeWidth="0.4" />
              <circle r="22" fill="rgba(212,175,55,0.08)" stroke="var(--gold-glow)" strokeWidth="0.6" />
              {/* yantra sigil */}
              <g stroke="var(--gold-glow)" strokeWidth="0.5" fill="none" opacity="0.8">
                <path d="M 0 -16 L 12 8 L -12 8 Z" />
                <path d="M 0 16 L 12 -8 L -12 -8 Z" />
                <circle r="6" />
              </g>
            </g>

            {/* Shrine altar — rectangular blocks */}
            <g transform="translate(195, 155)">
              <rect x="-35" y="-20" width="70" height="32" fill="#1a0c12" stroke="var(--gold-deep)" strokeWidth="0.5" />
              <rect x="-40" y="-22" width="80" height="6" fill="#0e0608" stroke="var(--gold-deep)" strokeWidth="0.4" />
              <rect x="-26" y="-30" width="52" height="10" fill="#160a10" stroke="var(--gold-deep)" strokeWidth="0.4" />
            </g>

            {/* Candle flames flanking */}
            <g transform="translate(165, 130)">
              <ellipse cx="0" cy="0" rx="2" ry="4" fill={palette.glow} opacity="0.9" />
              <circle cx="0" cy="0" r="6" fill={palette.glow} opacity="0.3" />
            </g>
            <g transform="translate(225, 130)">
              <ellipse cx="0" cy="0" rx="2" ry="4" fill={palette.glow} opacity="0.9" />
              <circle cx="0" cy="0" r="6" fill={palette.glow} opacity="0.3" />
            </g>

            {/* incense smoke wisps */}
            <g opacity="0.4" stroke={palette.glow} strokeWidth="0.6" fill="none">
              <path d="M 165 120 Q 168 100 162 80 Q 168 60 160 40" />
              <path d="M 225 120 Q 222 100 228 80 Q 222 60 230 40" />
            </g>
          </>
        )}

        {kind === "encounter" && (
          <>
            {/* Tall stone gate — silhouette */}
            <rect x="80" y="60" width="14" height="140" fill="#0a0608" stroke="var(--gold-deep)" strokeWidth="0.4" />
            <rect x="296" y="60" width="14" height="140" fill="#0a0608" stroke="var(--gold-deep)" strokeWidth="0.4" />
            <rect x="80" y="60" width="230" height="10" fill="#0a0608" />
            <ellipse cx="195" cy="65" rx="20" ry="3" fill="var(--gold-deep)" opacity="0.4" />

            {/* Floating ghost orbs */}
            <g opacity="0.7">
              <circle cx="160" cy="130" r="4" fill="var(--corruption-soft)" opacity="0.6" />
              <circle cx="160" cy="130" r="10" fill={palette.glow} opacity="0.2" />
              <circle cx="230" cy="115" r="3" fill="var(--corruption-soft)" opacity="0.5" />
              <circle cx="230" cy="115" r="8" fill={palette.glow} opacity="0.2" />
              <circle cx="195" cy="145" r="5" fill={palette.glow} opacity="0.7" />
              <circle cx="195" cy="145" r="14" fill={palette.glow} opacity="0.18" />
            </g>
          </>
        )}

        {kind === "rest" && (
          <>
            {/* Campfire — pile of logs + flame */}
            <ellipse cx="195" cy="170" rx="50" ry="8" fill="rgba(0,0,0,0.6)" />
            <rect x="170" y="155" width="50" height="6" fill="#3a2010" transform="rotate(-8 195 158)" />
            <rect x="170" y="160" width="50" height="6" fill="#2a1a08" transform="rotate(6 195 163)" />

            {/* flame */}
            <g transform="translate(195, 130)">
              <ellipse cx="0" cy="10" rx="14" ry="20" fill={palette.glow} opacity="0.4" />
              <ellipse cx="0" cy="15" rx="8" ry="12" fill={palette.glow} opacity="0.8" />
              <ellipse cx="0" cy="18" rx="4" ry="7" fill="var(--gold-glow)" />
              <circle cx="0" cy="20" r="2" fill="#fff" opacity="0.8" />
            </g>

            {/* sparks */}
            {[[170, 100], [220, 90], [185, 70], [210, 110], [180, 85]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={1.5 - (i * 0.2)} fill={palette.glow} opacity={0.7 - i * 0.1} />
            ))}
          </>
        )}
      </svg>

      {/* Decorative corner marks */}
      {[
        { top: 8, left: 8, b: "L T" },
        { top: 8, right: 8, b: "R T" },
        { bottom: 8, left: 8, b: "L B" },
        { bottom: 8, right: 8, b: "R B" },
      ].map((c, i) => (
        <div key={i} style={{
          position: "absolute", top: c.top, left: c.left, right: c.right, bottom: c.bottom,
          width: 12, height: 12,
          borderTop: c.b.includes("T") ? "1px solid var(--gold)" : "none",
          borderLeft: c.b.includes("L") ? "1px solid var(--gold)" : "none",
          borderRight: c.b.includes("R") ? "1px solid var(--gold)" : "none",
          borderBottom: c.b.includes("B") ? "1px solid var(--gold)" : "none",
          opacity: 0.6,
        }} />
      ))}
    </div>
  );
}

// Choice card — narrative option with outcome tags
function ChoiceCard({ label, en, desc, rewards, risks, requirement, recommended, locked, onClick }) {
  return (
    <button onClick={onClick} disabled={locked} style={{
      width: "100%",
      background: recommended
        ? "linear-gradient(180deg, rgba(212,175,55,0.15), rgba(0,0,0,0.4))"
        : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.4))",
      border: `1px solid ${recommended ? "var(--gold)" : "var(--hairline)"}`,
      padding: "9px 12px",
      textAlign: "left",
      color: "var(--bone)",
      cursor: locked ? "not-allowed" : "pointer",
      borderRadius: 2,
      fontFamily: "inherit",
      position: "relative",
      opacity: locked ? 0.5 : 1,
      marginBottom: 6,
    }}>
      {recommended && (
        <div style={{ position: "absolute", top: -7, left: 10, padding: "1px 6px", background: "var(--gold)", color: "var(--ink)", fontFamily: "var(--f-mono)", fontSize: 7, letterSpacing: 0.15, fontWeight: 700 }}>
          ★ RECOMMENDED
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <span className="thai-display" style={{ fontSize: 13, color: recommended ? "var(--gold-soft)" : "var(--bone)" }}>
          {label}
        </span>
        <span className="eyebrow-mute" style={{ fontSize: 7 }}>{en}</span>
      </div>
      {desc && <div style={{ fontSize: 10, color: "var(--bone-mute)", lineHeight: 1.4, marginBottom: 6 }}>{desc}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {rewards?.map((r, i) => (
          <span key={`r${i}`} className="num" style={{ fontSize: 9, color: "#7df096", border: "1px solid rgba(125,240,150,0.3)", padding: "1px 5px", background: "rgba(125,240,150,0.06)" }}>
            +{r}
          </span>
        ))}
        {risks?.map((r, i) => (
          <span key={`x${i}`} className="num" style={{ fontSize: 9, color: "var(--corruption-soft)", border: "1px solid rgba(232,121,249,0.3)", padding: "1px 5px", background: "rgba(232,121,249,0.06)" }}>
            {r}
          </span>
        ))}
        {requirement && (
          <span className="eyebrow" style={{ fontSize: 8, color: "var(--gold-soft)", border: "1px dashed var(--gold-deep)", padding: "1px 5px" }}>
            REQ · {requirement}
          </span>
        )}
      </div>
    </button>
  );
}

// ──────────────────────────────────────────────
// AdventureScreen
// ──────────────────────────────────────────────
function AdventureScreen() {
  return (
    <div className="screen" style={{
      background: "var(--void)",
    }}>
      <div className="noise" />
      <StatusBar />

      {/* Top HUD */}
      <div style={{ padding: "0 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button style={{ background: "rgba(0,0,0,0.5)", border: "1px solid var(--hairline)", width: 26, height: 26, color: "var(--bone)", borderRadius: 2, padding: 0 }}>
          <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><rect x="2" y="1" width="2" height="8" /><rect x="6" y="1" width="2" height="8" /></svg>
        </button>
        <div style={{ textAlign: "center" }}>
          <div className="eyebrow-mute" style={{ fontSize: 7 }}>บทที่ 02 · ห้องที่ 5 / 12</div>
          <div className="eyebrow" style={{ fontSize: 9, marginTop: 1 }}>EVENT · DISCOVERY</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--corruption-soft)" }}>◇</span>
          <span className="num" style={{ fontSize: 11, color: "var(--corruption-soft)" }}>240</span>
        </div>
      </div>

      <Ornament />

      {/* Scene visual */}
      <div style={{ position: "relative", marginTop: 6 }}>
        <SceneFrame kind="encounter" height={210} />
        {/* Floating event title */}
        <div style={{
          position: "absolute",
          bottom: 12,
          left: 0,
          right: 0,
          textAlign: "center",
        }}>
          <div className="eyebrow" style={{ color: "var(--corruption-soft)", letterSpacing: 0.2 }}>
            ◆ TWINE NODE · ev_02_alley_07
          </div>
          <div className="thai-display" style={{ fontSize: 26, color: "var(--gold-soft)", lineHeight: 1.05, marginTop: 4, textShadow: "0 2px 16px rgba(0,0,0,0.8)" }}>
            เสียงร้องในตรอก
          </div>
          <div style={{ fontSize: 10, color: "var(--bone-mute)", marginTop: 2 }}>
            <span style={{ color: "var(--corruption-soft)" }}>"แม่จ๋า ช่วยหนูที..."</span>
          </div>
        </div>
      </div>

      {/* Narrative body */}
      <div style={{ padding: "10px 16px 8px" }}>
        <div style={{
          fontSize: 12,
          color: "var(--bone)",
          lineHeight: 1.65,
          textWrap: "pretty",
          fontFamily: "var(--f-body)",
        }}>
          กลางตรอกอับมืด เสียงเด็กผู้หญิงสะอื้นเบาๆ ลอยมาตามสายลม
          เธอนั่งกอดเข่าหน้าซอย ผมปกหน้ายาวเลยอก
          <span style={{ color: "var(--corruption-soft)" }}> กลิ่นเหมือนกำยานเก่าๆ</span> โชยจากเด็กคนนั้น...
          <br/><br/>
          แม่นากกระซิบที่ข้างหู:
          <span style={{ color: "var(--el-water)", fontStyle: "italic" }}> "หล่อนไม่ใช่คน — ดูเงาของหล่อนสิ"</span>
        </div>
      </div>

      {/* Choices */}
      <div style={{ padding: "4px 14px 8px" }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>เจ้าจะทำยังไง · YOUR CHOICE</div>
        <ChoiceCard
          label="ก้มลงปลอบโยน"
          en="COMFORT · gentle"
          desc="ทำตัวเป็นแม่นากใหญ่ ให้กำลังใจวิญญาณเด็ก"
          rewards={["20 GUTS ทั้งทีม", "Bond แม่นาก +3"]}
          risks={["+2 Corruption"]}
          recommended
        />
        <ChoiceCard
          label="ไล่ขับด้วยยันต์"
          en="EXORCISE · forceful"
          desc="เผายันต์กันผีร้องเสียงดัง — บางทีก็ได้ของจากวิญญาณ"
          rewards={["120 Spirit Dust", "ตำราเก่า ×1"]}
          risks={["−15 Bond ทั้งทีม", "+8 Corruption"]}
          requirement="ยันต์ ×1"
        />
        <ChoiceCard
          label="เดินผ่านเงียบๆ"
          en="IGNORE · cautious"
          desc="ไม่ดี ไม่ร้าย ก้มหน้าก้มตาเดินผ่านไป"
          rewards={["−1 Corruption", "Focus +1"]}
          risks={["ไม่ได้ค่าเดินทาง"]}
        />
      </div>

      {/* Bottom info strip */}
      <div style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "8px 14px 18px",
        background: "linear-gradient(180deg, transparent, var(--ink) 30%)",
        borderTop: "1px solid var(--hairline)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 11, color: "var(--corruption-soft)" }}>◇</span>
              <span className="num" style={{ fontSize: 11 }}>240</span>
            </div>
            <div style={{ width: 1, height: 14, background: "var(--hairline)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 11, color: "var(--el-wind)" }}>♥</span>
              <span className="num" style={{ fontSize: 11 }}>4/5</span>
              <span className="eyebrow-mute" style={{ fontSize: 7 }}>FOCUS</span>
            </div>
            <div style={{ width: 1, height: 14, background: "var(--hairline)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 10, color: "var(--corruption-soft)" }}>HEX</span>
              <span className="num" style={{ fontSize: 11, color: "var(--corruption-soft)" }}>42</span>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 9, padding: "4px 8px" }}>
            ☰ แผนที่
          </button>
        </div>
      </div>
    </div>
  );
}

window.AdventureScreen = AdventureScreen;
window.SceneFrame = SceneFrame;
window.ChoiceCard = ChoiceCard;
