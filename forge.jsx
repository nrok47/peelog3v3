// forge.jsx — Forge screen: Tab 1 Frame Enhancement + Tab 2 Mass Reroll

// ──────────────────────────────────────────────
// Shared chrome
// ──────────────────────────────────────────────
function ForgeHeader({ activeTab }) {
  return (
    <>
      {/* Top bar */}
      <div style={{ padding: "0 14px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", width: 30, height: 30, color: "var(--bone)", borderRadius: 2 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6.5 1 L2 5 L6.5 9" /></svg>
        </button>
        <div style={{ textAlign: "center" }}>
          <div className="eyebrow">FORGE · โรงหลอมขมังเวท</div>
          <div className="thai-display" style={{ fontSize: 18, color: "var(--gold-soft)", lineHeight: 1.1, marginTop: 1 }}>
            ศาลพระภูมิหลอม
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 11, color: "var(--corruption-soft)" }}>◇</span>
            <span className="num" style={{ fontSize: 12, color: "var(--corruption-soft)" }}>1,247</span>
          </div>
          <div className="eyebrow-mute" style={{ fontSize: 7 }}>ผงอาถรรพ์</div>
        </div>
      </div>

      <Ornament />

      {/* Tab switcher */}
      <div style={{ padding: "8px 14px 6px", display: "flex", gap: 4 }}>
        <button style={{
          flex: 1,
          background: activeTab === "frame" ? "linear-gradient(180deg, rgba(212,175,55,0.18), rgba(212,175,55,0.05))" : "rgba(0,0,0,0.3)",
          border: `1px solid ${activeTab === "frame" ? "var(--gold)" : "var(--hairline)"}`,
          color: activeTab === "frame" ? "var(--gold-soft)" : "var(--bone-mute)",
          padding: "8px 10px",
          textAlign: "left",
          cursor: "pointer",
          borderRadius: 2,
          fontFamily: "inherit",
          position: "relative",
        }}>
          {activeTab === "frame" && (
            <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: 1, background: "var(--gold-glow)" }} />
          )}
          <div className="thai-display" style={{ fontSize: 12, lineHeight: 1 }}>ตีบวก · Frame</div>
          <div className="eyebrow-mute" style={{ fontSize: 7, marginTop: 2 }}>+ENHANCE</div>
        </button>
        <button style={{
          flex: 1,
          background: activeTab === "mass" ? "linear-gradient(180deg, rgba(192,38,211,0.18), rgba(192,38,211,0.05))" : "rgba(0,0,0,0.3)",
          border: `1px solid ${activeTab === "mass" ? "var(--corruption-soft)" : "var(--hairline)"}`,
          color: activeTab === "mass" ? "var(--corruption-soft)" : "var(--bone-mute)",
          padding: "8px 10px",
          textAlign: "left",
          cursor: "pointer",
          borderRadius: 2,
          fontFamily: "inherit",
          position: "relative",
        }}>
          {activeTab === "mass" && (
            <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: 1, background: "var(--corruption-soft)" }} />
          )}
          <div className="thai-display" style={{ fontSize: 12, lineHeight: 1 }}>หลอมมวล · Mass</div>
          <div className="eyebrow-mute" style={{ fontSize: 7, marginTop: 2 }}>REROLL AFFIX</div>
        </button>
      </div>
    </>
  );
}

function SpiritContextStrip({ kind, level, plus }) {
  const s = SPIRITS[kind];
  return (
    <div style={{ padding: "4px 14px 8px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
        <Chibi kind={kind} size={42} aura={false} />
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="thai-display" style={{ fontSize: 14, color: "var(--bone)" }}>{s.name}</span>
            <span className="num" style={{ fontSize: 10, color: "var(--gold)" }}>+{plus}</span>
          </div>
          <div style={{ display: "flex", gap: 5, marginTop: 2 }}>
            <span className={`el-chip el-${s.element}`} style={{ fontSize: 7, padding: "1px 4px" }}>{s.elementName}</span>
            <span className="pill" style={{ fontSize: 7, padding: "1px 4px" }}>Lv {level}</span>
            <span className="pill" style={{ fontSize: 7, padding: "1px 4px", color: "var(--t-epic)", borderColor: "var(--t-epic)" }}>EPIC</span>
          </div>
        </div>
      </div>
      <button style={{ background: "transparent", border: "1px solid var(--hairline)", color: "var(--bone-mute)", padding: "5px 9px", fontFamily: "var(--f-mono)", fontSize: 9, letterSpacing: 0.1 }}>
        เปลี่ยนผี ▾
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// TAB 1 — Frame Enhancement
// ──────────────────────────────────────────────
function EnhancementRing() {
  return (
    <svg viewBox="0 0 200 200" width="220" height="220" style={{ display: "block" }}>
      <defs>
        <radialGradient id="ringGlowGold">
          <stop offset="0%" stopColor="var(--gold-glow)" stopOpacity="0.8" />
          <stop offset="40%" stopColor="var(--gold)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ringGlowBlood">
          <stop offset="0%" stopColor="var(--blood)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--blood)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* outer glow halo */}
      <circle cx="100" cy="100" r="90" fill="url(#ringGlowGold)" opacity="0.6" />
      <circle cx="50" cy="100" r="30" fill="url(#ringGlowBlood)" />
      <circle cx="150" cy="100" r="30" fill="url(#ringGlowGold)" />

      {/* yantra rings */}
      <circle cx="100" cy="100" r="86" fill="none" stroke="var(--gold)" strokeWidth="0.5" opacity="0.6" />
      <circle cx="100" cy="100" r="78" fill="none" stroke="var(--gold)" strokeWidth="0.4" strokeDasharray="2 4" opacity="0.5" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="var(--blood)" strokeWidth="0.4" opacity="0.5" />
      <circle cx="100" cy="100" r="48" fill="rgba(0,0,0,0.6)" stroke="var(--gold)" strokeWidth="1" />

      {/* Cardinal yantra ticks */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map(d => (
        <g key={d} transform={`rotate(${d} 100 100)`}>
          <line x1="100" y1="14" x2="100" y2="22" stroke="var(--gold)" strokeWidth="0.7" />
          <circle cx="100" cy="22" r={d % 90 === 0 ? 2.5 : 1.5} fill={d % 90 === 0 ? "var(--gold)" : "var(--gold-deep)"} />
        </g>
      ))}

      {/* item slot core */}
      <circle cx="100" cy="100" r="34" fill="rgba(192,57,43,0.18)" stroke="var(--gold-glow)" strokeWidth="0.8" />

      {/* Star (yantra) */}
      <g transform="translate(100,100)" stroke="var(--gold-glow)" strokeWidth="0.6" fill="none" opacity="0.6">
        <path d="M 0 -22 L 6 -6 L 22 0 L 6 6 L 0 22 L -6 6 L -22 0 L -6 -6 Z" />
      </g>

      {/* +12 → +13 label */}
      <g>
        <text x="100" y="95" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="9" fill="var(--bone-mute)" letterSpacing="2">FRAME</text>
        <text x="100" y="115" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="22" fill="var(--gold-glow)" fontWeight="700">+12</text>
        <text x="100" y="128" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="9" fill="var(--gold-soft)" letterSpacing="1">⤳ +13</text>
      </g>
    </svg>
  );
}

function StatDelta({ label, before, after, isMax }) {
  const num = (s) => parseFloat(String(s).replace(/[^\d.-]/g, "")) || 0;
  const delta = num(after) - num(before);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", borderBottom: "1px dashed var(--faint)" }}>
      <span className="eyebrow-mute" style={{ fontSize: 9, color: "var(--bone-mute)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span className="num" style={{ fontSize: 10, color: "var(--bone-mute)" }}>{before}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="var(--bone-mute)" strokeWidth="1"><path d="M0 3 L8 3 M5 1 L8 3 L5 5" /></svg>
        <span className="num" style={{ fontSize: 12, color: "#7df096", fontWeight: 600, textShadow: "0 0 4px rgba(125,240,150,0.4)" }}>
          {after}
        </span>
        <span className="num" style={{ fontSize: 9, color: "#7df096", opacity: 0.7 }}>
          +{Math.abs(delta).toFixed(delta % 1 === 0 ? 0 : 1)}
        </span>
      </div>
    </div>
  );
}

function ForgeEnhancementScreen() {
  return (
    <div className="screen" style={{
      background: `radial-gradient(ellipse 100% 50% at 50% 35%, #2a1830, var(--void) 70%)`,
    }}>
      <div className="noise" />
      <StatusBar />
      <ForgeHeader activeTab="frame" />
      <SpiritContextStrip kind="krasue" level={32} plus={12} />

      {/* Enhancement ring centerpiece */}
      <div style={{ display: "flex", justifyContent: "center", padding: "0 0 4px", position: "relative" }}>
        <EnhancementRing />
      </div>

      {/* Stat preview */}
      <div style={{ padding: "0 14px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <span className="eyebrow">STAT PREVIEW · ผลที่จะได้</span>
          <span className="eyebrow-mute" style={{ fontSize: 8 }}>ก่อน → หลังพิธี</span>
        </div>
        <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", padding: "6px 12px" }}>
          <StatDelta label="ATK" before="284" after="312" />
          <StatDelta label="HP" before="3,200" after="3,420" />
          <StatDelta label="DEF" before="142" after="156" />
          <StatDelta label="CRIT" before="22%" after="24%" />
        </div>
      </div>

      {/* Risk + Protection */}
      <div style={{ padding: "0 14px 8px" }}>
        <div style={{ background: "linear-gradient(90deg, rgba(192,57,43,0.12), rgba(212,175,55,0.1))", border: "1px solid var(--hairline-strong)", padding: "8px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <span className="eyebrow">SUCCESS RATE</span>
            <span className="num" style={{ fontSize: 14, color: "var(--blood)", fontWeight: 700 }}>15%</span>
          </div>
          {/* Big segmented bar */}
          <div style={{ position: "relative", height: 8, background: "rgba(0,0,0,0.5)", border: "1px solid var(--hairline)", marginBottom: 6 }}>
            <div style={{ position: "absolute", inset: 0, width: "15%", background: "linear-gradient(90deg, var(--gold-soft), var(--gold))" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", pointerEvents: "none" }}>
              {[...Array(10)].map((_, i) => (
                <div key={i} style={{ flex: 1, borderRight: i < 9 ? "1px solid rgba(0,0,0,0.5)" : "none" }} />
              ))}
            </div>
          </div>

          {/* Protection toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0 0", borderTop: "1px dashed var(--faint)", marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 22, height: 22, border: "1.5px solid var(--gold)", background: "rgba(212,175,55,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--gold-glow)" }}>✓</div>
              <div>
                <div className="thai-display" style={{ fontSize: 11, color: "var(--gold-soft)" }}>ใส่ยันต์กันแตก</div>
                <div className="eyebrow-mute" style={{ fontSize: 7 }}>PROTECTION AMULET · ของไม่หาย</div>
              </div>
            </div>
            <span className="num" style={{ fontSize: 9, color: "var(--gold)" }}>×2 ใบ</span>
          </div>
        </div>
      </div>

      {/* Cost row */}
      <div style={{ padding: "0 14px 10px" }}>
        <div className="eyebrow-mute" style={{ fontSize: 8, marginBottom: 4 }}>วัตถุดิบที่ต้องใช้</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", padding: "5px 8px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, color: "var(--gold-soft)" }}>◆</span>
            <div style={{ flex: 1 }}>
              <div className="num" style={{ fontSize: 11, color: "var(--bone)" }}>4,800</div>
              <div className="eyebrow-mute" style={{ fontSize: 7 }}>Spirit Dust</div>
            </div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", padding: "5px 8px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, color: "var(--gold)" }}>✦</span>
            <div style={{ flex: 1 }}>
              <div className="num" style={{ fontSize: 11, color: "var(--bone)" }}>×3</div>
              <div className="eyebrow-mute" style={{ fontSize: 7 }}>ตำราเก่า</div>
            </div>
          </div>
          <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid var(--gold)", padding: "5px 8px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, color: "var(--gold-glow)" }}>☥</span>
            <div style={{ flex: 1 }}>
              <div className="num" style={{ fontSize: 11, color: "var(--gold-soft)" }}>×2</div>
              <div className="eyebrow-mute" style={{ fontSize: 7 }}>ยันต์กันแตก</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "10px 14px 18px",
        background: "linear-gradient(180deg, transparent, var(--ink) 40%)",
      }}>
        <button style={{
          width: "100%",
          background: "linear-gradient(180deg, var(--gold-soft), var(--gold) 50%, var(--gold-deep))",
          border: "1px solid var(--gold-deep)",
          color: "var(--ink)",
          fontFamily: "var(--f-display)",
          fontWeight: 700,
          fontSize: 15,
          padding: "12px 16px",
          letterSpacing: 0.3,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 0 #4a3510, 0 0 20px rgba(255,224,138,0.4)",
          cursor: "pointer",
          position: "relative",
        }}>
          ✦ ประกอบพิธีเลื่อนขั้นอาคม ✦
        </button>
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <span className="eyebrow-mute" style={{ fontSize: 8 }}>ตกลงแล้วของสามารถพังได้ — เตือนแล้วนะ</span>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// TAB 2 — Mass Reroll
// ──────────────────────────────────────────────
function MassOrb() {
  return (
    <svg viewBox="0 0 200 160" width="220" height="170" style={{ display: "block" }}>
      <defs>
        <radialGradient id="orbCore">
          <stop offset="0%" stopColor="#ff8ad8" stopOpacity="1" />
          <stop offset="40%" stopColor="var(--corruption)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--corruption)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orbHalo">
          <stop offset="0%" stopColor="var(--corruption)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--corruption)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* halo */}
      <circle cx="100" cy="80" r="76" fill="url(#orbHalo)" />

      {/* spinning rings */}
      <g opacity="0.65">
        <ellipse cx="100" cy="80" rx="62" ry="20" fill="none" stroke="var(--corruption-soft)" strokeWidth="0.5" transform="rotate(-15 100 80)" strokeDasharray="2 4" />
        <ellipse cx="100" cy="80" rx="56" ry="18" fill="none" stroke="var(--corruption-soft)" strokeWidth="0.5" transform="rotate(20 100 80)" />
        <ellipse cx="100" cy="80" rx="46" ry="14" fill="none" stroke="var(--gold)" strokeWidth="0.4" transform="rotate(-45 100 80)" strokeDasharray="3 3" opacity="0.6" />
      </g>

      {/* orb core */}
      <circle cx="100" cy="80" r="48" fill="url(#orbCore)" />
      <circle cx="100" cy="80" r="36" fill="rgba(192,38,211,0.4)" stroke="var(--corruption-soft)" strokeWidth="0.8" />
      <circle cx="92" cy="68" r="8" fill="rgba(255,255,255,0.45)" opacity="0.8" />

      {/* sigil */}
      <g transform="translate(100,80)" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" fill="none">
        <circle r="20" strokeDasharray="2 3" />
        <path d="M 0 -14 L 12 7 L -12 7 Z" />
      </g>

      {/* particles */}
      {[
        { x: 40, y: 35, r: 1.5 },
        { x: 158, y: 50, r: 1 },
        { x: 50, y: 130, r: 1.5 },
        { x: 168, y: 120, r: 1 },
        { x: 30, y: 90, r: 1 },
        { x: 175, y: 90, r: 1.2 },
        { x: 100, y: 18, r: 1.4 },
        { x: 100, y: 148, r: 1 },
      ].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="var(--corruption-soft)" opacity="0.7" />
      ))}
    </svg>
  );
}

function AffixLockRow({ prefix, name, roll, range, tier, color, locked, isPerfect }) {
  const tierColor = { T1: "var(--gold-glow)", T2: "var(--gold)", T3: "var(--bone)", T4: "var(--t-rare)", T5: "var(--bone-mute)" }[tier];
  const rollPct = ((roll - range[0]) / (range[1] - range[0])) * 100;
  return (
    <div style={{
      padding: "6px 8px",
      background: locked ? "rgba(212,175,55,0.08)" : "rgba(0,0,0,0.35)",
      borderLeft: `2px solid ${color || "var(--gold-deep)"}`,
      border: "1px solid",
      borderColor: locked ? "var(--gold)" : "var(--hairline)",
      borderLeftColor: color || "var(--gold-deep)",
      marginBottom: 4,
      display: "flex",
      alignItems: "stretch",
      gap: 6,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span className="eyebrow" style={{ fontSize: 7, color: tierColor }}>{tier}</span>
            <span style={{ fontSize: 11, color: "var(--bone)" }}>
              {prefix && <span style={{ color: tierColor, marginRight: 4 }}>"{prefix}"</span>}
              {name}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="num" style={{ fontSize: 12, color: tierColor, fontWeight: 700 }}>+{roll}{name.includes("%") ? "%" : ""}</span>
            {isPerfect && <span className="eyebrow" style={{ fontSize: 7, color: "var(--gold-glow)" }}>★</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", position: "relative" }}>
            <div style={{ height: "100%", width: `${rollPct}%`, background: tierColor }} />
            <div style={{ position: "absolute", left: "100%", top: -2, width: 1, height: 7, background: "var(--muted)" }} />
          </div>
          <span className="num" style={{ fontSize: 8, color: "var(--bone-mute)", whiteSpace: "nowrap" }}>[{range[0]}–{range[1]}]</span>
        </div>
      </div>

      {/* Lock toggle */}
      <button style={{
        flex: "0 0 28px",
        background: locked ? "var(--gold)" : "rgba(0,0,0,0.4)",
        border: `1px solid ${locked ? "var(--gold-glow)" : "var(--hairline)"}`,
        color: locked ? "var(--ink)" : "var(--bone-mute)",
        padding: 0,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 2,
      }}>
        <svg width="11" height="13" viewBox="0 0 11 13" fill="none" stroke="currentColor" strokeWidth="1.4">
          {locked ? (
            <>
              <rect x="1.5" y="6" width="8" height="6.5" rx="0.5" fill="currentColor" stroke="none" />
              <path d="M3 6 V4 a2.5 2.5 0 0 1 5 0 V6" />
            </>
          ) : (
            <>
              <rect x="1.5" y="6" width="8" height="6.5" rx="0.5" />
              <path d="M3 6 V4 a2.5 2.5 0 0 1 5 0" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}

function ForgeRerollScreen() {
  return (
    <div className="screen" style={{
      background: `radial-gradient(ellipse 100% 50% at 50% 28%, #2a0e35, var(--void) 70%)`,
    }}>
      <div className="noise" />
      <StatusBar />
      <ForgeHeader activeTab="mass" />
      <SpiritContextStrip kind="krasue" level={32} plus={12} />

      {/* Orb visual */}
      <div style={{ display: "flex", justifyContent: "center", padding: "0 0 4px" }}>
        <MassOrb />
      </div>

      {/* Affix list */}
      <div style={{ padding: "0 14px 6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <span className="eyebrow">SPIRIT MASS · มวลวิญญาณ 6 บรรทัด</span>
          <span className="eyebrow-mute" style={{ fontSize: 8 }}>
            🔒 LOCK <span className="num" style={{ color: "var(--gold)" }}>2/6</span>
          </span>
        </div>
        <AffixLockRow isPrefix prefix="ดุร้าย" name="ATK %" roll={28} range={[20, 30]} tier="T1" color="var(--gold-glow)" locked isPerfect />
        <AffixLockRow isPrefix prefix="เลือดเดือด" name="CRIT DMG" roll={42} range={[30, 50]} tier="T2" color="var(--gold)" locked />
        <AffixLockRow isPrefix prefix="เพลิงผลาญ" name="FIRE DMG %" roll={18} range={[12, 24]} tier="T3" color="var(--el-fire)" />
        <AffixLockRow prefix="แห่งห่าฝน" name="SPD" roll={62} range={[40, 80]} tier="T2" color="var(--gold)" />
        <AffixLockRow prefix="แห่งเงาเดือน" name="HP %" roll={12} range={[8, 18]} tier="T3" color="var(--bone)" />
        <AffixLockRow prefix="แห่งกรรมแฝง" name="DEF" roll={4} range={[2, 9]} tier="T5" color="var(--bone-mute)" />
      </div>

      {/* Cost preview */}
      <div style={{ padding: "0 14px 8px" }}>
        <div style={{
          background: "linear-gradient(90deg, rgba(192,38,211,0.12), rgba(212,175,55,0.06))",
          border: "1px solid var(--corruption)",
          padding: "6px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--corruption-soft)" }}>REROLL COST · 2 LOCKED</div>
            <div className="eyebrow-mute" style={{ fontSize: 7, marginTop: 2 }}>+ 5 Corruption ทีม</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="num" style={{ fontSize: 14, color: "var(--corruption-soft)", fontWeight: 700 }}>
              ◇ 540
            </div>
            <div className="eyebrow-mute" style={{ fontSize: 7 }}>ผงอาถรรพ์</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "10px 14px 18px",
        background: "linear-gradient(180deg, transparent, var(--ink) 40%)",
      }}>
        <button style={{
          width: "100%",
          background: "linear-gradient(180deg, #e879f9, var(--corruption) 50%, #6b1582)",
          border: "1px solid #4a0e5a",
          color: "var(--bone)",
          fontFamily: "var(--f-display)",
          fontWeight: 700,
          fontSize: 15,
          padding: "12px 16px",
          letterSpacing: 0.3,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 0 #2a0635, 0 0 18px rgba(232,121,249,0.4)",
          cursor: "pointer",
        }}>
          ✸ ซัดผงอาถรรพ์สุ่มชะตา ✸
        </button>
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <span className="eyebrow-mute" style={{ fontSize: 8 }}>สเตตัสที่ไม่ล็อกจะถูกสุ่มใหม่ · กลับคืนไม่ได้</span>
        </div>
      </div>
    </div>
  );
}

window.ForgeEnhancementScreen = ForgeEnhancementScreen;
window.ForgeRerollScreen = ForgeRerollScreen;
