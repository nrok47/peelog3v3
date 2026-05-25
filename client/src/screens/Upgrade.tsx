import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GHOST_REG } from '../data/ghosts';
import Chibi from '../components/Chibi';
import ScreenHeader from '../components/ScreenHeader';

// ── Amulet data ───────────────────────────────────────────────
const AMULET_POOL = [
  { id:'a_hp',     name:'ลูกประคำสีแดง',  icon:'📿', power:'HP +300',             tier:'rare'   },
  { id:'a_atk',    name:'เขี้ยวเสือดาว',  icon:'🦷', power:'STR +15',             tier:'rare'   },
  { id:'a_mag',    name:'ตะกรุดเวทมนตร์', icon:'📜', power:'MAG +15',             tier:'epic'   },
  { id:'a_spd',    name:'เท้าลม',         icon:'💨', power:'SPD +10',             tier:'rare'   },
  { id:'a_guts',   name:'หัวใจนักรบ',     icon:'❤️‍🔥', power:'GUTS fill +25%',    tier:'epic'   },
  { id:'a_bond',   name:'สร้อยผูกใจ',     icon:'💞', power:'Bond XP +50%',        tier:'legend' },
  { id:'a_curse',  name:'มงกุฎสาป',       icon:'👑', power:'MAG +25',             tier:'legend' },
  { id:'a_shield', name:'เกราะวิญญาณ',    icon:'🔵', power:'Shield 5% HP/เทิร์น', tier:'epic'  },
];
const TIER_COLORS: Record<string,string> = {
  common:'var(--t-common)', rare:'var(--t-rare)', epic:'var(--t-epic)', legend:'var(--t-legend)',
};

// ── Forge data ────────────────────────────────────────────────
const MASS_AFFIXES = [
  'ATK +12%','DEF +15%','SPD +8','MAG +10%','HP +200','GUTS 회복 +20%',
  'Bond XP +25%','SPR +12%','เมื่อ HP < 30%: ATK +25%','สกิลพิเศษ CD -1',
  'ดูด HP 5% ต่อโจมตี','ดื้อยา 1 ครั้ง/การต่อสู้',
];

// ── Skill Tree data ───────────────────────────────────────────
interface SNode { id:string; name:string; desc:string; cost:number; branch:'offense'|'defense'|'resource'; requires?:string; icon:string; }
const NODES: SNode[] = [
  { id:'atk1',    name:'พลังโจมตี I',   branch:'offense',  icon:'⚔️', cost:1, desc:'STR +5' },
  { id:'atk2',    name:'พลังโจมตี II',  branch:'offense',  icon:'⚔️', cost:2, desc:'STR +10',  requires:'atk1' },
  { id:'mag1',    name:'พลังเวท I',      branch:'offense',  icon:'🔮', cost:1, desc:'MAG +5' },
  { id:'crit',    name:'วิกฤตโจมตี',    branch:'offense',  icon:'💥', cost:2, desc:'Crit Rate +10%', requires:'atk2' },
  { id:'execute', name:'ประหาร',         branch:'offense',  icon:'🗡️', cost:3, desc:'ดีลเพิ่ม 30% เมื่อ HP ศัตรู < 20%', requires:'crit' },
  { id:'def1',    name:'ป้องกัน I',      branch:'defense',  icon:'🛡️', cost:1, desc:'DEF +5' },
  { id:'def2',    name:'ป้องกัน II',     branch:'defense',  icon:'🛡️', cost:2, desc:'DEF +10',  requires:'def1' },
  { id:'hp1',     name:'HP สูงสุด I',    branch:'defense',  icon:'❤️', cost:1, desc:'HP Max +100' },
  { id:'regen',   name:'ฟื้นฟูตัวเอง',  branch:'defense',  icon:'💚', cost:2, desc:'HP regen 2%/วิ', requires:'hp1' },
  { id:'barrier', name:'กำแพงพลัง',     branch:'defense',  icon:'🔵', cost:3, desc:'Shield 5% Max HP/เทิร์น', requires:'def2' },
  { id:'guts1',   name:'GUTS I',         branch:'resource', icon:'⚡', cost:1, desc:'GUTS recovery +15%' },
  { id:'guts2',   name:'GUTS II',        branch:'resource', icon:'⚡', cost:2, desc:'GUTS recovery +30%', requires:'guts1' },
  { id:'spd1',    name:'ความเร็ว',       branch:'resource', icon:'💨', cost:1, desc:'SPD +5' },
  { id:'rush',    name:'สตาร์ทรัช',     branch:'resource', icon:'🏃', cost:2, desc:'ATB เริ่มต้น 30%', requires:'spd1' },
  { id:'ultimate',name:'GUTS MAX',       branch:'resource', icon:'🌟', cost:3, desc:'สกิลพิเศษใช้ได้ทันที 1 ครั้ง/การต่อสู้', requires:'guts2' },
];
const BRANCH_COLORS = { offense:'var(--red)', defense:'var(--blue)', resource:'var(--gold)' };
const BRANCH_LABELS = { offense:'⚔️ โจมตี', defense:'🛡️ ป้องกัน', resource:'⚡ พลังงาน' };

// ── Evolution data ────────────────────────────────────────────
const EVO_NAMES = ['ฐาน','เปลือยพลัง','เทพวิญญาณ'];
const EVO_REQ   = [
  null,
  { level:10, dust:300,  desc:'Lv.10 + ✨300' },
  { level:20, dust:800,  desc:'Lv.20 + ✨800' },
];

// ─────────────────────────────────────────────────────────────
type UpgradeTab = 'forge'|'skill'|'amulet'|'evo';
const TABS = [
  { id:'forge'  as UpgradeTab, icon:'🔧', label:'Forge'   },
  { id:'skill'  as UpgradeTab, icon:'🌳', label:'สกิล'    },
  { id:'amulet' as UpgradeTab, icon:'📿', label:'ยันต์'   },
  { id:'evo'    as UpgradeTab, icon:'🌟', label:'วิวัฒน์' },
];

export default function Upgrade() {
  const { ghosts, team, player, updateGhost, spendDust, setFieldAmulet } = useGameStore();
  const [tab, setTab]                 = useState<UpgradeTab>('forge');
  const [selectedId, setSelectedId]   = useState(team[0]?.id ?? '');
  const [forgeSubTab, setForgeSubTab] = useState<'frame'|'mass'>('frame');
  const [msg, setMsg]                 = useState('');
  const [rolling, setRolling]         = useState(false);
  const [animating, setAnimating]     = useState(false);
  const [activeSlot, setActiveSlot]   = useState<number|null>(null);

  const ghost      = ghosts.find(g => g.id === selectedId) ?? team[0];
  const def        = ghost ? GHOST_REG[ghost.ghost_type] : null;
  const dust       = player?.spirit_dust ?? 0;
  const frame      = ghost?.frame ?? { enhancement:0, base_def: def?.baseStats.def ?? 20, base_spr: def?.baseStats.spr ?? 20, sockets:[] };
  const mass       = ghost?.spirit_mass ?? { affixes:[], tier_history:[] };
  const skillTree  = ghost?.skill_tree ?? { points_spent:0, nodes_taken:[], branches:{offense:0,defense:0,resource:0} };
  const availPts   = (ghost?.stat_points ?? 0) - skillTree.points_spent;
  const stage      = ghost?.evo_stage ?? 0;
  const nextReq    = EVO_REQ[stage + 1];
  const fieldAmulets: (string|null)[] = player?.inventory?.field_amulets ?? [null,null,null];
  const frameCost  = (frame.enhancement + 1) * 150;
  const massCost   = 200;

  function showMsg(m: string, ms = 2500) { setMsg(m); setTimeout(() => setMsg(''), ms); }

  async function enhanceFrame() {
    if (!ghost) return;
    if (dust < frameCost) { showMsg(`❌ ต้องการ ✨${frameCost}`); return; }
    const ok = await spendDust(frameCost);
    if (!ok) { showMsg('❌ ตัดฝุ่นไม่สำเร็จ'); return; }
    const newFrame = { ...frame, enhancement: frame.enhancement+1, base_def: frame.base_def+3, base_spr: frame.base_spr+3 };
    await updateGhost(ghost.id, { frame: newFrame });
    showMsg(`✅ Frame +${newFrame.enhancement}! DEF/SPR +3`);
  }

  async function rerollMass() {
    if (!ghost) return;
    if (dust < massCost) { showMsg(`❌ ต้องการ ✨${massCost}`); return; }
    const ok = await spendDust(massCost);
    if (!ok) { showMsg('❌ ตัดฝุ่นไม่สำเร็จ'); return; }
    setRolling(true);
    const count   = 2 + Math.floor(Math.random() * 2);
    const affixes = [...MASS_AFFIXES].sort(() => Math.random()-0.5).slice(0, count);
    await new Promise(r => setTimeout(r, 600));
    await updateGhost(ghost.id, { spirit_mass:{ affixes, tier_history:[...mass.tier_history, new Date().toISOString()] } });
    setRolling(false);
    showMsg(`🎲 Reroll สำเร็จ! ได้ ${count} Affixes`);
  }

  async function toggleNode(node: SNode) {
    if (!ghost) return;
    const taken = skillTree.nodes_taken;
    if (taken.includes(node.id)) {
      await updateGhost(ghost.id, { skill_tree:{ ...skillTree, nodes_taken: taken.filter(n=>n!==node.id), points_spent: skillTree.points_spent - node.cost } });
    } else {
      if (node.requires && !taken.includes(node.requires)) return;
      if (availPts < node.cost) return;
      await updateGhost(ghost.id, { skill_tree:{ ...skillTree, nodes_taken:[...taken, node.id], points_spent: skillTree.points_spent + node.cost } });
    }
  }

  async function evolve() {
    if (!ghost || !nextReq) return;
    if (ghost.level < nextReq.level) { showMsg(`❌ ต้องการ Lv.${nextReq.level}`); return; }
    if (dust < nextReq.dust)         { showMsg(`❌ ต้องการ ✨${nextReq.dust}`); return; }
    const ok = await spendDust(nextReq.dust);
    if (!ok) { showMsg('❌ ตัดฝุ่นไม่สำเร็จ'); return; }
    setAnimating(true);
    await new Promise(r => setTimeout(r, 1200));
    await updateGhost(ghost.id, { evo_stage:(stage+1) as 0|1|2 });
    setAnimating(false);
    showMsg(`✨ ${def?.nameTh} วิวัฒนาการเป็น "${EVO_NAMES[stage+1]}"!`, 3000);
  }

  async function pickAmulet(pos: number, amuletId: string) {
    const current = fieldAmulets[pos];
    await setFieldAmulet(pos, current === amuletId ? null : amuletId);
    setActiveSlot(null);
  }

  return (
    <div className="screen fade-in">
      <ScreenHeader title="🔧 อัปเกรด" back />
      <div className="screen-content">

        {/* ── Main tab bar ──────────────────────────────────────── */}
        <div style={{ display:'flex', background:'var(--bg-card)', borderRadius:'var(--r-md)', padding:3, gap:2 }}>
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => { setTab(t.id); setMsg(''); setActiveSlot(null); }}
              style={{
                flex:1, padding:'9px 2px', border:'none', borderRadius:'calc(var(--r-md) - 2px)',
                fontFamily:'inherit', fontSize:11, fontWeight:700, cursor:'pointer',
                background: tab===t.id ? 'linear-gradient(135deg,#f5c518,#e09f10)' : 'transparent',
                color: tab===t.id ? '#0b1120' : 'var(--text-muted)',
                transition:'all 0.2s',
              }}
            >{t.icon} {t.label}</button>
          ))}
        </div>

        {/* ── Ghost selector (not for amulet) ───────────────────── */}
        {tab !== 'amulet' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
            {ghosts.map(g => {
              const d      = GHOST_REG[g.ghost_type];
              const pts    = tab==='skill' ? Math.max(0,(g.stat_points ?? 0)-(g.skill_tree?.points_spent ?? 0)) : 0;
              const active = selectedId === g.id;
              return (
                <button key={g.id} onClick={() => setSelectedId(g.id)}
                  style={{
                    display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                    padding:'8px 4px',
                    background: active ? 'linear-gradient(135deg,rgba(165,94,234,0.25),var(--bg-card))' : 'var(--bg-card)',
                    border: active ? '2px solid var(--purple)' : '1.5px solid rgba(255,255,255,0.07)',
                    borderRadius:'var(--r-lg)', cursor:'pointer', position:'relative', transition:'all 0.15s',
                  }}
                >
                  {pts > 0 && (
                    <div style={{ position:'absolute',top:4,right:4,width:14,height:14,borderRadius:'50%',background:'var(--gold)',color:'#0b1120',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center' }}>
                      {pts}
                    </div>
                  )}
                  <Chibi emoji={d?.emoji ?? '👻'} element={d?.element ?? 'dark'} size={38} evoStage={g.evo_stage} />
                  <div style={{ fontSize:10, fontWeight:700, textAlign:'center', lineHeight:1.2 }}>
                    {g.nickname || d?.nameTh}
                  </div>
                  <div style={{ fontSize:9, color:'var(--text-muted)' }}>Lv.{g.level}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Msg banner ────────────────────────────────────────── */}
        {msg && (
          <div style={{
            padding:'10px 14px',
            background: msg.startsWith('❌') ? 'rgba(255,71,87,0.1)' : 'rgba(38,222,129,0.1)',
            border:`1px solid ${msg.startsWith('❌') ? 'rgba(255,71,87,0.3)' : 'rgba(38,222,129,0.3)'}`,
            borderRadius:'var(--r-md)', color: msg.startsWith('❌') ? 'var(--red)' : 'var(--green)',
            fontWeight:700, fontSize:13,
          }}>{msg}</div>
        )}

        {/* ════════════════ FORGE TAB ════════════════════════════ */}
        {tab === 'forge' && ghost && (
          <>
            <div style={{ display:'flex', background:'var(--bg-card)', borderRadius:'var(--r-md)', padding:3 }}>
              {([['frame','🛡️ Frame'],['mass','🔮 Mass']] as const).map(([k,lbl]) => (
                <button key={k} onClick={() => setForgeSubTab(k)}
                  style={{
                    flex:1, padding:'8px', border:'none', borderRadius:'calc(var(--r-md) - 2px)',
                    fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer',
                    background: forgeSubTab===k ? 'linear-gradient(135deg,#f5c518,#e09f10)' : 'transparent',
                    color: forgeSubTab===k ? '#0b1120' : 'var(--text-muted)', transition:'all 0.2s',
                  }}
                >{lbl}</button>
              ))}
            </div>

            {forgeSubTab === 'frame' && (
              <>
                <div className="card" style={{ textAlign:'center' }}>
                  <div style={{ fontSize:40, fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:frame.enhancement>=10?'var(--gold)':'var(--text-white)', marginBottom:4 }}>
                    +{frame.enhancement}
                  </div>
                  <div className="label-sm" style={{ marginBottom:12 }}>ระดับ Frame ({frame.enhancement}/15)</div>
                  <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                    <div className="stat-chip"><span className="val" style={{ color:'var(--blue)' }}>{frame.base_def}</span><span className="lbl">DEF</span></div>
                    <div className="stat-chip"><span className="val" style={{ color:'var(--cyan)' }}>{frame.base_spr}</span><span className="lbl">SPR</span></div>
                  </div>
                </div>
                {frame.enhancement < 15 ? (
                  <div className="card">
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                      <div>
                        <div style={{ fontWeight:700 }}>อัปเกรด Frame</div>
                        <div className="text-muted" style={{ fontSize:12 }}>+3 DEF, +3 SPR ต่อระดับ</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ color:dust>=frameCost?'var(--gold)':'var(--red)', fontWeight:700 }}>✨ {frameCost}</div>
                        <div className="label-sm">ค่าใช้จ่าย</div>
                      </div>
                    </div>
                    <button className={`btn ${dust>=frameCost?'btn-gold':'btn-outline'} btn-full`} onClick={enhanceFrame} disabled={dust<frameCost}>
                      ⚒️ อัปเกรด Frame
                    </button>
                  </div>
                ) : (
                  <div className="card" style={{ textAlign:'center', border:'1.5px solid rgba(245,197,24,0.5)' }}>
                    <div style={{ fontSize:24 }}>🏅</div>
                    <div style={{ fontWeight:700, color:'var(--gold)', marginTop:4 }}>Frame MAX!</div>
                  </div>
                )}
              </>
            )}

            {forgeSubTab === 'mass' && (
              <>
                <div className="card">
                  <div className="label-sm" style={{ marginBottom:10 }}>Affixes ปัจจุบัน</div>
                  {mass.affixes.length === 0 ? (
                    <div className="text-muted" style={{ textAlign:'center', padding:'16px 0', fontSize:13 }}>ยังไม่มี Affix — กด Reroll เพื่อสุ่ม</div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {mass.affixes.map((a,i) => (
                        <div key={i} style={{ padding:'8px 12px', background:'linear-gradient(135deg,rgba(165,94,234,0.1),var(--bg-elevated))', border:'1px solid rgba(165,94,234,0.25)', borderRadius:'var(--r-md)', fontSize:13, fontWeight:600 }}>
                          <span style={{ color:'var(--purple)' }}>◆</span> {a}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card">
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:700 }}>🎲 Spirit Mass Reroll</div>
                      <div className="text-muted" style={{ fontSize:12 }}>สุ่ม Affix ใหม่ (2-3 รายการ)</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ color:dust>=massCost?'var(--gold)':'var(--red)', fontWeight:700 }}>✨ {massCost}</div>
                    </div>
                  </div>
                  <button className={`btn ${dust>=massCost?'btn-purple':'btn-outline'} btn-full`} onClick={rerollMass} disabled={dust<massCost||rolling}>
                    {rolling ? <span className="pulse">🎲 กำลังสุ่ม...</span> : '🔮 Reroll Mass'}
                  </button>
                  {mass.tier_history.length > 0 && (
                    <div className="text-muted" style={{ fontSize:11, textAlign:'center', marginTop:8 }}>
                      Reroll แล้ว {mass.tier_history.length} ครั้ง
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ════════════════ SKILL TAB ════════════════════════════ */}
        {tab === 'skill' && ghost && (
          <>
            <div className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700 }}>แต้มสกิลคงเหลือ</div>
                <div className="text-muted" style={{ fontSize:12 }}>ใช้ไป {skillTree.points_spent} แต้ม</div>
              </div>
              <div style={{ fontSize:32, fontWeight:700, fontFamily:'JetBrains Mono,monospace', color:availPts>0?'var(--gold)':'var(--text-muted)' }}>
                {availPts}
              </div>
            </div>

            {(['offense','defense','resource'] as const).map(branch => (
              <div key={branch}>
                <div className="section-hd">
                  <span style={{ fontSize:13, fontWeight:700, color:BRANCH_COLORS[branch] }}>{BRANCH_LABELS[branch]}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {NODES.filter(n => n.branch===branch).map(node => {
                    const taken    = skillTree.nodes_taken.includes(node.id);
                    const prereqOk = !node.requires || skillTree.nodes_taken.includes(node.requires);
                    const canTake  = prereqOk && (taken || availPts >= node.cost);
                    return (
                      <div key={node.id} onClick={() => canTake && toggleNode(node)}
                        style={{
                          display:'flex', alignItems:'center', gap:12, padding:'10px 12px',
                          background: taken ? `linear-gradient(135deg,${BRANCH_COLORS[branch]}18,var(--bg-card))` : 'var(--bg-card)',
                          border: taken ? `1.5px solid ${BRANCH_COLORS[branch]}44` : '1px solid rgba(255,255,255,0.07)',
                          borderRadius:'var(--r-lg)', cursor: canTake?'pointer':'not-allowed',
                          opacity: !prereqOk?0.4:1, transition:'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize:20 }}>{node.icon}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:13 }}>{node.name}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{node.desc}</div>
                          {node.requires && !skillTree.nodes_taken.includes(node.requires) && (
                            <div style={{ fontSize:10, color:'var(--orange)', marginTop:2 }}>
                              ต้องการ: {NODES.find(n=>n.id===node.requires)?.name}
                            </div>
                          )}
                        </div>
                        <div style={{ padding:'4px 10px', borderRadius:'var(--r-full)', fontSize:11, fontWeight:700, background:taken?BRANCH_COLORS[branch]:'var(--bg-elevated)', color:taken?'#0b1120':'var(--text-muted)' }}>
                          {taken ? '✓' : `${node.cost}pt`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ════════════════ AMULET TAB ═══════════════════════════ */}
        {tab === 'amulet' && (
          <>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>
              วางยันต์บนตำแหน่ง — ผีที่ยืนตรงนั้นรับ effect
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[0,1,2].map(pos => {
                const amuletId  = fieldAmulets[pos] ?? null;
                const amulet    = AMULET_POOL.find(a => a.id === amuletId);
                const isActive  = activeSlot === pos;
                const slotGhost = team[pos];
                const slotDef   = slotGhost ? GHOST_REG[slotGhost.ghost_type] : null;
                return (
                  <button key={pos} onClick={() => setActiveSlot(isActive ? null : pos)}
                    style={{
                      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                      padding:'12px 6px', minHeight:108,
                      background: isActive ? 'linear-gradient(135deg,rgba(245,197,24,0.2),var(--bg-card))' : amulet ? `linear-gradient(135deg,${TIER_COLORS[amulet.tier]}15,var(--bg-card))` : 'var(--bg-card)',
                      border: isActive ? '2px solid var(--gold)' : amulet ? `1.5px solid ${TIER_COLORS[amulet.tier]}50` : '1.5px dashed rgba(255,255,255,0.15)',
                      borderRadius:'var(--r-lg)', cursor:'pointer', transition:'all 0.15s', justifyContent:'center',
                    }}
                  >
                    <div style={{ fontSize:9, color:isActive?'var(--gold)':'var(--text-muted)', fontWeight:700 }}>
                      ช่อง {pos+1}{slotDef ? ` · ${slotDef.nameTh}` : ''}
                    </div>
                    {slotDef && <div style={{ fontSize:16 }}>{slotDef.emoji}</div>}
                    {amulet ? (
                      <>
                        <div style={{ fontSize:24 }}>{amulet.icon}</div>
                        <div style={{ fontSize:9, fontWeight:700, textAlign:'center', color:TIER_COLORS[amulet.tier], lineHeight:1.3 }}>{amulet.name}</div>
                        <div style={{ fontSize:8, color:'var(--text-muted)', textAlign:'center' }}>{amulet.power}</div>
                      </>
                    ) : (
                      <div style={{ fontSize:20, color:'var(--text-muted)' }}>+</div>
                    )}
                  </button>
                );
              })}
            </div>

            {activeSlot !== null && (
              <>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--gold)' }}>
                  เลือกยันต์ → ช่อง {activeSlot+1}
                </div>
                {fieldAmulets[activeSlot] && (
                  <button type="button" className="btn btn-outline btn-full" style={{ fontSize:12 }}
                    onClick={() => { setFieldAmulet(activeSlot, null); setActiveSlot(null); }}
                  >✕ ถอดยันต์ออก</button>
                )}
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {AMULET_POOL.map(amulet => {
                    const isEquipped    = fieldAmulets[activeSlot] === amulet.id;
                    const usedElsewhere = fieldAmulets.some((id,i) => id === amulet.id && i !== activeSlot);
                    return (
                      <div key={amulet.id}
                        onClick={() => !usedElsewhere && pickAmulet(activeSlot, amulet.id)}
                        style={{
                          display:'flex', alignItems:'center', gap:12, padding:'10px 12px',
                          background: isEquipped ? `linear-gradient(135deg,${TIER_COLORS[amulet.tier]}20,var(--bg-card))` : 'var(--bg-card)',
                          border: isEquipped ? `2px solid ${TIER_COLORS[amulet.tier]}80` : '1px solid rgba(255,255,255,0.07)',
                          borderRadius:'var(--r-lg)', cursor:usedElsewhere?'not-allowed':'pointer',
                          opacity:usedElsewhere?0.4:1, transition:'all 0.1s',
                        }}
                      >
                        <div style={{ fontSize:22 }}>{amulet.icon}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:13, color:TIER_COLORS[amulet.tier] }}>{amulet.name}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{amulet.power}</div>
                          {usedElsewhere && <div style={{ fontSize:10, color:'var(--orange)' }}>ใช้ที่ช่องอื่นอยู่</div>}
                        </div>
                        <span className={`badge badge-${amulet.tier}`}>{amulet.tier}</span>
                        {isEquipped && <div style={{ color:'var(--green)', fontSize:16 }}>✓</div>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ════════════════ EVOLUTION TAB ════════════════════════ */}
        {tab === 'evo' && ghost && def && (
          <>
            <div className="card" style={{ textAlign:'center', padding:'20px 16px' }}>
              <div style={{
                fontSize:animating?64:52, marginBottom:12, transition:'font-size 0.3s',
                animation:animating?'float 0.5s ease-in-out infinite':'none',
                filter:animating?`drop-shadow(0 0 20px ${stage>=1?'#a55eea':'#f5c518'})`:'none',
              }}>{def.emoji}</div>
              <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:12 }}>
                {[0,1,2].map(s => (
                  <div key={s} style={{
                    width:s<=stage?32:24, height:s<=stage?32:24, borderRadius:'50%',
                    background: s<stage?'linear-gradient(135deg,var(--gold),var(--orange))':s===stage?'linear-gradient(135deg,var(--purple),var(--blue))':'var(--bg-elevated)',
                    border:s===stage?'2px solid var(--gold)':'1px solid rgba(255,255,255,0.1)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, transition:'all 0.3s',
                  }}>
                    {s<stage?'✓':s===stage?def.emoji.slice(0,2):'?'}
                  </div>
                ))}
              </div>
              <div style={{ fontFamily:'Bai Jamjuree,sans-serif', fontSize:18, fontWeight:700, marginBottom:4, color:stage>=2?'var(--pink)':stage>=1?'var(--purple)':'var(--text-white)' }}>
                {ghost.nickname || def.nameTh}
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>ขั้น {stage}: {EVO_NAMES[stage]}</div>
              {stage >= 2 && <span className="badge badge-mythic" style={{ margin:'8px auto 0' }}>MYTHIC</span>}
            </div>

            {stage < 2 && nextReq ? (
              <div className="card">
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>วิวัฒนาการ → {EVO_NAMES[stage+1]}</div>
                <div className="text-muted" style={{ fontSize:12, marginBottom:12 }}>ต้องการ: {nextReq.desc}</div>
                <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                  <div style={{ flex:1, padding:'8px', background:'var(--bg-elevated)', borderRadius:'var(--r-md)', textAlign:'center', border:`1px solid ${ghost.level>=nextReq.level?'rgba(38,222,129,0.3)':'rgba(255,71,87,0.3)'}` }}>
                    <div style={{ fontWeight:700, color:ghost.level>=nextReq.level?'var(--green)':'var(--red)' }}>Lv.{ghost.level}/{nextReq.level}</div>
                    <div className="label-sm">ระดับ</div>
                  </div>
                  <div style={{ flex:1, padding:'8px', background:'var(--bg-elevated)', borderRadius:'var(--r-md)', textAlign:'center', border:`1px solid ${dust>=nextReq.dust?'rgba(245,197,24,0.3)':'rgba(255,71,87,0.3)'}` }}>
                    <div style={{ fontWeight:700, color:dust>=nextReq.dust?'var(--gold)':'var(--red)' }}>✨ {dust}/{nextReq.dust}</div>
                    <div className="label-sm">ฝุ่นวิญญาณ</div>
                  </div>
                </div>
                <button className="btn btn-purple btn-full btn-lg" onClick={evolve} disabled={animating||ghost.level<nextReq.level||dust<nextReq.dust}>
                  {animating ? <span className="pulse">✨ กำลังวิวัฒนาการ...</span> : '🌟 วิวัฒนาการ!'}
                </button>
              </div>
            ) : (
              <div className="card" style={{ textAlign:'center', border:'1.5px solid rgba(255,107,157,0.5)', background:'linear-gradient(135deg,rgba(255,107,157,0.1),var(--bg-card))' }}>
                <div style={{ fontSize:28 }}>🏆</div>
                <div style={{ fontWeight:700, color:'var(--pink)', fontSize:15, marginTop:8 }}>วิวัฒนาการสูงสุดแล้ว!</div>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!ghost && tab !== 'amulet' && (
          <div className="card" style={{ textAlign:'center', padding:'40px' }}>
            <div style={{ fontSize:36 }}>😶</div>
            <div className="text-muted" style={{ marginTop:8 }}>เลือกวิญญาณก่อน</div>
          </div>
        )}

      </div>
    </div>
  );
}
