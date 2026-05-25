import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GHOST_REG, ELEMENT_LABELS, CLASS_LABELS } from '../data/ghosts';
import Chibi from '../components/Chibi';
import ScreenHeader from '../components/ScreenHeader';

type Tab = 'core' | 'frame' | 'mass' | 'skills';

export default function SpiritDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ghosts, team, updateGhost, player, setTeam } = useGameStore();

  const [tab, setTab] = useState<Tab>('core');
  const [msg, setMsg] = useState('');

  const ghost = ghosts.find(g => g.id === id);
  if (!ghost) return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="text-muted">ไม่พบวิญญาณ</div>
    </div>
  );

  const def = GHOST_REG[ghost.ghost_type];
  if (!def) return null;

  const stats = ghost.stats ?? def.baseStats;
  const frame = ghost.frame ?? { enhancement: 0, base_def: def.baseStats.def, base_spr: def.baseStats.spr, sockets: [] };

  const teamIds = team.map(g => g.id);
  const inTeam = teamIds.includes(ghost.id);

  function handleToggleTeam() {
    if (inTeam) {
      // ถอดออก
      const newSlots = team
        .filter(g => g.id !== ghost!.id)
        .map((g, i) => ({ ghostId: g.id, slot: i }));
      setTeam(newSlots);
      setMsg('ถอดออกจากทีมแล้ว');
    } else {
      if (team.length >= 3) {
        setMsg('ทีมเต็มแล้ว (3/3) — ถอดผีออกก่อน');
        setTimeout(() => setMsg(''), 2500);
        return;
      }
      const newSlots = [...team, ghost!].map((g, i) => ({ ghostId: g.id, slot: i }));
      setTeam(newSlots);
      setMsg(`✅ เพิ่ม ${ghost!.nickname || def.nameTh} เข้าทีมแล้ว`);
    }
    setTimeout(() => setMsg(''), 2500);
  }

  async function handleEnhanceFrame() {
    if (!ghost) return;
    const cost = (frame.enhancement + 1) * 150;
    if ((player?.spirit_dust ?? 0) < cost) {
      setMsg(`ต้องการฝุ่นวิญญาณ ${cost} ✨`);
      return;
    }
    const newFrame = {
      ...frame,
      enhancement: frame.enhancement + 1,
      base_def: frame.base_def + 3,
      base_spr: frame.base_spr + 3,
    };
    await updateGhost(ghost.id, { frame: newFrame });
    setMsg(`✅ Frame +${newFrame.enhancement} สำเร็จ!`);
    setTimeout(() => setMsg(''), 2500);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'core',   label: '⚡ Core' },
    { key: 'frame',  label: '🛡️ Frame' },
    { key: 'mass',   label: '🔮 Mass' },
    { key: 'skills', label: '💥 Skills' },
  ];

  return (
    <div className="screen fade-in">
      <ScreenHeader title={ghost.nickname || def.nameTh} back />

      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(180deg, #0d1a2e 0%, var(--bg-base) 100%)',
        padding: '20px 16px 16px',
        display: 'flex',
        gap: 16,
        alignItems: 'center',
      }}>
        <Chibi emoji={def.emoji} element={def.element} size={72} evoStage={ghost.evo_stage} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <span className={`badge badge-${def.element}`}>{ELEMENT_LABELS[def.element]}</span>
            <span className={`badge badge-${def.classType}`}>{CLASS_LABELS[def.classType]}</span>
            {ghost.evo_stage > 0 && (
              <span className="badge badge-epic">Evo {ghost.evo_stage}</span>
            )}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Bai Jamjuree, sans-serif', marginBottom: 4 }}>
            {ghost.nickname || def.nameTh}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{def.name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--gold)' }}>
            {ghost.level}
          </div>
          <div className="label-sm">Level</div>
        </div>
      </div>

      {/* Team toggle button */}
      <div style={{ padding: '0 16px 12px' }}>
        <button
          type="button"
          onClick={handleToggleTeam}
          style={{
            width: '100%',
            padding: '10px',
            border: inTeam ? '1.5px solid rgba(245,197,24,0.5)' : '1.5px solid rgba(255,255,255,0.15)',
            borderRadius: 10,
            background: inTeam
              ? 'linear-gradient(135deg, rgba(245,197,24,0.15), rgba(245,197,24,0.05))'
              : 'rgba(255,255,255,0.05)',
            color: inTeam ? 'var(--gold)' : 'var(--text-light)',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {inTeam ? '⚔️ อยู่ในทีมแล้ว — กดเพื่อถอดออก' : `➕ เพิ่มเข้าทีม (${team.length}/3)`}
        </button>
      </div>

      {/* XP bar */}
      <div style={{ padding: '0 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span className="label-sm">EXP {ghost.exp}</span>
          <span className="label-sm">Bond ❤️ {ghost.bond}</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill bar-xp" style={{ width: `${(ghost.exp % 1000) / 10}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-base)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 16px',
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              color: tab === t.key ? 'var(--gold)' : 'var(--text-muted)',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              borderBottom: `2px solid ${tab === t.key ? 'var(--gold)' : 'transparent'}`,
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="screen-content" style={{ paddingBottom: 24 }}>
        {msg && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(38,222,129,0.1)',
            border: '1px solid rgba(38,222,129,0.3)',
            borderRadius: 'var(--r-md)',
            color: 'var(--green)',
            fontSize: 13,
            fontWeight: 700,
          }}>
            {msg}
          </div>
        )}

        {/* CORE TAB */}
        {tab === 'core' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card">
              <div className="label-sm" style={{ marginBottom: 10 }}>สถิติพื้นฐาน</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                {[
                  { lbl: 'HP',  val: stats.hp,  color: 'var(--green)' },
                  { lbl: 'STR', val: stats.str, color: 'var(--red)' },
                  { lbl: 'MAG', val: stats.mag, color: 'var(--purple)' },
                  { lbl: 'DEF', val: stats.def, color: 'var(--blue)' },
                  { lbl: 'SPR', val: stats.spr, color: 'var(--cyan)' },
                  { lbl: 'SPD', val: stats.spd, color: 'var(--gold)' },
                ].map(s => (
                  <div key={s.lbl} className="stat-chip">
                    <span className="val" style={{ color: s.color }}>{s.val}</span>
                    <span className="lbl">{s.lbl}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="label-sm" style={{ marginBottom: 10 }}>Corruption & Bond</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--pink)' }}>❤️ Bond</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{ghost.bond}/100</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill bar-bond" style={{ width: `${ghost.bond}%` }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--purple)' }}>☠️ Corruption</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{ghost.corruption}/100</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill bar-corruption" style={{ width: `${ghost.corruption}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="label-sm" style={{ marginBottom: 6 }}>Lore</div>
              <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.7 }}>{def.lore}</p>
            </div>
          </div>
        )}

        {/* FRAME TAB */}
        {tab === 'frame' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🛡️</div>
              <div style={{
                fontSize: 32,
                fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace',
                color: frame.enhancement >= 10 ? 'var(--gold)' : 'var(--text-white)',
              }}>
                +{frame.enhancement}
              </div>
              <div className="label-sm" style={{ marginBottom: 12 }}>Frame Enhancement</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <div className="stat-chip" style={{ minWidth: 80 }}>
                  <span className="val" style={{ color: 'var(--blue)' }}>{frame.base_def}</span>
                  <span className="lbl">DEF</span>
                </div>
                <div className="stat-chip" style={{ minWidth: 80 }}>
                  <span className="val" style={{ color: 'var(--cyan)' }}>{frame.base_spr}</span>
                  <span className="lbl">SPR</span>
                </div>
              </div>
            </div>

            {frame.enhancement < 15 && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>อัปเกรด Frame</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>+3 DEF, +3 SPR</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--gold)', fontWeight: 700 }}>
                      ✨ {(frame.enhancement + 1) * 150}
                    </div>
                    <div className="label-sm">ค่าใช้จ่าย</div>
                  </div>
                </div>
                <button className="btn btn-gold btn-full" onClick={handleEnhanceFrame}>
                  ⚒️ อัปเกรด
                </button>
              </div>
            )}

            {frame.enhancement >= 15 && (
              <div className="card" style={{ textAlign: 'center', border: '1.5px solid rgba(245,197,24,0.4)' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>✨</div>
                <div style={{ fontWeight: 700, color: 'var(--gold)' }}>Frame เต็มระดับแล้ว!</div>
              </div>
            )}
          </div>
        )}

        {/* MASS TAB */}
        {tab === 'mass' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card">
              <div className="label-sm" style={{ marginBottom: 10 }}>Spirit Mass Affixes</div>
              {(ghost.spirit_mass?.affixes ?? []).length === 0 ? (
                <div className="text-muted" style={{ textAlign: 'center', padding: '20px 0', fontSize: 13 }}>
                  ยังไม่มี Affix — ใช้ฟังก์ชัน Reroll ใน Forge
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ghost.spirit_mass.affixes.map((a, i) => (
                    <div key={i} style={{
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--r-md)',
                      fontSize: 13,
                      color: 'var(--text-light)',
                    }}>
                      {a}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="btn btn-purple btn-full" onClick={() => navigate('/forge', { state: { ghostId: ghost.id } })}>
              🔮 ไปที่ Forge เพื่อ Reroll
            </button>
          </div>
        )}

        {/* SKILLS TAB */}
        {tab === 'skills' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {def.skills.map(skill => (
              <div key={skill.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{skill.name}</div>
                    <div className="label-sm" style={{ marginTop: 2 }}>{skill.type.toUpperCase()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {skill.gutsCost > 0 && (
                      <span style={{
                        padding: '3px 8px',
                        background: 'rgba(165,94,234,0.2)',
                        borderRadius: 'var(--r-full)',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--purple)',
                      }}>GUTS {skill.gutsCost}</span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{skill.desc}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--red)' }}>⚔️ Power: <b style={{ color: '#fff' }}>{skill.power}</b></div>
                  {skill.cooldown > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--blue)' }}>⏱️ CD: <b style={{ color: '#fff' }}>{skill.cooldown}s</b></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
