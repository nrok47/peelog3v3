// spirit-detail.jsx — Spirit Detail screen (Core / Frame / Mass)

function SectionLabel({ thai, en, ornament = true }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <div style={{ flex: "0 0 4px", width: 4, height: 14, background: "var(--gold)" }} />
      <div style={{ flex: 1 }}>
        <div className="thai-display" style={{ fontSize: 13, color: "var(--bone)", lineHeight: 1 }}>{thai}</div>
        <div className="eyebrow" style={{ fontSize: 7, marginTop: 2 }}>{en}</div>
      </div>
      {ornament && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 24, height: 1, background: "var(--hairline-strong)" }} />
          <div style={{ width: 4, height: 4, transform: "rotate(45deg)", background: "var(--gold)" }} />
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value, color, mod }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed var(--faint)", alignItems: "baseline" }}>
      <span className="eyebrow-mute" style={{ fontSize: 9, color: "var(--bone-mute)" }}>{label}</span>
      <span>
        <span className="num" style={{ fontSize: 12, color: color || "var(--bone)" }}>{value}</span>
        {mod && <span className="num" style={{ fontSize: 9, color: "var(--el-wind)", marginLeft: 4 }}>{mod}</span>}
      </span>
    </div>
  );
}

function AffixRow({ prefix, name, roll, range, tier, color, isPrefix }) {
  // tier: T1 (best) → T5 (worst). Lower T = brighter
  const tierColor = { T1: "var(--gold-glow)", T2: "var(--gold)", T3: "var(--bone)", T4: "var(--bone-mute)", T5: "var(--muted)" }[tier];
  const rollPct = ((roll - range[0]) / (range[1] - range[0])) * 100;
  return (
    <div style={{ padding: "5px 8px", background: "rgba(0,0,0,0.3)", borderLeft: `2px solid ${color || "var(--gold-deep)"}`, marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span className="eyebrow-mute" style={{ fontSize: 7, color: tierColor, fontWeight: 600 }}>
            {isPrefix ? "PFX" : "SFX"}·{tier}
          </span>
          <span style={{ fontSize: 11, color: "var(--bone)" }}>
            {prefix && <span style={{ color: tierColor, marginRight: 4 }}>"{prefix}"</span>}
            {name}
          </span>
        </div>
        <span className="num" style={{ fontSize: 11, color: tierColor, fontWeight: 600 }}>+{roll}{name.includes("%") ? "%" : ""}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.06)", position: "relative" }}>
          <div style={{ height: "100%", width: `${rollPct}%`, background: tierColor }} />
          <div style={{ position: "absolute", left: "100%", top: -2, width: 1, height: 6, background: "var(--muted)" }} />
        </div>
        <span className="num" style={{ fontSize: 8, color: "var(--bone-mute)" }}>{range[0]}–{range[1]}</span>
      </div>
    </div>
  );
}

function SpiritDetailScreen() {
  const s = SPIRITS.krasue;

  return (
    <div className="screen" style={{
      background: `radial-gradient(ellipse 100% 50% at 50% 0%, #3a1830, var(--void) 60%)`,
    }}>
      <div className="noise" />
      <StatusBar />

      {/* Header */}
      <div style={{ padding: "0 14px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", width: 30, height: 30, color: "var(--bone)", borderRadius: 2 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6.5 1 L2 5 L6.5 9" /></svg>
        </button>
        <div className="eyebrow-mute">SPIRIT DOSSIER · 014/100</div>
        <button style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)", width: 30, height: 30, color: "var(--bone)", borderRadius: 2, fontSize: 14 }}>⋯</button>
      </div>

      {/* Hero portrait */}
      <div style={{ position: "relative", textAlign: "center", paddingTop: 8, paddingBottom: 6 }}>
        {/* Concentric yantra circles */}
        <svg viewBox="0 0 280 280" width="260" height="260" style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", opacity: 0.5 }}>
          <circle cx="140" cy="140" r="130" fill="none" stroke="var(--gold)" strokeWidth="0.4" />
          <circle cx="140" cy="140" r="118" fill="none" stroke="var(--gold)" strokeWidth="0.3" strokeDasharray="1 3" />
          <circle cx="140" cy="140" r="98" fill="none" stroke="var(--blood)" strokeWidth="0.3" />
          {/* Cardinal marks */}
          {[0, 1, 2, 3].map(i => (
            <g key={i} transform={`rotate(${i * 90} 140 140)`}>
              <line x1="140" y1="10" x2="140" y2="30" stroke="var(--gold)" strokeWidth="0.6" />
              <circle cx="140" cy="20" r="3" fill="none" stroke="var(--gold)" strokeWidth="0.5" />
            </g>
          ))}
          {/* Tier corner marks */}
          {[45, 135, 225, 315].map((d, i) => (
            <g key={i} transform={`rotate(${d} 140 140)`}>
              <circle cx="140" cy="20" r="1.5" fill="var(--gold)" />
            </g>
          ))}
        </svg>

        <div style={{ position: "relative", display: "inline-block" }}>
          <Chibi kind="krasue" size={210} mood="fierce" />
        </div>

        {/* Name + tier */}
        <div style={{ marginTop: -4 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 2 }}>
            <span className="tier-dot" style={{ background: "var(--t-epic)", boxShadow: "0 0 6px var(--t-epic)" }} />
            <span className="eyebrow" style={{ color: "var(--t-epic)" }}>EPIC · IV★</span>
          </div>
          <div className="thai-display" style={{ fontSize: 30, color: "var(--gold-soft)", lineHeight: 1, marginBottom: 4 }}>
            {s.name}
          </div>
          <div className="eyebrow-mute" style={{ marginBottom: 6 }}>{s.nameRomaji} · "หัวลอยริมหน้าต่าง"</div>

          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 6 }}>
            <span className={`el-chip el-${s.element}`}>หทัย · FIRE</span>
            <span className="pill" style={{ color: "var(--gold-soft)" }}>{s.class}</span>
            <span className="pill">Lv 32</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "10px 14px 4px" }}>
        <Ornament />
      </div>

      {/* Body: scrollable panels */}
      <div style={{ padding: "8px 14px 14px", position: "absolute", top: 460, left: 0, right: 0, bottom: 0, overflowY: "auto" }}>
        {/* ── SOUL CORE ── */}
        <div style={{ marginBottom: 14 }}>
          <SectionLabel thai="แกนวิญญาณ" en="◇ SOUL CORE · LOCKED" />
          <div className="frame-gold" style={{ padding: "8px 12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
              <StatRow label="ATK" value="284" />
              <StatRow label="HP" value="3,200" />
              <StatRow label="DEF" value="142" />
              <StatRow label="SPD" value="118" />
              <StatRow label="CRIT" value="22%" />
              <StatRow label="BOND" value="78" color="var(--corruption-soft)" />
            </div>
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed var(--faint)" }}>
              <div className="eyebrow-mute" style={{ fontSize: 8, marginBottom: 3 }}>SIGNATURE SKILL · ติดตัวถาวร</div>
              <div style={{ fontSize: 12, color: "var(--bone)" }}>
                <span className="thai-display" style={{ color: "var(--gold-soft)" }}>คาบเครื่องใน</span>
                <span style={{ color: "var(--bone-mute)", marginLeft: 6, fontSize: 10 }}>ดูดเลือดคืน HP เมื่อ KO ศัตรู</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── AMULET FRAME ── */}
        <div style={{ marginBottom: 14 }}>
          <SectionLabel thai="โครงร่างอาคม" en="◈ AMULET FRAME · +12" />
          <div className="frame-gold" style={{ padding: "8px 10px" }}>
            {/* Enhancement stars */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
              <span className="eyebrow-mute">ENHANCEMENT</span>
              <span style={{ display: "inline-flex", gap: 1, fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--gold)" }}>
                ★★★★★★★★★★★★<span style={{ color: "var(--bone-mute)" }}>○○○</span>
                <span className="num" style={{ marginLeft: 4, fontSize: 10, color: "var(--gold-soft)" }}>+12/+15</span>
              </span>
            </div>
            <div style={{ fontSize: 9, color: "var(--bone-mute)", marginBottom: 8 }}>
              ⚠ ใช้ <span style={{ color: "var(--blood)" }}>ยันต์กันแตก</span> เพื่อกันร่างพัง · ต้องการ <span className="num" style={{ color: "var(--gold-soft)" }}>2 ใบ</span> สำหรับ +13
            </div>

            <div className="eyebrow-mute" style={{ fontSize: 8, marginBottom: 4 }}>SOCKETS · 3/4 SLOTS</div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1, aspectRatio: "1", background: "rgba(192,57,43,0.18)", border: "1px solid var(--blood)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 4 }}>
                <div style={{ fontSize: 14 }}>🜂</div>
                <div className="eyebrow" style={{ fontSize: 6, color: "var(--blood)" }}>R · BURN</div>
              </div>
              <div style={{ flex: 1, aspectRatio: "1", background: "rgba(155,95,198,0.18)", border: "1px solid var(--spirit)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 4 }}>
                <div style={{ fontSize: 14 }}>☽</div>
                <div className="eyebrow" style={{ fontSize: 6, color: "var(--spirit)" }}>P · LIFE</div>
              </div>
              <div style={{ flex: 1, aspectRatio: "1", background: "rgba(212,175,55,0.14)", border: "1px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 4 }}>
                <div style={{ fontSize: 14, color: "var(--gold)" }}>✦</div>
                <div className="eyebrow" style={{ fontSize: 6, color: "var(--gold)" }}>Y · HASTE</div>
              </div>
              <div style={{ flex: 1, aspectRatio: "1", background: "rgba(255,255,255,0.02)", border: "1px dashed var(--faint)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 14 }}>
                +
              </div>
            </div>
          </div>
        </div>

        {/* ── SPIRIT MASS ── */}
        <div style={{ marginBottom: 14 }}>
          <SectionLabel thai="มวลวิญญาณ" en="◊ SPIRIT MASS · AFFIXES" />
          <div style={{ padding: "8px 6px", background: "rgba(0,0,0,0.4)", border: "1px solid var(--hairline)" }}>
            <AffixRow isPrefix prefix="ดุร้าย" name="ATK %" roll={28} range={[20, 30]} tier="T1" color="var(--gold-glow)" />
            <AffixRow isPrefix prefix="เลือดเดือด" name="CRIT DMG" roll={42} range={[30, 50]} tier="T2" color="var(--gold)" />
            <AffixRow isPrefix prefix="เพลิงผลาญ" name="FIRE DMG %" roll={18} range={[12, 24]} tier="T3" color="var(--el-fire)" />
            <AffixRow name="แห่งห่าฝน" roll={62} range={[40, 80]} tier="T2" color="var(--gold)" />
            <AffixRow name="แห่งเงาเดือน" roll={12} range={[8, 18]} tier="T3" color="var(--spirit)" />
            <AffixRow name="แห่งกรรมแฝง" roll={4} range={[2, 9]} tier="T5" color="var(--bone-mute)" />

            <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px dashed var(--faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="eyebrow-mute" style={{ fontSize: 8 }}>REROLL COST</span>
              <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <span className="num" style={{ fontSize: 11, color: "var(--corruption-soft)" }}>◇ 240 · ผงอาถรรพ์</span>
              </span>
            </div>
          </div>
        </div>

        {/* CTA row */}
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }}>ตีบวก</button>
          <button className="btn btn-ghost" style={{ flex: 1 }}>สุ่ม Mass</button>
          <button className="btn btn-gold" style={{ flex: 1.4 }}>จัดเข้าทีม</button>
        </div>

        <div style={{ marginTop: 14, padding: 8, background: "rgba(192,38,211,0.08)", border: "1px solid rgba(192,38,211,0.3)" }}>
          <div className="eyebrow" style={{ color: "var(--corruption-soft)", marginBottom: 4 }}>LORE FRAGMENT · 03/05</div>
          <div style={{ fontSize: 11, color: "var(--bone-soft)", fontStyle: "italic", lineHeight: 1.5 }}>
            "หล่อนเคยเป็นคนเมือง ก่อนจะถูกท่านขุนสั่งฆ่า…<br/>
            ตอนนี้หัวของหล่อนยังลอยตามกลิ่นเลือดทุกค่ำคืน"
          </div>
        </div>

        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}

window.SpiritDetailScreen = SpiritDetailScreen;
window.SectionLabel = SectionLabel;
window.StatRow = StatRow;
