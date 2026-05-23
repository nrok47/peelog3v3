import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GHOST_REG } from '../data/ghosts';
import ScreenHeader from '../components/ScreenHeader';

const EVO_NAMES = ['ฐาน', 'เปลือยพลัง', 'เทพวิญญาณ'];
const EVO_REQ = [
  null,
  { level: 10, dust: 300,  desc: 'Lv.10 + ✨300' },
  { level: 20, dust: 800,  desc: 'Lv.20 + ✨800' },
];

export default function Evolution() {
  const { ghosts, team, updateGhost, player } = useGameStore();
  const [selectedId, setSelectedId] = useState(team[0]?.id ?? '');
  const [animating, setAnimating] = useState(false);
  const [msg, setMsg] = useState('');

  const ghost = ghosts.find(g => g.id === selectedId) ?? team[0];
  const def   = ghost ? GHOST_REG[ghost.ghost_type] : null;
  const dust  = player?.spirit_dust ?? 0;
  const stage = ghost?.evo_stage ?? 0;
  const nextReq = EVO_REQ[stage + 1];

  async function evolve() {
    if (!ghost || !nextReq) return;
    if (ghost.level < nextReq.level) { setMsg(`❌ ต้องการ Lv.${nextReq.level}`); return; }
    if (dust < nextReq.dust)         { setMsg(`❌ ต้องการ ✨${nextReq.dust}`);  return; }

    setAnimating(true);
    await new Promise(r => setTimeout(r, 1200));
    await updateGhost(ghost.id, { evo_stage: (stage + 1) as 0 | 1 | 2 });
    setAnimating(false);
    setMsg(`✨ ${def?.nameTh} วิวัฒนาการเป็น "${EVO_NAMES[stage + 1]}"!`);
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <div className="screen fade-in">
      <ScreenHeader title="🌟 วิวัฒนาการ" back />

      <div className="screen-content">
        {/* Ghost selector */}
        <div className="chip-row">
          {ghosts.map(g => {
            const d = GHOST_REG[g.ghost_type];
            return (
              <button
                key={g.id}
                className={`chip${selectedId === g.id ? ' active' : ''}`}
                onClick={() => { setSelectedId(g.id); setMsg(''); }}
              >
                {d?.emoji} {g.nickname || d?.nameTh}
              </button>
            );
          })}
        </div>

        {ghost && def ? (
          <>
            {/* Evolution stage display */}
            <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{
                fontSize: animating ? 64 : 56,
                marginBottom: 12,
                transition: 'font-size 0.3s',
                animation: animating ? 'float 0.5s ease-in-out infinite' : 'none',
                filter: animating ? `drop-shadow(0 0 20px ${stage >= 1 ? '#a55eea' : '#f5c518'})` : 'none',
              }}>
                {def.emoji}
              </div>

              {/* Stage indicators */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                {[0, 1, 2].map(s => (
                  <div
                    key={s}
                    style={{
                      width: s <= stage ? 36 : 28,
                      height: s <= stage ? 36 : 28,
                      borderRadius: '50%',
                      background: s < stage
                        ? 'linear-gradient(135deg, var(--gold), var(--orange))'
                        : s === stage
                          ? 'linear-gradient(135deg, var(--purple), var(--blue))'
                          : 'var(--bg-elevated)',
                      border: s === stage
                        ? '2px solid var(--gold)'
                        : '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      transition: 'all 0.3s',
                    }}
                  >
                    {s < stage ? '✓' : s === stage ? def.emoji.slice(0, 2) : '?'}
                  </div>
                ))}
              </div>

              <div style={{
                fontFamily: 'Bai Jamjuree, sans-serif',
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 4,
                color: stage >= 2 ? 'var(--pink)' : stage >= 1 ? 'var(--purple)' : 'var(--text-white)',
              }}>
                {ghost.nickname || def.nameTh}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                ขั้น {stage}: {EVO_NAMES[stage]}
              </div>
              {stage >= 2 && (
                <span className="badge badge-mythic" style={{ margin: '0 auto' }}>MYTHIC</span>
              )}
            </div>

            {msg && (
              <div style={{
                padding: '12px 14px',
                background: msg.startsWith('❌') ? 'rgba(255,71,87,0.1)' : 'rgba(165,94,234,0.1)',
                border: `1px solid ${msg.startsWith('❌') ? 'rgba(255,71,87,0.3)' : 'rgba(165,94,234,0.3)'}`,
                borderRadius: 'var(--r-md)',
                color: msg.startsWith('❌') ? 'var(--red)' : 'var(--purple)',
                fontWeight: 700,
                fontSize: 14,
                textAlign: 'center',
              }}>{msg}</div>
            )}

            {/* Evolve card */}
            {stage < 2 && nextReq ? (
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                  วิวัฒนาการ → {EVO_NAMES[stage + 1]}
                </div>
                <div className="text-muted" style={{ fontSize: 12, marginBottom: 12 }}>
                  ต้องการ: {nextReq.desc}
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    flex: 1, padding: '8px', background: 'var(--bg-elevated)',
                    borderRadius: 'var(--r-md)', textAlign: 'center',
                    border: `1px solid ${ghost.level >= nextReq.level ? 'rgba(38,222,129,0.3)' : 'rgba(255,71,87,0.3)'}`,
                  }}>
                    <div style={{ fontWeight: 700, color: ghost.level >= nextReq.level ? 'var(--green)' : 'var(--red)' }}>
                      Lv.{ghost.level}/{nextReq.level}
                    </div>
                    <div className="label-sm">ระดับ</div>
                  </div>
                  <div style={{
                    flex: 1, padding: '8px', background: 'var(--bg-elevated)',
                    borderRadius: 'var(--r-md)', textAlign: 'center',
                    border: `1px solid ${dust >= nextReq.dust ? 'rgba(245,197,24,0.3)' : 'rgba(255,71,87,0.3)'}`,
                  }}>
                    <div style={{ fontWeight: 700, color: dust >= nextReq.dust ? 'var(--gold)' : 'var(--red)' }}>
                      ✨ {dust}/{nextReq.dust}
                    </div>
                    <div className="label-sm">ฝุ่นวิญญาณ</div>
                  </div>
                </div>
                <button
                  className="btn btn-purple btn-full btn-lg"
                  onClick={evolve}
                  disabled={animating || ghost.level < nextReq.level || dust < nextReq.dust}
                >
                  {animating ? (
                    <span className="pulse">✨ กำลังวิวัฒนาการ...</span>
                  ) : '🌟 วิวัฒนาการ!'}
                </button>
              </div>
            ) : (
              <div className="card" style={{
                textAlign: 'center',
                border: '1.5px solid rgba(255,107,157,0.5)',
                background: 'linear-gradient(135deg, rgba(255,107,157,0.1), var(--bg-card))',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
                <div style={{ fontWeight: 700, color: 'var(--pink)', fontSize: 16 }}>
                  วิวัฒนาการสูงสุดแล้ว!
                </div>
                <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {def.nameTh} อยู่ในขั้น Mythic แล้ว
                </div>
              </div>
            )}

            {/* Stat boost preview */}
            <div className="card">
              <div className="label-sm" style={{ marginBottom: 8 }}>โบนัสวิวัฒนาการ</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {stage < 2 ? [
                  `HP Max +${(stage + 1) * 200}`,
                  `ATK/MAG +${(stage + 1) * 8}%`,
                  `SPD +${(stage + 1) * 5}`,
                ].map((txt, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--gold)' }}>◆</span>{txt}
                  </div>
                )) : (
                  <div className="text-muted" style={{ fontSize: 12 }}>โบนัสทั้งหมดได้รับครบแล้ว</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: 40 }}>😶</div>
            <div className="text-muted" style={{ marginTop: 8 }}>เลือกวิญญาณก่อน</div>
          </div>
        )}
      </div>
    </div>
  );
}
