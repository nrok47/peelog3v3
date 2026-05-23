// spirit-detail-live.jsx — Live Spirit Detail Screen
// รับ ghostId จาก window.selectedGhostId หรือ props
// แสดง stats จริงจาก GS.ghosts + nav ไป upgrade screens

const STAT_META = [
  { key:'str',  label:'STR · พลังกาย', col:'#ff7755' },
  { key:'mag',  label:'MAG · เวทมนตร์', col:'#aa77ff' },
  { key:'def',  label:'DEF · เกราะ',   col:'#55aaff' },
  { key:'spr',  label:'SPR · ต้านเวท', col:'#77ccaa' },
  { key:'spd',  label:'SPD · ความเร็ว', col:'#ffcc44' },
];
const EVO_LABELS = ['ร่างปกติ','ร่างตื่น','ร่างพระเจ้า'];
const EVO_TIERS  = ['EPIC','LEGEND','MYTHIC'];
const EVO_COLS   = ['#b07cd4','#ffb84a','#ff4a9e'];

function StatRow({ label, value, max=100, col }) {
  const pct = Math.min(100, (value/max)*100);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'110px 1fr 36px', gap:6, alignItems:'center',
      padding:'3px 0', borderBottom:'1px solid var(--faint)' }}>
      <span style={{ fontFamily:'var(--f-mono)', fontSize:9, color:'var(--bone-mute)' }}>{label}</span>
      <div style={{ height:5, background:'rgba(0,0,0,0.5)', position:'relative' }}>
        <div style={{ position:'absolute',left:0,top:0,height:'100%',
          width:pct+'%', background:col,
          boxShadow:`0 0 4px ${col}66`, transition:'width 0.3s' }} />
      </div>
      <span className="num" style={{ fontSize:10, color:'var(--bone)', textAlign:'right' }}>{value}</span>
    </div>
  );
}

function AffixChip({ affix }) {
  if (!affix) return null;
  const tierCols = { 1:'#ff4a9e', 2:'#ffb84a', 3:'#5fa6ff' };
  const col = tierCols[affix.tier] || '#9aa0a6';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 8px',
      background:`${col}11`, border:`1px solid ${col}44`, borderRadius:2 }}>
      <span style={{ fontFamily:'var(--f-mono)', fontSize:8, color:col, letterSpacing:0.1 }}>
        T{affix.tier}
      </span>
      <span style={{ fontSize:10, color:'var(--bone)' }}>
        {affix.stat?.toUpperCase()} +{affix.value}
      </span>
    </div>
  );
}

function NavButton({ icon, label, screen, ghostId }) {
  return (
    <button onClick={() => window.goTo(screen, { ghostId })} style={{
      flex:1, background:'rgba(0,0,0,0.4)',
      border:'1px solid var(--hairline-strong)',
      color:'var(--bone-soft)', fontFamily:'inherit',
      padding:'7px 4px', cursor:'pointer',
      display:'flex', flexDirection:'column',
      alignItems:'center', gap:3, borderRadius:2,
    }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <span style={{ fontFamily:'var(--f-mono)', fontSize:8, letterSpacing:0.1 }}>{label}</span>
    </button>
  );
}

// ══════════════════════════════════════════
//  MAIN LIVE SPIRIT DETAIL SCREEN
// ══════════════════════════════════════════
function LiveSpiritDetailScreen({ ghostId: propGhostId }) {
  const ghostId = propGhostId || window.selectedGhostId;
  const ghost   = (window.GS?.ghosts || []).find(g => g.id === ghostId);

  // Fallback: show first team member if no selection
  const g = ghost || window.GS?.team?.[0];

  if (!g) {
    return (
      <div className="screen" style={{ display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', gap:12 }}>
        <div style={{ fontSize:32 }}>👻</div>
        <div style={{ fontFamily:'var(--f-mono)', fontSize:12, color:'var(--bone-mute)' }}>
          ยังไม่ได้เลือกผี
        </div>
        <button onClick={() => window.goTo('roster')} style={{
          background:'rgba(212,175,55,0.15)', border:'1px solid var(--gold)',
          color:'var(--gold-soft)', fontFamily:'var(--f-display)',
          fontSize:12, padding:'8px 20px', cursor:'pointer' }}>
          ← ไปเลือกผีก่อน
        </button>
      </div>
    );
  }

  const d       = GHOST_REG[g.ghost_type] || {};
  const stats   = g.stats || d.baseStats || {};
  const frame   = g.frame || {};
  const mass    = g.spirit_mass || {};
  const tree    = g.skill_tree || {};
  const affixes = mass.affixes || [];
  const evo     = g.evo_stage || 0;
  const skills  = d.skills || [];

  const maxStat = 100;
  const bondCol = g.bond>=80?'#7df096':g.bond>=50?'#e8c764':'#ff9999';
  const corruptCol = g.corruption<30?'#7df096':g.corruption<70?'#e8c764':'#e879f9';

  return (
    <div className="screen" style={{
      background:`radial-gradient(ellipse 80% 55% at 50% 20%, ${d.col ? '#'+d.col.toString(16).padStart(6,'0')+'22' : '#1a0828'}, var(--void) 65%)`,
      overflowY:'auto',
    }}>
      <div className="noise" />
      <StatusBar />

      {/* Header */}
      <div style={{ padding:'0 12px 5px', display:'flex', alignItems:'center', gap:8 }}>
        <button onClick={() => window.goBack?.()} style={{ background:'rgba(0,0,0,0.4)',
          border:'1px solid var(--hairline)', width:28, height:28, color:'var(--bone)',
          borderRadius:2, cursor:'pointer', fontSize:11 }}>←</button>
        <div style={{ flex:1 }}>
          <div className="eyebrow">SPIRIT DOSSIER</div>
          <div className="thai-display" style={{ fontSize:16, color:'var(--bone)', lineHeight:1.1 }}>
            {g.nickname || d.name || g.ghost_type}
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--f-mono)', fontSize:8, color:EVO_COLS[evo],
            border:`1px solid ${EVO_COLS[evo]}66`, padding:'1px 6px', marginBottom:2 }}>
            {EVO_TIERS[evo]} · {['I','II','III'][evo]}★
          </div>
          <div className="eyebrow-mute" style={{ fontSize:7 }}>{d.class} · {d.element}</div>
        </div>
      </div>

      <Ornament />

      {/* ── Portrait + Identity */}
      <div style={{ padding:'8px 12px 6px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          <Chibi kind={(g.ghost_type||'').toLowerCase().replace(/[^a-z]/g,'')}
            size={90} mood="normal" aura={true} />
          {(frame.enhancement||0) > 0 && (
            <div style={{ position:'absolute', bottom:0, right:0,
              background:'rgba(0,0,0,0.8)', border:'1px solid var(--gold)',
              fontFamily:'var(--f-mono)', fontSize:9, color:'var(--gold-glow)', padding:'0 5px' }}>
              +{frame.enhancement}
            </div>
          )}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          {/* Level + EXP */}
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span className="eyebrow-mute">LEVEL</span>
            <span className="num" style={{ color:'var(--bone)', fontSize:11 }}>
              {g.level} <span style={{ color:'var(--bone-mute)', fontSize:9 }}>/ 30</span>
            </span>
          </div>
          <div style={{ height:4, background:'rgba(0,0,0,0.5)', marginBottom:6 }}>
            <div style={{ height:'100%', width:((g.exp||0)/100)+'%', background:'var(--gold)', opacity:0.7 }} />
          </div>

          {/* Bond */}
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
            <span className="eyebrow-mute" style={{ fontSize:8 }}>BOND · ความผูกพัน</span>
            <span className="num" style={{ fontSize:9, color:bondCol }}>{g.bond||0}/100</span>
          </div>
          <div style={{ height:4, background:'rgba(0,0,0,0.5)', marginBottom:5 }}>
            <div style={{ height:'100%', width:(g.bond||0)+'%', background:bondCol }} />
          </div>

          {/* Corruption */}
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
            <span className="eyebrow-mute" style={{ fontSize:8 }}>CORRUPTION · อาถรรพ์</span>
            <span className="num" style={{ fontSize:9, color:corruptCol }}>{g.corruption||0}/100</span>
          </div>
          <div style={{ height:4, background:'rgba(0,0,0,0.5)' }}>
            <div style={{ height:'100%', width:(g.corruption||0)+'%', background:corruptCol }} />
          </div>
        </div>
      </div>

      {/* ── Stats */}
      <div style={{ padding:'6px 12px' }}>
        <div className="eyebrow-mute" style={{ fontSize:8, marginBottom:5 }}>
          SOUL CORE · สถานะ (locked)
        </div>
        <div style={{ background:'rgba(0,0,0,0.35)', border:'1px solid var(--hairline)', padding:'6px 10px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 20px', marginBottom:5 }}>
            <div className="num" style={{ fontSize:11 }}>HP <span style={{ color:'#7df096' }}>{stats.maxHp?.toLocaleString()}</span></div>
            <div className="num" style={{ fontSize:11 }}>SPD <span style={{ color:'#ffcc44' }}>{stats.spd}</span></div>
          </div>
          {STAT_META.map(m => (
            <StatRow key={m.key} label={m.label} value={stats[m.key]||0} max={maxStat} col={m.col} />
          ))}
        </div>
      </div>

      {/* ── Amulet Frame */}
      <div style={{ padding:'0 12px 5px' }}>
        <div className="eyebrow-mute" style={{ fontSize:8, marginBottom:4 }}>AMULET FRAME · โครงร่างอาคม</div>
        <div style={{ display:'flex', alignItems:'center', gap:10,
          background:'rgba(0,0,0,0.3)', border:'1px solid var(--hairline)', padding:'6px 10px' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--f-mono)', fontSize:22, fontWeight:700,
              color: frame.enhancement>=10 ? '#ff4a9e' : frame.enhancement>=7 ? '#e8c764' : 'var(--gold-glow)' }}>
              +{frame.enhancement||0}
            </div>
            <div className="eyebrow-mute" style={{ fontSize:7 }}>Enhancement</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ height:6, background:'rgba(0,0,0,0.5)', borderRadius:3 }}>
              <div style={{ height:'100%', width:((frame.enhancement||0)/15*100)+'%',
                background:`linear-gradient(90deg, var(--gold), ${frame.enhancement>=10?'#ff4a9e':'var(--gold-glow)'})`,
                borderRadius:3 }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
              <span className="num" style={{ fontSize:7, color:'var(--bone-mute)' }}>0</span>
              <span className="num" style={{ fontSize:7, color:'var(--gold)' }}>+7 ⚠</span>
              <span className="num" style={{ fontSize:7, color:'var(--bone-mute)' }}>+15</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Spirit Mass affixes */}
      {affixes.length > 0 && (
        <div style={{ padding:'0 12px 5px' }}>
          <div className="eyebrow-mute" style={{ fontSize:8, marginBottom:4 }}>SPIRIT MASS · สถานะแฝง</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {affixes.map((aff,i) => <AffixChip key={i} affix={aff} />)}
          </div>
        </div>
      )}

      {/* ── Skills */}
      <div style={{ padding:'0 12px 5px' }}>
        <div className="eyebrow-mute" style={{ fontSize:8, marginBottom:4 }}>SKILLS · วิชาอาคม</div>
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          {skills.map(sk => (
            <div key={sk.id} style={{ display:'flex', alignItems:'center', gap:8,
              background:'rgba(0,0,0,0.3)', border:'1px solid var(--hairline)', padding:'5px 8px' }}>
              <div style={{ flex:1 }}>
                <div className="thai-display" style={{ fontSize:11, color:'var(--bone)', lineHeight:1.1 }}>
                  {sk.name}
                </div>
                <div style={{ fontSize:9, color:'var(--bone-mute)', marginTop:1 }}>
                  {sk.type} · Power {sk.power}
                  {sk.gutsCost>0 && ` · GUTS ${sk.gutsCost}`}
                  {sk.cd>0 && ` · CD ${sk.cd}s`}
                </div>
              </div>
              {sk.gutsCost>=60 && (
                <span style={{ fontFamily:'var(--f-mono)', fontSize:7,
                  color:'var(--gold-glow)', border:'1px solid var(--gold)',
                  padding:'0 4px', background:'rgba(212,175,55,0.1)' }}>ULT</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Navigate to upgrade screens */}
      <div style={{ padding:'6px 12px 16px' }}>
        <div className="eyebrow-mute" style={{ fontSize:8, marginBottom:5 }}>ปรับแต่ง · UPGRADE</div>
        <div style={{ display:'flex', gap:5 }}>
          <NavButton icon="⚒"  label="Forge"    screen="forge-frame" ghostId={g.id} />
          <NavButton icon="🌳" label="Skill"     screen="skill-tree"  ghostId={g.id} />
          <NavButton icon="💎" label="Amulet"    screen="amulet"      ghostId={g.id} />
          <NavButton icon="🐉" label="Evolution" screen="evolution"    ghostId={g.id} />
        </div>
      </div>

      <div style={{ height:60 }} />
    </div>
  );
}

window.LiveSpiritDetailScreen = LiveSpiritDetailScreen;
