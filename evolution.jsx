// evolution.jsx — Evolution / Awakening screen (Phase 3 endgame)
// กระสือ → กระสือเฒ่า → กระสือพญา
// 3 stages of awakening · materials, stat preview, lore unlock

// Stage data
const EVO_STAGES = [
  {
    id: 0,
    nameThai: "กระสือ",
    nameRomaji: "KRASUE · BASE",
    tier: "epic",
    tierLabel: "EPIC · IV★",
    color: "#c0392b",
    accent: "#ff7066",
    stats: { ATK: 284, HP: 3200, DEF: 142, SPD: 118, CRIT: 22 },
    desc: "หัวลอย เครื่องในแดง หิวเลือดยามดึก",
    status: "current",
    glyph: "I",
  },
  {
    id: 1,
    nameThai: "กระสือเฒ่า",
    nameRomaji: "OLD KRASUE",
    tier: "legend",
    tierLabel: "LEGEND · V★",
    color: "#a52a4a",
    accent: "#ff5a8a",
    stats: { ATK: 412, HP: 4180, DEF: 178, SPD: 134, CRIT: 28 },
    desc: "อายุพันปี ดวงตาแดงสว่าง · ปลดล็อก signature 2",
    status: "next",
    glyph: "II",
    bonus: "+ NEW SKILL: เครื่องในร่ายลึก (AoE Curse)",
    cost: { dust: 28000, scrolls: 12, key: "ดวงตาคนตาย" },
  },
  {
    id: 2,
    nameThai: "กระสือพญา",
    nameRomaji: "KRASUE LORD",
    tier: "mythic",
    tierLabel: "MYTHIC · VI★",
    color: "#6b1582",
    accent: "#e879f9",
    stats: { ATK: 612, HP: 5780, DEF: 235, SPD: 156, CRIT: 38 },
    desc: "ตำนานสาวกรุงเก่า · ผีตัวแม่แห่งสายเลือดเดือด",
    status: "locked",
    glyph: "III",
    bonus: "+ Passive: เสน่ห์ขุนนาง · พ่ายแพ้แล้วฟื้นได้ 1 ครั้ง",
    cost: { dust: 88000, scrolls: 40, key: "หัวกะโหลกเจ้าโทสะ", req: "ปลด ending ที่ 4 ก่อน" },
  },
];

// Stage portrait — uses Chibi base, but applies tint + extra ornament
function StagePortrait({ stage, active }) {
  return (
    <div style={{
      position: "relative",
      width: 130,
      height: 150,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {/* Halo */}
      <div style={{
        position: "absolute",
        inset: 6,
        background: `radial-gradient(circle, ${stage.color}40 0%, transparent 70%)`,
        opacity: active ? 1 : 0.4,
      }} />
      {/* Yantra ring */}
      <svg viewBox="0 0 130 130" width="130" height="130" style={{ position: "absolute", top: 5 }}>
        <circle cx="65" cy="65" r="58" fill="none" stroke={active ? stage.color : "var(--bone-mute)"} strokeWidth="0.5" opacity={active ? 0.8 : 0.3} />
        <circle cx="65" cy="65" r="52" fill="none" stroke={active ? stage.accent : "var(--bone-mute)"} strokeWidth="0.4" strokeDasharray="2 4" opacity={active ? 0.7 : 0.25} />
        {active && stage.id >= 1 && (
          <>
            <circle cx="65" cy="65" r="46" fill="none" stroke="var(--gold)" strokeWidth="0.3" />
            {/* 5-pointed yantra spikes for awakened */}
            {[0, 72, 144, 216, 288].map((d, i) => (
              <g key={i} transform={`rotate(${d - 90} 65 65)`}>
                <line x1="65" y1="6" x2="65" y2="14" stroke="var(--gold)" strokeWidth="0.6" />
                <circle cx="65" cy="10" r="1.5" fill="var(--gold)" />
              </g>
            ))}
          </>
        )}
        {active && stage.id >= 2 && (
          <>
            {/* Mythic crown ring */}
            <circle cx="65" cy="65" r="62" fill="none" stroke="var(--corruption-soft)" strokeWidth="0.3" opacity="0.6" />
            {[15, 75, 135, 195, 255, 315].map((d, i) => (
              <g key={i} transform={`rotate(${d - 90} 65 65)`}>
                <path d={`M 63 8 L 65 0 L 67 8 Z`} fill="var(--corruption-soft)" opacity="0.8" />
              </g>
            ))}
          </>
        )}
      </svg>

      {/* Chibi (recolor via filter only at higher stages; here we just reuse same kind) */}
      <div style={{ filter: active ? `drop-shadow(0 0 6px ${stage.color}88)` : "grayscale(0.6)", opacity: stage.status === "locked" ? 0.5 : 1 }}>
        <Chibi kind="krasue" size={86} mood={active ? "fierce" : "normal"} aura={false} />
      </div>

      {/* Stage roman numeral overlay */}
      <div style={{
        position: "absolute",
        bottom: 4,
        right: 8,
        fontFamily: "var(--f-mono)",
        fontSize: 11,
        color: active ? "var(--gold-glow)" : "var(--bone-mute)",
        fontWeight: 700,
        background: "rgba(0,0,0,0.7)",
        padding: "1px 5px",
        border: `1px solid ${active ? "var(--gold)" : "var(--hairline)"}`,
        letterSpacing: 0.1,
      }}>{stage.glyph}</div>

      {stage.status === "locked" && (
        <div style={{ position: "absolute", inset: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)" }}>
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="var(--bone-mute)" strokeWidth="1.2">
            <rect x="3" y="7" width="10" height="7" rx="1" />
            <path d="M5 7 V5 a3 3 0 0 1 6 0 V7" />
          </svg>
        </div>
      )}
    </div>
  );
}

function EvoStatRow({ label, before, after }) {
  const delta = after - before;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "60px 1fr auto auto auto", gap: 6, alignItems: "baseline", padding: "3px 0", borderBottom: "1px dashed var(--faint)" }}>
      <span className="eyebrow-mute" style={{ fontSize: 9, color: "var(--bone-mute)" }}>{label}</span>
      <div style={{ position: "relative", height: 4, background: "rgba(0,0,0,0.5)" }}>
        <div style={{ position: "absolute", inset: 0, width: `${(before / 800) * 100}%`, background: "var(--bone-mute)", opacity: 0.6 }} />
        <div style={{ position: "absolute", inset: 0, width: `${(after / 800) * 100}%`, background: "linear-gradient(90deg, var(--gold-soft), var(--gold-glow))" }} />
      </div>
      <span className="num" style={{ fontSize: 10, color: "var(--bone-mute)", minWidth: 32, textAlign: "right" }}>{before.toLocaleString()}</span>
      <svg width="9" height="6" viewBox="0 0 10 6" fill="none" stroke="var(--gold)" strokeWidth="1"><path d="M0 3 L8 3 M5 1 L8 3 L5 5" /></svg>
      <span className="num" style={{ fontSize: 11, color: "#7df096", minWidth: 38, textAlign: "right", fontWeight: 600, textShadow: "0 0 4px rgba(125,240,150,0.4)" }}>
        {after.toLocaleString()} <span style={{ color: "#7df09680", fontSize: 9 }}>+{delta}</span>
      </span>
    </div>
  );
}

function EvolutionScreen() {
  const current = EVO_STAGES[0];
  const target = EVO_STAGES[1];

  return (
    <div className="screen" style={{
      background: `radial-gradient(ellipse 100% 60% at 50% 25%, #2e1438, var(--void) 70%)`,
    }}>
      <div className="noise" />
      <StatusBar />

      {/* Top HUD */}
      <div style={{ padding: "0 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", width: 28, height: 28, color: "var(--bone)", borderRadius: 2 }}>
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6.5 1 L2 5 L6.5 9" /></svg>
        </button>
        <div style={{ textAlign: "center" }}>
          <div className="eyebrow">AWAKENING · พิธีปลุก</div>
          <div className="thai-display" style={{ fontSize: 15, color: "var(--gold-soft)", lineHeight: 1.1, marginTop: 1 }}>
            ปลุกร่างกระสือ
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 11, color: "var(--corruption-soft)" }}>◇</span>
            <span className="num" style={{ fontSize: 12, color: "var(--corruption-soft)" }}>32,480</span>
          </div>
          <div className="eyebrow-mute" style={{ fontSize: 7 }}>ผงอาถรรพ์</div>
        </div>
      </div>

      <Ornament />

      {/* Stages row */}
      <div style={{ padding: "10px 8px 6px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          {/* Connecting flow lines */}
          <div style={{ position: "absolute", left: 80, right: 80, top: "50%", height: 1, background: "linear-gradient(90deg, var(--gold-soft), var(--gold), var(--corruption-soft) 50%, rgba(192,38,211,0.3))", marginTop: -10 }} />
          {/* Arrows between */}
          <svg width="14" height="10" viewBox="0 0 14 10" style={{ position: "absolute", left: "31%", top: "50%", marginTop: -15 }} fill="var(--gold-glow)">
            <path d="M0 3 L9 3 L9 0 L14 5 L9 10 L9 7 L0 7 Z" />
          </svg>
          <svg width="14" height="10" viewBox="0 0 14 10" style={{ position: "absolute", right: "31%", top: "50%", marginTop: -15 }} fill="var(--corruption-soft)" opacity="0.7">
            <path d="M0 3 L9 3 L9 0 L14 5 L9 10 L9 7 L0 7 Z" />
          </svg>

          {EVO_STAGES.map((s, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <StagePortrait stage={s} active={s.status === "current" || s.status === "next"} />
              <div className="thai-display" style={{ fontSize: 13, color: s.status === "locked" ? "var(--bone-mute)" : "var(--bone)", lineHeight: 1.1, textAlign: "center" }}>
                {s.nameThai}
              </div>
              <div style={{ marginTop: 2, padding: "1px 6px", background: s.status === "current" ? "var(--gold)" : s.status === "next" ? "rgba(212,175,55,0.18)" : "rgba(0,0,0,0.3)", color: s.status === "current" ? "var(--ink)" : "var(--bone-mute)", fontFamily: "var(--f-mono)", fontSize: 7, fontWeight: 700, letterSpacing: 0.15, border: s.status === "next" ? "1px solid var(--gold)" : "none" }}>
                {s.status === "current" ? "CURRENT" : s.status === "next" ? "NEXT" : "LOCKED"}
              </div>
              <div className="eyebrow-mute" style={{ fontSize: 7, marginTop: 2, color: TIER_COLOR[s.tier] }}>{s.tierLabel}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lore quote */}
      <div style={{ padding: "0 14px 6px", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "var(--bone-mute)", fontStyle: "italic", lineHeight: 1.4 }}>
          "เมื่อหัวเธอลอยขึ้นนิดที่สาม วิญญาณภายในจะตื่นจากความหลับใหล…"
        </div>
      </div>

      {/* Stat preview */}
      <div style={{ padding: "8px 14px 6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span className="eyebrow">STAT PREVIEW · กระสือ → กระสือเฒ่า</span>
          <span className="eyebrow-mute" style={{ fontSize: 8 }}>+45% avg</span>
        </div>
        <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline-strong)", padding: "6px 10px" }}>
          <EvoStatRow label="ATK" before={current.stats.ATK} after={target.stats.ATK} />
          <EvoStatRow label="HP" before={current.stats.HP} after={target.stats.HP} />
          <EvoStatRow label="DEF" before={current.stats.DEF} after={target.stats.DEF} />
          <EvoStatRow label="SPD" before={current.stats.SPD} after={target.stats.SPD} />
        </div>
      </div>

      {/* Unlock bonus */}
      <div style={{ padding: "0 14px 6px" }}>
        <div style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.12), rgba(232,121,249,0.08))", border: "1px solid var(--gold)", padding: "7px 10px" }}>
          <div className="eyebrow" style={{ color: "var(--gold-glow)", marginBottom: 3 }}>UNLOCK · ปลดล็อก</div>
          <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
            <span style={{ fontSize: 13, color: "var(--gold-glow)" }}>✦</span>
            <div style={{ flex: 1 }}>
              <span className="thai-display" style={{ fontSize: 12, color: "var(--bone)" }}>เครื่องในร่ายลึก</span>
              <span style={{ fontSize: 10, color: "var(--bone-mute)", marginLeft: 5 }}>· AoE Curse · 200% ATK</span>
            </div>
            <span className="el-chip el-occult" style={{ fontSize: 7, padding: "1px 4px" }}>NEW SKILL</span>
          </div>
        </div>
      </div>

      {/* Materials */}
      <div style={{ padding: "0 14px 6px" }}>
        <div className="eyebrow-mute" style={{ fontSize: 8, marginBottom: 4 }}>วัตถุดิบพิธี · MATERIALS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
          <div style={{ background: "rgba(0,0,0,0.45)", border: "1px solid var(--hairline)", padding: "5px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--corruption-soft)" }}>◇</div>
            <div className="num" style={{ fontSize: 11, color: "var(--bone)" }}>28,000</div>
            <div className="eyebrow-mute" style={{ fontSize: 7 }}>Spirit Dust</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.45)", border: "1px solid var(--hairline)", padding: "5px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--gold-soft)" }}>✦</div>
            <div className="num" style={{ fontSize: 11, color: "var(--bone)" }}>×12</div>
            <div className="eyebrow-mute" style={{ fontSize: 7 }}>ตำราเก่า</div>
          </div>
          <div style={{ background: "rgba(232,121,249,0.06)", border: "1px solid var(--corruption-soft)", padding: "5px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--corruption-soft)" }}>◐</div>
            <div className="num" style={{ fontSize: 10, color: "var(--corruption-soft)", lineHeight: 1.1, marginTop: 1 }}>×1</div>
            <div className="eyebrow-mute" style={{ fontSize: 7 }}>ดวงตาคนตาย</div>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div style={{ padding: "0 14px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, color: "var(--corruption-soft)" }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="6" cy="6" r="5" />
            <line x1="6" y1="3.5" x2="6" y2="7" />
            <circle cx="6" cy="9" r="0.5" fill="currentColor" />
          </svg>
          ปลุกร่างจะ +10 Corruption ทีม · ส่งผลต่อ ending
        </div>
      </div>

      {/* CTA */}
      <div style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "10px 14px 18px",
        background: "linear-gradient(180deg, transparent, var(--ink) 30%)",
      }}>
        <button style={{
          width: "100%",
          background: "linear-gradient(180deg, #ffd470, var(--gold) 40%, var(--corruption) 100%)",
          border: "1px solid var(--gold-deep)",
          color: "var(--ink)",
          fontFamily: "var(--f-display)",
          fontWeight: 700,
          fontSize: 14,
          padding: "11px 16px",
          letterSpacing: 0.3,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 0 #4a3510, 0 0 20px rgba(232,121,249,0.4)",
          cursor: "pointer",
          textShadow: "0 1px 0 rgba(255,255,255,0.3)",
        }}>
          ✸ ประกอบพิธีปลุกร่าง · AWAKEN ✸
        </button>
      </div>
    </div>
  );
}

window.EvolutionScreen = EvolutionScreen;
