// Season หมุนรายเดือน — ใช้ปี-เดือนปัจจุบันเป็น season id (เช่น "2026-06")
// เปลี่ยนเดือน → leaderboard query ใหม่ทั้งหมด เพราะ filter ด้วยค่านี้ ไม่ต้อง reset มือ

export function getCurrentSeason(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getSeasonDaysLeft(): number {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.ceil((endOfMonth.getTime() - now.getTime()) / 86_400_000);
}

export const CURRENT_SEASON = getCurrentSeason();
