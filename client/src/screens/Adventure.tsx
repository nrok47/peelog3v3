import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import ScreenHeader from '../components/ScreenHeader';
import BottomNav from '../components/BottomNav';

interface EventChoice {
  id: string;
  text: string;
  outcome: string;
  corruptionDelta: number;
  dustReward?: number;
  bondGain?: number;
}

interface EventNode {
  id: string;
  title: string;
  text: string;
  icon: string;
  choices: EventChoice[];
}

const EVENTS: EventNode[] = [
  {
    id: 'ev01',
    icon: '⛩️',
    title: 'ศาลเจ้าลึกลับ',
    text: 'คุณพบศาลเจ้าเก่าแก่กลางป่า ข้างในมีเทียนจุดอยู่ แต่ไม่มีใครอยู่ เสียงพระธรรมดังแว่วมาจากข้างใน...',
    choices: [
      { id: 'pray',  text: '🙏 ไหว้บูชา',       outcome: 'พลังศักดิ์สิทธิ์ปกป้องคณะ วิญญาณทุกตัวรู้สึกสงบ',   corruptionDelta: -5, bondGain: 5 },
      { id: 'take',  text: '💎 เอาของในศาล',     outcome: 'ได้ฝุ่นวิญญาณ แต่ถูกสาปทำให้มืดลง',                corruptionDelta: 10, dustReward: 50 },
      { id: 'leave', text: '🚶 เดินต่อไป',        outcome: 'เดินผ่านมาโดยไม่มีอะไรเกิดขึ้น',                    corruptionDelta: 0 },
    ],
  },
  {
    id: 'ev02',
    icon: '👧',
    title: 'เด็กหญิงหลงทาง',
    text: 'คุณเจอเด็กหญิงนั่งร้องไห้กลางทาง เธอบอกว่าหลงมาจากหมู่บ้าน แต่ดวงตาของเธอดูแปลกพิกล สีดำสนิทโดยไม่มีขาว...',
    choices: [
      { id: 'help',  text: '🤝 ช่วยพาส่ง',         outcome: 'เด็กหายตัวพร้อมรอยยิ้ม ทิ้งฝุ่นวิญญาณไว้ให้',      corruptionDelta: -10, dustReward: 30 },
      { id: 'run',   text: '🏃 วิ่งหนี',             outcome: 'รอดปลอดภัย แต่เสียงหัวเราะดังตามหลัง',              corruptionDelta: 0 },
      { id: 'bind',  text: '⛓️ จับกักขังไว้ศึกษา', outcome: 'ได้ข้อมูลลึกลับและฝุ่นวิญญาณ แต่ความมืดซึมเข้ามา', corruptionDelta: 15, dustReward: 80 },
    ],
  },
  {
    id: 'ev03',
    icon: '🌳',
    title: 'ต้นไม้โบราณ',
    text: 'ต้นไม้ขนาดมหึมาที่มีอายุนับร้อยปี บนกิ่งมีผ้าสีแดงผูกอยู่เต็มไปหมด เสียงกระซิบดังมาจากเปลือกไม้...',
    choices: [
      { id: 'listen',  text: '👂 ฟังเสียงกระซิบ', outcome: 'เรียนรู้ความลับเก่าแก่ ได้ฝุ่นวิญญาณและ corruption เล็กน้อย', corruptionDelta: 5,  dustReward: 40 },
      { id: 'cut',     text: '🪓 ตัดกิ่ง',         outcome: 'ได้ฝุ่นหายาก แต่ถูกสาปหนัก',                               corruptionDelta: 20, dustReward: 100 },
      { id: 'respect', text: '💐 วางดอกไม้บูชา',   outcome: 'ต้นไม้ให้พรแก่วิญญาณ Bond ทุกตัวเพิ่มขึ้น',               corruptionDelta: -5, bondGain: 3 },
    ],
  },
  {
    id: 'ev04',
    icon: '🕯️',
    title: 'ห้องเรียนร้าง',
    text: 'โรงเรียนเก่าที่ถูกทิ้งร้าง บนกระดานดำมีตัวเลขเขียนอยู่ — 13, 6, 9... และภาพวาดเด็กที่ดูเหมือนจะเคลื่อนไหวได้...',
    choices: [
      { id: 'copy',  text: '📝 คัดลอกสูตร',       outcome: 'ได้รับความรู้ลึกลับพร้อมฝุ่นวิญญาณ',          corruptionDelta: 5,   dustReward: 35 },
      { id: 'erase', text: '🧹 ลบกระดาน',          outcome: 'วิญญาณที่ผูกพันถูกปลดปล่อย Bond ทุกตัวเพิ่ม', corruptionDelta: -8,  bondGain: 4 },
      { id: 'burn',  text: '🔥 เผาโรงเรียน',       outcome: 'ไฟดับวิญญาณชั่วคราว ได้ฝุ่นมาก แต่มืดหนัก',   corruptionDelta: 25,  dustReward: 120 },
    ],
  },
  {
    id: 'ev05',
    icon: '🌊',
    title: 'บึงน้ำดำ',
    text: 'บึงน้ำสีดำสนิท ไม่มีคลื่น ไม่มีเสียง แต่เงาของคุณในน้ำดูเหมือนจะขยับต่างจากตัวจริง...',
    choices: [
      { id: 'drink',  text: '💧 ดื่มน้ำ',          outcome: 'น้ำเย็นชืดชวนให้ลืมความกลัว แต่มืดซึมเข้าสู่ใจ', corruptionDelta: 12, dustReward: 20 },
      { id: 'pray2',  text: '🙏 สวดมนต์ก่อนข้าม', outcome: 'ข้ามได้อย่างปลอดภัย วิญญาณในทีมรู้สึกสงบ',        corruptionDelta: -8, bondGain: 6 },
      { id: 'bypass', text: '🏃 อ้อมไป',           outcome: 'เสียเวลาแต่ปลอดภัย ได้ฝุ่นเล็กน้อยระหว่างทาง',   corruptionDelta: 0,  dustReward: 15 },
    ],
  },
];

export default function Adventure() {
  const { save, applyAdventureChoice } = useGameStore();
  const [currentIdx, setCurrentIdx] = useState(() => Math.floor(Math.random() * EVENTS.length));
  const [chosen, setChosen]         = useState<string | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);
  const [applying, setApplying]     = useState(false);

  const event    = EVENTS[currentIdx];
  const choiceObj = event.choices.find(c => c.id === chosen);
  const corruption = save?.corruption_score ?? 0;

  function handleChoice(choiceId: string) {
    if (applying || showOutcome) return;
    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) return;
    setChosen(choiceId);
    setShowOutcome(true);
    setApplying(true);
    applyAdventureChoice(
      event.id,
      choiceId,
      choice.corruptionDelta,
      choice.dustReward ?? 0,
      choice.bondGain ?? 0,
    ).finally(() => setApplying(false));
  }

  function nextEvent() {
    let next = currentIdx;
    if (EVENTS.length > 1) {
      while (next === currentIdx) next = Math.floor(Math.random() * EVENTS.length);
    }
    setCurrentIdx(next);
    setChosen(null);
    setShowOutcome(false);
    setApplying(false);
  }

  return (
    <div className="screen fade-in">
      <ScreenHeader title="📜 ผจญภัย" />

      <div className="screen-content">
        {/* Corruption bar */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>☠️ Corruption</span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
              color: corruption >= 70 ? 'var(--red)' : corruption >= 40 ? 'var(--orange)' : 'var(--green)',
            }}>
              {corruption}%
            </span>
          </div>
          <div className="bar-track">
            <div className="bar-fill bar-corruption" style={{ width: `${corruption}%` }} />
          </div>
        </div>

        {/* Event card */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(165,94,234,0.08), var(--bg-card))',
          border: '1px solid rgba(165,94,234,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 40 }}>{event.icon}</span>
            <div>
              <div style={{ fontFamily: 'Bai Jamjuree, sans-serif', fontSize: 18, fontWeight: 700 }}>
                {event.title}
              </div>
              <div className="label-sm">เหตุการณ์สุ่ม</div>
            </div>
          </div>

          <p style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.8, marginBottom: 20, fontStyle: 'italic' }}>
            "{event.text}"
          </p>

          {!showOutcome ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {event.choices.map(choice => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => handleChoice(choice.id)}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-elevated)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    borderRadius: 'var(--r-lg)',
                    color: 'var(--text-white)',
                    fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  <span style={{ flex: 1 }}>{choice.text}</span>
                  <span style={{ display: 'flex', gap: 6, flexShrink: 0, fontSize: 11 }}>
                    {choice.corruptionDelta !== 0 && (
                      <span style={{ fontWeight: 700, color: choice.corruptionDelta > 0 ? 'var(--red)' : 'var(--green)' }}>
                        {choice.corruptionDelta > 0 ? `+${choice.corruptionDelta}` : choice.corruptionDelta}☠️
                      </span>
                    )}
                    {choice.dustReward && <span style={{ color: 'var(--gold)', fontWeight: 700 }}>+{choice.dustReward}🌀</span>}
                    {choice.bondGain   && <span style={{ color: '#a78bfa',   fontWeight: 700 }}>+{choice.bondGain}💞</span>}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Outcome box */}
              <div style={{
                padding: '14px',
                background: (choiceObj?.corruptionDelta ?? 0) < 0
                  ? 'rgba(38,222,129,0.1)' : (choiceObj?.corruptionDelta ?? 0) > 0
                  ? 'rgba(255,71,87,0.1)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${(choiceObj?.corruptionDelta ?? 0) < 0 ? 'rgba(38,222,129,0.3)' : (choiceObj?.corruptionDelta ?? 0) > 0 ? 'rgba(255,71,87,0.3)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 'var(--r-md)',
              }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>ผลลัพธ์:</div>
                <div style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 10 }}>
                  {choiceObj?.outcome}
                </div>
                {/* Reward chips */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(choiceObj?.corruptionDelta ?? 0) !== 0 && (
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: (choiceObj!.corruptionDelta) < 0 ? 'rgba(38,222,129,0.2)' : 'rgba(255,71,87,0.2)',
                      color: (choiceObj!.corruptionDelta) < 0 ? 'var(--green)' : 'var(--red)',
                    }}>
                      ☠️ {(choiceObj!.corruptionDelta) > 0 ? '+' : ''}{choiceObj!.corruptionDelta}%
                    </span>
                  )}
                  {(choiceObj?.dustReward ?? 0) > 0 && (
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(245,197,24,0.15)', color: 'var(--gold)' }}>
                      🌀 +{choiceObj!.dustReward} ฝุ่น
                    </span>
                  )}
                  {(choiceObj?.bondGain ?? 0) > 0 && (
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
                      💞 Bond +{choiceObj!.bondGain} ทุกตัว
                    </span>
                  )}
                  {applying && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>กำลังบันทึก...</span>
                  )}
                </div>
              </div>

              <button type="button" className="btn btn-gold btn-full" onClick={nextEvent} disabled={applying}>
                ➡️ เหตุการณ์ถัดไป
              </button>
            </div>
          )}
        </div>

        {/* Mentor bonds */}
        <div className="card">
          <div className="label-sm" style={{ marginBottom: 10 }}>Bond ที่ปรึกษา</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { key: 'phra',      label: '🙏 พระ',       color: 'var(--gold)' },
              { key: 'chee',      label: '🧘 ชี',         color: 'var(--green)' },
              { key: 'mo_jeen',   label: '🔮 หมอจีน',    color: 'var(--red)' },
              { key: 'mo_farang', label: '⚗️ หมอฝรั่ง', color: 'var(--blue)' },
            ].map(m => {
              const bonds = save?.mentor_bonds as Record<string, number> | undefined;
              const val = bonds?.[m.key] ?? 0;
              return (
                <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, width: 80, flexShrink: 0 }}>{m.label}</span>
                  <div className="bar-track" style={{ flex: 1 }}>
                    <div className="bar-fill" style={{ width: `${val}%`, background: m.color }} />
                  </div>
                  <span className="mono" style={{ fontSize: 11, width: 24, textAlign: 'right', color: 'var(--text-muted)' }}>
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
