import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GHOST_REG } from '../data/ghosts';
import Chibi from '../components/Chibi';
import BottomNav from '../components/BottomNav';

const MENU = [
  { path: '/battle',    icon: '⚔️', label: 'ต่อสู้',      color: '#ff4757', desc: '3v3 ATB Battle' },
  { path: '/roster',    icon: '👻', label: 'วิญญาณ',      color: '#4d9fff', desc: 'จัดการทีม' },
  { path: '/map',       icon: '🗺️', label: 'แผนที่',      color: '#26de81', desc: 'สำรวจดินแดน' },
  { path: '/forge',     icon: '🔨', label: 'ตีเหล็ก',     color: '#fd9644', desc: 'อัปเกรดกาย' },
  { path: '/adventure', icon: '📜', label: 'ผจญภัย',      color: '#a55eea', desc: 'เหตุการณ์' },
  { path: '/codex',     icon: '📚', label: 'ตำราธาตุ',    color: '#45e8d8', desc: 'จุดอ่อน-แข็ง' },
  { path: '/skill-tree',icon: '🌳', label: 'ต้นไม้สกิล', color: '#7ed56f', desc: 'แจกแต้ม' },
  { path: '/amulet',    icon: '📿', label: 'เครื่องราง',  color: '#f5c518', desc: 'ใส่ไอเทม' },
];

export default function Home() {
  const navigate = useNavigate();
  const { player, team, save, signOut, passiveDustEarned, passiveRate } = useGameStore();
  const [showDustNotif, setShowDustNotif] = useState(false);

  useEffect(() => {
    if (passiveDustEarned > 0) {
      setShowDustNotif(true);
      const t = setTimeout(() => setShowDustNotif(false), 4000);
      return () => clearTimeout(t);
    }
  }, [passiveDustEarned]);

  const corruption = save?.corruption_score ?? 0;
  const chapter    = save?.chapter ?? 1;

  return (
    <div className="screen fade-in">
      {/* Passive dust notification */}
      {showDustNotif && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          animation: 'popIn 0.3s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🌀</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>
                ได้รับฝุ่นวิญญาณ offline!
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                +{passiveDustEarned} ฝุ่นวิญญาณ ({passiveRate}/ชม.)
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDustNotif(false)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer' }}
          >✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, #0d1a2e 0%, var(--bg-base) 100%)',
        padding: '16px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>
              {player?.title ?? 'นักเดินทาง'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Bai Jamjuree, sans-serif' }}>
              {player?.username ?? '—'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div className="label-sm">ฝุ่นวิญญาณ</div>
              <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 16, fontFamily: 'JetBrains Mono, monospace' }}>
                ✨ {player?.spirit_dust ?? 0}
              </div>
            </div>
            <button
              onClick={signOut}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--r-md)',
                color: 'var(--text-muted)',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'inherit',
              }}
            >
              ออก
            </button>
          </div>
        </div>

        {/* Save progress bar */}
        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="label-sm">บทที่ {chapter}</span>
              <span className="label-sm" style={{ color: corruption > 60 ? 'var(--red)' : 'var(--text-muted)' }}>
                ☠️ {corruption}%
              </span>
            </div>
            <div className="bar-track">
              <div
                className={`bar-fill ${corruption > 60 ? 'bar-corruption' : 'bar-xp'}`}
                style={{ width: `${(chapter / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="screen-content">
        {/* Team preview */}
        {team.length > 0 && (
          <div>
            <div className="section-hd">
              <span className="section-title">⚔️ ทีมปัจจุบัน</span>
              <button
                onClick={() => navigate('/roster')}
                className="btn btn-outline btn-sm"
              >
                จัดทีม
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {team.map(g => {
                const def = GHOST_REG[g.ghost_type];
                if (!def) return null;
                return (
                  <div
                    key={g.id}
                    onClick={() => navigate(`/spirit/${g.id}`)}
                    style={{
                      flex: 1,
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--r-lg)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '10px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <Chibi emoji={def.emoji} element={def.element} size={48} evoStage={g.evo_stage} />
                    <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
                      {g.nickname || def.nameTh}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Lv.{g.level}</div>
                    <div className="bar-track thin" style={{ width: '100%' }}>
                      <div className="bar-fill bar-hp" style={{ width: `${Math.min(100, ((g.stats?.hp ?? def.baseStats.hp) / def.baseStats.hp) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {team.length === 0 && (
          <div
            className="card"
            onClick={() => navigate('/roster')}
            style={{ textAlign: 'center', cursor: 'pointer', padding: '24px 16px', border: '1.5px dashed rgba(245,197,24,0.3)' }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>➕</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>เพิ่มผีในทีม</div>
            <div className="text-muted" style={{ fontSize: 12 }}>ไปที่หน้าวิญญาณเพื่อเลือกทีม</div>
          </div>
        )}

        {/* Passive Dust Stats */}
        {(() => {
          const bondBonus  = passiveRate - 30;
          const avgBond    = team.length > 0
            ? Math.floor(team.reduce((s, g) => s + g.bond, 0) / team.length)
            : 0;
          const maxOffline = passiveRate * 8;
          const dust       = player?.spirit_dust ?? 0;
          const toBasic    = Math.max(0, 50  - dust);
          const toPremium  = Math.max(0, 150 - dust);
          return (
            <div className="card" style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(168,85,247,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>🌀 Passive Income</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 18, color: 'var(--gold)' }}>
                  {passiveRate}<span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>/ชม.</span>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>⚡ Base rate</span>
                  <span style={{ color: 'var(--text-light)' }}>30/ชม.</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>💞 Bond bonus (avg {avgBond})</span>
                  <span style={{ color: bondBonus > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                    {bondBonus > 0 ? `+${bondBonus}` : '0'}/ชม.
                  </span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '2px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>⏰ Max offline (8ชม.)</span>
                  <span style={{ color: 'var(--text-light)' }}>🌀 {maxOffline}</span>
                </div>
                {(toBasic > 0 || toPremium > 0) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>🎯 ถึง summon ถัดไป</span>
                    <span style={{ color: 'var(--gold)' }}>
                      {toBasic > 0
                        ? `${Math.ceil(toBasic / passiveRate * 60)} นาที (พื้นฐาน)`
                        : `${Math.ceil(toPremium / passiveRate * 60)} นาที (พิเศษ)`}
                    </span>
                  </div>
                )}
                {team.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                    💡 เพิ่มผีในทีมและเพิ่ม Bond เพื่อเพิ่ม rate
                  </div>
                )}
                {team.length > 0 && bondBonus === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                    💡 Bond ทีม {avgBond}/100 — ต่อสู้และผจญภัยเพื่อเพิ่ม rate
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Menu Grid */}
        <div>
          <div className="section-hd">
            <span className="section-title">🎮 เมนูหลัก</span>
          </div>
          <div className="grid-2">
            {MENU.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  background: `linear-gradient(135deg, ${item.color}18 0%, ${item.color}08 100%)`,
                  border: `1px solid ${item.color}30`,
                  borderRadius: 'var(--r-lg)',
                  padding: '14px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 4,
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <span style={{
                  fontFamily: 'Bai Jamjuree, sans-serif',
                  fontWeight: 700,
                  fontSize: 15,
                  color: '#fff',
                }}>{item.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Corruption warning */}
        {corruption >= 70 && (
          <div
            className="card"
            onClick={() => navigate('/ending')}
            style={{
              border: '1.5px solid rgba(255,71,87,0.5)',
              background: 'rgba(255,71,87,0.08)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 2 }}>
                  ความมืดครอบงำ {corruption}%
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  ถึงเวลาเลือกชะตากรรม — แตะเพื่อดูตอนจบ
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
