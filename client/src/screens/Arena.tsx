import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { LeaderboardService, GuildService } from '../db/supabase';
import { CURRENT_SEASON, getSeasonDaysLeft } from '../lib/season';
import type { Guild } from '../types';
import { GHOST_REG } from '../data/ghosts';
import Chibi from '../components/Chibi';
import ScreenHeader from '../components/ScreenHeader';
import BottomNav from '../components/BottomNav';

const ENDING_LABEL: Record<string, string> = {
  good: '🌟', neutral: '⚖️', bad: '💀', true: '🔮',
};

function getRank(score: number) {
  if (score >= 1000) return { tier: 'แชมเปี้ยน', color: '#f5c518', icon: '👑' };
  if (score >= 600)  return { tier: 'โกลด์',     color: '#fd9644', icon: '🥇' };
  if (score >= 300)  return { tier: 'ซิลเวอร์',  color: '#aaa',    icon: '🥈' };
  return               { tier: 'บรอนซ์',          color: '#cd7f32', icon: '🥉' };
}

export default function Arena() {
  const navigate = useNavigate();
  const { ghosts, team, player, myGuild, saveDefenseTeam } = useGameStore();

  const [board, setBoard]               = useState<{ username: string; score: number; ending: string }[]>([]);
  const [myBestScore, setMyBestScore]   = useState<number | null>(null);
  const [myHasDefenseTeam, setMyHasDefenseTeam] = useState(false);
  const [boardLoading, setBoardLoading] = useState(true);
  const [savingDefense, setSavingDefense] = useState(false);
  const [defMsg, setDefMsg] = useState('');

  const [boardMode, setBoardMode] = useState<'player' | 'guild'>('player');
  const [guildBoard, setGuildBoard] = useState<{ guild: Guild; totalScore: number; memberCount: number }[]>([]);
  const [guildBoardLoading, setGuildBoardLoading] = useState(false);

  useEffect(() => {
    setBoardLoading(true);
    const fetchBoard = LeaderboardService.getTop(10).then(data =>
      data.map(r => ({ username: r.username as string, score: r.score as number, ending: (r.ending ?? 'neutral') as string }))
    );
    const fetchMine = player
      ? LeaderboardService.getPlayerEntry(player.id)
      : Promise.resolve({ score: null, hasDefenseTeam: false });
    Promise.all([fetchBoard, fetchMine]).then(([topData, myEntry]) => {
      setBoard(topData);
      setMyBestScore(myEntry.score);
      setMyHasDefenseTeam(myEntry.hasDefenseTeam);
      setBoardLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (boardMode !== 'guild') return;
    setGuildBoardLoading(true);
    GuildService.getGuildLeaderboard().then(data => {
      setGuildBoard(data.slice(0, 10));
      setGuildBoardLoading(false);
    });
  }, [boardMode]);

  const avgLevel = team.length > 0
    ? Math.round(team.reduce((s, g) => s + g.level, 0) / team.length)
    : 1;
  const localScore = Math.min(9999, ghosts.length * 30 + avgLevel * 50);
  const displayScore = myBestScore ?? localScore;
  const rank = getRank(displayScore);

  return (
    <div className="screen fade-in">
      <ScreenHeader title="🏆 สนามรบ" back="/home" />

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
            {displayScore.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {myBestScore !== null ? 'คะแนนสูงสุดของคุณ' : 'คะแนนประเมิน (ยังไม่เคยลงสนาม)'}
          </div>
          <div style={{ marginTop: 10, fontSize: 11 }}>
            {myHasDefenseTeam
              ? <span style={{ color: '#4ade80', fontWeight: 700 }}>🛡️ ทีมตั้งรับ: บันทึกแล้ว — ผู้เล่นอื่นสามารถท้าชิงได้</span>
              : <span style={{ color: 'var(--text-muted)' }}>🛡️ ยังไม่มีทีมตั้งรับ — ไปบันทึกที่คลังผีก่อน</span>
            }
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

        {/* Save defense team */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>🛡️ ทีมตั้งรับ</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {myHasDefenseTeam
                ? 'บันทึกแล้ว — ผู้เล่นอื่นสามารถท้าชิงได้'
                : team.length > 0 ? 'บันทึกทีมปัจจุบันเป็นทีมตั้งรับ' : 'ต้องมีทีมก่อน'}
            </div>
            {defMsg && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 3, fontWeight: 700 }}>{defMsg}</div>}
          </div>
          <button
            type="button"
            className={`btn ${myHasDefenseTeam ? 'btn-outline' : 'btn-purple'} btn-sm`}
            disabled={team.length === 0 || savingDefense}
            onClick={async () => {
              setSavingDefense(true);
              await saveDefenseTeam();
              setMyHasDefenseTeam(true);
              setDefMsg('✅ บันทึกแล้ว!');
              setSavingDefense(false);
              setTimeout(() => setDefMsg(''), 2500);
            }}
          >
            {savingDefense ? '...' : myHasDefenseTeam ? 'อัปเดต' : 'บันทึก'}
          </button>
        </div>

        {/* Guild quick-link */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          onClick={() => navigate('/guild')} role="button">
          <div style={{ fontSize: 22 }}>🛡️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              {myGuild ? `[${myGuild.tag}] ${myGuild.name}` : 'ยังไม่มีกิลด์'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {myGuild ? 'ดูสมาชิก / ออกจากกิลด์' : 'สร้างหรือเข้าร่วมกิลด์'}
            </div>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>›</span>
        </div>

        {/* Challenge button */}
        <button
          type="button"
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
            <span className="section-title">🏅 อันดับ</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Season {CURRENT_SEASON} · เหลือ {getSeasonDaysLeft()} วัน
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <button type="button"
              className={`btn btn-sm ${boardMode === 'player' ? 'btn-gold' : 'btn-outline'}`}
              onClick={() => setBoardMode('player')}>👤 ผู้เล่น</button>
            <button type="button"
              className={`btn btn-sm ${boardMode === 'guild' ? 'btn-gold' : 'btn-outline'}`}
              onClick={() => setBoardMode('guild')}>🛡️ กิลด์</button>
          </div>

          {boardMode === 'player' ? (
            boardLoading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0', fontSize: 13 }}>
                กำลังโหลด...
              </div>
            ) : board.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0', fontSize: 13 }}>
                ยังไม่มีข้อมูล — เป็นคนแรกที่ลงสนาม!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {board.map((r, i) => {
                  const rt = getRank(r.score);
                  const isMe = r.username === player?.username;
                  return (
                    <div key={i} className="card" style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      border: isMe ? `1.5px solid ${rt.color}60` : undefined,
                      background: isMe ? `${rt.color}10` : undefined,
                    }}>
                      <div style={{ fontSize: 18, width: 28, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', fontWeight: 700 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {r.username}
                          {isMe && <span style={{ fontSize: 10, background: 'var(--gold)', color: '#000', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>YOU</span>}
                        </div>
                        <div style={{ fontSize: 10, color: rt.color, marginTop: 1 }}>
                          {rt.icon} {rt.tier} {ENDING_LABEL[r.ending] ?? ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: 700, color: rt.color, fontSize: 15,
                        }}>
                          {r.score.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            guildBoardLoading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0', fontSize: 13 }}>
                กำลังโหลด...
              </div>
            ) : guildBoard.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0', fontSize: 13 }}>
                ยังไม่มีกิลด์ — เป็นคนแรกที่สร้างเลย!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {guildBoard.map((r, i) => {
                  const isMine = myGuild?.id === r.guild.id;
                  return (
                    <div key={r.guild.id} className="card" style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      border: isMine ? '1.5px solid #f5c51860' : undefined,
                      background: isMine ? '#f5c51810' : undefined,
                    }}>
                      <div style={{ fontSize: 18, width: 28, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', fontWeight: 700 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>
                          [{r.guild.tag}] {r.guild.name}
                          {isMine && <span style={{ fontSize: 10, background: 'var(--gold)', color: '#000', padding: '1px 5px', borderRadius: 4, fontWeight: 700, marginLeft: 6 }}>YOU</span>}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                          {r.memberCount} สมาชิก
                        </div>
                      </div>
                      <div style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700, color: 'var(--gold)', fontSize: 15,
                      }}>
                        {r.totalScore.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        <div style={{
          fontSize: 11, color: 'var(--text-muted)', textAlign: 'center',
          padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          🔒 PvP ออนไลน์ &amp; Daily Boss — มาใน patch ถัดไป
        </div>

      </div>

      <BottomNav />
    </div>
  );
}
