/**
 * SaveManager handles persistent meta-progression (Garage Workshop Upgrades)
 * and game settings stored in localStorage.
 */

export interface GarageStatConfig {
  id: string;
  name: string;
  icon: string;
  color: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  valuePerLevel: number;
  unit: string;
  isMultiplier?: boolean;
  desc: string;
  shortDesc: string;
}

export const GARAGE_UPGRADE_CONFIGS: Record<string, GarageStatConfig> = {
  hull: {
    id: "hull",
    name: "Giáp & Máu Xe",
    icon: "🛡️",
    color: 0x22c55e,
    maxLevel: 10,
    baseCost: 50,
    costMultiplier: 1.35,
    valuePerLevel: 25,
    unit: "HP",
    desc: "+25 HP Tối đa cho toàn bộ module xe.",
    shortDesc: "Tăng HP tối đa",
  },
  damage: {
    id: "damage",
    name: "Sức Mạnh Hỏa Lực",
    icon: "💥",
    color: 0xef4444,
    maxLevel: 10,
    baseCost: 60,
    costMultiplier: 1.4,
    valuePerLevel: 0.08,
    unit: "%",
    isMultiplier: true,
    desc: "+8% Sát thương cơ bản cho tất cả vũ khí.",
    shortDesc: "Tăng sát thương",
  },
  attackSpeed: {
    id: "attackSpeed",
    name: "Tốc Độ Bắn",
    icon: "⚡",
    color: 0xf59e0b,
    maxLevel: 10,
    baseCost: 55,
    costMultiplier: 1.4,
    valuePerLevel: 0.05,
    unit: "%",
    isMultiplier: true,
    desc: "+5% Tốc độ bắn và nạp đạn cho xe.",
    shortDesc: "Tăng tốc độ bắn",
  },
  crit: {
    id: "crit",
    name: "Bắn Chí Mạng",
    icon: "🎯",
    color: 0xd946ef,
    maxLevel: 10,
    baseCost: 70,
    costMultiplier: 1.45,
    valuePerLevel: 0.03,
    unit: "%",
    isMultiplier: true,
    desc: "+3% Tỉ lệ chí mạng & sát thương.",
    shortDesc: "Tăng tỉ lệ chí mạng",
  },
  magnet: {
    id: "magnet",
    name: "Nam Châm Hút",
    icon: "🧲",
    color: 0x06b6d4,
    maxLevel: 10,
    baseCost: 45,
    costMultiplier: 1.35,
    valuePerLevel: 30,
    unit: "px",
    desc: "+30px Bán kính tự động hút phế liệu.",
    shortDesc: "Mở rộng bán kính hút",
  },
  heavyWeapon: {
    id: "heavyWeapon",
    name: "Vũ Khí Hạng Nặng",
    icon: "🚀",
    color: 0xf97316,
    maxLevel: 10,
    baseCost: 65,
    costMultiplier: 1.4,
    valuePerLevel: 0.10,
    unit: "%",
    isMultiplier: true,
    desc: "+10% Sát thương Tên Lửa & Pháo Laser.",
    shortDesc: "Tăng uy lực Tên Lửa & Laser",
  },
  regen: {
    id: "regen",
    name: "Tự Động Sửa Chữa",
    icon: "🔧",
    color: 0x10b981,
    maxLevel: 10,
    baseCost: 75,
    costMultiplier: 1.45,
    valuePerLevel: 1.2,
    unit: "HP/s",
    desc: "Tự động hồi +1.2 HP/giây khi di chuyển.",
    shortDesc: "Hồi phục HP/giây",
  },
  scrapBonus: {
    id: "scrapBonus",
    name: "Khai Thác Phế Liệu",
    icon: "💰",
    color: 0xeab308,
    maxLevel: 10,
    baseCost: 50,
    costMultiplier: 1.35,
    valuePerLevel: 0.12,
    unit: "%",
    isMultiplier: true,
    desc: "+12% Lượng phế liệu thu được.",
    shortDesc: "Tăng phế liệu thu được",
  },
};

export interface GameSettingsData {
  sfxVolume: number;
  bgmVolume: number;
  sfxMuted: boolean;
  bgmMuted: boolean;
  screenShake: boolean;
  lowParticles: boolean;
}

export interface SaveData {
  totalScrap: number;
  upgrades: Record<string, number>;
  settings: GameSettingsData;
  bestDistance: number;
  totalRuns: number;
  totalKills: number;
}

const STORAGE_KEY = "monster_convoy_save_v1";

const DEFAULT_SETTINGS: GameSettingsData = {
  sfxVolume: 0.8,
  bgmVolume: 0.7,
  sfxMuted: false,
  bgmMuted: false,
  screenShake: true,
  lowParticles: false,
};

export class SaveManager {
  private static data: SaveData = SaveManager.getDefaultSaveData();
  private static initialized: boolean = false;

  private static getDefaultSaveData(): SaveData {
    const upgrades: Record<string, number> = {};
    for (const key of Object.keys(GARAGE_UPGRADE_CONFIGS)) {
      upgrades[key] = 0;
    }
    return {
      totalScrap: 40, // Modest starter scrap
      upgrades,
      settings: { ...DEFAULT_SETTINGS },
      bestDistance: 0,
      totalRuns: 0,
      totalKills: 0,
    };
  }

  public static init() {
    if (this.initialized) return;
    this.load();
    this.initialized = true;
  }

  public static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = {
          totalScrap: parsed.totalScrap ?? 40,
          upgrades: { ...this.getDefaultSaveData().upgrades, ...parsed.upgrades },
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
          bestDistance: parsed.bestDistance ?? 0,
          totalRuns: parsed.totalRuns ?? 0,
          totalKills: parsed.totalKills ?? 0,
        };
      } else {
        this.data = this.getDefaultSaveData();
        this.save();
      }
    } catch {
      this.data = this.getDefaultSaveData();
    }
  }

  public static save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage unavailable
    }
  }

  // ── Currency Management ──
  public static getScrap(): number {
    this.init();
    return this.data.totalScrap;
  }

  public static addScrap(amount: number) {
    this.init();
    this.data.totalScrap = Math.max(0, this.data.totalScrap + Math.round(amount));
    this.save();
  }

  // ── Garage Upgrades ──
  public static getUpgradeLevel(statId: string): number {
    this.init();
    return this.data.upgrades[statId] ?? 0;
  }

  public static getUpgradeCost(statId: string): number {
    const cfg = GARAGE_UPGRADE_CONFIGS[statId];
    if (!cfg) return 999999;
    const curLevel = this.getUpgradeLevel(statId);
    if (curLevel >= cfg.maxLevel) return 0;
    return Math.round(cfg.baseCost * Math.pow(cfg.costMultiplier, curLevel));
  }

  public static canUpgrade(statId: string): boolean {
    const cfg = GARAGE_UPGRADE_CONFIGS[statId];
    if (!cfg) return false;
    const curLevel = this.getUpgradeLevel(statId);
    if (curLevel >= cfg.maxLevel) return false;
    const cost = this.getUpgradeCost(statId);
    return this.data.totalScrap >= cost;
  }

  public static buyUpgrade(statId: string): boolean {
    if (!this.canUpgrade(statId)) return false;
    const cost = this.getUpgradeCost(statId);
    this.data.totalScrap -= cost;
    this.data.upgrades[statId] = (this.data.upgrades[statId] ?? 0) + 1;
    this.save();
    return true;
  }

  public static getStatBonus(statId: string): number {
    const cfg = GARAGE_UPGRADE_CONFIGS[statId];
    if (!cfg) return 0;
    const curLevel = this.getUpgradeLevel(statId);
    return curLevel * cfg.valuePerLevel;
  }

  // ── Game Settings ──
  public static getSettings(): GameSettingsData {
    this.init();
    return this.data.settings;
  }

  public static updateSettings(partial: Partial<GameSettingsData>) {
    this.init();
    this.data.settings = { ...this.data.settings, ...partial };
    this.save();
  }

  // ── Run Records ──
  public static recordRun(distance: number, kills: number) {
    this.init();
    this.data.totalRuns += 1;
    this.data.totalKills += kills;
    if (distance > this.data.bestDistance) {
      this.data.bestDistance = Math.floor(distance);
    }
    this.save();
  }

  public static getBestDistance(): number {
    this.init();
    return this.data.bestDistance;
  }

  // ── Full Reset ──
  public static resetProgress() {
    this.data = this.getDefaultSaveData();
    this.save();
  }
}
