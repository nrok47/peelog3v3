// map-live.jsx — Live Roguelike Map Screen
// อ่าน zone/chapter/steps จาก GS.save + overlay บน MapScreen เดิม

// Zone definitions
const ZONES = [
  { id:'zone_01_graveyard', label:'สุสานร้าง',      icon:'⚰',  chapter:1 },
  { id:'zone_02_temple',    label:'วัดจอมปีศาจ',    icon:'🏯', chapter:2 },
  { id:'zone_03_forest',    label:'ป่าต้องสาป',     icon:'🌲', chapter:3 },
  { id:'zone_04_palace',    label:'วังแห่งความตาย', icon:'👑', chapter:4 },
];

// Map nodes layout (fixed positions)
const MAP_NODES = [
  // Chapter 1
  { id:'z1_1', zone:'zone_01_graveyard', x:50,  y:80,  type:'start',    label:'เริ่มต้น' },
  { id:'z1_2', zone:'zone_01_graveyard', x:120, y:55,  type:'battle',   label:'แก๊งผีดิบ' },
  { id:'z1_3', zone:'zone_01_graveyard', x:60,  y:32,  type:'event',    label:'หลุมลึกลับ' },
  { id:'z1_4', zone:'zone_01_graveyard', x:175, y:35,  type:'boss',     label:'ปอบเฒ่า' },
  // Chapter 2
  { id:'z2_1', zone:'zone_02_temple',   x:230, y:55,  type:'rest',     label:'ศาลเจ้า' },
  { id:'z2_2', zone:'zone_02_temple',   x:270, y:30,  type:'battle',   label:'ผีดิบทหาร' },
  { id:'z2_3', zone:'zone_02_temple',   x:220, y:10,  type:'event',    label:'ห้องพิธีกรรม' },
  { id:'z2_4', zone:'zone_02_temple',   x:310, y:15,  type:'boss',     label:'กระสือพญา' },
  // Chapter 3
  { id:'z3_1', zone:'zone_03_forest',  x:180, y:65,  type:'rest',     label:'กองไฟโบราณ' },
  { id:'z3_2', zone:'zone_03_forest',  x:250, y:75,  type:'battle',   label:'นางไม้ป่า' },
  { id:'z3_3', zone:'zone_03_forest',  x:290, y:58,  type:'event',    label:'ต้นตะเคียนสาป' },
  // Chapter 4
  { id:'z4_1', zone:'zone_04_palace',  x:180, y:82,  type:'battle',   label:'ทหารผี' },
  { id:'z4_2', zone:'zone_04_palace',  x:130, y:65,  type:'event',    label:'ห้องซ่อนกาย' },
  { id:'z4_3', zone:'zone_04_palace',  x:90,  y:48,  type:'boss',     label:'แม่ (Final)' },
];

// Edges between nodes
const EDGES = [
  ['z1_1','z1_2'],['z1_2','z1_3'],['z1_2','z1_4'],['z1_3','z1_4'],
  ['z1_4','z2_1'],['z2_1','z2_2'],['z2_2','z2_3'],['z2_2','z2_4'],
  ['z2_4','z3_1'],['z3_1','z3_2'],['z3_2','z3_3'],
  ['z3_3','z4_1'],['z4_1','z4_2'],['z4_2','z4_3'],
];

const TYPE_COL = { start:'#7dcfa0', battle:'#ff5555', event:'#e8c764',
                   rest:'#5fa6ff', boss:'#e879f9' };
const TYPE_ICON = { start:'★', battle:'⚔', event:'?', rest:'♥', boss:'💀' };

function MapNode({ node, current, cleared, onTap }) {
  const col      = TYPE_COL[node.type] || '#888';
  const isCurr   = current === node.id;
  const isCleared = cleared.includes(node.id);
  const isLocked = !isCleared && !isCurr;
  const cx = node.x * 3.5 + 5; // scale to ~350px wide
  const cy = node.y * 3.5 + 5; // scale
  const r  = node.type === 'boss' ? 14 : 10;

  return (
    <g onClick={() => !isLocked && onTap(node)} style={{ cursor: isLocked ? 'default' : 'pointer' }}>
      {/* Glow ring for current */}
      {isCurr && <circle cx={cx} cy={cy} r={r+5} fill="none" stroke={col} strokeWidth="1.5" opacity="0.4"
        style={{ animation: 'pulse 1.5s infinite' }} />}
      {/* Main circle */}
      <circle cx={cx} cy={cy} r={r}
        fill={isLocked ? '#111' : isCurr ? col : isCleared ? `${col}55` : `${col}33`}
        stroke={isLocked ? '#333' : col}
        strokeWidth={isCurr ? 2 : 1}
        opacity={isLocked ? 0.4 : 1} />
      {/* Icon */}
      <text x={cx} y={cy+4} textAnchor="middle"
        fontSize={node.type==='boss'?11:9}
        fill={isLocked ? '#555' : isCleared ? '#666' : col}
        fontFamily="sans-serif">
        {isCleared ? '✓' : TYPE_ICON[node.type] || '•'}
      </text>
      {/* Label */}
      {(isCurr || !isLocked) && (
        <text x={cx} y={cy+r+9} textAnchor="middle" fontSize="7"
          fill={isCurr ? col : '#a89c7a'} fontFamily="sans-serif">
          {node.label}
        </text>
      )}
    </g>
  );
}

// ══════════════════════════════════════════
//  MAIN LIVE MAP SCREEN
// ══════════════════════════════════════════
function LiveMapScreen() {
  const save    = window.GS?.save;
  const chapter = save?.chapter ?? 1;
  const zoneId  = save?.zone_id ?? 'zone_01_graveyard';
  const steps   = save?.steps_taken ?? 0;
  const resources = save?.resources || { coins:0, necro_fluid:0 };
  const mentorBonds = save?.mentor_bonds || {};

  // Derive cleared nodes from chapter/steps
  const clearedNodes = MAP_NODES
    .filter(n => {
      const z = ZONES.find(z => z.id === n.zone);
      if (!z) return false;
      if (z.chapter < chapter) return true;
      if (z.chapter === chapter && n.id !== `z${chapter}_4`) return true; // not boss of current chapter
      return false;
    })
    .map(n => n.id);

  // Current node
  const currentNode = MAP_NODES.find(n => n.zone === zoneId) || MAP_NODES[0];

  const [selectedNode, setSelectedNode] = React.useState(null);
  const sel = MAP_NODES.find(n => n.id === selectedNode);

  return (
    <div className="screen" style={{ background:'radial-gradient(ellipse 80% 60% at 50% 25%, #0a1a10, var(--void) 60%)', overflowY:'auto' }}>
      <div className="noise" />
      <StatusBar />

      {/* Header */}
      <div style={{ padding:'0 12px 5px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div className="eyebrow">ROGUELIKE MAP · แผนที่พเนจร</div>
          <div className="thai-display" style={{ fontSize:14, color:'var(--bone)', lineHeight:1.1 }}>
            {ZONES.find(z=>z.id===zoneId)?.label || 'สำรวจ'}
          </div>
        </div>
        <div style={{ textAlign:'right', fontFamily:'var(--f-mono)', fontSize:9 }}>
          <div style={{ color:'var(--gold-soft)' }}>บท {chapter}/4</div>
          <div style={{ color:'var(--bone-mute)' }}>{steps} ก้าว</div>
        </div>
      </div>

      <Ornament />

      {/* ── Resources */}
      <div style={{ padding:'4px 12px 6px', display:'flex', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ color:'var(--gold-soft)', fontSize:11 }}>⚡</span>
          <span className="num" style={{ fontSize:11, color:'var(--gold-soft)' }}>{resources.coins||0}</span>
          <span style={{ fontFamily:'var(--f-mono)', fontSize:8, color:'var(--bone-mute)' }}>เหรียญ</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ color:'var(--corruption-soft)', fontSize:11 }}>◈</span>
          <span className="num" style={{ fontSize:11, color:'var(--corruption-soft)' }}>{resources.necro_fluid||0}</span>
          <span style={{ fontFamily:'var(--f-mono)', fontSize:8, color:'var(--bone-mute)' }}>น้ำมันพราย</span>
        </div>
      </div>

      {/* ── SVG Map */}
      <div style={{ padding:'0 8px', position:'relative' }}>
        <svg viewBox="0 0 380 320" width="100%" style={{ display:'block' }}>
          {/* Background zone bands */}
          <rect x="0"   y="0"   width="200" height="320" fill="rgba(10,26,16,0.6)" />
          <rect x="200" y="0"   width="180" height="320" fill="rgba(10,10,40,0.6)" />
          {/* Zone labels */}
          <text x="100" y="310" textAnchor="middle" fontSize="8" fill="#334" fontFamily="sans-serif">บท 1-2</text>
          <text x="290" y="310" textAnchor="middle" fontSize="8" fill="#334" fontFamily="sans-serif">บท 3-4</text>

          {/* Edges */}
          {EDGES.map(([a,b]) => {
            const na = MAP_NODES.find(n=>n.id===a);
            const nb = MAP_NODES.find(n=>n.id===b);
            if (!na||!nb) return null;
            const bothCleared = clearedNodes.includes(a) || a===currentNode?.id;
            return (
              <line key={`${a}-${b}`}
                x1={na.x*3.5+5} y1={na.y*3.5+5}
                x2={nb.x*3.5+5} y2={nb.y*3.5+5}
                stroke={bothCleared ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}
                strokeWidth="1" strokeDasharray={bothCleared?'none':'3 3'} />
            );
          })}

          {/* Nodes */}
          {MAP_NODES.map(node => (
            <MapNode key={node.id} node={node}
              current={currentNode?.id}
              cleared={clearedNodes}
              onTap={n => setSelectedNode(n.id===selectedNode ? null : n.id)} />
          ))}
        </svg>
      </div>

      {/* ── Legend */}
      <div style={{ padding:'0 12px 6px', display:'flex', gap:10, flexWrap:'wrap' }}>
        {Object.entries(TYPE_COL).map(([type, col]) => (
          <div key={type} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:col, opacity:0.8 }} />
            <span style={{ fontFamily:'var(--f-mono)', fontSize:8, color:'var(--bone-mute)' }}>
              {type==='battle'?'ต่อสู้':type==='event'?'เหตุการณ์':type==='rest'?'พักผ่อน':type==='boss'?'บอส':'เริ่ม'}
            </span>
          </div>
        ))}
      </div>

      {/* ── Node action panel */}
      {sel && (
        <div style={{ margin:'0 12px 10px', background:'rgba(0,0,0,0.6)',
          border:`1px solid ${TYPE_COL[sel.type]||'var(--hairline)'}`,
          padding:'8px 12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
            <div className="thai-display" style={{ fontSize:13, color:'var(--bone)' }}>{sel.label}</div>
            <span style={{ fontFamily:'var(--f-mono)', fontSize:8,
              color:TYPE_COL[sel.type], border:`1px solid ${TYPE_COL[sel.type]}55`, padding:'0 5px' }}>
              {TYPE_ICON[sel.type]} {sel.type}
            </span>
          </div>
          {sel.id === currentNode?.id ? (
            <button onClick={() => window.goTo('adventure')} style={{
              width:'100%', background:`linear-gradient(180deg,${TYPE_COL[sel.type]}33,${TYPE_COL[sel.type]}11)`,
              border:`1px solid ${TYPE_COL[sel.type]}`, color:TYPE_COL[sel.type],
              fontFamily:'var(--f-display)', fontSize:12, padding:'8px', cursor:'pointer' }}>
              🌿 เดินหน้าต่อ →
            </button>
          ) : clearedNodes.includes(sel.id) ? (
            <div style={{ fontFamily:'var(--f-mono)', fontSize:9, color:'#666', textAlign:'center' }}>✓ เคลียร์แล้ว</div>
          ) : (
            <div style={{ fontFamily:'var(--f-mono)', fontSize:9, color:'var(--bone-mute)', textAlign:'center' }}>🔒 ยังไม่ถึง</div>
          )}
        </div>
      )}

      {/* ── Mentor bonds */}
      <div style={{ padding:'0 12px 16px' }}>
        <div className="eyebrow-mute" style={{ fontSize:8, marginBottom:5 }}>ความสัมพันธ์ 4 อาจารย์</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
          {[['phra','พระ','☸'],['chee','ชี','☽'],['mo_jeen','หมอผีจีน','⚕'],['mo_farang','หมอผีฝรั่ง','✙']].map(([key,name,icon]) => {
            const val = mentorBonds[key] || 0;
            const col = val>=80?'#7df096':val>=50?'#e8c764':'#ff9999';
            return (
              <div key={key} style={{ background:'rgba(0,0,0,0.3)', border:'1px solid var(--hairline)', padding:'5px 8px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                  <span style={{ fontSize:10 }}>{icon} {name}</span>
                  <span className="num" style={{ fontSize:9, color:col }}>{val}</span>
                </div>
                <div style={{ height:3, background:'rgba(0,0,0,0.5)' }}>
                  <div style={{ height:'100%', width:val+'%', background:col }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ height:60 }} />
    </div>
  );
}

window.LiveMapScreen = LiveMapScreen;
