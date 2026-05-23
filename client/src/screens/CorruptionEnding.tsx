import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import ScreenHeader from '../components/ScreenHeader';
import type { EndingType } from '../types';

interface Ending {
  id: EndingType;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  corruptionReq: number;
  desc: string;
  unlock: string;
}

const ENDINGS: Ending[] = [
  {
    id: 'good',
    title: 'ตอนจบแสงสว่าง',
    subtitle: 'The Purifier',
    icon: '☀️',
    color: 'var(--gold)',
    corruptionReq: 0,
    desc: 'คุณต้านทานความมืดได้สำเร็จ วิญญาณทุกตัวได้รับการปลดปล่อย เมืองกลับคืนสู่ความสงบ',
    unlock: 'Corruption < 30%',
  },
  {
    id: 'neutral',
    title: 'ตอนจบแห่งสมดุล',
    subtitle: 'The Watcher',
    icon: '⚖️',
    color: 'var(--blue)',
    corruptionReq: 30,
    desc: 'คุณเลือกทางสายกลาง — ไม่ดีทั้งหมด ไม่มืดทั้งหมด วิญญาณบางส่วนได้รับการปลดปล่อย บางส่วนยังคงอยู่',
    unlock: 'Corruption 30–59%',
  },
  {
    id: 'bad',
    title: 'ตอนจบแห่งความมืด',
    subtitle: 'The Fallen',
    icon: '🌑',
    color: 'var(--purple)',
    corruptionReq: 60,
    desc: 'ความมืดครอบงำคุณ คุณกลายเป็นส่วนหนึ่งของโลกผี นำพาวิญญาณสู่ความสับสนวุ่นวายนิรันดร์',
    unlock: 'Corruption 60–79%',
  },
  {
    id: 'true',
    title: 'ตอนจบที่แท้จริง',
    subtitle: 'The Devourer',
    icon: '💀',
    color: 'var(--red)',
    corruptionReq: 80,
    desc: 'คุณกลายเป็น Spirit Master ที่แท้จริง — ผู้ที่กินทั้งแสงและมืด ไม่มีใครหยุดคุณได้อีกต่อไป',
    unlock: 'Corruption ≥ 80%',
  },
];

export default function CorruptionEnding() {
  const { save, player } = useGameStore();
  const [selected, setSelected] = useState<EndingType | null>(null);

  const corruption = save?.corruption_score ?? 0;
  const currentEnding = ENDINGS.reduce((best, e) =>
    corruption >= e.corruptionReq ? e : best, ENDINGS[0]);


  return (
    <div className="screen fade-in">
      <ScreenHeader title="💀 ชะตากรรม" back="/home" />

      <div className="screen-content">
        {/* Corruption meter */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(165,94,234,0.1), rgba(255,71,87,0.08))',
          border: '1px solid rgba(165,94,234,0.3)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>
              CORRUPTION SCORE
            </div>
            <div style={{
              fontSize: 48,
              fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              color: corruption >= 80 ? 'var(--red)' : corruption >= 60 ? 'var(--purple)' : corruption >= 30 ? 'var(--blue)' : 'var(--gold)',
            }}>
              {corruption}%
            </div>
          </div>
          <div className="bar-track thick">
            <div className="bar-fill bar-corruption" style={{ width: `${corruption}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span className="label-sm" style={{ color: 'var(--gold)' }}>แสงสว่าง</span>
            <span className="label-sm" style={{ color: 'var(--red)' }}>ความมืด</span>
          </div>
        </div>

        {/* Current ending highlight */}
        <div className="card" style={{
          border: `1.5px solid ${currentEnding.color}50`,
          background: `linear-gradient(135deg, ${currentEnding.color}12, var(--bg-card))`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 36 }}>{currentEnding.icon}</div>
            <div>
              <div className="label-sm" style={{ marginBottom: 2 }}>ตอนจบปัจจุบัน</div>
              <div style={{ fontFamily: 'Bai Jamjuree, sans-serif', fontSize: 16, fontWeight: 700, color: currentEnding.color }}>
                {currentEnding.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentEnding.subtitle}</div>
            </div>
          </div>
        </div>

        {/* All endings */}
        <div className="section-hd">
          <span className="section-title">ตอนจบทั้งหมด</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ENDINGS.map(ending => {
            const unlocked = corruption >= ending.corruptionReq;
            const isActive = ending.id === currentEnding.id;

            return (
              <div
                key={ending.id}
                onClick={() => setSelected(selected === ending.id ? null : ending.id)}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${ending.color}18, var(--bg-card))`
                    : 'var(--bg-card)',
                  border: isActive
                    ? `1.5px solid ${ending.color}50`
                    : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 'var(--r-lg)',
                  padding: '14px',
                  cursor: 'pointer',
                  opacity: unlocked ? 1 : 0.5,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44,
                    borderRadius: 'var(--r-md)',
                    background: unlocked ? `${ending.color}20` : 'var(--bg-elevated)',
                    border: `1.5px solid ${unlocked ? ending.color + '40' : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {unlocked ? ending.icon : '🔒'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: unlocked ? ending.color : 'var(--text-muted)' }}>
                      {ending.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      {ending.unlock}
                    </div>
                  </div>
                  {isActive && (
                    <span style={{
                      padding: '4px 10px',
                      background: `${ending.color}25`,
                      borderRadius: 'var(--r-full)',
                      fontSize: 10,
                      fontWeight: 700,
                      color: ending.color,
                    }}>
                      ปัจจุบัน
                    </span>
                  )}
                </div>

                {selected === ending.id && (
                  <div style={{
                    marginTop: 12,
                    padding: '10px 12px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--r-md)',
                    fontSize: 13,
                    color: 'var(--text-light)',
                    lineHeight: 1.7,
                    borderLeft: `3px solid ${ending.color}`,
                  }}>
                    {unlocked ? ending.desc : `🔒 ต้องการ: ${ending.unlock}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit score button */}
        {corruption >= 30 && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>ส่ง Score</div>
            <div className="text-muted" style={{ fontSize: 12, marginBottom: 12 }}>
              ส่ง Leaderboard ด้วยตอนจบ "{currentEnding.title}"
            </div>
            <button className="btn btn-gold btn-full">
              🏆 ส่งคะแนน ({player?.username ?? '—'})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
