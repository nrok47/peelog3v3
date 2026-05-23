// ═══════════════════════════════════════════════════
//  GameState — global singleton
//  โหลดข้อมูลทั้งหมดจาก Supabase ครั้งเดียว
//  เข้าถึงผ่าน window.GS ทุกที่
// ═══════════════════════════════════════════════════

window.GS = null;

window.loadGameState = async function () {
  const player = await SpiritDB.Auth.getPlayer();
  if (!player) return null;

  const [ghosts, save] = await Promise.all([
    SpiritDB.GhostService.getAll(player.id),
    SpiritDB.SaveService.getCurrent(player.id),
  ]);

  const team = (ghosts || [])
    .filter(g => g.is_in_team)
    .sort((a, b) => a.team_slot - b.team_slot);

  window.GS = {
    player,
    ghosts:    ghosts || [],
    team,
    save,
    inventory: player.inventory || [],

    // ── อัปเดต ghost แล้ว sync กลับ cache
    async updateGhost(ghostId, changes) {
      const updated = await SpiritDB.GhostService.update(ghostId, changes);
      const idx = this.ghosts.findIndex(g => g.id === ghostId);
      if (idx >= 0) this.ghosts[idx] = { ...this.ghosts[idx], ...updated };
      this.team = this.ghosts.filter(g => g.is_in_team).sort((a,b) => a.team_slot - b.team_slot);
      window._gsRefresh?.();
      return updated;
    },

    // ── บันทึก decision ใน adventure
    async addDecision(decision) {
      if (!this.save) return;
      const updated = await SpiritDB.SaveService.addDecision(
        this.save.id, this.save.decisions || [], decision
      );
      this.save = updated;
      window._gsRefresh?.();
      return updated;
    },

    // ── จัดทีมใหม่
    async setTeam(slots) {
      await SpiritDB.GhostService.setTeam(this.player.id, slots);
      this.ghosts.forEach(g => { g.is_in_team = false; g.team_slot = null; });
      slots.forEach(s => {
        const g = this.ghosts.find(x => x.id === s.ghostId);
        if (g) { g.is_in_team = true; g.team_slot = s.slot; }
      });
      this.team = this.ghosts.filter(g => g.is_in_team).sort((a,b) => a.team_slot - b.team_slot);
      window._gsRefresh?.();
    },

    // ── reload ทั้งหมดจาก DB
    async refresh() {
      const fresh = await loadGameState();
      window._gsRefresh?.();
      return fresh;
    },
  };

  console.log(`✅ GS loaded: ${player.username} | ผี ${ghosts?.length} ตัว | save บท ${save?.chapter}`);
  return window.GS;
};
