// roster-map.jsx — Roster screen + Roguelike Map screen

// ───────────────────────────────────────────────────────────────
// Roster Screen — grid of owned spirits, filter / sort, team builder
// ───────────────────────────────────────────────────────────────

function SpiritCard({ kind, level, plus, tier, inTeam, locked }) {
  const s = SPIRITS[kind];
  const tierColor = { common: "var(--t-common)", rare: "var(--t-rare)", epic: "var(--t-epic)", legend: "var(--t-legend)", mythic: "var(--t-mythic)" }[tier];
  return (
    <div style={{
      background: `linear-gradient(180deg, ${s.color}28, rgba(0,0,0,0.6) 60%)`,
      border: `1px solid ${inTeam ? "var(--gold)" : tierColor}`,
      padding: 6,
      position: "relative",
      aspectRatio: "0.78",
      overflow: "hidden",
      cursor: "pointer",
    }}>
      {/* tier corner */}
      <div style={{ position: "absolute", top: 0, left: 0, padding: "2px 5px", background: tierColor, color: "var(--ink)", fontFamily: "var(--f-mono)", fontSize: 7, fontWeight: 700, letterSpacing: 0.1 }}>
        {tier.toUpperCase().slice(0, 4)}
      </div>
      {inTeam && (
        <div style={{ position: "absolute", top: 0, right: 0, padding: "2px 5px", background: "var(--gold)", color: "var(--ink)", fontFamily: "var(--f-mono)", fontSize: 7, fontWeight: 700 }}>
          T{inTeam}
        </div>
      )}
      {locked && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, flexDirection: "column", gap: 4 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--bone-mute)" strokeWidth="1.2">
            <rect x="3" y="7" width="10" height="7" rx="1" />
            <path d="M5 7 V5 a3 3 0 0 1 6 0 V7" />
          </svg>
          <div className="eyebrow-mute" style={{ fontSize: 7 }}>SEALED</div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        <Chibi kind={kind} size={66} aura={false} mood={locked ? "ko" : "normal"} />
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "5px 6px", background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.85))" }}>
        <div className="thai-display" style={{ fontSize: 11, color: "var(--bone)", lineHeight: 1, textAlign: "center" }}>{s.name}</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, alignItems: "baseline" }}>
          <span className="num" style={{ fontSize: 8, color: "var(--bone-mute)" }}>Lv {level}</span>
          {plus > 0 && <span className="num" style={{ fontSize: 8, color: "var(--gold-soft)" }}>+{plus}</span>}
          <span className={`el-chip el-${s.element}`} style={{ fontSize: 6, padding: "0 3px", border: "none", background: "none" }}>●</span>
        </div>
      </div>
    </div>
  );
}

function RosterScreen() {
  const grid = [
    { kind: "krasue", level: 32, plus: 12, tier: "epic", inTeam: 1 },
    { kind: "maenak", level: 35, plus: 9, tier: "mythic", inTeam: 2 },
    { kind: "nangtani", level: 28, plus: 5, tier: "epic", inTeam: 3 },
    { kind: "pret", level: 30, plus: 7, tier: "legend" },
    { kind: "phitaihong", level: 26, plus: 0, tier: "legend" },
    { kind: "krahang", level: 22, plus: 3, tier: "rare" },
    { kind: "pob", level: 18, plus: 0, tier: "rare" },
    { kind: "jakkajan", level: 12, plus: 0, tier: "common" },
    { kind: "krasue", level: 1, plus: 0, tier: "common", locked: true },
  ];

  return (
    <div className="screen" style={{
      background: `radial-gradient(ellipse 110% 50% at 50% 100%, #2a1238, var(--void) 70%)`,
    }}>
      <div className="noise" />
      <StatusBar />

      {/* Header */}
      <div style={{ padding: "0 14px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div className="eyebrow">SPIRIT ROSTER · ตำรารวมผี</div>
            <div className="thai-display" style={{ fontSize: 24, color: "var(--gold-soft)", lineHeight: 1.1, marginTop: 2 }}>
              ผีในชายคา
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="num" style={{ fontSize: 18, color: "var(--bone)" }}>
              23<span style={{ color: "var(--bone-mute)", fontSize: 12 }}>/30</span>
            </div>
            <div className="eyebrow-mute" style={{ fontSize: 8 }}>UNSEALED</div>
          </div>
        </div>
      </div>

      <Ornament />

      {/* Filter bar */}
      <div style={{ padding: "8px 14px", display: "flex", gap: 4, overflowX: "auto" }}>
        <button style={{ background: "var(--gold)", color: "var(--ink)", border: "none", padding: "5px 10px", fontFamily: "var(--f-mono)", fontSize: 9, fontWeight: 600, letterSpacing: 0.1 }}>ALL · 23</button>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", color: "var(--el-fire)", padding: "5px 10px", fontFamily: "var(--f-mono)", fontSize: 9, letterSpacing: 0.1 }}>🜂 ไฟ 6</button>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", color: "var(--el-wind)", padding: "5px 10px", fontFamily: "var(--f-mono)", fontSize: 9, letterSpacing: 0.1 }}>🜁 ลม 4</button>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", color: "var(--el-earth)", padding: "5px 10px", fontFamily: "var(--f-mono)", fontSize: 9, letterSpacing: 0.1 }}>🜃 ดิน 5</button>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", color: "var(--el-water)", padding: "5px 10px", fontFamily: "var(--f-mono)", fontSize: 9, letterSpacing: 0.1 }}>🜄 น้ำ 4</button>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", color: "var(--el-occult)", padding: "5px 10px", fontFamily: "var(--f-mono)", fontSize: 9, letterSpacing: 0.1 }}>✸ อาถรรพ์ 4</button>
      </div>

      {/* Team strip */}
      <div style={{ padding: "0 14px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span className="eyebrow">ทีมปัจจุบัน · ACTIVE TEAM</span>
          <span className="eyebrow-mute">PWR <span className="num" style={{ color: "var(--gold-soft)" }}>14,820</span></span>
        </div>
        <div style={{ display: "flex", gap: 6, background: "rgba(0,0,0,0.5)", padding: 8, border: "1px solid var(--hairline-strong)" }}>
          {[ "krasue", "maenak", "nangtani"].map((k, i) => {
            const s = SPIRITS[k];
            return (
              <div key={k} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ position: "relative" }}>
                  <Chibi kind={k} size={48} aura={false} />
                  <div style={{ position: "absolute", top: -2, left: -2, fontSize: 8, background: "var(--gold)", color: "var(--ink)", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--f-mono)", fontWeight: 700 }}>{i + 1}</div>
                </div>
                <div className="thai-display" style={{ fontSize: 9, lineHeight: 1 }}>{s.name}</div>
                <span className={`el-chip el-${s.element}`} style={{ fontSize: 6, padding: "0 3px", borderColor: "transparent", background: "transparent" }}>●</span>
              </div>
            );
          })}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--faint)", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 16, color: "var(--muted)" }}>+</div>
            <div className="eyebrow-mute" style={{ fontSize: 7 }}>SLOT 4</div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: "0 14px 16px", overflowY: "auto", maxHeight: 400 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {grid.map((g, i) => <SpiritCard key={i} {...g} />)}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(180deg, transparent, var(--ink) 30%)", padding: "8px 14px 18px", borderTop: "1px solid var(--hairline)" }}>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          {[
            { label: "Run", glyph: "▲" },
            { label: "Roster", glyph: "◇", active: true },
            { label: "Forge", glyph: "✦" },
            { label: "Story", glyph: "☽" },
            { label: "Shop", glyph: "◈" },
          ].map(n => (
            <div key={n.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: n.active ? "var(--gold)" : "var(--bone-mute)" }}>
              <span style={{ fontSize: 16 }}>{n.glyph}</span>
              <span className="eyebrow" style={{ color: "inherit", fontSize: 8 }}>{n.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Roguelike Map Screen — branching path of rooms, Slay-the-Spire style
// ───────────────────────────────────────────────────────────────

function RoomNode({ type, x, y, status }) {
  const config = {
    battle: { glyph: "⚔", color: "var(--blood)", label: "ต่อสู้" },
    elite: { glyph: "☠", color: "var(--corruption)", label: "ผีใหญ่" },
    event: { glyph: "?", color: "var(--gold)", label: "เหตุการณ์" },
    rest: { glyph: "☽", color: "var(--el-wind)", label: "พักผ่อน" },
    shop: { glyph: "◈", color: "var(--gold-soft)", label: "ตลาด" },
    discovery: { glyph: "✦", color: "var(--spirit)", label: "ค้นพบ" },
    boss: { glyph: "✚", color: "var(--blood)", label: "เจ้าบท" },
  };
  const c = config[type] || config.battle;
  const isPast = status === "past";
  const isNow = status === "now";
  const isNext = status === "next";

  return (
    <g transform={`translate(${x}, ${y})`}>
      {isNow && (
        <circle r="20" fill="none" stroke="var(--gold-glow)" strokeWidth="1" opacity="0.6">
          <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      <circle
        r={isNow ? 13 : 11}
        fill={isPast ? "rgba(0,0,0,0.6)" : isNext ? "rgba(212,175,55,0.18)" : "rgba(0,0,0,0.7)"}
        stroke={isPast ? "var(--bone-mute)" : isNow ? "var(--gold-glow)" : isNext ? "var(--gold)" : c.color}
        strokeWidth={isNow ? 2 : 1.3}
        opacity={isPast ? 0.5 : 1}
      />
      <text
        x="0"
        y="4"
        textAnchor="middle"
        fontSize="13"
        fill={isPast ? "var(--bone-mute)" : c.color}
        fontFamily="var(--f-mono)"
        fontWeight="600"
        opacity={isPast ? 0.5 : 1}
      >{c.glyph}</text>
      {isPast && (
        <line x1="-8" y1="-8" x2="8" y2="8" stroke="var(--bone-mute)" strokeWidth="1" opacity="0.4" />
      )}
    </g>
  );
}

function MapScreen() {
  // 7 floors, branching graph
  const floors = [
    { y: 700, nodes: [{ x: 195, type: "battle", status: "past" }] },
    { y: 620, nodes: [{ x: 130, type: "event", status: "past" }, { x: 260, type: "battle", status: "past" }] },
    { y: 540, nodes: [{ x: 95, type: "battle", status: "past" }, { x: 195, type: "rest", status: "past" }, { x: 295, type: "discovery", status: "past" }] },
    { y: 460, nodes: [{ x: 130, type: "elite", status: "past" }, { x: 260, type: "battle", status: "now" }] },
    { y: 380, nodes: [{ x: 80, type: "event", status: "next" }, { x: 195, type: "shop", status: "next" }, { x: 310, type: "battle", status: "next" }] },
    { y: 300, nodes: [{ x: 130, type: "battle" }, { x: 260, type: "rest" }] },
    { y: 220, nodes: [{ x: 195, type: "elite" }] },
    { y: 140, nodes: [{ x: 195, type: "boss" }] },
  ];

  // Build edges: connect each node to 1-2 nearest in floor above
  const edges = [];
  for (let i = 0; i < floors.length - 1; i++) {
    const cur = floors[i], up = floors[i + 1];
    cur.nodes.forEach((n, ni) => {
      const upN = up.nodes;
      // simple connection: nearest by x
      const sorted = upN.map((u, ui) => ({ ui, dx: Math.abs(u.x - n.x) })).sort((a, b) => a.dx - b.dx);
      const targets = sorted.slice(0, Math.min(2, upN.length));
      targets.forEach(t => edges.push({ from: n, to: upN[t.ui], status: n.status === "past" && upN[t.ui].status === "past" ? "past" : (n.status === "now" || upN[t.ui].status === "next") ? "active" : "future" }));
    });
  }

  return (
    <div className="screen" style={{
      background: `linear-gradient(180deg, #1f0c2e 0%, var(--void) 50%, #1a0816 100%)`,
    }}>
      <div className="noise" />
      <StatusBar />

      {/* Header HUD */}
      <div style={{ padding: "0 14px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="eyebrow">ROGUELIKE · บทที่ 02</div>
          <div className="thai-display" style={{ fontSize: 22, color: "var(--gold-soft)", lineHeight: 1.1 }}>ตรอกผีดิบ</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 11, color: "var(--corruption-soft)" }}>◇</span>
            <span className="num" style={{ fontSize: 14, color: "var(--corruption-soft)" }}>240</span>
            <span style={{ fontSize: 11, color: "var(--gold-soft)", marginLeft: 6 }}>◆</span>
            <span className="num" style={{ fontSize: 14, color: "var(--gold-soft)" }}>17</span>
          </div>
          <div className="eyebrow-mute" style={{ fontSize: 8 }}>FOCUS 4/5</div>
        </div>
      </div>

      <Ornament />

      {/* Map SVG canvas */}
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, bottom: 130 }}>
        <svg viewBox="0 0 390 760" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="pathGrad" x1="0" x2="0" y1="1" y2="0">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.7" />
            </linearGradient>
            <pattern id="dottedPath" patternUnits="userSpaceOnUse" width="8" height="8">
              <circle cx="4" cy="4" r="1" fill="var(--bone-mute)" opacity="0.3" />
            </pattern>
          </defs>

          {/* Floor number labels */}
          {floors.map((f, i) => (
            <g key={`fl-${i}`}>
              <text x="20" y={f.y + 4} fontFamily="var(--f-mono)" fontSize="9" fill="var(--bone-mute)" opacity="0.5">{String(i + 1).padStart(2, "0")}</text>
              <line x1="38" y1={f.y} x2="370" y2={f.y} stroke="var(--hairline)" strokeWidth="0.4" strokeDasharray="2 6" opacity="0.4" />
            </g>
          ))}

          {/* Edges */}
          {edges.map((e, i) => (
            <line
              key={`e-${i}`}
              x1={e.from.x}
              y1={floors.find(f => f.nodes.includes(e.from)).y}
              x2={e.to.x}
              y2={floors.find(f => f.nodes.includes(e.to)).y}
              stroke={e.status === "past" ? "var(--gold)" : e.status === "active" ? "var(--gold-glow)" : "var(--bone-mute)"}
              strokeWidth={e.status === "active" ? 1.6 : 1}
              strokeDasharray={e.status === "future" ? "3 4" : "none"}
              opacity={e.status === "past" ? 0.7 : e.status === "active" ? 1 : 0.35}
            />
          ))}

          {/* Nodes */}
          {floors.map((f, fi) => f.nodes.map((n, ni) => (
            <RoomNode key={`n-${fi}-${ni}`} {...n} y={f.y} />
          )))}

          {/* Boss label */}
          <g transform="translate(195, 100)">
            <rect x="-50" y="-12" width="100" height="18" fill="rgba(192,57,43,0.18)" stroke="var(--blood)" strokeWidth="0.6" />
            <text textAnchor="middle" y="2" fontFamily="var(--f-mono)" fontSize="9" fill="var(--blood)" letterSpacing="1.5">BOSS · เจ้าโทสะ</text>
          </g>
        </svg>
      </div>

      {/* Next room card (peek) */}
      <div style={{
        position: "absolute",
        bottom: 70,
        left: 14,
        right: 14,
        background: "linear-gradient(180deg, var(--panel-2), var(--shrine))",
        border: "1px solid var(--gold)",
        padding: "10px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(192,57,43,0.2)", border: "1px solid var(--blood)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blood)", fontSize: 20 }}>⚔</div>
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ color: "var(--blood)" }}>NEXT · ห้องที่ 4</div>
            <div className="thai-display" style={{ fontSize: 13, color: "var(--bone)" }}>ต่อสู้ · ผีดิบ × 3</div>
            <div className="eyebrow-mute" style={{ fontSize: 9 }}>+ 80 spirit dust · 12% drop ยันต์</div>
          </div>
          <button className="btn btn-gold" style={{ fontSize: 11 }}>เดินหน้า ▶</button>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(180deg, transparent, var(--ink) 30%)", padding: "8px 14px 18px", borderTop: "1px solid var(--hairline)" }}>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          {[
            { label: "Run", glyph: "▲", active: true },
            { label: "Roster", glyph: "◇" },
            { label: "Forge", glyph: "✦" },
            { label: "Story", glyph: "☽" },
            { label: "Shop", glyph: "◈" },
          ].map(n => (
            <div key={n.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: n.active ? "var(--gold)" : "var(--bone-mute)" }}>
              <span style={{ fontSize: 16 }}>{n.glyph}</span>
              <span className="eyebrow" style={{ color: "inherit", fontSize: 8 }}>{n.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.RosterScreen = RosterScreen;
window.MapScreen = MapScreen;
