/**
 * Enemy archetype definitions for data-driven spawning.
 */

export type EnemyArchetype =
  | "runner"
  | "tank"
  | "spitter"
  | "jumper"
  | "swarm"
  | "bomber"
  | "colossus"
  | "stalker"
  | "acid_queen";

export interface EnemyDefinition {
  id: EnemyArchetype;
  name: string;
  maxHp: number;
  speed: number; // px/s
  radius: number; // collision radius
  damage: number; // damage on crash
  color: number;
  emoji: string;
  xpReward: number;
  scrapReward: number;

  // Archetype behavior
  behavior: "rush" | "ranged" | "leap" | "swarm";
  attackRange?: number; // for ranged enemies
  attackCooldown?: number; // seconds
  attackDamage?: number;
  leapRange?: number; // for jumpers
  isExplosive?: boolean; // explodes on death
}

export const EnemyDefinitions: Record<EnemyArchetype, EnemyDefinition> = {
  runner: {
    id: "runner",
    name: "Quái Chạy Nhanh",
    maxHp: 18,
    speed: 180,
    radius: 22,
    damage: 6,
    color: 0xcc3333,
    emoji: "🏃",
    xpReward: 12,
    scrapReward: 1,
    behavior: "rush",
  },

  tank: {
    id: "tank",
    name: "Quái Thiết Giáp",
    maxHp: 65,
    speed: 75,
    radius: 38,
    damage: 12,
    color: 0x666633,
    emoji: "🛡️",
    xpReward: 35,
    scrapReward: 3,
    behavior: "rush",
  },

  spitter: {
    id: "spitter",
    name: "Quái Phun Gai",
    maxHp: 26,
    speed: 95,
    radius: 24,
    damage: 6,
    color: 0x22c55e,
    emoji: "🟢",
    xpReward: 20,
    scrapReward: 2,
    behavior: "ranged",
    attackRange: 400,
    attackCooldown: 2.0,
    attackDamage: 8,
  },

  jumper: {
    id: "jumper",
    name: "Quái Nhảy Cóc",
    maxHp: 24,
    speed: 135,
    radius: 24,
    damage: 10,
    color: 0xaa44aa,
    emoji: "🦘",
    xpReward: 18,
    scrapReward: 2,
    behavior: "leap",
    leapRange: 300,
  },

  swarm: {
    id: "swarm",
    name: "Bầy Tiểu Quái",
    maxHp: 6,
    speed: 210,
    radius: 14,
    damage: 3,
    color: 0xef4444,
    emoji: "🐜",
    xpReward: 6,
    scrapReward: 1,
    behavior: "swarm",
  },

  bomber: {
    id: "bomber",
    name: "Quái Cảm Tử Phát Nổ",
    maxHp: 24,
    speed: 190,
    radius: 22,
    damage: 14,
    color: 0xf97316,
    emoji: "💣",
    xpReward: 25,
    scrapReward: 2,
    behavior: "rush",
    isExplosive: true,
  },

  colossus: {
    id: "colossus",
    name: "Cự Thú Thiết Giáp",
    maxHp: 220,
    speed: 60,
    radius: 46,
    damage: 26,
    color: 0x3f3f46,
    emoji: "👹",
    xpReward: 80,
    scrapReward: 6,
    behavior: "rush",
  },

  stalker: {
    id: "stalker",
    name: "Sát Thủ Bóng Đêm",
    maxHp: 42,
    speed: 220,
    radius: 22,
    damage: 12,
    color: 0x8b5cf6,
    emoji: "⚡",
    xpReward: 30,
    scrapReward: 3,
    behavior: "rush",
  },

  acid_queen: {
    id: "acid_queen",
    name: "Nữ Chúa Axit",
    maxHp: 95,
    speed: 85,
    radius: 34,
    damage: 14,
    color: 0x10b981,
    emoji: "☣️",
    xpReward: 55,
    scrapReward: 5,
    behavior: "ranged",
    attackRange: 420,
    attackCooldown: 1.8,
    attackDamage: 10,
  },
};
