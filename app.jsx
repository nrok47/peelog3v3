// app.jsx — compose all screens into a design canvas

function App() {
  return (
    <DesignCanvas>
      <DCSection
        id="screens"
        title="จอมขมังเวทน้อย · ผีไทยป่วนเมือง"
        subtitle="Core game screens · 390×844 mobile portrait · Thai folk x devilman tone"
      >
        <DCArtboard id="battle" label="01 · Battle (ATB)" width={390} height={844}>
          <BattleScreen />
        </DCArtboard>
        <DCArtboard id="detail" label="02 · Spirit Detail · Core/Frame/Mass" width={390} height={844}>
          <SpiritDetailScreen />
        </DCArtboard>
        <DCArtboard id="map" label="03 · Roguelike Map" width={390} height={844}>
          <MapScreen />
        </DCArtboard>
        <DCArtboard id="roster" label="04 · Spirit Roster" width={390} height={844}>
          <RosterScreen />
        </DCArtboard>
        <DCArtboard id="codex" label="05 · Codex · Element + Damage Formula" width={390} height={844}>
          <ElementCodexScreen />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="forge"
        title="โรงหลอม · Forge"
        subtitle="ตีบวก Frame + หลอม Spirit Mass (PoE-style reroll) — สองแท็บในหน้าเดียว"
      >
        <DCArtboard id="forge-frame" label="06 · Forge · ตีบวก Frame" width={390} height={844}>
          <ForgeEnhancementScreen />
        </DCArtboard>
        <DCArtboard id="forge-mass" label="07 · Forge · หลอมมวล (Reroll)" width={390} height={844}>
          <ForgeRerollScreen />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="adventure"
        title="ผจญภัย · Adventure Scenes"
        subtitle="Hybrid engine: Twine narrative node ฝังในห้อง Roguelike — ตัวเลือก 2-3 ทาง · กระทบ Corruption / Bond / ของ"
      >
        <DCArtboard id="adv-event" label="08 · Adventure · Discovery Event" width={390} height={844}>
          <AdventureScreen />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="depth"
        title="ลึกลงไป · Phase 2 Depth"
        subtitle="Skill Tree (ย่อยตำราใจ) · ระบบ build identity ที่ทำให้ผีตัวเดียวกันเล่นต่างกันได้"
      >
        <DCArtboard id="skill-tree" label="09 · Skill Tree · ตำราย่อยใจ" width={390} height={844}>
          <SkillTreeScreen />
        </DCArtboard>
        <DCArtboard id="amulet" label="10 · Amulet Slots · 4 สล็อตยันต์" width={390} height={844}>
          <AmuletScreen />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="endgame"
        title="ปลายทาง · Phase 3 Endgame"
        subtitle="Evolution / Awakening + Corruption Ending — บทสรุปที่เปลี่ยนตาม Corruption สะสม"
      >
        <DCArtboard id="evolution" label="11 · Evolution · พิธีปลุกร่าง" width={390} height={844}>
          <EvolutionScreen />
        </DCArtboard>
        <DCArtboard id="corruption-ending" label="12 · Corruption Ending · บทสรุป" width={390} height={844}>
          <CorruptionEndingScreen />
        </DCArtboard>
      </DCSection>

      <DCPostIt top={120} left={60} rotate={-3} width={220}>
        <strong>System map · v2</strong><br />
        Battle 3v3 (ฝ่ายเรา vs ศัตรู 3 ตัว) + Codex ใหม่<br />
        ระบบธาตุปรับเป็น 5: ไฟ/ลม/ดิน/น้ำ + อาถรรพ์
      </DCPostIt>

      <DCPostIt bottom={220} right={60} rotate={2} width={200}>
        <strong>วิญญาณ = Modular</strong><br />
        Core (locked) + Frame (+12) + Mass (Affixes สุ่ม) เหมือน PoE item ใส่ในร่างเบย์เบลด
      </DCPostIt>

      <DCPostIt bottom={80} right={300} rotate={-1} width={210}>
        <strong>ULT ready cue</strong><br />
        เมื่อ GUTS เต็ม 100 ปุ่ม "ทัณฑ์อาถรรพ์" จะเรืองแสงม่วง-ทอง พร้อมหัวข้อ ★ READY
      </DCPostIt>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
