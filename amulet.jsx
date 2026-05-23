// amulet.jsx — Dedicated Amulet Slot screen (Phase 2 close-out)
// 4 sacred sockets per spirit · drag/equip from inventory · live compare tooltip

const AMULET_TYPES = {
  active: { thai: "โจมตี", en: "ACTIVE", color: "var(--blood)", glyph: "⚔" },
  passive: { thai: "พาสซีฟ", en: "PASSIVE", color: "var(--gold)", glyph: "✦" },
  utility: { thai: "แก้ทาง", en: "UTILITY", color: "var(--corruption-soft)", glyph: "☽" },
};

// Equipped state for the 4 sockets
const EQUIPPED = [
  { slot: "active", element: "fire", name: "เพลิงล้างวิญญ์", tier: "epic", lv: 5, stat: "180% ATK · AoE", cd: 10, guts: 30 },
  { slot: "active", element: "fire", name: "ฟันจิกหัว+", tier: "rare", lv: 3, stat: "120% ATK · เดี่ยว", cd: 4, guts: 0 },
  { slot: "passive", element: "fire", name: "เลือดเดือด", tier: "legend", lv: 7, stat: "+18% ATK · −20% HP" },
  null, // utility slot — empty
];

// Inventory amulets
const INV = [
  { slot: "active", element: "wind", name: "ลมเหยียบเมฆ", tier: "epic", lv: 4, stat: "Dash+Hit · ATK 140%", cd: 6, guts: 20 },
  { slot: "active", element: "water", name: "เรียกห่าฝน", tier: "rare", lv: 3, stat: "Heal AoE 25%", cd: 12, guts: 30 },
  { slot: "active", element: "earth", name: "หินดินสาร", tier: "rare", lv: 2, stat: "120% · stun 1t", cd: 5, guts: 15, selected: true, equipping: 0 /* would replace slot 0 */ },
  { slot: "passive", element: "earth", name: "โล่ทอง", tier: "epic", lv: 5, stat: "+25% DEF" },
  { slot: "passive", element: "occult", name: "ลูกแก้วเงา", tier: "legend", lv: 6, stat: "+20% CRIT DMG" },
  { slot: "passive", element: "wind", name: "พระนิเวศน์", tier: "rare", lv: 3, stat: "+12% Max HP" },
  { slot: "utility", element: "water", name: "อามฤต", tier: "epic", lv: 4, stat: "ฟื้น 8% HP/turn ทีม" },
  { slot: "utility", element: "occult", name: "ผีย่ำเค้า", tier: "legend", lv: 6, stat: "ลด GUTS ศัตรู −10/ตี" },
  { slot: "utility", element: "occult", name: "เลือดบอด", tier: "rare", lv: 2, stat: "Corruption −5 / wave" },
  { slot: "active", element: "fire", name: "เผาผลาญใจ", tier: "rare", lv: 2, stat: "DoT 5% · 3 turns", cd: 8, guts: 15 },
  { slot: "passive", element: "fire", name: "ใจสิงห์", tier: "common", lv: 1, stat: "+8% CRIT" },
  { slot: "utility", element: "wind", name: "ลมรอด", tier: "rare", lv: 3, stat: "+15% Dodge" },
];

const TIER_COLOR = {
  common: "var(--t-common)",
  rare: "var(--t-rare)",
  epic: "var(--t-epic)",
  legend: "var(--t-legend)",
  mythic: "var(--t-mythic)",
};

function SocketCell({ amulet, type, idx, hovering }) {
  const t = AMULET_TYPES[type];
  if (!amulet) {
    return (
      <div style={{
        background: "rgba(0,0,0,0.45)",
        border: hovering ? `1.5px dashed ${t.color}` : "1px dashed var(--faint)",
        padding: "10px 8px",
        position: "relative",
        textAlign: "center",
        minHeight: 84,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 4,
      }}>
        <div style={{ position: "absolute", top: 3, left: 4, fontSize: 7, fontFamily: "var(--f-mono)", letterSpacing: 0.15, color: t.color, opacity: 0.6 }}>
          SLOT {idx + 1} · {t.en}
        </div>
        <div style={{ fontSize: 28, color: t.color, opacity: 0.3, lineHeight: 1 }}>{t.glyph}</div>
        <div style={{ fontSize: 9, color: "var(--bone-mute)", fontFamily: "var(--f-mono)" }}>
          {hovering ? "▼ วางตรงนี้" : "+ ว่าง"}
        </div>
      </div>
    );
  }

  const tierC = TIER_COLOR[amulet.tier];
  return (
    <div style={{
      background: `linear-gradient(180deg, var(--el-${amulet.element})18, rgba(0,0,0,0.6) 80%)`,
      border: `1px solid ${tierC}`,
      padding: "6px 8px 5px",
      position: "relative",
      minHeight: 84,
      overflow: "hidden",
    }}>
      {/* gold aura highlight */}
      <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 14px ${tierC}40`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 0, left: 0, padding: "1px 5px", background: tierC, color: "var(--ink)", fontFamily: "var(--f-mono)", fontSize: 7, letterSpacing: 0.12, fontWeight: 700 }}>
        SLOT {idx + 1}
      </div>
      <div style={{ position: "absolute", top: 2, right: 4, display: "flex", alignItems: "center", gap: 3 }}>
        <span style={{ fontSize: 10, color: t.color }}>{t.glyph}</span>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="thai-display" style={{ fontSize: 12, color: "var(--bone)", lineHeight: 1, marginBottom: 2 }}>
          {amulet.name}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 3 }}>
          <span className={`el-chip el-${amulet.element}`} style={{ fontSize: 7, padding: "0 4px" }}>{amulet.element}</span>
          <span className="num" style={{ fontSize: 8, color: tierC }}>Lv{amulet.lv}</span>
        </div>
        <div style={{ fontSize: 9, color: "var(--bone-soft)", lineHeight: 1.3 }}>
          {amulet.stat}
        </div>
        {(amulet.cd || amulet.guts) && (
          <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
            {amulet.cd > 0 && <span className="num" style={{ fontSize: 8, color: "var(--bone-mute)" }}>CD {amulet.cd}s</span>}
            {amulet.guts > 0 && <span className="num" style={{ fontSize: 8, color: "var(--gold-soft)" }}>◆{amulet.guts}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryCard({ amulet, selected, equipping }) {
  const tierC = TIER_COLOR[amulet.tier];
  const t = AMULET_TYPES[amulet.slot];
  return (
    <div style={{
      background: selected ? `linear-gradient(180deg, var(--el-${amulet.element})22, rgba(0,0,0,0.6) 75%)` : "rgba(0,0,0,0.4)",
      border: `1px solid ${selected ? tierC : "var(--hairline)"}`,
      padding: "5px 6px 6px",
      position: "relative",
      cursor: "pointer",
      minHeight: 92,
      overflow: "hidden",
      boxShadow: selected ? `0 0 12px ${tierC}40` : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 6, fontFamily: "var(--f-mono)", color: tierC, fontWeight: 700, letterSpacing: 0.1 }}>
          {amulet.tier.toUpperCase()}
        </span>
        <span style={{ fontSize: 9, color: t.color }}>{t.glyph}</span>
      </div>
      <div className="thai-display" style={{ fontSize: 11, color: "var(--bone)", lineHeight: 1.1, marginTop: 3, marginBottom: 3 }}>
        {amulet.name}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
        <span className={`el-chip el-${amulet.element}`} style={{ fontSize: 6, padding: "0 3px", border: "none", background: "rgba(0,0,0,0.4)" }}>
          ●
        </span>
        <span className="num" style={{ fontSize: 7, color: "var(--bone-mute)" }}>Lv{amulet.lv}</span>
      </div>
      <div style={{ fontSize: 8, color: "var(--bone-soft)", lineHeight: 1.3 }}>
        {amulet.stat}
      </div>
      {selected && (
        <>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", border: `1px solid ${tierC}`, boxShadow: `inset 0 0 0 1px ${tierC}40` }} />
          <div style={{ position: "absolute", bottom: 2, right: 3, fontSize: 7, fontFamily: "var(--f-mono)", color: tierC, fontWeight: 700, letterSpacing: 0.1 }}>
            ✓ เลือก
          </div>
        </>
      )}
    </div>
  );
}

function CompareDelta({ before, after, sign }) {
  const cls = sign === "+" ? "#7df096" : sign === "−" ? "var(--blood)" : "var(--bone)";
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4, fontFamily: "var(--f-mono)", fontSize: 9 }}>
      <span style={{ color: "var(--bone-mute)" }}>{before}</span>
      <svg width="8" height="6" viewBox="0 0 10 6" fill="none" stroke="var(--bone-mute)" strokeWidth="1"><path d="M0 3 L8 3 M5 1 L8 3 L5 5" /></svg>
      <span style={{ color: cls, fontWeight: 600 }}>{after}</span>
    </span>
  );
}

function AmuletScreen() {
  // selected amulet from inventory — replacing slot 0 (active fire)
  // mock state: ยันต์หินดินสาร selected, would replace เพลิงล้างวิญญ์
  return (
    <div className="screen" style={{
      background: `radial-gradient(ellipse 100% 50% at 50% 30%, #261430, var(--void) 70%)`,
    }}>
      <div className="noise" />
      <StatusBar />

      {/* Top HUD */}
      <div style={{ padding: "0 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", width: 28, height: 28, color: "var(--bone)", borderRadius: 2 }}>
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6.5 1 L2 5 L6.5 9" /></svg>
        </button>
        <div style={{ textAlign: "center" }}>
          <div className="eyebrow">AMULET SLOTS · ลงอักขระ</div>
          <div className="thai-display" style={{ fontSize: 15, color: "var(--gold-soft)", lineHeight: 1.1, marginTop: 1 }}>
            ย่ามขมังเวท
          </div>
        </div>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", color: "var(--bone-mute)", padding: "5px 8px", fontFamily: "var(--f-mono)", fontSize: 9, letterSpacing: 0.1, borderRadius: 2 }}>
          ◷ AUTO
        </button>
      </div>

      <Ornament />

      {/* Active spirit context */}
      <div style={{ padding: "8px 14px 6px", display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.3)", borderBottom: "1px solid var(--hairline)" }}>
        <Chibi kind="krasue" size={48} aura />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="thai-display" style={{ fontSize: 15, color: "var(--bone)" }}>กระสือ</span>
            <span className="num" style={{ fontSize: 10, color: "var(--gold)" }}>+12</span>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
            <span className="el-chip el-fire" style={{ fontSize: 7, padding: "1px 4px" }}>หทัย · FIRE</span>
            <span className="pill" style={{ fontSize: 7, padding: "1px 4px" }}>Lv 32</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="num" style={{ fontSize: 16, color: "var(--gold-soft)" }}>3<span style={{ color: "var(--bone-mute)", fontSize: 11 }}>/4</span></div>
          <div className="eyebrow-mute" style={{ fontSize: 7 }}>SOCKETS</div>
        </div>
      </div>

      {/* 4 Sockets — 2x2 grid */}
      <div style={{ padding: "10px 12px 8px" }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>4 SACRED SOCKETS · สี่อักขระคุ้มกาย</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <SocketCell amulet={EQUIPPED[0]} type="active" idx={0} hovering />
          <SocketCell amulet={EQUIPPED[1]} type="active" idx={1} />
          <SocketCell amulet={EQUIPPED[2]} type="passive" idx={2} />
          <SocketCell amulet={EQUIPPED[3]} type="utility" idx={3} />
        </div>
      </div>

      {/* Compare tooltip — when amulet is selected for replacement */}
      <div style={{ padding: "0 12px 8px" }}>
        <div style={{
          background: "linear-gradient(90deg, rgba(125,240,150,0.07), rgba(212,175,55,0.06))",
          border: "1px solid var(--gold)",
          padding: "7px 10px",
          position: "relative",
        }}>
          <div style={{ position: "absolute", top: -7, left: 10, padding: "1px 6px", background: "var(--gold)", color: "var(--ink)", fontFamily: "var(--f-mono)", fontSize: 7, letterSpacing: 0.15, fontWeight: 700 }}>
            REPLACE PREVIEW · SLOT 1
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, marginTop: 2 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span className="thai-display" style={{ fontSize: 12, color: "var(--bone-mute)", textDecoration: "line-through" }}>เพลิงล้างวิญญ์</span>
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="var(--gold)" strokeWidth="1.2"><path d="M0 4 L8 4 M5 1 L8 4 L5 7" /></svg>
              <span className="thai-display" style={{ fontSize: 12, color: "var(--gold-soft)" }}>หินดินสาร</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto 1fr", gap: "2px 8px", alignItems: "baseline" }}>
            <span className="eyebrow-mute" style={{ fontSize: 7 }}>ATK%</span>
            <CompareDelta before="180%" after="120%" sign="−" />
            <span className="eyebrow-mute" style={{ fontSize: 7 }}>CD</span>
            <CompareDelta before="10s" after="5s" sign="+" />
            <span className="eyebrow-mute" style={{ fontSize: 7 }}>GUTS</span>
            <CompareDelta before="30" after="15" sign="+" />
            <span className="eyebrow-mute" style={{ fontSize: 7 }}>EFFECT</span>
            <span style={{ fontSize: 9, color: "var(--bone-soft)" }}>AoE → stun 1t</span>
          </div>
        </div>
      </div>

      {/* Inventory tabs */}
      <div style={{ padding: "0 12px 6px", display: "flex", gap: 4 }}>
        <button style={{ background: "var(--gold)", color: "var(--ink)", border: "none", padding: "4px 10px", fontFamily: "var(--f-mono)", fontSize: 9, fontWeight: 600, letterSpacing: 0.1, borderRadius: 2 }}>
          ALL · 24
        </button>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", color: "var(--blood)", padding: "4px 10px", fontFamily: "var(--f-mono)", fontSize: 9, letterSpacing: 0.1, borderRadius: 2 }}>⚔ โจมตี 9</button>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", color: "var(--gold)", padding: "4px 10px", fontFamily: "var(--f-mono)", fontSize: 9, letterSpacing: 0.1, borderRadius: 2 }}>✦ พาสซีฟ 8</button>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", color: "var(--corruption-soft)", padding: "4px 10px", fontFamily: "var(--f-mono)", fontSize: 9, letterSpacing: 0.1, borderRadius: 2 }}>☽ แก้ทาง 7</button>
      </div>

      {/* Inventory grid */}
      <div style={{ padding: "0 12px 8px", maxHeight: 260, overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
          {INV.slice(0, 9).map((a, i) => (
            <InventoryCard key={i} amulet={a} selected={a.selected} />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "8px 14px 18px",
        background: "linear-gradient(180deg, transparent, var(--ink) 30%)",
        borderTop: "1px solid var(--hairline)",
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-ghost" style={{ flex: 1, fontSize: 10, padding: "8px 8px" }}>
            ⤬ ถอด
          </button>
          <button className="btn btn-ghost" style={{ flex: 1, fontSize: 10, padding: "8px 8px" }}>
            ↻ คืนค่า
          </button>
          <button className="btn btn-gold" style={{ flex: 1.6, fontSize: 12, padding: "8px 12px" }}>
            ✦ สวมยันต์ · EQUIP
          </button>
        </div>
      </div>
    </div>
  );
}

window.AmuletScreen = AmuletScreen;
