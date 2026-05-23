// chibi.jsx — Chibi spirit portraits + spirit data
// Simple SVG built from primitives (circles, ovals, rects).
// Each spirit has a signature shape that hints at the Thai folklore.

const SPIRITS = {
  krasue: {
    name: "กระสือ",
    nameRomaji: "KRASUE",
    element: "fire",
    elementName: "อัคนี",
    class: "Striker",
    tier: "epic",
    color: "#c0392b",
    accent: "#ff7066",
    lore: "หัวลอย เครื่องในแดงฉาน หิวเลือดยามดึก",
  },
  krahang: {
    name: "กระหัง",
    nameRomaji: "KRAHANG",
    element: "wind",
    elementName: "วาโย",
    class: "Scout",
    tier: "rare",
    color: "#7dcfa0",
    accent: "#a8e6c0",
    lore: "ชายร่างหิ้วกระด้ง บินตามลม กระโดดต้นไม้",
  },
  pret: {
    name: "เปรต",
    nameRomaji: "PRET",
    element: "occult",
    elementName: "อาถรรพ์",
    class: "Warlock",
    tier: "legend",
    color: "#c026d3",
    accent: "#e879f9",
    lore: "ร่างยาว ปากเท่ารูเข็ม กรรมเก่าหนักอึ้ง",
  },
  maenak: {
    name: "แม่นาก",
    nameRomaji: "MAE NAK",
    element: "water",
    elementName: "วารี",
    class: "Guardian",
    tier: "mythic",
    color: "#5a8fc4",
    accent: "#a8c8e6",
    lore: "ผีรักครั้งสุดท้าย คอยปกป้องที่รัก น้ำตาเย็นยะเยือก",
  },
  nangtani: {
    name: "นางตานี",
    nameRomaji: "NANG TANI",
    element: "earth",
    elementName: "ปฐพี",
    class: "Cleric",
    tier: "epic",
    color: "#7a9450",
    accent: "#b8c87a",
    lore: "วิญญาณต้นกล้วยตานี หยั่งรากลึกในผืนดิน",
  },
  pob: {
    name: "ปอบ",
    nameRomaji: "POB",
    element: "occult",
    elementName: "อาถรรพ์",
    class: "Striker",
    tier: "rare",
    color: "#a64bb8",
    accent: "#d889e0",
    lore: "วิญญาณกินตับ สิงร่างคน หากินไส้พุง",
  },
  phitaihong: {
    name: "ผีตายโหง",
    nameRomaji: "TAI HONG",
    element: "fire",
    elementName: "พิโรธ",
    class: "Berserker",
    tier: "legend",
    color: "#8a3a3a",
    accent: "#c95e5e",
    lore: "ตายผิดที่ผิดเวลา โทสะยังพลุ่งพล่าน",
  },
  jakkajan: {
    name: "จักจั่น",
    nameRomaji: "JAKKAJAN",
    element: "wind",
    elementName: "วาโย",
    class: "Bard",
    tier: "common",
    color: "#5fa6ff",
    accent: "#a8c8ff",
    lore: "วิญญาณจักจั่น ส่งเสียงร้องชวนหลับใหล",
  },
  chamopnang: {
    name: "ผีโขมด",
    nameRomaji: "KHAMOT",
    element: "earth",
    elementName: "ปฐพี",
    class: "Tank",
    tier: "rare",
    color: "#8a7040",
    accent: "#c4a868",
    lore: "แสงไฟลึกลับในป่า ดวงตาดินรอเหยื่อ",
  },
  phisuea: {
    name: "ผีเสื้อสมุทร",
    nameRomaji: "SAMUT",
    element: "water",
    elementName: "วารี",
    class: "Mage",
    tier: "legend",
    color: "#3a78a8",
    accent: "#7ac0e8",
    lore: "ราชินียักษ์แห่งคลื่น คลั่งรักจอมขมังเวท",
  },
};

// Chibi portrait — each spirit has its own simple form, all built from
// circles/ovals/rects. mood: 'normal' | 'fierce' | 'sad' | 'ko'
function Chibi({ kind = "krasue", size = 120, mood = "normal", aura = true }) {
  const s = SPIRITS[kind] || SPIRITS.krasue;
  const eyeY = mood === "ko" ? 50 : 48;
  const eyeOpen = mood === "ko" ? 0.5 : 4;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: "block", overflow: "visible" }}>
      {aura && (
        <>
          <circle cx="50" cy="52" r="44" fill={s.color} opacity="0.12" />
          <circle cx="50" cy="52" r="36" fill={s.color} opacity="0.18" />
        </>
      )}

      {kind === "krasue" && (
        <g>
          {/* entrails dangling */}
          <ellipse cx="46" cy="70" rx="3.5" ry="9" fill={s.color} opacity="0.85" />
          <ellipse cx="52" cy="74" rx="3" ry="11" fill={s.accent} opacity="0.8" />
          <ellipse cx="56" cy="72" rx="2.5" ry="8" fill={s.color} opacity="0.85" />
          <circle cx="48" cy="84" r="3" fill={s.color} />
          <circle cx="54" cy="86" r="2.5" fill={s.accent} />
          {/* head */}
          <circle cx="50" cy="42" r="26" fill={s.color} />
          <ellipse cx="50" cy="32" rx="22" ry="8" fill="#1a0d1f" opacity="0.5" />
          {/* hair tuft */}
          <path d="M 30 32 Q 35 20 50 22 Q 65 20 70 32" fill="#1a0d1f" />
        </g>
      )}

      {kind === "krahang" && (
        <g>
          {/* wings (rectangle baskets) */}
          <rect x="12" y="36" width="18" height="22" fill={s.color} opacity="0.6" rx="2" />
          <rect x="70" y="36" width="18" height="22" fill={s.color} opacity="0.6" rx="2" />
          <rect x="14" y="38" width="14" height="18" fill="none" stroke={s.accent} strokeWidth="0.6" opacity="0.6" />
          <rect x="72" y="38" width="14" height="18" fill="none" stroke={s.accent} strokeWidth="0.6" opacity="0.6" />
          {/* body */}
          <ellipse cx="50" cy="56" rx="16" ry="20" fill={s.color} />
          {/* head */}
          <circle cx="50" cy="38" r="18" fill={s.color} />
        </g>
      )}

      {kind === "pret" && (
        <g>
          {/* tall narrow body */}
          <ellipse cx="50" cy="62" rx="11" ry="22" fill={s.color} />
          <ellipse cx="50" cy="62" rx="6" ry="18" fill={s.accent} opacity="0.3" />
          {/* head */}
          <ellipse cx="50" cy="32" rx="14" ry="18" fill={s.color} />
          {/* sad arms */}
          <ellipse cx="38" cy="60" rx="3" ry="14" fill={s.color} transform="rotate(8 38 60)" />
          <ellipse cx="62" cy="60" rx="3" ry="14" fill={s.color} transform="rotate(-8 62 60)" />
        </g>
      )}

      {kind === "maenak" && (
        <g>
          {/* long hair flowing down */}
          <ellipse cx="50" cy="62" rx="28" ry="34" fill="#1a0d1f" />
          <ellipse cx="50" cy="62" rx="22" ry="28" fill="#0f0716" />
          {/* face */}
          <ellipse cx="50" cy="46" rx="18" ry="22" fill={s.accent} />
          <ellipse cx="50" cy="44" rx="14" ry="18" fill={s.color} opacity="0.3" />
          {/* hair on forehead */}
          <path d="M 32 38 Q 50 26 68 38 L 65 44 Q 50 36 35 44 Z" fill="#1a0d1f" />
        </g>
      )}

      {kind === "nangtani" && (
        <g>
          {/* banana leaf backdrop */}
          <ellipse cx="50" cy="50" rx="34" ry="42" fill={s.color} opacity="0.35" />
          <ellipse cx="50" cy="50" rx="28" ry="36" fill="none" stroke={s.accent} strokeWidth="0.6" opacity="0.5" />
          {/* dress */}
          <ellipse cx="50" cy="64" rx="18" ry="22" fill={s.color} />
          {/* head */}
          <circle cx="50" cy="40" r="16" fill={s.accent} />
          {/* leaves on head */}
          <ellipse cx="42" cy="26" rx="4" ry="9" fill={s.color} transform="rotate(-25 42 26)" />
          <ellipse cx="58" cy="26" rx="4" ry="9" fill={s.color} transform="rotate(25 58 26)" />
          <ellipse cx="50" cy="22" rx="4" ry="10" fill={s.color} />
        </g>
      )}

      {kind === "pob" && (
        <g>
          {/* round body */}
          <ellipse cx="50" cy="60" rx="22" ry="20" fill={s.color} />
          {/* head */}
          <circle cx="50" cy="38" r="20" fill={s.color} />
          {/* big mouth — wide open */}
          <ellipse cx="50" cy="46" rx="9" ry="5" fill="#1a0612" />
          {/* teeth */}
          <rect x="44" y="42" width="2" height="3" fill="#fff" />
          <rect x="48" y="42" width="2" height="3" fill="#fff" />
          <rect x="52" y="42" width="2" height="3" fill="#fff" />
          <rect x="56" y="42" width="2" height="3" fill="#fff" />
        </g>
      )}

      {kind === "phitaihong" && (
        <g>
          {/* spike-like crown */}
          <path d="M 30 22 L 36 6 L 42 22 L 50 4 L 58 22 L 64 6 L 70 22 Z" fill={s.color} />
          {/* head */}
          <circle cx="50" cy="46" r="24" fill={s.color} />
          <circle cx="50" cy="46" r="24" fill={s.accent} opacity="0.2" />
          {/* tears of blood */}
          <ellipse cx="38" cy="58" rx="1.5" ry="4" fill={s.accent} />
          <ellipse cx="62" cy="58" rx="1.5" ry="4" fill={s.accent} />
        </g>
      )}

      {kind === "jakkajan" && (
        <g>
          {/* wings */}
          <ellipse cx="28" cy="48" rx="14" ry="20" fill={s.color} opacity="0.5" transform="rotate(-15 28 48)" />
          <ellipse cx="72" cy="48" rx="14" ry="20" fill={s.color} opacity="0.5" transform="rotate(15 72 48)" />
          {/* body */}
          <ellipse cx="50" cy="52" rx="16" ry="22" fill={s.color} />
          {/* stripes */}
          <ellipse cx="50" cy="48" rx="12" ry="2" fill={s.accent} opacity="0.6" />
          <ellipse cx="50" cy="56" rx="12" ry="2" fill={s.accent} opacity="0.6" />
          <ellipse cx="50" cy="64" rx="10" ry="2" fill={s.accent} opacity="0.6" />
        </g>
      )}

      {/* eyes — universal */}
      {mood !== "ko" ? (
        <g>
          <ellipse cx="42" cy={eyeY - 2} rx="3.5" ry="4" fill="#0a0612" />
          <ellipse cx="58" cy={eyeY - 2} rx="3.5" ry="4" fill="#0a0612" />
          <circle cx="43" cy={eyeY - 3} r="1.2" fill="#fff" />
          <circle cx="59" cy={eyeY - 3} r="1.2" fill="#fff" />
        </g>
      ) : (
        <g stroke="#0a0612" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <path d={`M 39 ${eyeY - 3} L 45 ${eyeY + 1}`} />
          <path d={`M 45 ${eyeY - 3} L 39 ${eyeY + 1}`} />
          <path d={`M 55 ${eyeY - 3} L 61 ${eyeY + 1}`} />
          <path d={`M 61 ${eyeY - 3} L 55 ${eyeY + 1}`} />
        </g>
      )}

      {/* mouth */}
      {mood === "fierce" ? (
        <path d={`M 44 ${eyeY + 12} Q 50 ${eyeY + 8} 56 ${eyeY + 12}`} stroke="#0a0612" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      ) : mood === "sad" ? (
        <path d={`M 44 ${eyeY + 14} Q 50 ${eyeY + 10} 56 ${eyeY + 14}`} stroke="#0a0612" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      ) : (
        <ellipse cx="50" cy={eyeY + 10} rx="2" ry="1.4" fill="#0a0612" />
      )}

      {/* cheek blush */}
      {mood !== "ko" && mood !== "sad" && (
        <g opacity="0.45">
          <ellipse cx="36" cy={eyeY + 6} rx="3" ry="1.6" fill="#ff8a8a" />
          <ellipse cx="64" cy={eyeY + 6} rx="3" ry="1.6" fill="#ff8a8a" />
        </g>
      )}
    </svg>
  );
}

window.SPIRITS = SPIRITS;
window.Chibi = Chibi;
