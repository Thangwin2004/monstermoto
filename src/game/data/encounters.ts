import { EnemyArchetype } from "./enemies";

/**
 * Encounter templates control wave composition and monster density.
 */

export interface WaveEntry {
  type: EnemyArchetype;
  count: number;
  delay?: number; // seconds before this group starts spawning
  interval?: number; // seconds between each spawn in the group
}

export interface EncounterTemplate {
  id: string;
  name: string;
  waves: WaveEntry[];
  duration: number; // how long this encounter lasts (seconds)
  difficulty: number; // 1-10+ scale
}

export const EncounterTemplates: EncounterTemplate[] = [
  // ── Tier 1: 0m - 200m (Khởi đầu) ──
  {
    id: "early_runners",
    name: "Đoàn Tiền Tiêu",
    difficulty: 1,
    duration: 7,
    waves: [{ type: "runner", count: 6, interval: 0.8 }],
  },
  {
    id: "runner_swarm",
    name: "Bầy Tiểu Quái",
    difficulty: 1,
    duration: 8,
    waves: [{ type: "swarm", count: 18, interval: 0.25 }],
  },

  // ── Tier 2: 200m - 500m (Quái Cảm Tử & Thiết Giáp Xuất Hiện) ──
  {
    id: "tank_push",
    name: "Quái Thiết Giáp Dẫn Đường",
    difficulty: 2,
    duration: 10,
    waves: [
      { type: "tank", count: 3, interval: 1.5 },
      { type: "runner", count: 10, interval: 0.5, delay: 1.5 },
    ],
  },
  {
    id: "bomber_rush",
    name: "Cảm Tử Nổ Tung",
    difficulty: 2,
    duration: 9,
    waves: [
      { type: "bomber", count: 6, interval: 0.8 },
      { type: "runner", count: 8, interval: 0.6, delay: 2 },
    ],
  },
  {
    id: "spitter_barrage",
    name: "Pháo Binh Gai Nhọn",
    difficulty: 3,
    duration: 11,
    waves: [
      { type: "spitter", count: 6, interval: 1.2 },
      { type: "swarm", count: 22, interval: 0.2, delay: 2 },
    ],
  },

  // ── Tier 3: 500m - 1000m (Sát Thủ Bóng Đêm & Đợt Càn Quét Dày Đặc) ──
  {
    id: "stalker_ambush",
    name: "Sát Thủ Phục Kích",
    difficulty: 4,
    duration: 12,
    waves: [
      { type: "stalker", count: 6, interval: 0.9 },
      { type: "bomber", count: 6, interval: 0.7, delay: 2 },
      { type: "tank", count: 3, interval: 2.0, delay: 4 },
    ],
  },
  {
    id: "acid_queen_infestation",
    name: "Nữ Chúa Axit Trỗi Dậy",
    difficulty: 4,
    duration: 12,
    waves: [
      { type: "acid_queen", count: 3, interval: 2.0 },
      { type: "spitter", count: 8, interval: 0.8, delay: 1 },
      { type: "runner", count: 14, interval: 0.4, delay: 3 },
    ],
  },
  {
    id: "mega_swarm",
    name: "Đại Họa Châu Chấu",
    difficulty: 5,
    duration: 10,
    waves: [
      { type: "swarm", count: 45, interval: 0.12 },
      { type: "stalker", count: 4, interval: 1.2, delay: 2 },
    ],
  },

  // ── Tier 4: 1000m - 2000m (Cự Thú Thiết Giáp & Hỗn Loạn Tối Thượng) ──
  {
    id: "colossus_siege",
    name: "Cự Thú Cản Đường",
    difficulty: 6,
    duration: 14,
    waves: [
      { type: "colossus", count: 3, interval: 3.0 },
      { type: "bomber", count: 10, interval: 0.6, delay: 2 },
      { type: "acid_queen", count: 4, interval: 1.8, delay: 4 },
    ],
  },
  {
    id: "apocalypse_charge",
    name: "Cuộc Tấn Công Tận Thế",
    difficulty: 7,
    duration: 16,
    waves: [
      { type: "colossus", count: 4, interval: 2.5 },
      { type: "stalker", count: 8, interval: 0.8, delay: 2 },
      { type: "bomber", count: 12, interval: 0.5, delay: 3 },
      { type: "swarm", count: 35, interval: 0.15, delay: 5 },
    ],
  },
  {
    id: "nightmare_highway",
    name: "Đại Lộ Ác Mộng Vĩnh Hằng",
    difficulty: 8,
    duration: 18,
    waves: [
      { type: "colossus", count: 5, interval: 2.0 },
      { type: "acid_queen", count: 6, interval: 1.5, delay: 2 },
      { type: "stalker", count: 10, interval: 0.6, delay: 3 },
      { type: "bomber", count: 15, interval: 0.4, delay: 4 },
      { type: "swarm", count: 50, interval: 0.1, delay: 6 },
    ],
  },
];

export function getEncountersForDifficulty(diff: number): EncounterTemplate[] {
  const minDiff = Math.max(1, diff - 2);
  const maxDiff = diff + 1;
  const matches = EncounterTemplates.filter(
    (e) => e.difficulty >= minDiff && e.difficulty <= maxDiff,
  );
  if (matches.length > 0) return matches;
  return EncounterTemplates;
}
