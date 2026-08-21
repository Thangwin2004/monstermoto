import { ModuleData } from "../entities/Module";

/**
 * 7 module MVP — tiếng Việt.
 */
export const ModuleDefinitions: Record<string, ModuleData> = {
  engine: {
    id: "engine",
    name: "Động Cơ",
    type: "engine",
    rarity: "common",
    maxHp: 350,
    armor: 8,
    tags: ["engine"],
    color: 0x3366cc,
    emoji: "🚙",
  },

  machine_gun: {
    id: "machine_gun",
    name: "Súng Máy",
    type: "weapon",
    rarity: "common",
    maxHp: 150,
    armor: 2,
    tags: ["projectile", "physical"],
    color: 0xaa3333,
    emoji: "🔫",
    attack: {
      damage: 14,
      cooldown: 0.14,
      range: 600,
      projectileSpeed: 1100,
      projectileCount: 1,
    },
  },

  flamethrower: {
    id: "flamethrower",
    name: "Phun Lửa",
    type: "weapon",
    rarity: "common",
    maxHp: 160,
    armor: 2,
    tags: ["fire"],
    color: 0xff6600,
    emoji: "🔥",
    attack: {
      damage: 8,
      cooldown: 0.06,
      range: 280,
      projectileSpeed: 450,
      aoeRadius: 75,
    },
  },

  tesla: {
    id: "tesla",
    name: "Tesla",
    type: "weapon",
    rarity: "rare",
    maxHp: 130,
    armor: 2,
    tags: ["electric", "energy"],
    color: 0x00ccff,
    emoji: "⚡",
    attack: {
      damage: 32,
      cooldown: 0.45,
      range: 450,
      chainTargets: 3,
    },
  },

  shield: {
    id: "shield",
    name: "Khiên",
    type: "defense",
    rarity: "common",
    maxHp: 450,
    armor: 15,
    tags: ["defense"],
    color: 0x888899,
    emoji: "🛡️",
    adjacencyEffects: [
      {
        target: "behind",
        stat: "damageTaken",
        value: 0.7,
        isMultiplier: true,
      },
    ],
  },

  fuel_tank: {
    id: "fuel_tank",
    name: "Bình Xăng",
    type: "support",
    rarity: "common",
    maxHp: 80,
    armor: 0,
    tags: ["fire", "support", "explosive"],
    color: 0xcc6600,
    emoji: "⛽",
    adjacencyEffects: [
      {
        target: "adjacent",
        requireTag: "fire",
        stat: "damage",
        value: 1.6,
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
    maxHp: 90,
    armor: 0,
    tags: ["energy", "support"],
    color: 0x33aa66,
    emoji: "🔋",
    adjacencyEffects: [
      {
        target: "adjacent",
        requireTag: "energy",
        stat: "attackSpeed",
        value: 1.35,
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
