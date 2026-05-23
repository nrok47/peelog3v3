// battle.jsx — ATB Combat screen (3v3)

function StatusBar({ tone = "light" }) {
  return (
    <div className="status-bar" style={{ color: tone === "dark" ? "#0a0612" : "var(--bone)" }}>
      <span>22:13</span>
      <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 9, letterSpacing: 0.1 }}>5G</span>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><rect x="0" y="7" width="2.5" height="4" /><rect x="3.5" y="5" width="2.5" height="6" /><rect x="7" y="3" width="2.5" height="8" /><rect x="10.5" y="0" width="2.5" height="11" /></svg>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="18" height="10" rx="2" /><rect x="2" y="2" width="14" height="7" fill="currentColor" /><rect x="19" y="3.5" width="2" height="4" fill="currentColor" /></svg>
      </span>
    </div>
  );
}

function Ornament() {
  return (
    <svg viewBox="0 0 200 8" width="100%" height="8" style={{ display: "block" }}>
      <line x1="0" y1="4" x2="78" y2="4" stroke="var(--gold)" strokeWidth="0.5" opacity="0.6" />
      <line x1="122" y1="4" x2="200" y2="4" stroke="var(--gold)" strokeWidth="0.5" opacity="0.6" />
      <circle cx="100" cy="4" r="2.5" fill="none" stroke="var(--gold)" strokeWidth="0.6" />
      <circle cx="100" cy="4" r="0.8" fill="var(--gold)" />
      <circle cx="88" cy="4" r="1.2" fill="var(--gold)" opacity="0.5" />
      <circle cx="112" cy="4" r="1.2" fill="var(--gold)" opacity="0.5" />
    </svg>
  );
}

function Bar({ kind = "hp", value = 70, max = 100, label, showNum = true, height = 6, segments = 0 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2, alignItems: "baseline" }}>
          <span className="eyebrow-mute">{label}</span>
          {showNum && (
            <span className="num" style={{ fontSize: 10, color: "var(--bone)" }}>
              {value}<span style={{ color: "var(--muted)" }}>/{max}</span>
            </span>
          )}
        </div>
      )}
      <div className={`bar bar-${kind}`} style={{ height }}>
        <div className="bar-fill" style={{ width: `${pct}%` }} />
        {segments > 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", pointerEvents: "none" }}>
            {[...Array(segments)].map((_, i) => (
              <div key={i} style={{ flex: 1, borderRight: i < segments - 1 ? "1px solid rgba(0,0,0,0.5)" : "none" }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ATBToken({ kind, ready = false, isEnemy = false, soon = false }) {
  return (
    <div style={{
      width: 28, height: 28,
      borderRadius: "50%",
      background: isEnemy ? "rgba(192,57,43,0.2)" : "rgba(0,0,0,0.5)",
      border: `1.5px solid ${ready ? "var(--gold)" : isEnemy ? "var(--blood)" : "var(--hairline)"}`,
      boxShadow: ready ? "0 0 8px var(--gold-glow)" : "none",
      position: "relative",
      flexShrink: 0,
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: -4, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Chibi kind={kind} size={32} aura={false} mood={isEnemy ? "fierce" : "normal"} />
      </div>
      {soon && (
        <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", fontSize: 7 }} className="num">soon</div>
      )}
    </div>
  );
}

// Element advantage glyph — small "▲" up next to target
function AdvantageGlyph({ kind = "vs" }) {
  if (kind === "weak") return <span style={{ fontSize: 8, color: "var(--gold-glow)", fontFamily: "var(--f-mono)", letterSpacing: 0.1 }}>▲WEAK</span>;
  if (kind === "resist") return <span style={{ fontSize: 8, color: "var(--bone-mute)", fontFamily: "var(--f-mono)", letterSpacing: 0.1 }}>▼RES</span>;
  return null;
}

function EnemyCard({ kind, level, hp, hpMax, atb, isBoss, status = [], advantage }) {
  const s = SPIRITS[kind];
  return (
    <div style={{
      flex: isBoss ? 1.4 : 1,
      background: `linear-gradient(180deg, ${s.color}1f, rgba(0,0,0,0.45) 70%)`,
      border: `1px solid ${isBoss ? "var(--blood)" : "var(--hairline-strong)"}`,
      padding: "6px 5px 5px",
      position: "relative",
      borderRadius: 2,
    }}>
      {isBoss && (
        <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", padding: "1px 8px", background: "var(--blood)", color: "var(--bone)", fontFamily: "var(--f-mono)", fontSize: 7, letterSpacing: 0.18, fontWeight: 700 }}>
          BOSS
        </div>
      )}
      {advantage && (
        <div style={{ position: "absolute", top: 4, right: 4 }}>
          <AdvantageGlyph kind={advantage} />
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 2, position: "relative" }}>
        <Chibi kind={kind} size={isBoss ? 78 : 64} mood="fierce" aura={isBoss} />
      </div>
      <div className="thai-display" style={{ fontSize: 11, textAlign: "center", marginBottom: 1, color: "var(--bone)", lineHeight: 1 }}>{s.name}</div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginBottom: 4 }}>
        <span className={`el-chip el-${s.element}`} style={{ fontSize: 7, padding: "1px 4px" }}>{s.elementName}</span>
        <span className="num" style={{ fontSize: 8, color: "var(--bone-mute)" }}>Lv{level}</span>
      </div>
      <Bar kind="hp" value={hp} max={hpMax} height={4} showNum={false} segments={isBoss ? 5 : 3} />
      <div className="num" style={{ fontSize: 8, color: "var(--bone-mute)", marginTop: 2, textAlign: "center" }}>
        {hp.toLocaleString()}<span style={{ opacity: 0.5 }}>/{hpMax.toLocaleString()}</span>
      </div>
      {status.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 3, marginTop: 3, flexWrap: "wrap" }}>
          {status.map((s, i) => (
            <span key={i} style={{ fontSize: 8, color: s.color, fontFamily: "var(--f-mono)", letterSpacing: 0.05, padding: "0 3px", border: `1px solid ${s.color}`, opacity: 0.85, background: "rgba(0,0,0,0.4)" }}>
              {s.icon}{s.turns}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SkillButton({ name, element, cost, cd, locked, type = "normal", desc, ready }) {
  const isUlt = type === "ult";
  const isReady = isUlt && ready;
  return (
    <button style={{
      background: isReady
        ? "linear-gradient(180deg, rgba(192,38,211,0.3), rgba(212,175,55,0.15))"
        : "linear-gradient(180deg, var(--panel-2), var(--panel))",
      border: `1px solid ${isReady ? "var(--corruption-soft)" : "var(--hairline-strong)"}`,
      padding: "8px 9px 7px",
      textAlign: "left",
      color: "var(--bone)",
      cursor: locked ? "not-allowed" : "pointer",
      opacity: locked ? 0.5 : 1,
      position: "relative",
      borderRadius: 2,
      fontFamily: "inherit",
      overflow: "hidden",
      boxShadow: isReady ? "0 0 12px rgba(192,38,211,0.45), inset 0 0 12px rgba(212,175,55,0.1)" : "none",
    }}>
      {isUlt && (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: isReady ? "linear-gradient(90deg, var(--corruption), var(--gold), var(--corruption))" : "linear-gradient(90deg, var(--corruption), var(--gold))" }} />
          <span className="eyebrow" style={{ fontSize: 7, color: isReady ? "var(--gold-glow)" : "var(--corruption-soft)", position: "absolute", top: 3, right: 7 }}>
            {isReady ? "★ READY" : "ULT"}
          </span>
        </>
      )}
      <div style={{ marginBottom: 4 }}>
        <span className="thai-display" style={{ fontSize: 12, color: isUlt ? "var(--gold-soft)" : "var(--bone)", lineHeight: 1 }}>{name}</span>
      </div>
      {desc && <div style={{ fontSize: 9, color: "var(--bone-mute)", lineHeight: 1.3, marginBottom: 5 }}>{desc}</div>}
      <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
        <span className={`el-chip el-${element}`} style={{ fontSize: 7, padding: "1px 4px" }}>{element}</span>
        {cost > 0 && (
          <span className="num" style={{ fontSize: 9, color: isReady ? "var(--gold-glow)" : "var(--gold-soft)" }}>◆{cost}</span>
        )}
        {cd > 0 && (
          <span className="num" style={{ fontSize: 9, color: "var(--bone-mute)" }}>CD {cd}s</span>
        )}
      </div>
    </button>
  );
}

function TeamMember({ kind, level, hp, hpMax, atb, guts, active, ko }) {
  const s = SPIRITS[kind];
  return (
    <div style={{
      flex: 1,
      background: active
        ? "linear-gradient(180deg, rgba(212,175,55,0.14), rgba(0,0,0,0.4))"
        : "rgba(0,0,0,0.3)",
      border: `1px solid ${active ? "var(--gold)" : "var(--hairline)"}`,
      padding: "6px 5px 5px",
      position: "relative",
      borderRadius: 2,
      opacity: ko ? 0.4 : 1,
    }}>
      {active && (
        <div style={{ position: "absolute", top: -7, left: "50%", transform: "translateX(-50%)", fontSize: 7, letterSpacing: 0.18, background: "var(--gold)", color: "var(--ink)", padding: "1px 6px", fontFamily: "var(--f-mono)", fontWeight: 700 }}>
          ACTIVE
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
        <Chibi kind={kind} size={64} mood={ko ? "ko" : active ? "fierce" : "normal"} aura={!ko} />
      </div>
      <div className="thai-display" style={{ fontSize: 11, textAlign: "center", marginBottom: 1, lineHeight: 1 }}>{s.name}</div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginBottom: 4 }}>
        <span className={`el-chip el-${s.element}`} style={{ fontSize: 7, padding: "1px 4px" }}>{s.elementName}</span>
        <span className="num" style={{ fontSize: 8, color: "var(--bone-mute)" }}>Lv{level}</span>
      </div>
      <Bar kind="hp" value={hp} max={hpMax} height={4} showNum={false} segments={3} />
      <div className="num" style={{ fontSize: 8, color: "var(--bone-mute)", marginTop: 2, textAlign: "center" }}>
        {hp}<span style={{ opacity: 0.5 }}>/{hpMax}</span>
      </div>
      <div style={{ marginTop: 3 }}>
        <Bar kind="guts" value={guts} max={100} height={2} showNum={false} />
      </div>
      <div style={{ marginTop: 2 }}>
        <Bar kind="atb" value={atb} max={100} height={2} showNum={false} />
      </div>
    </div>
  );
}

function BattleScreen() {
  return (
    <div className="screen" style={{
      background: "radial-gradient(ellipse 100% 60% at 50% 30%, #2a1238, var(--void) 70%)",
    }}>
      <div className="noise" />
      <StatusBar />

      {/* ── Top HUD ── */}
      <div style={{ padding: "0 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{ width: 26, height: 26, background: "rgba(0,0,0,0.5)", border: "1px solid var(--hairline)", color: "var(--bone)", borderRadius: 2, padding: 0 }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><rect x="2" y="1" width="2" height="8" /><rect x="6" y="1" width="2" height="8" /></svg>
          </button>
          <div>
            <div className="eyebrow-mute" style={{ fontSize: 8 }}>บทที่ 02 · ตรอกผีดิบ</div>
            <div className="thai-display" style={{ fontSize: 12, color: "var(--bone)", lineHeight: 1.1 }}>ห้องที่ 7 / 12</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div>
            <div className="eyebrow-mute" style={{ fontSize: 7, textAlign: "right", marginBottom: 2 }}>CORRUPTION</div>
            <div style={{ width: 94 }}>
              <div className="bar bar-corruption" style={{ height: 4 }}>
                <div className="bar-fill" style={{ width: "42%" }} />
              </div>
            </div>
            <div className="num" style={{ fontSize: 8, color: "var(--corruption-soft)", textAlign: "right", marginTop: 1 }}>
              42<span style={{ color: "var(--bone-mute)" }}> / 100</span>
            </div>
          </div>
        </div>
      </div>

      <Ornament />

      {/* ── Enemy row (3) ── */}
      <div style={{ padding: "16px 12px 6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span className="eyebrow" style={{ color: "var(--blood)" }}>ศัตรู · ENEMIES 3/3</span>
          <span className="eyebrow-mute" style={{ fontSize: 8 }}>WAVE 2 of 3</span>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "stretch" }}>
          <EnemyCard
            kind="krasue"
            level={36}
            hp={1850}
            hpMax={2400}
            advantage="resist"
            status={[{ icon: "🜂", color: "var(--el-fire)", turns: 1 }]}
          />
          <EnemyCard
            kind="phitaihong"
            level={38}
            hp={4820}
            hpMax={8200}
            isBoss
            advantage="weak"
            status={[
              { icon: "BURN", color: "var(--el-fire)", turns: 2 },
              { icon: "HEX", color: "var(--corruption-soft)", turns: 1 },
            ]}
          />
          <EnemyCard
            kind="pob"
            level={34}
            hp={2980}
            hpMax={3200}
            advantage="weak"
            status={[]}
          />
        </div>
      </div>

      {/* ── ATB Timeline ── */}
      <div style={{ padding: "8px 14px 6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <span className="eyebrow-mute" style={{ fontSize: 8 }}>ATB QUEUE · ลำดับการเคลื่อน</span>
          <span className="eyebrow-mute" style={{ fontSize: 8 }}>tick 100ms · spd ÷ CONST</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, right: 30, top: "50%", height: 1, background: "linear-gradient(90deg, var(--gold) 5%, var(--hairline) 60%, transparent)" }} />
          <ATBToken kind="krasue" ready />
          <ATBToken kind="pob" isEnemy />
          <ATBToken kind="maenak" soon />
          <ATBToken kind="phitaihong" isEnemy />
          <ATBToken kind="nangtani" />
          <ATBToken kind="krasue" isEnemy />
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
            <span className="eyebrow-mute" style={{ fontSize: 7 }}>NEXT</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="var(--gold)"><path d="M2 1 L8 5 L2 9 Z" /></svg>
          </div>
        </div>
      </div>

      {/* ── Team row (3) ── */}
      <div style={{ padding: "10px 12px 6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span className="eyebrow">ทีมเรา · YOUR PARTY</span>
          <span className="eyebrow-mute" style={{ fontSize: 8 }}>PWR <span className="num" style={{ color: "var(--gold-soft)" }}>14,820</span></span>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <TeamMember kind="krasue" level={32} hp={2400} hpMax={3200} atb={100} guts={68} active />
          <TeamMember kind="maenak" level={35} hp={2890} hpMax={3580} atb={62} guts={42} />
          <TeamMember kind="nangtani" level={28} hp={1200} hpMax={2900} atb={28} guts={88} />
        </div>
      </div>

      {/* ── Skill panel ── */}
      <div style={{
        background: "linear-gradient(180deg, transparent, var(--ink) 30%)",
        padding: "8px 12px 16px",
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        borderTop: "1px solid var(--hairline-strong)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Chibi kind="krasue" size={22} aura={false} />
            <div>
              <div className="eyebrow" style={{ fontSize: 8 }}>SKILLS · กระสือ</div>
              <div className="eyebrow-mute" style={{ fontSize: 7 }}>active · Lv 32</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="eyebrow-mute" style={{ fontSize: 8 }}>GUTS</span>
            <div style={{ width: 70, position: "relative" }}>
              <Bar kind="guts" value={68} max={100} height={5} showNum={false} />
              <div style={{ position: "absolute", left: "60%", top: -2, width: 1, height: 9, background: "var(--corruption-soft)", opacity: 0.5 }} />
            </div>
            <span className="num" style={{ fontSize: 11, color: "var(--gold-soft)", minWidth: 22 }}>68</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 6 }}>
          <SkillButton name="ฟันจิกหัว" element="fire" cost={0} cd={0} desc="โจมตีเดี่ยว · 110% ATK" />
          <SkillButton name="เพลิงเครื่องใน" element="fire" cost={20} cd={6} desc="AoE · เบิร์น 3 เทิร์น" />
          <SkillButton name="กระโจนล่า" element="fire" cost={30} cd={8} desc="บัฟ SPD ตัวเอง + ตีตอบ" />
          <SkillButton name="ทัณฑ์อาถรรพ์" element="occult" cost={60} cd={12} type="ult" ready desc="โจมตีหนัก + ผูกพันธนาการ HEX" />
        </div>

        <div style={{ display: "flex", gap: 5 }}>
          <button className="btn btn-ghost" style={{ flex: 1, fontSize: 10, padding: "6px 8px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>⇄ สลับร่าง</span>
          </button>
          <button className="btn btn-ghost" style={{ flex: 1, fontSize: 10, padding: "6px 8px" }}>◇ ของวิเศษ</button>
          <button className="btn btn-ghost" style={{ flex: 0.8, fontSize: 10, padding: "6px 8px" }}>↻ AUTO</button>
          <button className="btn btn-gold" style={{ flex: 1.3, fontSize: 11 }}>▶ ออกอาวุธ</button>
        </div>
      </div>
    </div>
  );
}

window.BattleScreen = BattleScreen;
window.Bar = Bar;
window.StatusBar = StatusBar;
window.Ornament = Ornament;
