// roster-live.jsx — Live Roster Screen
// โหลดผีทั้งหมดจาก window.GS + จัดทีม 3 ตัว + tap → detail

const ELEMENTS = ['all','fire','water','wood','earth','dark','light','metal'];
const EL_LABEL = { all:'ALL', fire:'ไฟ', water:'น้ำ', wood:'ไม้', earth:'ดิน',
                   dark:'มืด', light:'แสง', metal:'โลหะ' };
const TIER_STYLE = { common:  {label:'COMM',  col:'#9aa0a6'},
                     uncommon:{label:'RARE',  col:'#5fa6ff'},
                     rare:    {label:'EPIC',  col:'#b07cd4'},
                     legend:  {label:'LEGE',  col:'#ffb84a'},
                     legendary:{label:'LEGE', col:'#ffb84a'},
                     mythic:  {label:'MYTH',  col:'#ff4a9e'} };

// ── ghost_type → chibi kind (lowercase)
function kindOf(ghostType) {
  return (ghostType||'').toLowerCase().replace(/[^a-z]/g,'');
}

// ── Tier from evo_stage
function tierOf(stage) {
  return ['common','rare','legend'][stage] || 'common';
}

// ── Compact ghost card
function GhostCard({ ghost, selected, teamSlot, onTap, onSlotTap, assignMode, assignSlot }) {
  if (!ghost) return null;  // guard: ป้องกัน undefined ระหว่าง GS refresh
  const d    = GHOST_REG[ghost.ghost_type] || {};
  const tier = tierOf(ghost.evo_stage || 0);
  const ts   = TIER_STYLE[tier] || TIER_STYLE.common;
  const frame = ghost.frame?.enhancement || 0;
  const isInTeam = ghost.is_in_team;
  const isSel  = selected;

  return (
    <div onClick={onTap} style={{
      background: isSel ? 'linear-gradient(180deg,rgba(212,175,55,0.18),rgba(0,0,0,0.5))'
                        : 'rgba(0,0,0,0.4)',
      border: `1px solid ${isSel ? 'var(--gold)' : isInTeam ? 'rgba(125,207,160,0.5)' : 'var(--hairline)'}`,
      borderRadius:3, padding:'7px 6px 6px', cursor:'pointer',
      position:'relative', transition:'all 0.15s',
    }}>
      {/* Team badge */}
      {isInTeam && (
        <div style={{ position:'absolute', top:-6, left:'50%', transform:'translateX(-50%)',
          background:'#7dcfa0', color:'#0a1a0e', fontFamily:'var(--f-mono)',
          fontSize:7, fontWeight:700, padding:'0 5px', letterSpacing:0.1, whiteSpace:'nowrap' }}>
          {['①','②','③'][ghost.team_slot] || '⚔'}
        </div>
      )}

      {/* Frame badge */}
      {frame > 0 && (
        <div style={{ position:'absolute', top:3, right:3, fontFamily:'var(--f-mono)',
          fontSize:7, color:'var(--gold-soft)', background:'rgba(0,0,0,0.7)',
          padding:'0 4px', border:'1px solid var(--hairline)' }}>
          +{frame}
        </div>
      )}

      {/* Chibi */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom:3 }}>
        <Chibi kind={kindOf(ghost.ghost_type)} size={54} mood="normal" aura={isSel} />
      </div>

      {/* Name */}
      <div className="thai-display" style={{ fontSize:10, textAlign:'center', lineHeight:1.1,
        color: isSel ? 'var(--bone)' : 'var(--bone-soft)', marginBottom:2 }}>
        {ghost.nickname || d.name || ghost.ghost_type}
      </div>

      {/* Tier + Level */}
      <div style={{ display:'flex', justifyContent:'center', gap:4, alignItems:'center', marginBottom:3 }}>
        <span style={{ fontFamily:'var(--f-mono)', fontSize:7, color:ts.col,
          border:`1px solid ${ts.col}55`, padding:'0 3px' }}>{ts.label}</span>
        <span className="num" style={{ fontSize:8, color:'var(--bone-mute)' }}>Lv{ghost.level}</span>
      </div>

      {/* Bond bar */}
      <div style={{ height:2, background:'rgba(0,0,0,0.5)' }}>
        <div style={{ height:'100%', width:(ghost.bond||0)+'%',
          background: ghost.bond>=80?'#7df096':ghost.bond>=50?'#e8c764':'#ff9999' }} />
      </div>
      <div className="num" style={{ fontSize:7, color:'var(--bone-mute)', textAlign:'center', marginTop:1 }}>
        Bond {ghost.bond||0}
      </div>

      {/* Assign mode overlay */}
      {assignMode && assignSlot !== null && (
        <div onClick={e=>{e.stopPropagation();onSlotTap();}} style={{
          position:'absolute', inset:0, background:'rgba(125,207,160,0.25)',
          border:'2px solid #7dcfa0', borderRadius:3,
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer',
        }}>
          <span style={{ fontFamily:'var(--f-mono)', fontSize:11, color:'#7dcfa0', fontWeight:700 }}>
            →{['①','②','③'][assignSlot]}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Team slot cell
function TeamSlotCell({ ghost, slot, isAssigning, onTap }) {
  const d = ghost ? (GHOST_REG[ghost.ghost_type] || {}) : null;
  return (
    <div onClick={onTap} style={{
      flex:1, minWidth:0, border:`1px solid ${isAssigning?'#7dcfa0':ghost?'var(--hairline-strong)':'var(--hairline)'}`,
      background: isAssigning ? 'rgba(125,207,160,0.12)' : ghost ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)',
      borderRadius:4, padding:'5px 4px', cursor:'pointer', textAlign:'center',
      boxShadow: isAssigning ? '0 0 8px rgba(125,207,160,0.3)' : 'none',
      transition:'all 0.15s',
    }}>
      <div style={{ fontFamily:'var(--f-mono)', fontSize:8, color:'var(--bone-mute)', marginBottom:3 }}>
        {['หน้า','กลาง','หลัง'][slot]}
      </div>
      {ghost ? (
        <>
          <Chibi kind={kindOf(ghost.ghost_type)} size={36} mood="normal" aura={false} />
          <div className="thai-display" style={{ fontSize:9, lineHeight:1.1, marginTop:2,
            color:'var(--bone)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {ghost.nickname || d.name || ghost.ghost_type}
          </div>
          <div className="num" style={{ fontSize:7, color:'var(--bone-mute)' }}>Lv{ghost.level}</div>
        </>
      ) : (
        <div style={{ fontSize:20, color:isAssigning?'#7dcfa0':'var(--hairline)', lineHeight:1, marginTop:4 }}>
          {isAssigning ? '●' : '+'}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
//  MAIN LIVE ROSTER SCREEN
// ══════════════════════════════════════════
function LiveRosterScreen() {
  const allGhosts = (window.GS?.ghosts || []).filter(Boolean);
  const [selected,    setSelected]    = React.useState(null);    // selected ghost id
  const [filterEl,    setFilterEl]    = React.useState('all');
  const [assignMode,  setAssignMode]  = React.useState(false);
  const [assignSlot,  setAssignSlot]  = React.useState(null);    // 0|1|2
  const [saving,      setSaving]      = React.useState(false);
  const [teamState,   setTeamState]   = React.useState(() => {
    const t = [null, null, null];
    (window.GS?.ghosts||[]).filter(g=>g.is_in_team).forEach(g=>{ t[g.team_slot||0]=g; });
    return t;
  });

  // Sync teamState when GS updates
  React.useEffect(() => {
    const t = [null, null, null];
    (window.GS?.ghosts||[]).filter(g=>g.is_in_team).forEach(g=>{ t[g.team_slot||0]=g; });
    setTeamState(t);
  }, [window.GS?.ghosts?.length]);

  // Filtered ghosts
  const filtered = allGhosts.filter(g => {
    if (!g?.ghost_type) return false;  // guard
    if (filterEl === 'all') return true;
    return (g.soul_core?.element || GHOST_REG[g.ghost_type]?.element) === filterEl;
  });

  // ── Actions
  function handleGhostTap(ghost) {
    if (assignMode && assignSlot !== null) {
      // Assign ghost to slot
      assignToSlot(ghost, assignSlot);
      return;
    }
    setSelected(g => g === ghost.id ? null : ghost.id);
  }

  async function assignToSlot(ghost, slot) {
    setSaving(true);
    const newTeam = [...teamState];
    // Remove ghost from old slot if already in team
    for (let i = 0; i < 3; i++) {
      if (newTeam[i]?.id === ghost.id) newTeam[i] = null;
    }
    newTeam[slot] = ghost;
    setTeamState(newTeam);

    const slots = newTeam
      .map((g,i) => g ? { ghostId: g.id, slot: i } : null)
      .filter(Boolean);
    try {
      await SpiritDB.GhostService.setTeam(window.GS.player.id, slots);
      await window.GS.refresh();
      // Re-sync teamState
      const t = [null,null,null];
      (window.GS?.ghosts||[]).filter(g=>g.is_in_team).forEach(g=>{t[g.team_slot||0]=g;});
      setTeamState(t);
    } catch(e) { console.error('setTeam error:', e); }
    setSaving(false);
    setAssignMode(false);
    setAssignSlot(null);
  }

  function handleSlotTap(slot) {
    if (assignMode && assignSlot === slot) {
      setAssignMode(false); setAssignSlot(null);
    } else {
      setAssignMode(true); setAssignSlot(slot);
    }
  }

  function handleViewDetail() {
    if (!selected) return;
    window.goTo('detail', { ghostId: selected });
  }

  const selGhost = allGhosts.find(g => g.id === selected);

  return (
    <div className="screen" style={{ background:'radial-gradient(ellipse 80% 50% at 50% 10%, #1a0828, var(--void) 60%)' }}>
      <div className="noise" />
      <StatusBar />

      {/* Header */}
      <div style={{ padding:'0 14px 5px', display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
        <div>
          <div className="eyebrow">SPIRIT ROSTER · ผีในชายคา</div>
          <div className="thai-display" style={{ fontSize:16, color:'var(--bone)', lineHeight:1.1 }}>
            ผีทั้งหมด {allGhosts.length} ตัว
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div className="num" style={{ fontSize:11, color:'var(--gold-soft)' }}>
            PWR {allGhosts.reduce((s,g)=>{
              const st=g.stats||{}; return s+(st.str||0)+(st.mag||0);
            },0).toLocaleString()}
          </div>
          <div className="eyebrow-mute" style={{ fontSize:7 }}>Total Power</div>
        </div>
      </div>

      <Ornament />

      {/* ── Team slots */}
      <div style={{ padding:'6px 12px 5px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
          <span className="eyebrow" style={{ fontSize:8 }}>
            ทีมปัจจุบัน · ACTIVE TEAM
            {saving && <span style={{ color:'var(--gold-soft)', marginLeft:6 }}>กำลังบันทึก...</span>}
          </span>
          {assignMode ? (
            <button onClick={() => { setAssignMode(false); setAssignSlot(null); }} style={{
              background:'rgba(232,121,249,0.15)', border:'1px solid var(--corruption-soft)',
              color:'var(--corruption-soft)', fontFamily:'var(--f-mono)', fontSize:8,
              padding:'2px 8px', cursor:'pointer' }}>
              ✕ ยกเลิก
            </button>
          ) : (
            <button onClick={() => { setAssignMode(true); setAssignSlot(0); }} style={{
              background:'rgba(125,207,160,0.1)', border:'1px solid rgba(125,207,160,0.5)',
              color:'#7dcfa0', fontFamily:'var(--f-mono)', fontSize:8,
              padding:'2px 8px', cursor:'pointer' }}>
              ⇄ จัดทีม
            </button>
          )}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[0,1,2].map(slot => (
            <TeamSlotCell key={slot} ghost={teamState[slot]} slot={slot}
              isAssigning={assignMode && assignSlot===slot}
              onTap={() => handleSlotTap(slot)} />
          ))}
        </div>
        {assignMode && (
          <div style={{ marginTop:5, fontFamily:'var(--f-mono)', fontSize:9,
            color:'#7dcfa0', textAlign:'center', letterSpacing:0.1 }}>
            เลือกผีด้านล่างเพื่อใส่ slot {['หน้า','กลาง','หลัง'][assignSlot]}
          </div>
        )}
      </div>

      {/* ── Filter tabs */}
      <div style={{ padding:'4px 12px 5px', display:'flex', gap:3, overflowX:'auto', flexWrap:'nowrap' }}>
        {ELEMENTS.map(el => (
          <button key={el} onClick={() => setFilterEl(el)} style={{
            background: filterEl===el ? 'rgba(212,175,55,0.18)' : 'rgba(0,0,0,0.3)',
            border: `1px solid ${filterEl===el ? 'var(--gold)' : 'var(--hairline)'}`,
            color: filterEl===el ? 'var(--gold-soft)' : 'var(--bone-mute)',
            fontFamily:'var(--f-mono)', fontSize:9, padding:'3px 8px',
            cursor:'pointer', borderRadius:2, whiteSpace:'nowrap',
          }}>
            {EL_LABEL[el]}
          </button>
        ))}
      </div>

      {/* ── Ghost grid */}
      <div style={{ padding:'0 12px', overflowY:'auto',
        maxHeight: selGhost ? 260 : 380,
        display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
        {filtered.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:30,
            color:'var(--bone-mute)', fontFamily:'var(--f-mono)', fontSize:11 }}>
            ไม่มีผีในหมวดนี้
          </div>
        )}
        {filtered.map(ghost => (
          <GhostCard key={ghost.id} ghost={ghost}
            selected={selected===ghost.id}
            assignMode={assignMode} assignSlot={assignSlot}
            onTap={() => handleGhostTap(ghost)}
            onSlotTap={() => assignToSlot(ghost, assignSlot)} />
        ))}
      </div>

      {/* ── Selected ghost action bar */}
      {selGhost && !assignMode && (
        <div style={{ position:'sticky', bottom:0, left:0, right:0,
          background:'linear-gradient(180deg,transparent,var(--ink) 25%)',
          padding:'6px 12px 12px' }}>
          <div style={{ background:'rgba(10,6,18,0.95)', border:'1px solid var(--gold)',
            padding:'8px 10px', display:'flex', gap:8, alignItems:'center' }}>
            <Chibi kind={kindOf(selGhost.ghost_type)} size={36} mood="normal" aura={false} />
            <div style={{ flex:1, minWidth:0 }}>
              <div className="thai-display" style={{ fontSize:13, lineHeight:1.1, color:'var(--bone)' }}>
                {selGhost.nickname || GHOST_REG[selGhost.ghost_type]?.name || selGhost.ghost_type}
              </div>
              <div style={{ fontSize:9, color:'var(--bone-mute)', marginTop:1 }}>
                Lv{selGhost.level} · Bond {selGhost.bond} · Corrupt {selGhost.corruption}%
              </div>
            </div>
            <div style={{ display:'flex', gap:5 }}>
              <button onClick={handleViewDetail} style={{
                background:'linear-gradient(180deg,rgba(212,175,55,0.2),rgba(212,175,55,0.08))',
                border:'1px solid var(--gold)', color:'var(--gold-soft)',
                fontFamily:'var(--f-display)', fontSize:11, padding:'6px 12px', cursor:'pointer' }}>
                ดูรายละเอียด →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.LiveRosterScreen = LiveRosterScreen;
