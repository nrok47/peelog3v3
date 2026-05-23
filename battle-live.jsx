// battle-live.jsx — Live Battle Screen
// ผูก window.GS.team + BattleEngine จริง
// ──────────────────────────────────────

// ── Map ghost_type → display info (จาก GHOST_REG)
function getDisplay(ghostType) {
  const g = GHOST_REG?.[ghostType];
  if (!g) return { name: ghostType, col: 0x888888, element: 'dark', elementName: 'มืด' };
  const elNames = { fire:'ไฟ', water:'น้ำ', wood:'ไม้', earth:'ดิน',
                    metal:'โลหะ', light:'แสง', dark:'มืด', wind:'ลม' };
  return { name: g.name, col: g.col, element: g.element,
           elementName: elNames[g.element] || g.element,
           class: g.class };
}

// ── Build player team from DB ghost record
function dbGhostToBattle(dbGhost) {
  const tmpl = GHOST_REG[dbGhost.ghost_type] || {};
  const stats = dbGhost.stats || tmpl.baseStats || {};
  return {
    id:      dbGhost.id,
    dbId:    dbGhost.id,
    name:    dbGhost.nickname || tmpl.name || dbGhost.ghost_type,
    element: dbGhost.soul_core?.element || tmpl.element || 'dark',
    class:   dbGhost.soul_core?.class   || tmpl.class   || 'dps',
    col:     tmpl.col || 0xAA88CC,
    bond:    dbGhost.bond  || 30,
    level:   dbGhost.level || 1,
    skills:  tmpl.skills   || [],
    baseStats: {
      maxHp: stats.maxHp || stats.hp || 1000,
      str: stats.str || 30, mag: stats.mag || 30,
      def: stats.def || 30, spr: stats.spr || 30, spd: stats.spd || 30,
    },
  };
}

// ── Generate enemy team by chapter
function buildEnemyTeam(chapter = 1) {
  const pools = {
    1: ['pob','phiDib','kumantong'],
    2: ['krasue','phiTaiHong','pob'],
    3: ['maeNak','pisaj','kalakinee'],
    4: ['asurakay','phiTaiHong','krasue'],
  };
  const types = pools[chapter] || pools[1];
  const lvBonus = (chapter - 1) * 6;
  return types.map(type => {
    const tmpl = GHOST_REG[type] || {};
    const bs   = tmpl.baseStats || { maxHp:800,str:30,mag:30,def:25,spr:25,spd:28 };
    return {
      id: type, name: tmpl.name || type,
      element: tmpl.element || 'dark', class: tmpl.class || 'dps',
      col: tmpl.col || 0xFF4444, bond: 50,
      level: 15 + lvBonus, skills: tmpl.skills || [],
      baseStats: {
        maxHp: Math.floor(bs.maxHp * (1 + lvBonus * 0.08)),
        str: bs.str + lvBonus, mag: bs.mag + lvBonus,
        def: bs.def + Math.floor(lvBonus/2), spr: bs.spr + Math.floor(lvBonus/2),
        spd: bs.spd,
      },
    };
  });
}

// ── HP bar colour
function hpCol(ratio) {
  return ratio > 0.6 ? '#7df096' : ratio > 0.3 ? '#e8c764' : '#ff5555';
}

// ── Element chip
function ElChip({ element }) {
  const cols = { fire:'var(--el-fire)',water:'var(--el-water)',wood:'var(--el-wood)',
                 earth:'var(--el-earth)',metal:'var(--el-spirit)',
                 light:'#ffe08a',dark:'var(--corruption-soft)',wind:'#aaffcc' };
  const names = { fire:'ไฟ',water:'น้ำ',wood:'ไม้',earth:'ดิน',
                  metal:'โลหะ',light:'แสง',dark:'มืด',wind:'ลม' };
  return (
    <span style={{ padding:'1px 5px', border:`1px solid ${cols[element]||'#888'}44`,
      background:`${cols[element]||'#888'}18`,
      color: cols[element]||'#aaa', fontFamily:'var(--f-mono)', fontSize:7, letterSpacing:0.1 }}>
      {names[element] || element}
    </span>
  );
}

// ── Ghost card (enemy top / player bottom)
function GhostCard({ combatant, isEnemy, isActive }) {
  if (!combatant) return <div style={{ flex:1 }} />;
  const d     = getDisplay(combatant.id);
  const hpR   = combatant.alive ? (combatant.currentHp / combatant.maxHp) : 0;
  const atbR  = combatant.currentAtb / 100;
  const gutsR = combatant.currentGuts / 100;

  return (
    <div style={{
      flex: 1, padding:'7px 5px 6px',
      background: isActive
        ? 'linear-gradient(180deg,rgba(212,175,55,0.12),rgba(0,0,0,0.4))'
        : 'rgba(0,0,0,0.35)',
      border:`1px solid ${isActive ? 'var(--gold)' : combatant.alive ? 'var(--hairline-strong)' : 'var(--hairline)'}`,
      borderRadius:2, opacity: combatant.alive ? 1 : 0.35,
      transition:'opacity 0.3s', position:'relative',
    }}>
      {isActive && (
        <div style={{ position:'absolute',top:-8,left:'50%',transform:'translateX(-50%)',
          padding:'1px 7px', background:'var(--gold)', color:'var(--ink)',
          fontFamily:'var(--f-mono)', fontSize:7, fontWeight:700, whiteSpace:'nowrap' }}>
          ACTIVE
        </div>
      )}
      {!combatant.alive && (
        <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',
          justifyContent:'center', background:'rgba(0,0,0,0.5)', zIndex:2,
          fontFamily:'var(--f-mono)', fontSize:11, color:'#ff5555' }}>
          KO
        </div>
      )}

      {/* Chibi icon */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom:3 }}>
        <Chibi kind={combatant.id} size={56} mood={isEnemy ? 'fierce' : isActive ? 'fierce' : 'normal'}
          aura={isActive} />
      </div>

      <div className="thai-display" style={{ fontSize:10, textAlign:'center', lineHeight:1, marginBottom:2 }}>
        {combatant.name.length > 8 ? combatant.name.slice(0,7)+'…' : combatant.name}
      </div>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:4 }}>
        <ElChip element={combatant.element} />
      </div>

      {/* HP bar */}
      <div style={{ height:4, background:'rgba(0,0,0,0.5)', marginBottom:1, position:'relative' }}>
        <div style={{ position:'absolute',left:0,top:0,height:'100%',
          width:(hpR*100)+'%', background:hpCol(hpR), transition:'width 0.2s' }} />
      </div>
      <div className="num" style={{ fontSize:7, color:'var(--bone-mute)', textAlign:'center', marginBottom:3 }}>
        {Math.ceil(combatant.currentHp).toLocaleString()}<span style={{opacity:0.5}}>/{combatant.maxHp.toLocaleString()}</span>
      </div>

      {/* ATB bar (blue) */}
      <div style={{ height:3, background:'rgba(0,0,0,0.4)', marginBottom:1 }}>
        <div style={{ height:'100%', width:(atbR*100)+'%', background:'#2266ff',
          boxShadow: atbR>=0.95 ? '0 0 4px #66aaff' : 'none', transition:'width 0.1s' }} />
      </div>

      {/* GUTS bar (orange) — player only */}
      {!isEnemy && (
        <div style={{ height:3, background:'rgba(0,0,0,0.4)' }}>
          <div style={{ height:'100%', width:(gutsR*100)+'%', background:'#ff8800',
            boxShadow: gutsR>=0.6 ? '0 0 4px #ffaa44' : 'none', transition:'width 0.1s' }} />
        </div>
      )}

      {/* Status effects */}
      {combatant.statusEffects?.length > 0 && (
        <div style={{ display:'flex', gap:2, justifyContent:'center', marginTop:2, flexWrap:'wrap' }}>
          {combatant.statusEffects.map((e,i) => (
            <span key={i} style={{ fontSize:7, color:'var(--corruption-soft)',
              fontFamily:'var(--f-mono)', border:'1px solid var(--corruption-soft)',
              padding:'0 2px', background:'rgba(0,0,0,0.4)' }}>
              {e.id}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Battle log line
function LogLine({ entry, index }) {
  if (!entry) return null;
  const t = entry.targets?.[0];
  let col = 'var(--bone-mute)';
  if (t?.type === 'dmg')    col = '#ff9f9f';
  if (t?.type === 'drain')  col = '#e879f9';
  if (t?.type === 'heal' || t?.type === 'heal_all') col = '#7df096';
  if (t?.type === 'revive') col = '#ffe08a';

  let line = `${entry.actor} · ${entry.skill}`;
  if (t) {
    if (t.type==='dmg')    line += ` → -${t.value}`;
    if (t.type==='drain')  line += ` → ดูด ${t.value}`;
    if (t.type==='heal')   line += ` → +${t.value} HP`;
    if (t.type==='heal_all') line += ` → ฮีลทีม +${t.value}`;
    if (t.type==='revive') line += ` → คืนชีพ!`;
    if (t.type==='debuff') line += ` → ${t.effect}`;
  }

  return (
    <div style={{ fontFamily:'var(--f-mono)', fontSize:9, color:col, lineHeight:1.4,
      borderBottom:'1px solid var(--faint)', padding:'2px 0', opacity: 0.6 + index*0.1 }}>
      {line}
    </div>
  );
}

// ══════════════════════════════════════════
//  MAIN LIVE BATTLE SCREEN
// ══════════════════════════════════════════
function LiveBattleScreen() {
  const chapter    = window.GS?.save?.chapter || 1;
  const corruption = window.GS?.save?.corruption_score || 0;
  const zone       = window.GS?.save?.zone_id?.replace('zone_0','#').replace('_',' ') || '#1';

  // Build teams once
  const [playerTeamDef] = React.useState(() => {
    const team = window.GS?.team || [];
    if (team.length > 0) return team.map(dbGhostToBattle);
    // fallback demo team
    return ['krasue','maeNak','nangTani'].map(t => {
      const tmpl = GHOST_REG[t];
      return { id:t, name:tmpl.name, element:tmpl.element, class:tmpl.class,
               col:tmpl.col, bond:60, level:20, skills:tmpl.skills, baseStats:tmpl.baseStats };
    });
  });

  const [enemyTeamDef] = React.useState(() => buildEnemyTeam(chapter));

  // Battle state
  const [snap,    setSnap]    = React.useState(null);
  const [result,  setResult]  = React.useState(null); // null | 'player' | 'ai'
  const [paused,  setPaused]  = React.useState(false);
  const [saving,  setSaving]  = React.useState(false);
  const engineRef = React.useRef(null);

  // Start engine
  React.useEffect(() => {
    const eng = new BattleEngine();
    eng.start(
      playerTeamDef, enemyTeamDef,
      (s) => setSnap({ ...s, ts: Date.now() }),
      (winner) => { setResult(winner); handleBattleEnd(winner); }
    );
    engineRef.current = eng;
    return () => eng.stop();
  }, []);

  // Pause / resume
  React.useEffect(() => {
    if (!engineRef.current) return;
    if (paused) engineRef.current.pause();
    else engineRef.current.resume();
  }, [paused]);

  // ── Save battle result to DB
  async function handleBattleEnd(winner) {
    if (!window.GS?.player) return;
    setSaving(true);
    try {
      if (winner === 'player') {
        // Bond +5 for each team member
        const updates = (window.GS.team || []).map(g =>
          SpiritDB.GhostService.update(g.id, { bond: Math.min(100, (g.bond||30) + 5) })
        );
        await Promise.all(updates);

        // Advance chapter step
        const save = window.GS.save;
        if (save) {
          const newStep = (save.chapter_step || 0) + 1;
          await SpiritDB.SaveService.checkpoint(save.id, {
            chapter_step: newStep,
            steps_taken: (save.steps_taken || 0) + 1,
          });
        }
        await window.GS.refresh();
      }
    } catch(e) { console.error('Save error:', e); }
    setSaving(false);
  }

  // ── Active unit (highest ATB in player team)
  const activeIdx = snap
    ? snap.player.reduce((best, c, i) =>
        (c.alive && c.currentAtb > (snap.player[best]?.currentAtb||0)) ? i : best, 0)
    : 0;

  const corrCol = corruption < 31 ? '#7df096' : corruption < 70 ? '#e8c764' : '#e879f9';

  return (
    <div className="screen" style={{
      background:'radial-gradient(ellipse 100% 60% at 50% 30%, #1e0a30, var(--void) 70%)',
      display:'flex', flexDirection:'column',
    }}>
      <div className="noise" />
      <StatusBar />

      {/* ── Top bar ── */}
      <div style={{ padding:'0 12px 5px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div className="eyebrow-mute" style={{ fontSize:7 }}>บทที่ {chapter} · {zone}</div>
          <div className="thai-display" style={{ fontSize:12, color:'var(--bone)', lineHeight:1.1 }}>
            ต่อสู้อยู่...
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Corruption */}
          <div style={{ textAlign:'right' }}>
            <div className="eyebrow-mute" style={{ fontSize:7, marginBottom:2 }}>CORRUPTION</div>
            <div style={{ width:80, height:4, background:'rgba(0,0,0,0.5)', position:'relative' }}>
              <div style={{ position:'absolute',left:0,top:0,height:'100%',
                width:corruption+'%', background:corrCol, opacity:0.8 }} />
            </div>
            <div className="num" style={{ fontSize:8, color:corrCol, textAlign:'right', marginTop:1 }}>
              {corruption}<span style={{color:'var(--bone-mute)'}}>/100</span>
            </div>
          </div>
          {/* Pause button */}
          <button onClick={() => setPaused(p => !p)} style={{
            width:28, height:28, background:'rgba(0,0,0,0.5)',
            border:'1px solid var(--hairline)', color:'var(--bone)', borderRadius:2, cursor:'pointer',
          }}>
            {paused ? '▶' : '⏸'}
          </button>
        </div>
      </div>

      <Ornament />

      {/* ── Enemy row ── */}
      <div style={{ padding:'10px 10px 5px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
          <span className="eyebrow" style={{ color:'var(--blood)', fontSize:9 }}>
            ศัตรู · {snap ? snap.enemy.filter(e=>e.alive).length : 3}/3
          </span>
          <span className="eyebrow-mute" style={{ fontSize:8 }}>บทที่ {chapter} · LV {15+(chapter-1)*6}</span>
        </div>
        <div style={{ display:'flex', gap:5 }}>
          {(snap ? snap.enemy : enemyTeamDef.map(e => ({
            id:e.id, name:e.name, element:e.element,
            currentHp:e.baseStats.maxHp, maxHp:e.baseStats.maxHp,
            currentAtb:0, currentGuts:0, alive:true, statusEffects:[]
          }))).map((e, i) => (
            <GhostCard key={i} combatant={e} isEnemy={true} isActive={false} />
          ))}
        </div>
      </div>

      {/* ── Battle log ── */}
      <div style={{ padding:'4px 12px 3px', minHeight:52,
        background:'rgba(0,0,0,0.3)', borderTop:'1px solid var(--faint)',
        borderBottom:'1px solid var(--faint)' }}>
        {snap?.log?.slice(-3).map((entry, i) => (
          <LogLine key={i} entry={entry} index={i} />
        ))}
        {!snap && (
          <div style={{ fontFamily:'var(--f-mono)', fontSize:9, color:'var(--bone-mute)', lineHeight:2 }}>
            ⏳ เตรียมพร้อม...
          </div>
        )}
      </div>

      {/* ── Player row ── */}
      <div style={{ padding:'8px 10px 5px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
          <span className="eyebrow" style={{ fontSize:9 }}>
            ทีมเรา · {snap ? snap.player.filter(p=>p.alive).length : playerTeamDef.length}/3
          </span>
          <span className="eyebrow-mute" style={{ fontSize:8 }}>
            {paused ? '⏸ หยุดชั่วคราว' : '▶ AUTO'}
          </span>
        </div>
        <div style={{ display:'flex', gap:5 }}>
          {(snap ? snap.player : playerTeamDef.map(p => ({
            id: p.id, name: p.name, element: p.element,
            currentHp: p.baseStats.maxHp, maxHp: p.baseStats.maxHp,
            currentAtb: 0, currentGuts: 0, alive: true, statusEffects: []
          }))).map((p, i) => (
            <GhostCard key={i} combatant={p} isEnemy={false} isActive={i === activeIdx && !result} />
          ))}
        </div>
      </div>

      {/* ── Skill/action bar (active unit) ── */}
      {snap && !result && (
        <div style={{ padding:'5px 10px 6px',
          background:'linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.5))',
          borderTop:'1px solid var(--hairline)' }}>
          {(() => {
            const active = snap.player[activeIdx];
            if (!active || !active.alive) return null;
            const tmpl = GHOST_REG[active.id] || GHOST_REG[playerTeamDef[activeIdx]?.id];
            const skills = tmpl?.skills || [];
            return (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                  <Chibi kind={active.id || playerTeamDef[activeIdx]?.id} size={20} aura={false} />
                  <span className="eyebrow" style={{ fontSize:8 }}>
                    {active.name} · GUTS {Math.floor(active.currentGuts)}%
                  </span>
                  <div style={{ flex:1, height:4, background:'rgba(0,0,0,0.5)' }}>
                    <div style={{ height:'100%', width:active.currentGuts+'%',
                      background:'#ff8800', transition:'width 0.1s' }} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(skills.length,4)},1fr)`, gap:4 }}>
                  {skills.slice(0,4).map((sk,i) => {
                    const canUse = active.currentGuts >= sk.gutsCost && !active.cooldowns?.[sk.id];
                    const isUlt  = sk.gutsCost >= 60;
                    return (
                      <button key={i} style={{
                        background: canUse && isUlt
                          ? 'linear-gradient(180deg,rgba(192,38,211,0.25),rgba(212,175,55,0.1))'
                          : 'rgba(0,0,0,0.45)',
                        border:`1px solid ${canUse ? (isUlt ? 'var(--corruption-soft)' : 'var(--gold)') : 'var(--hairline)'}`,
                        color: canUse ? 'var(--bone)' : 'var(--bone-mute)',
                        padding:'5px 4px', cursor: canUse ? 'pointer' : 'default',
                        fontFamily:'inherit', borderRadius:2,
                        boxShadow: canUse && isUlt ? '0 0 8px rgba(192,38,211,0.3)' : 'none',
                      }}>
                        <div className="thai-display" style={{ fontSize:10, lineHeight:1, marginBottom:2 }}>
                          {sk.name}
                        </div>
                        <div style={{ display:'flex', gap:4, justifyContent:'center', flexWrap:'wrap' }}>
                          <ElChip element={active.element} />
                          {sk.gutsCost > 0 && (
                            <span className="num" style={{ fontSize:8, color:canUse?'var(--gold-soft)':'var(--bone-mute)' }}>
                              ◆{sk.gutsCost}
                            </span>
                          )}
                          {isUlt && canUse && (
                            <span style={{ fontSize:7, color:'var(--gold-glow)',
                              fontFamily:'var(--f-mono)' }}>★READY</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Result overlay ── */}
      {result && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          zIndex:200, padding:'0 30px' }}>
          <div style={{ fontFamily:'var(--f-display)', fontSize:36,
            color: result==='player' ? 'var(--gold-glow)' : '#ff6666',
            textShadow:`0 0 20px ${result==='player'?'var(--gold)':'#ff4444'}`,
            marginBottom:8, textAlign:'center' }}>
            {result==='player' ? '🎉 ชัยชนะ!' : '💀 พ่ายแพ้'}
          </div>
          {result==='player' && (
            <div style={{ fontSize:12, color:'var(--bone-mute)', marginBottom:16, textAlign:'center', lineHeight:1.6 }}>
              Bond +5 ทุกตัว{saving ? ' · กำลังบันทึก...' : ' · บันทึกแล้ว ✓'}
            </div>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => window.goTo?.('map')} style={{
              background:'rgba(0,0,0,0.6)', border:'1px solid var(--hairline-strong)',
              color:'var(--bone-soft)', fontFamily:'var(--f-display)',
              fontSize:12, padding:'9px 16px', cursor:'pointer' }}>
              🗺 แผนที่
            </button>
            <button onClick={() => window.location.reload()} style={{
              background:`linear-gradient(180deg,${result==='player'?'#ffd470,var(--gold)':'rgba(192,38,211,0.4),rgba(192,38,211,0.2)'})`,
              border:`1px solid ${result==='player'?'var(--gold-deep)':'var(--corruption)'}`,
              color: result==='player' ? 'var(--ink)' : 'var(--bone)',
              fontFamily:'var(--f-display)', fontWeight:700,
              fontSize:12, padding:'9px 18px', cursor:'pointer' }}>
              {result==='player' ? '⚔ ต่อสู้อีกครั้ง' : '↺ ลองใหม่'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

window.LiveBattleScreen = LiveBattleScreen;
