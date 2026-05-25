import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GHOST_REG } from '../data/ghosts';
import Chibi from '../components/Chibi';
import ScreenHeader from '../components/ScreenHeader';

const MOCK_BOARD = [
  { name: 'จอมผีอุบล',    score: 1340, desc: 'ปอบ · กระสือ · ผีตายโหง' },
  { name: 'แม่มดขอนแก่น', score: 1080, desc: 'แม่นาค · กุมารทอง · นางตานี' },
  { name: 'เด็กวัดสีลม',  score:  760, desc: 'อสุรกาย · เปรต · ปีศาจ' },
];

function getRank(score: number) {
  if (score >= 1000) return { tier: 'แชมเปี้ยน', color: '#f5c518', icon: '👑' };
  if (score >= 600)  return { tier: 'โกลด์',     color: '#fd9644', icon: '🥇' };
  if (score >= 300)  return { tier: 'ซิลเวอร์',  color: '#aaa',    icon: '🥈' };
  return               { tier: 'บรอนซ์',          color: '#cd7f32', icon: '🥉' };
}

export default function Arena() {
  const navigate = useNavigate();
  const { ghosts, team } = useGameStore();

  const avgLevel = team.length > 0
    ? Math.round(team.reduce((s, g) => s + g.level, 0) / team.length)
    : 1;
  const myScore = Math.min(9999, ghosts.length * 30 + avgLevel * 50);
  const rank    = getRank(myScore);

  return (
    <div className="screen fade-in">
      <ScreenHeader title="🏆 สนามรบ" back />

      <div className="screen-content">

        {/* Rank card */}
        <div className="card" style={{
          background: `linear-gradient(135deg, ${rank.color}22, var(--bg-card))`,
          border: `1.5px solid ${rank.color}50`,
          textAlign: 'center',
          padding: '20px 16px',
        }}>
          <div style={{ fontSize: 40 }}>{rank.icon}</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: rank.color, marginTop: 6 }}>
            {rank.tier}
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 32, fontWeight: 700, color: '#fff', marginTop: 4,
          }}>
            {myScore.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            คะแนนสัปดาห์นี้
          </div>
        </div>

        {/* Team preview */}
        {team.length > 0 ? (
          <div>
            <div className="section-hd">
              <span className="section-title">⚔️ ทีมที่ส่งออก</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {team.map(g => {
                const def = GHOST_REG[g.ghost_type];
                if (!def) return null;
                return (
                  <div key={g.id} className="card" style={{ flex: 1, textAlign: 'center', padding: '10px 6px' }}>
                    <Chibi emoji={def.emoji} element={def.element} size={44} evoStage={g.evo_stage} />
                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                      {g.nickname || def.nameTh}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Lv.{g.level}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>👻</div>
            <div>ต้องจัดทีมก่อน!</div>
          </div>
        )}

        {/* Challenge button */}
        <button
          className="btn btn-gold btn-full"
          disabled={team.length === 0}
          onClick={() => navigate('/battle', { state: { arenaMode: true } })}
          style={{ fontSize: 15, padding: '14px' }}
        >
          ⚔️ ท้าชิงอันดับ!
        </button>

        {/* Leaderboard */}
        <div>
          <div className="section-hd">
            <span className="section-title">🏅 อันดับสัปดาห์นี้</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Mock · sync coming soon</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {MOCK_BOARD.map((r, i) => {
              const rt = getRank(r.score);
              return (
                <div key={i} className="card" style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 20, width: 28, textAlign: 'center' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.desc}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 700, color: rt.color,
                    }}>
                      {r.score.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: rt.color }}>{rt.tier}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{
          fontSize: 11, color: 'var(--text-muted)', textAlign: 'center',
          padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          🔒 PvP ออนไลน์ &amp; Daily Boss — มาใน patch ถัดไป
        </div>

      </div>
    </div>
  );
}
