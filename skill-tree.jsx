// skill-tree.jsx — Skill Tree UI (yantra-shaped passive tree)
// "ย่อยตำรา" = consume scrolls → invest skill points into nodes
// Schools: สายเลือดเดือด (offense) / สายอามรณ์ (resource) / สายเงาเดือน (defense+occult)

// ──────────────────────────────────────────────
// Node data — one tree (สายเลือดเดือด, offense focus)
// state: 'taken' | 'available' | 'locked'
// ──────────────────────────────────────────────
const TREE_NODES = [
  // Root (bottom center)
  { id: "root", x: 180, y: 460, kind: "root", state: "taken", name: "ตื่นรู้", desc: "เริ่มต้น · +5 ATK ทุกตัว", branch: "core" },

  // Branch dividers (minor +1 each)
  { id: "m-l1", x: 100, y: 400, kind: "minor", state: "taken", name: "+ ATK", desc: "+12 ATK", branch: "L" },
  { id: "m-c1", x: 180, y: 400, kind: "minor", state: "taken", name: "+ ATK", desc: "+12 ATK", branch: "C" },
  { id: "m-r1", x: 260, y: 400, kind: "minor", state: "taken", name: "+ DEF", desc: "+10 DEF", branch: "R" },

  // Layer 2 minors
  { id: "m-l2", x: 60, y: 340, kind: "minor", state: "taken", name: "+ CRIT%", desc: "+3% CRIT", branch: "L" },
  { id: "m-l3", x: 130, y: 340, kind: "minor", state: "available", name: "+ FIRE", desc: "+15% Fire DMG", branch: "L" },
  { id: "m-c2", x: 180, y: 340, kind: "minor", state: "taken", name: "GUTS+", desc: "+4 GUTS / ตี", branch: "C" },
  { id: "m-r2", x: 230, y: 340, kind: "minor", state: "available", name: "+ HP", desc: "+8% Max HP", branch: "R" },
  { id: "m-r3", x: 300, y: 340, kind: "minor", state: "locked", name: "+ DEF", desc: "+15 DEF", branch: "R" },

  // Layer 3 notables
  { id: "n-L", x: 90, y: 240, kind: "notable", state: "available", name: "เลือดเดือด", desc: "DMG เพิ่ม 18% เมื่อ HP < 50%", branch: "L", icon: "🜂" },
  { id: "n-C", x: 180, y: 240, kind: "notable", state: "taken", name: "อามรณ์เร่ง", desc: "GUTS regen +50% นอกเทิร์น", branch: "C", icon: "✦" },
  { id: "n-R", x: 270, y: 240, kind: "notable", state: "locked", name: "ดินสารพัด", desc: "ลด DMG เข้า 12% · ดิน +20%", branch: "R", icon: "🜃" },

  // Layer 4 minors (between notables and keystones)
  { id: "m-l4", x: 100, y: 170, kind: "minor", state: "locked", name: "+ SPD", desc: "+8 SPD", branch: "L" },
  { id: "m-c3", x: 180, y: 170, kind: "minor", state: "available", name: "ULT−", desc: "Cooldown ULT −2s", branch: "C" },
  { id: "m-r4", x: 260, y: 170, kind: "minor", state: "locked", name: "+ RES", desc: "+10% Status RES", branch: "R" },

  // Keystones (top)
  { id: "k-L", x: 90, y: 90, kind: "keystone", state: "locked", name: "เพลิงล้างโลก", desc: "ใช้สกิลไฟ สร้างเปลวเผาทั้งสนาม · แต่ HP ตัวเอง −20% ต่อเทิร์น", branch: "L", glyph: "🜂" },
  { id: "k-C", x: 180, y: 90, kind: "keystone", state: "locked", name: "หล่อร่างใหม่", desc: "GUTS เต็ม 100 → ULT ฟรีไม่กิน GUTS · CD ULT ×2", branch: "C", glyph: "✸" },
  { id: "k-R", x: 270, y: 90, kind: "keystone", state: "locked", name: "เงาเดือนคุ้มภัย", desc: "ตีกลับ 30% DMG · แต่ ATK ตัวเอง −15%", branch: "R", glyph: "☽" },
];

const TREE_EDGES = [
  ["root", "m-l1"], ["root", "m-c1"], ["root", "m-r1"],
  ["m-l1", "m-l2"], ["m-l1", "m-l3"],
  ["m-c1", "m-c2"], ["m-c1", "m-l3"],
  ["m-r1", "m-r2"], ["m-r1", "m-r3"],
  ["m-l2", "n-L"], ["m-l3", "n-L"], ["m-l3", "n-C"],
  ["m-c2", "n-C"], ["m-r2", "n-C"],
  ["m-r2", "n-R"], ["m-r3", "n-R"],
  ["n-L", "m-l4"], ["n-C", "m-c3"], ["n-R", "m-r4"],
  ["m-l4", "k-L"], ["m-c3", "k-C"], ["m-r4", "k-R"],
  // cross paths
  ["m-l4", "k-C"], ["m-r4", "k-C"],
];

function nodeById(id) {
  return TREE_NODES.find(n => n.id === id);
}

function nodeColor(state) {
  return {
    taken: "var(--gold-glow)",
    available: "var(--gold)",
    locked: "var(--bone-mute)",
  }[state];
}

function nodeFill(state) {
  return {
    taken: "rgba(212,175,55,0.4)",
    available: "rgba(212,175,55,0.08)",
    locked: "rgba(0,0,0,0.55)",
  }[state];
}

function TreeEdge({ from, to }) {
  const both = from.state === "taken" && to.state === "taken";
  const reachable = (from.state === "taken" && to.state === "available") || (to.state === "taken" && from.state === "available");
  const stroke = both ? "var(--gold)" : reachable ? "var(--gold-deep)" : "var(--bone-mute)";
  const dash = both ? "none" : reachable ? "none" : "3 4";
  const op = both ? 0.85 : reachable ? 0.55 : 0.25;
  return (
    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
      stroke={stroke} strokeWidth={both ? 2 : 1.2} strokeDasharray={dash} opacity={op} />
  );
}

function TreeNode({ node, selected, onSelect }) {
  const r = node.kind === "keystone" ? 18 : node.kind === "notable" ? 13 : node.kind === "root" ? 16 : 8;
  const isSel = selected === node.id;
  const color = nodeColor(node.state);
  const fill = nodeFill(node.state);

  return (
    <g style={{ cursor: "pointer" }} onClick={() => onSelect(node.id)}>
      {/* selection pulse */}
      {isSel && (
        <circle cx={node.x} cy={node.y} r={r + 8} fill="none" stroke="var(--gold-glow)" strokeWidth="1" opacity="0.8">
          <animate attributeName="r" values={`${r + 6};${r + 12};${r + 6}`} dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.6s" repeatCount="indefinite" />
        </circle>
      )}
      {/* outer glow for taken */}
      {node.state === "taken" && (
        <circle cx={node.x} cy={node.y} r={r + 3} fill="var(--gold)" opacity="0.18" />
      )}

      {node.kind === "keystone" ? (
        <g transform={`translate(${node.x}, ${node.y})`}>
          {/* diamond/star shape */}
          <path d={`M 0 ${-r} L ${r} 0 L 0 ${r} L ${-r} 0 Z`} fill={fill} stroke={color} strokeWidth={isSel ? 2 : 1.4} />
          <path d={`M 0 ${-(r - 4)} L ${r - 4} 0 L 0 ${r - 4} L ${-(r - 4)} 0 Z`} fill="none" stroke={color} strokeWidth="0.5" opacity="0.6" />
          <text textAnchor="middle" y="5" fontSize="14" fill={color}>{node.glyph || "✦"}</text>
        </g>
      ) : node.kind === "notable" ? (
        <g transform={`translate(${node.x}, ${node.y})`}>
          {/* hexagon-ish */}
          <circle r={r} fill={fill} stroke={color} strokeWidth={isSel ? 2 : 1.3} />
          <circle r={r - 3} fill="none" stroke={color} strokeWidth="0.5" opacity="0.5" />
          <text textAnchor="middle" y="4" fontSize="11" fill={color}>{node.icon || "◆"}</text>
        </g>
      ) : node.kind === "root" ? (
        <g transform={`translate(${node.x}, ${node.y})`}>
          <circle r={r} fill="rgba(212,175,55,0.3)" stroke="var(--gold-glow)" strokeWidth="1.5" />
          <circle r={r - 4} fill="none" stroke="var(--gold-glow)" strokeWidth="0.6" />
          <text textAnchor="middle" y="4" fontSize="11" fill="var(--gold-glow)">☥</text>
        </g>
      ) : (
        <circle cx={node.x} cy={node.y} r={r} fill={fill} stroke={color} strokeWidth={isSel ? 2 : 1.1} />
      )}
    </g>
  );
}

function TreeDetailPanel({ nodeId }) {
  const node = nodeById(nodeId) || nodeById("n-C");
  const stateBadge = {
    taken: { label: "TAKEN", color: "var(--gold-glow)", bg: "rgba(212,175,55,0.18)" },
    available: { label: "READY", color: "var(--gold)", bg: "rgba(212,175,55,0.08)" },
    locked: { label: "LOCKED", color: "var(--bone-mute)", bg: "rgba(0,0,0,0.4)" },
  }[node.state];

  const kindLabel = { keystone: "KEYSTONE · พลังเอก", notable: "NOTABLE · พลังเด่น", minor: "MINOR · พลังเล็ก", root: "ROOT" }[node.kind];
  const cost = { keystone: 8, notable: 3, minor: 1, root: 0 }[node.kind];

  return (
    <div style={{
      background: "linear-gradient(180deg, var(--panel-2), var(--shrine) 80%)",
      borderTop: "1px solid var(--gold)",
      padding: "10px 14px 10px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span className="eyebrow" style={{ color: node.kind === "keystone" ? "var(--corruption-soft)" : "var(--gold)" }}>{kindLabel}</span>
        <span style={{
          fontSize: 8, fontFamily: "var(--f-mono)", fontWeight: 600,
          color: stateBadge.color, background: stateBadge.bg,
          padding: "1px 6px", border: `1px solid ${stateBadge.color}`, letterSpacing: 0.15,
        }}>{stateBadge.label}</span>
      </div>
      <div className="thai-display" style={{ fontSize: 18, color: "var(--bone)", marginBottom: 4, lineHeight: 1 }}>
        {node.name}
      </div>
      <div style={{ fontSize: 11, color: "var(--bone-soft)", lineHeight: 1.45, marginBottom: 8 }}>
        {node.desc}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: "var(--gold)" }}>✦</span>
            <span className="num" style={{ fontSize: 11, color: "var(--gold-soft)" }}>{cost} pt</span>
          </div>
          <div className="hairline-v" style={{ height: 14, width: 1, background: "var(--hairline)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 9, color: "var(--bone-mute)" }}>SCROLLS</span>
            <span className="num" style={{ fontSize: 11, color: "var(--bone)" }}>×{cost * 2}</span>
          </div>
        </div>
        <button disabled={node.state !== "available"} style={{
          background: node.state === "available" ? "linear-gradient(180deg, var(--gold-soft), var(--gold) 50%, var(--gold-deep))" : "rgba(0,0,0,0.4)",
          border: `1px solid ${node.state === "available" ? "var(--gold-deep)" : "var(--hairline)"}`,
          color: node.state === "available" ? "var(--ink)" : "var(--bone-mute)",
          fontFamily: "var(--f-display)",
          fontWeight: 700,
          fontSize: 12,
          padding: "8px 16px",
          cursor: node.state === "available" ? "pointer" : "not-allowed",
          letterSpacing: 0.2,
          boxShadow: node.state === "available" ? "inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 0 #4a3510" : "none",
        }}>
          {node.state === "taken" ? "✓ ครอบครองแล้ว" : node.state === "available" ? "ย่อยตำรา · INVEST" : "ปลดล็อกไม่ได้"}
        </button>
      </div>
    </div>
  );
}

function SkillTreeScreen() {
  const [sel, setSel] = React.useState("n-C");

  return (
    <div className="screen" style={{
      background: `radial-gradient(ellipse 90% 70% at 50% 50%, #1a0c24, var(--void) 85%)`,
    }}>
      <div className="noise" />
      <StatusBar />

      {/* Top HUD */}
      <div style={{ padding: "0 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", width: 30, height: 30, color: "var(--bone)", borderRadius: 2 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6.5 1 L2 5 L6.5 9" /></svg>
        </button>
        <div style={{ textAlign: "center" }}>
          <div className="eyebrow">SKILL TREE · ตำราย่อยใจ</div>
          <div className="thai-display" style={{ fontSize: 15, color: "var(--gold-soft)", lineHeight: 1.1 }}>
            กระสือ · Lv 32
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 11, color: "var(--gold-soft)" }}>✦</span>
            <span className="num" style={{ fontSize: 14, color: "var(--gold-soft)", fontWeight: 700 }}>7</span>
          </div>
          <div className="eyebrow-mute" style={{ fontSize: 7 }}>UNSPENT</div>
        </div>
      </div>

      {/* Branch tabs */}
      <div style={{ padding: "4px 14px 8px", display: "flex", gap: 4 }}>
        {[
          { id: "blood", thai: "สายเลือดเดือด", en: "OFFENSE", active: true, color: "var(--blood)" },
          { id: "spirit", thai: "สายอามรณ์", en: "RESOURCE", color: "var(--gold)" },
          { id: "shadow", thai: "สายเงาเดือน", en: "OCCULT", color: "var(--corruption-soft)" },
        ].map(t => (
          <button key={t.id} style={{
            flex: 1,
            background: t.active ? `linear-gradient(180deg, ${t.color}28, rgba(0,0,0,0.3))` : "rgba(0,0,0,0.25)",
            border: `1px solid ${t.active ? t.color : "var(--hairline)"}`,
            padding: "5px 6px",
            color: t.active ? t.color : "var(--bone-mute)",
            cursor: "pointer",
            borderRadius: 2,
            fontFamily: "inherit",
            position: "relative",
          }}>
            {t.active && <div style={{ position: "absolute", top: -1, left: 0, right: 0, height: 1, background: t.color }} />}
            <div className="thai-display" style={{ fontSize: 10, lineHeight: 1 }}>{t.thai}</div>
            <div className="eyebrow-mute" style={{ fontSize: 7, marginTop: 1, color: "inherit", opacity: 0.6 }}>{t.en}</div>
          </button>
        ))}
      </div>

      {/* Tree canvas */}
      <div style={{
        position: "absolute",
        top: 142,
        left: 0,
        right: 0,
        bottom: 200,
        overflow: "hidden",
        background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(212,175,55,0.04), transparent)",
      }}>
        <svg viewBox="0 0 360 540" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="treeNodeGlow">
              <stop offset="0%" stopColor="var(--gold-glow)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
            </radialGradient>
            <pattern id="treeGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="0.5" fill="var(--gold)" opacity="0.15" />
            </pattern>
          </defs>

          {/* Background grid */}
          <rect width="360" height="540" fill="url(#treeGrid)" />

          {/* Decorative outer ring (yantra) */}
          <circle cx="180" cy="275" r="240" fill="none" stroke="var(--gold-deep)" strokeWidth="0.4" opacity="0.4" />
          <circle cx="180" cy="275" r="200" fill="none" stroke="var(--gold-deep)" strokeWidth="0.3" strokeDasharray="2 6" opacity="0.4" />

          {/* Edges first (under nodes) */}
          {TREE_EDGES.map(([fid, tid], i) => (
            <TreeEdge key={i} from={nodeById(fid)} to={nodeById(tid)} />
          ))}

          {/* Nodes */}
          {TREE_NODES.map(n => (
            <TreeNode key={n.id} node={n} selected={sel} onSelect={setSel} />
          ))}

          {/* Tier labels */}
          <text x="14" y="94" fontFamily="var(--f-mono)" fontSize="8" fill="var(--corruption-soft)" letterSpacing="2" opacity="0.7">KEY</text>
          <text x="14" y="244" fontFamily="var(--f-mono)" fontSize="8" fill="var(--gold)" letterSpacing="2" opacity="0.6">NOT</text>
          <text x="14" y="464" fontFamily="var(--f-mono)" fontSize="8" fill="var(--bone-mute)" letterSpacing="2" opacity="0.6">ROOT</text>
        </svg>

        {/* mini-legend overlay */}
        <div style={{
          position: "absolute",
          bottom: 4,
          left: 8,
          display: "flex",
          gap: 8,
          fontFamily: "var(--f-mono)",
          fontSize: 8,
          color: "var(--bone-mute)",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold-glow)" }} /> TAKEN
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", border: "1px solid var(--gold)" }} /> READY
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", border: "1px dashed var(--bone-mute)" }} /> LOCKED
          </span>
        </div>

        {/* Allocated counter overlay top-right */}
        <div style={{
          position: "absolute",
          top: 6,
          right: 8,
          background: "rgba(0,0,0,0.5)",
          border: "1px solid var(--hairline)",
          padding: "3px 8px",
          fontFamily: "var(--f-mono)",
          fontSize: 9,
          letterSpacing: 0.15,
        }}>
          <span style={{ color: "var(--gold)" }}>ALLOC</span>
          <span style={{ color: "var(--gold-glow)", marginLeft: 6, fontWeight: 700 }}>8</span>
          <span style={{ color: "var(--bone-mute)" }}> / 24</span>
        </div>
      </div>

      {/* Bottom detail panel + CTA */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <TreeDetailPanel nodeId={sel} />
      </div>
    </div>
  );
}

window.SkillTreeScreen = SkillTreeScreen;
