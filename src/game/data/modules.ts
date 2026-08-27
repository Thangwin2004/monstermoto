import { ModuleData } from "../entities/Module";

/**
 * 7 module MVP — tiếng Việt.
 * Các chỉ số cơ bản được tinh chỉnh vừa phải để tạo đất diễn cho nâng cấp Xưởng Xe và Thẻ bài.
 */
export const ModuleDefinitions: Record<string, ModuleData> = {
  engine: {
    id: "engine",
    name: "Động Cơ",
    type: "engine",
    rarity: "common",
    maxHp: 220,
    armor: 4,
    tags: ["engine"],
    color: 0x3366cc,
    emoji: "🚙",
  },

  machine_gun: {
    id: "machine_gun",
    name: "Súng Máy",
    type: "weapon",
    rarity: "common",
    maxHp: 120,
    armor: 2,
    tags: ["projectile", "physical"],
    color: 0xaa3333,
    emoji: "🔫",
    attack: {
      damage: 13,
      cooldown: 0.36,
      range: 580,
      projectileSpeed: 1000,
      projectileCount: 1,
    },
  },

  rocket: {
    id: "rocket",
    name: "Tên Lửa",
    type: "weapon",
    rarity: "rare",
    maxHp: 130,
    armor: 2,
    tags: ["explosive", "projectile"],
    color: 0xf97316,
    emoji: "🚀",
    attack: {
      damage: 35,
      cooldown: 1.15,
      range: 620,
      projectileSpeed: 680,
      aoeRadius: 65,
    },
  },

  laser: {
    id: "laser",
    name: "Pháo Laser",
    type: "weapon",
    rarity: "epic",
    maxHp: 110,
    armor: 2,
    tags: ["laser", "energy"],
    color: 0x00e5ff,
    emoji: "⚡",
    attack: {
      damage: 32,
      cooldown: 0.85,
      range: 660,
      projectileSpeed: 1350,
    },
  },

  shield: {
    id: "shield",
    name: "Khiên",
    type: "defense",
    rarity: "common",
    maxHp: 280,
    armor: 8,
    tags: ["defense"],
    color: 0x888899,
    emoji: "🛡️",
    adjacencyEffects: [
      {
        target: "behind",
        stat: "damageTaken",
        value: 0.75,
        isMultiplier: true,
      },
    ],
  },

  fuel_tank: {
    id: "fuel_tank",
    name: "Bình Xăng",
    type: "support",
    rarity: "common",
    maxHp: 70,
    armor: 0,
    tags: ["fire", "support", "explosive"],
    color: 0xcc6600,
    emoji: "⛽",
    adjacencyEffects: [
      {
        target: "adjacent",
        requireTag: "fire",
        stat: "damage",
        value: 1.5,
        isMultiplier: true,
      },
    ],
    activeId: "detonate",
    activeDescription:
      "Phá hủy module này. Gây sát thương LỬA lớn cho tất cả quái xung quanh.",
  },

  battery: {
    id: "battery",
    name: "Pin",
    type: "support",
    rarity: "common",
    maxHp: 80,
    armor: 0,
    tags: ["energy", "support"],
    color: 0x33aa66,
    emoji: "🔋",
    adjacencyEffects: [
      {
        target: "adjacent",
        requireTag: "energy",
        stat: "attackSpeed",
        value: 1.25,
        isMultiplier: true,
      },
    ],
  },
};

export function getAllModuleIds(): string[] {
  return Object.keys(ModuleDefinitions);
}

export function getWeaponModules(): ModuleData[] {
  return Object.values(ModuleDefinitions).filter((m) => m.type === "weapon");
}

export function getLootableModules(): ModuleData[] {
  return Object.values(ModuleDefinitions).filter((m) => m.type !== "engine");
}
