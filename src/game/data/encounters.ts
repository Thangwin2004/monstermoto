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
  // ── Tier 1: 0m - 200m (Khởi đầu - Quái tràn ngập liên tục) ──
  {
    id: "early_runners",
    name: "Đoàn Tiền Tiêu Đột Kích",
    difficulty: 1,
    duration: 6,
    waves: [
      { type: "runner", count: 10, interval: 0.35 },
      { type: "swarm", count: 12, interval: 0.2, delay: 1.0 },
    ],
  },
  {
    id: "runner_swarm",
    name: "Bầy Tiểu Quái Cuồng Nộ",
    difficulty: 1,
    duration: 7,
    waves: [
      { type: "swarm", count: 26, interval: 0.15 },
      { type: "runner", count: 6, interval: 0.4, delay: 1.5 },
    ],
  },
  {
    id: "early_mixed",
    name: "Tổ Hợp Quái Sa Mạc",
    difficulty: 1,
    duration: 7,
    waves: [
      { type: "runner", count: 8, interval: 0.35 },
      { type: "jumper", count: 4, interval: 0.6, delay: 0.8 },
      { type: "spitter", count: 3, interval: 0.8, delay: 1.5 },
    ],
  },

  // ── Tier 2: 200m - 500m (Quái Cảm Tử & Thiết Giáp Xuất Hiện) ──
  {
    id: "tank_push",
    name: "Quái Thiết Giáp Dẫn Đường",
    difficulty: 2,
    duration: 8,
    waves: [
      { type: "tank", count: 4, interval: 1.0 },
      { type: "runner", count: 14, interval: 0.3, delay: 0.5 },
      { type: "swarm", count: 16, interval: 0.18, delay: 1.5 },
    ],
  },
  {
    id: "bomber_rush",
    name: "Cảm Tử Nổ Tung",
    difficulty: 2,
    duration: 8,
    waves: [
      { type: "bomber", count: 8, interval: 0.45 },
      { type: "runner", count: 12, interval: 0.35, delay: 1 },
      { type: "jumper", count: 5, interval: 0.5, delay: 1.5 },
    ],
  },
  {
    id: "spitter_barrage",
    name: "Pháo Binh Gai Nhọn",
    difficulty: 3,
    duration: 9,
    waves: [
      { type: "spitter", count: 8, interval: 0.6 },
      { type: "swarm", count: 28, interval: 0.15, delay: 1 },
      { type: "tank", count: 3, interval: 1.2, delay: 2 },
    ],
  },

  // ── Tier 3: 500m - 1000m (Sát Thủ Bóng Đêm & Đợt Càn Quét Dày Đặc) ──
  {
    id: "stalker_ambush",
    name: "Sát Thủ Phục Kích",
    difficulty: 4,
    duration: 10,
    waves: [
      { type: "stalker", count: 8, interval: 0.5 },
      { type: "bomber", count: 8, interval: 0.4, delay: 1 },
      { type: "tank", count: 4, interval: 1.2, delay: 2 },
      { type: "swarm", count: 24, interval: 0.15, delay: 3 },
    ],
  },
  {
    id: "acid_queen_infestation",
    name: "Nữ Chúa Axit Trỗi Dậy",
    difficulty: 4,
    duration: 10,
    waves: [
      { type: "acid_queen", count: 4, interval: 1.2 },
      { type: "spitter", count: 10, interval: 0.5, delay: 0.8 },
      { type: "runner", count: 18, interval: 0.25, delay: 2 },
    ],
  },
  {
    id: "mega_swarm",
    name: "Đại Họa Châu Chấu",
    difficulty: 5,
    duration: 9,
    waves: [
      { type: "swarm", count: 55, interval: 0.08 },
      { type: "stalker", count: 6, interval: 0.8, delay: 1.5 },
      { type: "bomber", count: 8, interval: 0.5, delay: 2 },
    ],
  },

  // ── Tier 4: 1000m - 2000m (Cự Thú Thiết Giáp & Hỗn Loạn Tối Thượng) ──
  {
    id: "colossus_siege",
    name: "Cự Thú Cản Đường",
    difficulty: 6,
    duration: 12,
    waves: [
      { type: "colossus", count: 4, interval: 1.8 },
      { type: "bomber", count: 14, interval: 0.4, delay: 1.5 },
      { type: "acid_queen", count: 5, interval: 1.2, delay: 2.5 },
      { type: "swarm", count: 35, interval: 0.12, delay: 3 },
    ],
  },
  {
    id: "apocalypse_charge",
    name: "Cuộc Tấn Công Tận Thế",
    difficulty: 7,
    duration: 14,
    waves: [
      { type: "colossus", count: 5, interval: 1.5 },
      { type: "stalker", count: 12, interval: 0.5, delay: 1.5 },
      { type: "bomber", count: 16, interval: 0.35, delay: 2 },
      { type: "swarm", count: 50, interval: 0.1, delay: 3.5 },
    ],
  },
  {
    id: "nightmare_highway",
    name: "Đại Lộ Ác Mộng Vĩnh Hằng",
    difficulty: 8,
    duration: 15,
    waves: [
      { type: "colossus", count: 6, interval: 1.2 },
      { type: "acid_queen", count: 8, interval: 1.0, delay: 1.5 },
      { type: "stalker", count: 14, interval: 0.4, delay: 2 },
      { type: "bomber", count: 20, interval: 0.3, delay: 2.5 },
      { type: "swarm", count: 70, interval: 0.08, delay: 4 },
    ],
  },

  // ── Tier 5: 2500m - 4000m (Bão Cự Thú & Binh Đoàn Hủy Diệt) ──
  {
    id: "titan_onslaught",
    name: "Binh Đoàn Titan Càn Quét",
    difficulty: 10,
    duration: 16,
    waves: [
      { type: "colossus", count: 10, interval: 0.9 },
      { type: "acid_queen", count: 12, interval: 0.8, delay: 1.0 },
      { type: "tank", count: 15, interval: 0.6, delay: 1.5 },
      { type: "bomber", count: 25, interval: 0.25, delay: 2.0 },
      { type: "swarm", count: 90, interval: 0.06, delay: 3.0 },
    ],
  },
  {
    id: "acid_apocalypse",
    name: "Đại Dịch Axit Ăn Mòn",
    difficulty: 12,
    duration: 16,
    waves: [
      { type: "acid_queen", count: 16, interval: 0.7 },
      { type: "spitter", count: 20, interval: 0.4, delay: 1.0 },
      { type: "colossus", count: 8, interval: 1.0, delay: 1.5 },
      { type: "stalker", count: 22, interval: 0.3, delay: 2.0 },
      { type: "swarm", count: 100, interval: 0.05, delay: 3.0 },
    ],
  },

  // ── Tier 6: 4000m - 6000m+ (Địa Ngục Sa Mạc Tận Thế) ──
  {
    id: "hell_highway_armageddon",
    name: "Hỏa Ngục Sa Mạc Tận Thế",
    difficulty: 15,
    duration: 18,
    waves: [
      { type: "colossus", count: 15, interval: 0.7 },
      { type: "acid_queen", count: 18, interval: 0.6, delay: 1.0 },
      { type: "stalker", count: 30, interval: 0.25, delay: 1.5 },
      { type: "bomber", count: 35, interval: 0.2, delay: 2.0 },
      { type: "tank", count: 20, interval: 0.5, delay: 2.5 },
      { type: "swarm", count: 140, interval: 0.04, delay: 3.0 },
    ],
  },
  {
    id: "endless_extinction",
    name: "Cơn Thịnh Nộ Diệt Tuyệt Vĩnh Hằng",
    difficulty: 20,
    duration: 20,
    waves: [
      { type: "colossus", count: 22, interval: 0.5 },
      { type: "acid_queen", count: 24, interval: 0.5, delay: 0.8 },
      { type: "stalker", count: 40, interval: 0.2, delay: 1.2 },
      { type: "bomber", count: 45, interval: 0.15, delay: 1.8 },
      { type: "tank", count: 28, interval: 0.4, delay: 2.2 },
      { type: "swarm", count: 180, interval: 0.03, delay: 2.5 },
    ],
  },
];

export function getEncountersForDifficulty(diff: number): EncounterTemplate[] {
  // Find matching or closest highest difficulty templates for endless scaling
  const minDiff = Math.max(1, diff - 3);
  const maxDiff = diff + 2;
  const matches = EncounterTemplates.filter(
    (e) => e.difficulty >= minDiff && e.difficulty <= maxDiff,
  );
  if (matches.length > 0) return matches;

  // If player reaches ultra-high difficulty (> 20), return the hardest tier encounters
  const maxAvailable = Math.max(...EncounterTemplates.map((e) => e.difficulty));
  return EncounterTemplates.filter((e) => e.difficulty >= maxAvailable - 3);
}
