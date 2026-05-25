import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GHOST_REG } from '../data/ghosts';
import Chibi from '../components/Chibi';
import ScreenHeader from '../components/ScreenHeader';

interface Node {
  id: string;
  name: string;
  desc: string;
  cost: number;
  branch: 'offense' | 'defense' | 'resource' | 'soul';
  requires?: string;
  icon: string;
  tier: 1 | 2 | 3 | 4 | 5;
}

const NODES: Node[] = [
  // ── OFFENSE ─────────────────────────────────── total to max: 24pt
  { id:'atk1',     name:'พลังโจมตี I',      branch:'offense',  icon:'⚔️',  tier:1, cost:1, desc:'STR +6' },
  { id:'atk2',     name:'พลังโจมตี II',     branch:'offense',  icon:'⚔️',  tier:2, cost:2, desc:'STR +12', requires:'atk1' },
  { id:'atk3',     name:'พลังโจมตี III',    branch:'offense',  icon:'⚔️',  tier:3, cost:3, desc:'STR +18', requires:'atk2' },
  { id:'mag1',     name:'พลังเวท I',         branch:'offense',  icon:'🔮',  tier:1, cost:1, desc:'MAG +6' },
  { id:'mag2',     name:'พลังเวท II',        branch:'offense',  icon:'🔮',  tier:2, cost:2, desc:'MAG +12', requires:'mag1' },
  { id:'mag3',     name:'พลังเวท III',       branch:'offense',  icon:'🔮',  tier:3, cost:3, desc:'MAG +18', requires:'mag2' },
  { id:'crit1',    name:'วิกฤตโจมตี',       branch:'offense',  icon:'💥',  tier:3, cost:2, desc:'Crit Rate +10%', requires:'atk2' },
  { id:'crit2',    name:'วิกฤตรุนแรง',      branch:'offense',  icon:'💥',  tier:4, cost:3, desc:'Crit Dmg +30%', requires:'crit1' },
  { id:'execute',  name:'ประหาร',            branch:'offense',  icon:'🗡️', tier:4, cost:3, desc:'HP ศัตรู < 20% → ดีลเพิ่ม 35%', requires:'crit1' },
  { id:'pierce',   name:'ทะลุเกราะ',         branch:'offense',  icon:'🎯',  tier:5, cost:4, desc:'ทะลุ DEF 20% ตลอดเวลา', requires:'atk3' },

  // ── DEFENSE ─────────────────────────────────── total to max: 21pt
  { id:'def1',     name:'ป้องกัน I',         branch:'defense',  icon:'🛡️', tier:1, cost:1, desc:'DEF +6' },
  { id:'def2',     name:'ป้องกัน II',        branch:'defense',  icon:'🛡️', tier:2, cost:2, desc:'DEF +12', requires:'def1' },
  { id:'def3',     name:'ป้องกัน III',       branch:'defense',  icon:'🛡️', tier:3, cost:3, desc:'DEF +18', requires:'def2' },
  { id:'spr1',     name:'ต้านเวท I',          branch:'defense',  icon:'💠',  tier:1, cost:1, desc:'SPR +6' },
  { id:'spr2',     name:'ต้านเวท II',         branch:'defense',  icon:'💠',  tier:2, cost:2, desc:'SPR +12', requires:'spr1' },
  { id:'hp1',      name:'HP สูงสุด I',       branch:'defense',  icon:'❤️',  tier:1, cost:1, desc:'HP Max +100' },
  { id:'hp2',      name:'HP สูงสุด II',      branch:'defense',  icon:'❤️',  tier:2, cost:2, desc:'HP Max +200', requires:'hp1' },
  { id:'regen',    name:'ฟื้นฟูตัวเอง',     branch:'defense',  icon:'💚',  tier:3, cost:2, desc:'HP regen 3%/วิ', requires:'hp2' },
  { id:'barrier',  name:'กำแพงพลัง',        branch:'defense',  icon:'🔵',  tier:4, cost:3, desc:'ต้นเทิร์น: shield 5% Max HP', requires:'def2' },
  { id:'fortress', name:'ป้อมปราการ',        branch:'defense',  icon:'🏰',  tier:5, cost:4, desc:'ลด Crit ที่รับ 50% + DEF +10', requires:'def3' },

  // ── RESOURCE ────────────────────────────────── total to max: 25pt
  { id:'guts1',    name:'GUTS I',            branch:'resource', icon:'⚡',  tier:1, cost:1, desc:'GUTS recovery +15%' },
  { id:'guts2',    name:'GUTS II',           branch:'resource', icon:'⚡',  tier:2, cost:2, desc:'GUTS recovery +30%', requires:'guts1' },
  { id:'guts3',    name:'GUTS III',          branch:'resource', icon:'⚡',  tier:3, cost:3, desc:'GUTS recovery +50%', requires:'guts2' },
  { id:'spd1',     name:'ความเร็ว I',        branch:'resource', icon:'💨',  tier:1, cost:1, desc:'SPD +6' },
  { id:'spd2',     name:'ความเร็ว II',       branch:'resource', icon:'💨',  tier:2, cost:2, desc:'SPD +12', requires:'spd1' },
  { id:'rush',     name:'สตาร์ทรัช',        branch:'resource', icon:'🏃',  tier:2, cost:2, desc:'ATB เริ่มต้น 30%', requires:'spd1' },
  { id:'cdcut',    name:'ลดคูลดาวน์',       branch:'resource', icon:'🔄',  tier:3, cost:3, desc:'Cooldown ทุก skill -1', requires:'guts2' },
  { id:'ultimate', name:'GUTS MAX',          branch:'resource', icon:'🌟',  tier:4, cost:3, desc:'skill พิเศษใช้ได้ทันที 1 ครั้ง/battle', requires:'guts3' },
  { id:'overdrive',name:'โอเวอร์ไดรฟ์',    branch:'resource', icon:'🔥',  tier:5, cost:4, desc:'GUTS เต็ม → ดีลเพิ่ม 20%', requires:'ultimate' },
  { id:'chain',    name:'เชนสกิล',           branch:'resource', icon:'🔗',  tier:5, cost:4, desc:'ใช้ skill มีโอกาส 25% ใช้ต่อทันที', requires:'cdcut' },

  // ── SOUL ────────────────────────────────────── total to max: 26pt
  { id:'bond1',    name:'สายสัมพันธ์ I',    branch:'soul',     icon:'💞',  tier:1, cost:1, desc:'Bond +1 ทุก battle' },
  { id:'bond2',    name:'สายสัมพันธ์ II',   branch:'soul',     icon:'💞',  tier:2, cost:2, desc:'Bond +2 ทุก battle', requires:'bond1' },
  { id:'bond3',    name:'สายสัมพันธ์ III',  branch:'soul',     icon:'💞',  tier:3, cost:3, desc:'Bond ≥ 80 → ดีล/ฮีล +10%', requires:'bond2' },
  { id:'dust_mag', name:'ดักฝุ่น',          branch:'soul',     icon:'🌀',  tier:1, cost:1, desc:'ได้ฝุ่นวิญญาณ +15%' },
  { id:'exp_accel',name:'เรียนรู้เร็ว',     branch:'soul',     icon:'📚',  tier:2, cost:2, desc:'EXP ที่ได้รับ +25%' },
  { id:'corr_res', name:'ต้านความเน่า',     branch:'soul',     icon:'☠️',  tier:2, cost:2, desc:'ลด Corruption gain 25%' },
  { id:'attune',   name:'ประสานธาตุ',       branch:'soul',     icon:'🎴',  tier:3, cost:3, desc:'ธาตุชนะ: ×1.5 แทน ×1.33', requires:'bond2' },
  { id:'laststand',name:'สู้จนนาที',        branch:'soul',     icon:'💀',  tier:4, cost:3, desc:'HP < 15% → สถิติทุกด้าน +35%', requires:'corr_res' },
  { id:'ghostlink',name:'โซ่วิญญาณ',       branch:'soul',     icon:'🪬',  tier:5, cost:4, desc:'เพื่อนทีมตาย → ATB เต็มทันที', requires:'attune' },
  { id:'ascension',name:'อวตาร',            branch:'soul',     icon:'✨',  tier:5, cost:5, desc:'มี 20+ node → บอนัสทุกด้าน +20%', requires:'ghostlink' },
];

const BRANCH_COLORS = {
  offense: 'var(--red)', defense: 'var(--blue)',
  resource: 'var(--gold)', soul: '#a78bfa',
};
const BRANCH_LABELS = {
  offense: '⚔️ โจมตี', defense: '🛡️ ป้องกัน',
  resource: '⚡ พลังงาน', soul: '💞 จิตวิญญาณ',
};

export default function SkillTree() {
  const { ghosts, team, updateGhost } = useGameStore();
  const [selectedId, setSelectedId] = useState(team[0]?.id ?? '');

  const ghost = ghosts.find(g => g.id === selectedId) ?? team[0];
  const skillTree = ghost?.skill_tree ?? { points_spent: 0, nodes_taken: [], branches: { offense: 0, defense: 0, resource: 0 } };
  const availPts  = (ghost?.stat_points ?? 0) - skillTree.points_spent;

  async function toggleNode(node: Node) {
    if (!ghost) return;
    const taken = skillTree.nodes_taken;
    if (taken.includes(node.id)) {
      const newTaken = taken.filter(n => n !== node.id);
      await updateGhost(ghost.id, {
        skill_tree: { ...skillTree, nodes_taken: newTaken, points_spent: skillTree.points_spent - node.cost },
      });
    } else {
      if (node.requires && !taken.includes(node.requires)) return;
      if (availPts < node.cost) return;
      const newTaken = [...taken, node.id];
      await updateGhost(ghost.id, {
        skill_tree: { ...skillTree, nodes_taken: newTaken, points_spent: skillTree.points_spent + node.cost },
      });
    }
  }

  const branches = (['offense', 'defense', 'resource', 'soul'] as const);
  const totalNodes = skillTree.nodes_taken.length;

  return (
    <div className="screen fade-in">
      <ScreenHeader title="🌳 Skill Tree" back />

      <div className="screen-content">
        {/* Ghost selector — card grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {ghosts.map(g => {
            const d = GHOST_REG[g.ghost_type];
            const pts = (g.stat_points ?? 0) - (g.skill_tree?.points_spent ?? 0);
            const active = selectedId === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setSelectedId(g.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '10px 6px',
                  background: active
                    ? 'linear-gradient(135deg, rgba(165,94,234,0.25), var(--bg-card))'
                    : 'var(--bg-card)',
                  border: active
                    ? '2px solid var(--purple)'
                    : '1.5px solid rgba(255,255,255,0.07)',
                  borderRadius: 'var(--r-lg)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s',
                }}
              >
                {pts > 0 && (
                  <div style={{
                    position: 'absolute', top: 5, right: 5,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'var(--gold)', color: '#0b1120',
                    fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{pts}</div>
                )}
                <Chibi emoji={d?.emoji ?? '👻'} element={d?.element ?? 'dark'} size={44} evoStage={g.evo_stage} />
                <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.2, color: 'var(--text-white)' }}>
                  {g.nickname || d?.nameTh}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Lv.{g.level}</div>
              </button>
            );
          })}
        </div>

        {/* Points display */}
        {ghost && (
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>แต้มสกิลคงเหลือ</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                ใช้ไป {skillTree.points_spent} pt  ·  node {totalNodes}/{NODES.length}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 28, fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace',
                color: availPts > 0 ? 'var(--gold)' : 'var(--text-muted)',
              }}>{availPts}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>pt</div>
            </div>
          </div>
        )}

        {/* Branches */}
        {branches.map(branch => {
          const branchNodes = NODES.filter(n => n.branch === branch);
          const takenCount  = branchNodes.filter(n => skillTree.nodes_taken.includes(n.id)).length;
          const tiers = [1,2,3,4,5] as const;
          const color = BRANCH_COLORS[branch];
          return (
            <div key={branch}>
              <div className="section-hd" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color }}>{BRANCH_LABELS[branch]}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{takenCount}/{branchNodes.length} node</span>
              </div>

              {tiers.map(tier => {
                const tierNodes = branchNodes.filter(n => n.tier === tier);
                if (tierNodes.length === 0) return null;
                return (
                  <div key={tier} style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, paddingLeft: 2 }}>
                      {'◆'.repeat(tier)} Tier {tier}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {tierNodes.map(node => {
                        const taken    = skillTree.nodes_taken.includes(node.id);
                        const prereqOk = !node.requires || skillTree.nodes_taken.includes(node.requires);
                        const canTake  = prereqOk && (taken || availPts >= node.cost);
                        const costColor = node.cost >= 4 ? '#fb7185' : node.cost >= 3 ? 'var(--orange)' : 'var(--text-muted)';

                        return (
                          <div
                            key={node.id}
                            onClick={() => canTake ? toggleNode(node) : undefined}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '9px 12px',
                              background: taken
                                ? `linear-gradient(135deg, ${color}18, var(--bg-card))`
                                : 'var(--bg-card)',
                              border: taken
                                ? `1.5px solid ${color}55`
                                : '1px solid rgba(255,255,255,0.07)',
                              borderRadius: 'var(--r-lg)',
                              cursor: canTake ? 'pointer' : 'not-allowed',
                              opacity: !prereqOk ? 0.35 : 1,
                              transition: 'all 0.15s',
                            }}
                          >
                            <div style={{ fontSize: 20 }}>{node.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{node.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{node.desc}</div>
                              {node.requires && !skillTree.nodes_taken.includes(node.requires) && (
                                <div style={{ fontSize: 10, color: 'var(--orange)', marginTop: 2 }}>
                                  ต้องการ: {NODES.find(n => n.id === node.requires)?.name}
                                </div>
                              )}
                            </div>
                            <div style={{ flexShrink: 0, textAlign: 'center' }}>
                              {taken ? (
                                <div style={{
                                  padding: '4px 10px', borderRadius: 'var(--r-full)',
                                  fontSize: 11, fontWeight: 700,
                                  background: color, color: '#0b1120',
                                }}>✓</div>
                              ) : (
                                <div style={{
                                  padding: '4px 10px', borderRadius: 'var(--r-full)',
                                  fontSize: 11, fontWeight: 700,
                                  background: 'var(--bg-elevated)',
                                  color: availPts >= node.cost ? costColor : 'var(--text-muted)',
                                  opacity: availPts < node.cost ? 0.5 : 1,
                                }}>{node.cost}pt</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
