import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GHOST_REG } from '../data/ghosts';
import ScreenHeader from '../components/ScreenHeader';

interface Node {
  id: string;
  name: string;
  desc: string;
  cost: number;
  branch: 'offense' | 'defense' | 'resource';
  requires?: string;
  icon: string;
}

const NODES: Node[] = [
  // Offense
  { id: 'atk1',      name: 'พลังโจมตี I',     branch: 'offense',  icon: '⚔️', cost: 1, desc: 'STR +5' },
  { id: 'atk2',      name: 'พลังโจมตี II',    branch: 'offense',  icon: '⚔️', cost: 2, desc: 'STR +10', requires: 'atk1' },
  { id: 'mag1',      name: 'พลังเวท I',        branch: 'offense',  icon: '🔮', cost: 1, desc: 'MAG +5' },
  { id: 'crit',      name: 'วิกฤตโจมตี',      branch: 'offense',  icon: '💥', cost: 2, desc: 'Crit Rate +10%', requires: 'atk2' },
  { id: 'execute',   name: 'ประหาร',           branch: 'offense',  icon: '🗡️', cost: 3, desc: 'เมื่อ HP ศัตรู < 20% ดีลเพิ่ม 30%', requires: 'crit' },
  // Defense
  { id: 'def1',      name: 'ป้องกัน I',        branch: 'defense',  icon: '🛡️', cost: 1, desc: 'DEF +5' },
  { id: 'def2',      name: 'ป้องกัน II',       branch: 'defense',  icon: '🛡️', cost: 2, desc: 'DEF +10', requires: 'def1' },
  { id: 'hp1',       name: 'HP สูงสุด I',      branch: 'defense',  icon: '❤️', cost: 1, desc: 'HP Max +100' },
  { id: 'regen',     name: 'ฟื้นฟูตัวเอง',    branch: 'defense',  icon: '💚', cost: 2, desc: 'HP regen 2%/วิ', requires: 'hp1' },
  { id: 'barrier',   name: 'กำแพงพลัง',       branch: 'defense',  icon: '🔵', cost: 3, desc: 'ทุกต้นเทิร์น รับ shield 5% Max HP', requires: 'def2' },
  // Resource
  { id: 'guts1',     name: 'GUTS I',           branch: 'resource', icon: '⚡', cost: 1, desc: 'GUTS recovery +15%' },
  { id: 'guts2',     name: 'GUTS II',          branch: 'resource', icon: '⚡', cost: 2, desc: 'GUTS recovery +30%', requires: 'guts1' },
  { id: 'spd1',      name: 'ความเร็ว',         branch: 'resource', icon: '💨', cost: 1, desc: 'SPD +5' },
  { id: 'rush',      name: 'สตาร์ทรัช',       branch: 'resource', icon: '🏃', cost: 2, desc: 'ATB เริ่มต้น 30%', requires: 'spd1' },
  { id: 'ultimate',  name: 'GUTS MAX',         branch: 'resource', icon: '🌟', cost: 3, desc: 'สกิลพิเศษใช้ได้ทันที 1 ครั้ง/การต่อสู้', requires: 'guts2' },
];

const BRANCH_COLORS = { offense: 'var(--red)', defense: 'var(--blue)', resource: 'var(--gold)' };
const BRANCH_LABELS = { offense: '⚔️ โจมตี', defense: '🛡️ ป้องกัน', resource: '⚡ พลังงาน' };

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

  const branches = (['offense', 'defense', 'resource'] as const);

  return (
    <div className="screen fade-in">
      <ScreenHeader title="🌳 Skill Tree" back />

      <div className="screen-content">
        {/* Ghost selector */}
        <div className="chip-row">
          {ghosts.map(g => {
            const d = GHOST_REG[g.ghost_type];
            return (
              <button
                key={g.id}
                className={`chip${selectedId === g.id ? ' active' : ''}`}
                onClick={() => setSelectedId(g.id)}
              >
                {d?.emoji} {g.nickname || d?.nameTh}
              </button>
            );
          })}
        </div>

        {/* Points display */}
        {ghost && (
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>แต้มสกิลคงเหลือ</div>
              <div className="text-muted" style={{ fontSize: 12 }}>ใช้ไป {skillTree.points_spent} แต้ม</div>
            </div>
            <div style={{
              fontSize: 32,
              fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              color: availPts > 0 ? 'var(--gold)' : 'var(--text-muted)',
            }}>
              {availPts}
            </div>
          </div>
        )}

        {/* Branches */}
        {branches.map(branch => (
          <div key={branch}>
            <div className="section-hd">
              <span style={{ fontSize: 14, fontWeight: 700, color: BRANCH_COLORS[branch] }}>
                {BRANCH_LABELS[branch]}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {NODES.filter(n => n.branch === branch).map(node => {
                const taken    = skillTree.nodes_taken.includes(node.id);
                const prereqOk = !node.requires || skillTree.nodes_taken.includes(node.requires);
                const canTake  = prereqOk && (taken || availPts >= node.cost);

                return (
                  <div
                    key={node.id}
                    onClick={() => canTake ? toggleNode(node) : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      background: taken
                        ? `linear-gradient(135deg, ${BRANCH_COLORS[branch]}18, var(--bg-card))`
                        : 'var(--bg-card)',
                      border: taken
                        ? `1.5px solid ${BRANCH_COLORS[branch]}44`
                        : '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 'var(--r-lg)',
                      cursor: canTake ? 'pointer' : 'not-allowed',
                      opacity: !prereqOk ? 0.4 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 22 }}>{node.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{node.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{node.desc}</div>
                      {node.requires && !skillTree.nodes_taken.includes(node.requires) && (
                        <div style={{ fontSize: 10, color: 'var(--orange)', marginTop: 2 }}>
                          ต้องการ: {NODES.find(n => n.id === node.requires)?.name}
                        </div>
                      )}
                    </div>
                    <div style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--r-full)',
                      fontSize: 11,
                      fontWeight: 700,
                      background: taken ? BRANCH_COLORS[branch] : 'var(--bg-elevated)',
                      color: taken ? '#0b1120' : 'var(--text-muted)',
                    }}>
                      {taken ? '✓' : `${node.cost}pt`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
