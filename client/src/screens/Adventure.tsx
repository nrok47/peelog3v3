import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import ScreenHeader from '../components/ScreenHeader';
import BottomNav from '../components/BottomNav';

interface EventNode {
  id: string;
  title: string;
  text: string;
  icon: string;
  choices: { id: string; text: string; outcome: string; corruptionDelta: number }[];
}

const EVENTS: EventNode[] = [
  {
    id: 'ev01',
    icon: '⛩️',
    title: 'ศาลเจ้าลึกลับ',
    text: 'คุณพบศาลเจ้าเก่าแก่กลางป่า ข้างในมีเทียนจุดอยู่ แต่ไม่มีใครอยู่ เสียงพระธรรมดังแว่วมาจากข้างใน...',
    choices: [
      { id: 'pray',     text: '🙏 ไหว้บูชา',          outcome: 'Bond เพิ่ม +5 กับวิญญาณทุกตัว',         corruptionDelta: -5 },
      { id: 'take',     text: '💎 เอาของในศาล',       outcome: 'ได้ Gold 200 แต่ Corruption +10',        corruptionDelta: 10 },
      { id: 'leave',    text: '🚶 เดินต่อไป',          outcome: 'ไม่มีผลอะไร',                            corruptionDelta: 0 },
    ],
  },
  {
    id: 'ev02',
    icon: '👧',
    title: 'เด็กหญิงหลงทาง',
    text: 'คุณเจอเด็กหญิงนั่งร้องไห้กลางทาง เธอบอกว่าหลงมาจากหมู่บ้าน แต่ดวงตาของเธอดูแปลกพิกล สีดำสนิทโดยไม่มีขาว...',
    choices: [
      { id: 'help',     text: '🤝 ช่วยพาส่ง',         outcome: 'ได้ Mentor Bond กับ อ.พระ +10',          corruptionDelta: -10 },
      { id: 'run',      text: '🏃 วิ่งหนี',            outcome: 'รอดปลอดภัย แต่พลาดรางวัล',               corruptionDelta: 0 },
      { id: 'bind',     text: '⛓️ จับกักขังไว้ศึกษา', outcome: 'ได้ข้อมูลลึกลับ แต่ Corruption +15',     corruptionDelta: 15 },
    ],
  },
  {
    id: 'ev03',
    icon: '🌳',
    title: 'ต้นไม้โบราณ',
    text: 'ต้นไม้ขนาดมหึมาที่มีอายุนับร้อยปี บนกิ่งมีผ้าสีแดงผูกอยู่เต็มไปหมด เสียงกระซิบดังมาจากเปลือกไม้...',
    choices: [
      { id: 'listen',   text: '👂 ฟังเสียงกระซิบ',   outcome: 'เรียนรู้ความลับเก่าแก่ +สกิลพิเศษ',        corruptionDelta: 5 },
      { id: 'cut',      text: '🪓 ตัดกิ่ง',           outcome: 'ได้ไม้หายาก แต่ถูกสาป Corruption +20',     corruptionDelta: 20 },
      { id: 'respect',  text: '💐 วางดอกไม้บูชา',     outcome: 'ต้นไม้ให้ผลมหัศจรรย์ HP MAX +200',         corruptionDelta: -5 },
    ],
  },
];

export default function Adventure() {
  const { save } = useGameStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [chosen, setChosen]         = useState<string | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);

  const event    = EVENTS[currentIdx];
  const choiceObj = event.choices.find(c => c.id === chosen);
  const corruption = save?.corruption_score ?? 0;

  function handleChoice(choiceId: string) {
    setChosen(choiceId);
    setShowOutcome(true);
  }

  function nextEvent() {
    setCurrentIdx(i => (i + 1) % EVENTS.length);
    setChosen(null);
    setShowOutcome(false);
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
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
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
              <div className="label-sm">เหตุการณ์ {currentIdx + 1}/{EVENTS.length}</div>
            </div>
          </div>

          <p style={{
            fontSize: 14,
            color: 'var(--text-light)',
            lineHeight: 1.8,
            marginBottom: 20,
            fontStyle: 'italic',
          }}>
            "{event.text}"
          </p>

          {!showOutcome ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {event.choices.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice.id)}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-elevated)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    borderRadius: 'var(--r-lg)',
                    color: 'var(--text-white)',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  {choice.text}
                  {choice.corruptionDelta !== 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: 11,
                      fontWeight: 700,
                      color: choice.corruptionDelta > 0 ? 'var(--red)' : 'var(--green)',
                    }}>
                      {choice.corruptionDelta > 0 ? `+${choice.corruptionDelta}` : choice.corruptionDelta}☠️
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                padding: '14px',
                background: (choiceObj?.corruptionDelta ?? 0) < 0
                  ? 'rgba(38,222,129,0.1)'
                  : (choiceObj?.corruptionDelta ?? 0) > 0
                    ? 'rgba(255,71,87,0.1)'
                    : 'rgba(255,255,255,0.05)',
                border: `1px solid ${(choiceObj?.corruptionDelta ?? 0) < 0 ? 'rgba(38,222,129,0.3)' : (choiceObj?.corruptionDelta ?? 0) > 0 ? 'rgba(255,71,87,0.3)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 'var(--r-md)',
              }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>ผลลัพธ์:</div>
                <div style={{ fontSize: 14, color: 'var(--text-light)' }}>{choiceObj?.outcome}</div>
                {(choiceObj?.corruptionDelta ?? 0) !== 0 && (
                  <div style={{
                    marginTop: 8,
                    fontWeight: 700,
                    color: (choiceObj?.corruptionDelta ?? 0) > 0 ? 'var(--red)' : 'var(--green)',
                  }}>
                    Corruption {(choiceObj?.corruptionDelta ?? 0) > 0 ? '+' : ''}{choiceObj?.corruptionDelta}%
                  </div>
                )}
              </div>
              <button className="btn btn-gold btn-full" onClick={nextEvent}>
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
