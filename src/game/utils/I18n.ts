import { EventBus } from "./EventBus";

export type Language = "vi" | "en";

const STORAGE_KEY = "monster_convoy_language";

const messages: Record<Language, Record<string, string>> = {
  vi: {
    "menu.title": "QUÁI VẬT\nHỘ TỐNG",
    "menu.subtitle": "ROGUELITE BATTLE",
    "menu.play": "CHƠI NGAY",
    "menu.garage": "XƯỞNG XE",
    "menu.tagline": "Thu thập phế liệu • Nâng cấp chiến xa • Tiêu diệt trùm",
    "garage.title": "XƯỞNG XE CHIẾN ĐẤU",
    "garage.scrap": "🔩 PHẾ LIỆU: {value}",
    "garage.maxed": "TỐI ĐA",
    "garage.level": "Cấp {cur}/{max}",
    "garage.tip": "💡 Nâng cấp vĩnh viễn áp dụng cho mọi chuyến đi chiến đấu",
    "garage.current": "Hiện tại: {value} ({desc})",
    "garage.name.hull": "Giáp & Máu Xe",
    "garage.desc.hull": "Tăng HP tối đa",
    "garage.name.damage": "Sức Mạnh Hỏa Lực",
    "garage.desc.damage": "Tăng sát thương",
    "garage.name.attackSpeed": "Tốc Độ Bắn",
    "garage.desc.attackSpeed": "Tăng tốc độ bắn",
    "garage.name.crit": "Bắn Chí Mạng",
    "garage.desc.crit": "Tăng tỉ lệ chí mạng",
    "garage.name.magnet": "Nam Châm Hút",
    "garage.desc.magnet": "Mở rộng bán kính hút",
    "garage.name.heavyWeapon": "Vũ Khí Hạng Nặng",
    "garage.desc.heavyWeapon": "Tăng uy lực Tên Lửa & Laser",
    "garage.name.regen": "Tự Động Sửa Chữa",
    "garage.desc.regen": "Hồi phục HP/giây",
    "garage.name.scrapBonus": "Khai Thác Phế Liệu",
    "garage.desc.scrapBonus": "Tăng phế liệu thu được",
    "settings.game": "CÀI ĐẶT",
    "settings.run": "CÀI ĐẶT",
    "settings.sfx": "Âm thanh",
    "settings.bgm": "Nhạc nền",
    "settings.shake": "Rung màn hình",
    "settings.shakeSubOn": "Bật cảm giác rung lực chiến đấu",
    "settings.shakeSubOff": "Tắt hiệu ứng rung màn hình",
    "settings.particles": "Hiệu ứng đồ họa",
    "settings.particlesSubOn": "Rực rỡ: Hạt & số sát thương",
    "settings.particlesSubOff": "Tiết kiệm: Tối ưu 60 FPS mượt mà",
    "settings.on": "BẬT",
    "settings.off": "TẮT",
    "settings.language": "Ngôn ngữ",
    "settings.vietnamese": "Tiếng Việt",
    "settings.english": "English",
    "settings.helpTitle": "HƯỚNG DẪN CHIẾN ĐẤU",
    "settings.helpBody":
      "• Vuốt kéo để lái xe tránh đâm quái vật trực diện.\n• Thu thập Phế liệu để nâng cấp vĩnh viễn trong Xưởng Xe.\n• Trang bị Tên Lửa và Laser để quét sạch quái cự ly xa!",
    "settings.reset": "XÓA DỮ LIỆU",
    "settings.resetTitle": "⚠️ ĐẶT LẠI TIẾN TRÌNH?",
    "settings.resetBody":
      "Bạn có chắc muốn xóa toàn bộ tiến trình nâng cấp và số phế liệu đã tích lũy không?",
    "settings.cancel": "HỦY BỎ",
    "settings.confirm": "ĐỒNG Ý",
    "settings.version": "Monster Convoy",
    "upgrade.title": "LÊN CẤP ĐOÀN XE!",
    "upgrade.subtitle": "Chạm vào thẻ bài để gia tăng hỏa lực chiến xa",
    "upgrade.scope": "ÁP DỤNG: {value}",
    "hud.level": "CẤP {value}",
    "hud.distance": "📏 {value}m",
    "hud.scrap": "🔩 {value}",
    "hud.kills": "💀 {value}",
    "hud.bossName": "BOSS: KẺ THU THẬP",
    "boss.overlord": "CỰ THÚ SA MẠC THỐNG TRỊ",
    "buff.rapid": "⚡ CUỒNG NỘ {sec}s",
    "buff.invincible": "🛡️ BẤT TỬ {sec}s",
    "pickup.rapid": "HỎA LỰC CUỒNG NỘ (10S)!",
    "pickup.shield": "KHIÊN VÔ ĐỊCH (8S)!",
    "pickup.heal": "HỒI PHỤC CHIẾN XA (+100 HP)!",
    "pickup.nuke": "BOM TẬN DIỆT QUÁI VẬT!",
    "pickup.star": "LÊN SAO VŨ KHÍ TỰ ĐỘNG (+1★)!",
    "pickup.starUp": "⭐ {name} LÊN CẤP {lvl}!",
    "pickup.maxWeapon": "⭐ VŨ KHÍ ĐÃ TỐI ĐA (+150 HP!)",
    "weapon.machine_gun": "Súng Máy",
    "weapon.rocket": "Tên Lửa",
    "weapon.laser": "Pháo Laser",
    "weapon.shield": "Khiên",
    "gameover.victory": "CHIẾN THẮNG!",
    "gameover.defeat": "HẾT LƯỢT",
    "gameover.replay": "CHƠI LẠI",
    "gameover.upgrade": "NÂNG CẤP XE",
    "gameover.home": "TRANG CHỦ",
    "stats.distance": "Quãng đường",
    "stats.kills": "Quái tiêu diệt",
    "stats.level": "Cấp độ đạt được",
    "stats.scrapRun": "Phế liệu nhận được",
    "stats.scrapTotal": "Tổng phế liệu ví",
    "stats.time": "Thời gian sinh tồn",
    "stats.score": "ĐIỂM",
    "stats.best": "KỶ LỤC",
  },
  en: {
    "menu.title": "MONSTER\nCONVOY",
    "menu.subtitle": "ROGUELITE BATTLE",
    "menu.play": "PLAY NOW",
    "menu.garage": "GARAGE",
    "menu.tagline": "Collect scrap • Upgrade your convoy • Defeat bosses",
    "garage.title": "WAR RIG GARAGE",
    "garage.scrap": "🔩 SCRAP: {value}",
    "garage.maxed": "MAX",
    "garage.level": "Level {cur}/{max}",
    "garage.tip": "💡 Permanent upgrades apply to all future battle runs",
    "garage.current": "Current: {value} ({desc})",
    "garage.name.hull": "Hull & Armor",
    "garage.desc.hull": "Max HP bonus",
    "garage.name.damage": "Firepower",
    "garage.desc.damage": "Base damage bonus",
    "garage.name.attackSpeed": "Attack Speed",
    "garage.desc.attackSpeed": "Faster fire rate",
    "garage.name.crit": "Critical Strike",
    "garage.desc.crit": "Crit chance & dmg",
    "garage.name.magnet": "Scrap Magnet",
    "garage.desc.magnet": "Wider pickup radius",
    "garage.name.heavyWeapon": "Heavy Ordinance",
    "garage.desc.heavyWeapon": "Missile & Laser buff",
    "garage.name.regen": "Auto Repair",
    "garage.desc.regen": "HP regen per second",
    "garage.name.scrapBonus": "Scrap Salvage",
    "garage.desc.scrapBonus": "More scrap drops",
    "settings.game": "SETTINGS",
    "settings.run": "SETTINGS",
    "settings.sfx": "Sound FX",
    "settings.bgm": "Music",
    "settings.shake": "Screen Shake",
    "settings.shakeSubOn": "Tactile vibration feedback on impact",
    "settings.shakeSubOff": "Reduced motion (no shake)",
    "settings.particles": "Visual Effects",
    "settings.particlesSubOn": "Vibrant: Particles & damage numbers",
    "settings.particlesSubOff": "Battery Saver: Optimized 60 FPS",
    "settings.on": "ON",
    "settings.off": "OFF",
    "settings.language": "Language",
    "settings.vietnamese": "Tiếng Việt",
    "settings.english": "English",
    "settings.helpTitle": "BATTLE GUIDE",
    "settings.helpBody":
      "• Drag to steer convoy and dodge incoming monsters.\n• Collect Scrap to permanently upgrade your war rig.\n• Equip Rockets and Lasers to snipe distant foes!",
    "settings.reset": "CLEAR DATA",
    "settings.resetTitle": "⚠️ RESET PROGRESS?",
    "settings.resetBody":
      "Are you sure you want to erase all garage upgrades and stored scrap?",
    "settings.cancel": "CANCEL",
    "settings.confirm": "CONFIRM",
    "settings.version": "Monster Convoy",
    "upgrade.title": "CONVOY LEVEL UP!",
    "upgrade.subtitle": "Tap a card to increase your battle firepower",
    "upgrade.scope": "APPLIES TO: {value}",
    "hud.level": "LEVEL {value}",
    "hud.distance": "📏 {value}m",
    "hud.scrap": "🔩 {value}",
    "hud.kills": "💀 {value}",
    "hud.bossName": "BOSS: THE HARVESTER",
    "boss.overlord": "CANYON OVERLORD COLOSSUS",
    "buff.rapid": "⚡ FURY {sec}s",
    "buff.invincible": "🛡️ INVINCIBLE {sec}s",
    "pickup.rapid": "FURY FIREPOWER (10S)!",
    "pickup.shield": "INVINCIBLE SHIELD (8S)!",
    "pickup.heal": "CONVOY REPAIR (+100 HP)!",
    "pickup.nuke": "TACTICAL NUKE DETONATION!",
    "pickup.star": "AUTO WEAPON STAR UP (+1★)!",
    "pickup.starUp": "⭐ {name} TIER {lvl}!",
    "pickup.maxWeapon": "⭐ ALL WEAPONS MAXED (+150 HP!)",
    "weapon.machine_gun": "Machine Gun",
    "weapon.rocket": "Rocket Launcher",
    "weapon.laser": "Laser Cannon",
    "weapon.shield": "Energy Shield",
    "gameover.victory": "VICTORY!",
    "gameover.defeat": "RUN OVER",
    "gameover.replay": "PLAY AGAIN",
    "gameover.upgrade": "UPGRADE",
    "gameover.home": "HOME",
    "stats.distance": "Distance",
    "stats.kills": "Monsters defeated",
    "stats.level": "Level reached",
    "stats.scrapRun": "Scrap earned",
    "stats.scrapTotal": "Wallet scrap",
    "stats.time": "Survival time",
    "stats.score": "SCORE",
    "stats.best": "BEST",
  },
};

const garageEnglish: Record<string, { name: string; shortDesc: string }> = {
  hull: { name: "Hull & Armor", shortDesc: "Max HP bonus" },
  damage: { name: "Firepower", shortDesc: "Base damage bonus" },
  attackSpeed: { name: "Fire Rate", shortDesc: "Faster attack speed" },
  crit: { name: "Critical Strike", shortDesc: "Crit chance & dmg" },
  magnet: { name: "Scrap Magnet", shortDesc: "Expand magnet radius" },
  heavyWeapon: { name: "Heavy Weapons", shortDesc: "Boost Rocket & Laser" },
  regen: { name: "Auto Repair", shortDesc: "Heal HP per second" },
  scrapBonus: { name: "Scrap Mining", shortDesc: "Earn more scrap" },
};

/** All 24 Upgrade Cards Mapped to English Names */
const upgradeNamesEnglish: Record<string, string> = {
  star_machine_gun: "⭐ Star Up Machine Gun",
  star_rocket: "⭐ Star Up Rocket Launcher",
  star_laser: "⭐ Star Up Laser Cannon",
  star_shield: "⭐ Star Up Energy Shield",
  card_get_rocket: "🚀 Unlock Rocket Pod",
  card_get_laser: "⚡ Unlock Laser Cannon",
  card_get_shield: "🛡️ Unlock Energy Shield",
  card_get_battery: "🔋 Equip Capacitor Battery",
  extra_bullet: "+1 Projectile",
  sharp_ammo: "Armor-Piercing Rounds",
  rapid_fire: "Rapid Fire Trigger",
  armor_plating: "Heavy Armor Plates",
  repair_kit: "Lead Engine Repair",
  full_repair: "Emergency Convoy Overhaul",
  ignite_bullets: "Incendiary Rounds",
  shock_bullets: "Shock Paralyzer Rounds",
  critical_hits: "Critical Strike Ammo",
  explosion_on_kill: "Chain Reaction Corpse Blast",
  damage_surge: "Firepower Surge",
  shield_regen: "Forcefield Restoration",
  double_fire: "Ultimate Twin Barrels",
  laser_overcharge_master: "Hyperthermal Photonic Cannon",
  berserk_engine: "Overclocked Berserk Engine",
};

/** All 24 Upgrade Cards Mapped to English Descriptions */
const upgradeDescEnglish: Record<string, string> = {
  star_machine_gun:
    "Upgrade +1 Star ⭐ for Machine Gun: +15% Damage & extra focused bullet stream.",
  star_rocket:
    "Upgrade +1 Star ⭐ for Rocket: +40% AOE Blast Damage & extra pod.",
  star_laser:
    "Upgrade +1 Star ⭐ for Laser: +45% Damage, range & beam piercing.",
  star_shield:
    "Upgrade +1 Star ⭐ for Shield: +120 Max HP & reinforced deflection.",
  card_get_rocket:
    "Equip Rocket Pod Tier 1: Fires explosive homing missiles at distant swarms.",
  card_get_laser:
    "Equip Laser Cannon Tier 1: Fires continuous energy beam piercing enemies.",
  card_get_shield:
    "Equip Shield Module Tier 1: Grants +150 HP and absorbs collisions.",
  card_get_battery: "+35% Attack speed for all Energy weapons.",
  extra_bullet: "Fires +1 extra bullet per shot.",
  sharp_ammo: "Permanently increases all weapons base damage by +4.",
  rapid_fire: "+20% Attack speed & fire rate for all weapons.",
  armor_plating: "All convoy vehicles take 12% reduced damage.",
  repair_kit: "Immediately restores 80 HP to the lead engine.",
  full_repair: "Restores 50 HP to all vehicles in the convoy.",
  ignite_bullets: "Bullets have a 35% chance to continuously burn enemies.",
  shock_bullets: "Bullets have a 30% chance to shock and slow monsters.",
  critical_hits: "+20% Critical hit chance dealing 2x damage.",
  explosion_on_kill:
    "Defeated monsters explode, dealing AOE damage to nearby foes.",
  damage_surge: "Permanently increases entire convoy damage by +50%.",
  shield_regen: "Shield regenerates 6 HP/sec when not taking damage.",
  double_fire: "Machine Gun fires +1 additional focused projectile.",
  laser_overcharge_master:
    "Laser Cannon deals +60% damage and pierces through all enemies.",
  berserk_engine: "+80% Attack speed, +40% damage, but costs -30 Max HP.",
};

const targetLabelEnglish: Record<string, string> = {
  "🔫 Súng Máy & Vũ Khí Đạn": "🔫 Machine Gun & Ballistics",
  "🔫 Súng Máy (Hiệu ứng Lửa)": "🔫 Machine Gun (Fire Effect)",
  "🔫 Súng Máy (Hiệu ứng Điện)": "🔫 Machine Gun (Shock Effect)",
  "🔫 Súng Máy": "🔫 Machine Gun",
  "🚀 Bệ Phóng Tên Lửa": "🚀 Rocket Launcher",
  "🚀 Tên Lửa": "🚀 Rocket Launcher",
  "⚡ Pháo Laser Xuyên Phá": "⚡ Piercing Laser Cannon",
  "⚡ Pháo Laser & Năng Lượng": "⚡ Laser & Energy Weapons",
  "⚡ Pháo Laser": "⚡ Laser Cannon",
  "🛡️ Khiên Bảo Vệ": "🛡️ Energy Shield",
  "🛡️ Khiên Đầu Xe": "🛡️ Front Energy Shield",
  "🛡️ Khiên Năng Lượng": "🛡️ Energy Shield",
  "🛡️ Khiên": "🛡️ Energy Shield",
  "🔋 Pin Năng Lượng Tụ Điện": "🔋 Capacitor Battery",
  "🌐 Tất Cả Vũ Khí": "🌐 All Weapons",
  "🌐 Toàn Bộ Đoàn Xe": "🌐 Entire Convoy",
  "🚙 Động Cơ Đầu Tàu": "🚙 Lead Engine",
  "💀 Toàn Bộ Quái Bị Hạ": "💀 Defeated Monsters",
  "⚠️ Động Cơ & Vũ Khí": "⚠️ Engine & Weapons",
  "🚚 Toàn Đoàn Xe": "🚚 Entire Convoy",
};

let language: Language = "vi";
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "vi") language = stored;
} catch {
  // Storage can be unavailable in an embedded host.
}

export const I18n = {
  get language(): Language {
    return language;
  },
  t(key: string, values: Record<string, string | number> = {}) {
    const template = messages[language][key] ?? messages.vi[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (_, name: string) =>
      String(values[name] ?? ""),
    );
  },
  weaponName(id: string) {
    return this.t(`weapon.${id}`) || id;
  },
  garageName(id: string, fallback: string) {
    return language === "en" ? (garageEnglish[id]?.name ?? fallback) : fallback;
  },
  garageShortDesc(id: string, fallback: string) {
    return language === "en"
      ? (garageEnglish[id]?.shortDesc ?? fallback)
      : fallback;
  },
  upgradeName(id: string, defaultName: string) {
    if (language !== "en") return defaultName;

    // Check dynamic star upgrade pattern: ⭐ Lên Sao [Weapon] (Cấp X)
    const starMatch = defaultName.match(/⭐ Lên Sao (.*?) \(Cấp (\d+)\)/);
    if (starMatch) {
      const weaponMap: Record<string, string> = {
        "Súng Máy": "Machine Gun",
        "Tên Lửa": "Rocket Launcher",
        "Pháo Laser": "Laser Cannon",
        Khiên: "Energy Shield",
      };
      const wName = weaponMap[starMatch[1]] || starMatch[1];
      return `⭐ Star Up ${wName} (Tier ${starMatch[2]})`;
    }

    // Check stack pattern: Name (Tầng X/Y)
    const stackMatch = defaultName.match(/(.*?) \(Tầng (\d+)\/(\d+)\)/);
    if (stackMatch) {
      const baseEn = upgradeNamesEnglish[id] ?? stackMatch[1];
      return `${baseEn} (Tier ${stackMatch[2]}/${stackMatch[3]})`;
    }

    return upgradeNamesEnglish[id] ?? defaultName;
  },
  upgradeDesc(id: string, defaultDesc: string) {
    if (language !== "en") return defaultDesc;

    // Check dynamic star description pattern: Nâng cấp Cấp X: ...
    const lvlMatch = defaultDesc.match(/Nâng cấp Cấp (\d+): (.*)/);
    if (lvlMatch) {
      const lvl = parseInt(lvlMatch[1], 10);
      if (id === "star_machine_gun") {
        return `Tier ${lvl} Upgrade: Fires +1 extra focused projectile stream & +15% damage bonus.`;
      } else if (id === "star_rocket") {
        const perks = [
          "",
          "Heavy armored rockets with 65px AOE blast & +40% damage bonus.",
          "Salvo of 4 rockets (2 forward, 2 angled) with wide 80px AOE detonation.",
          "Micro-Missile Swarm of 6 projectiles obliterating enemy clusters.",
          "Mythic Thermonuclear Evolution: 6 mini-nuke rockets with cascade chain explosions!",
        ];
        return `Tier ${lvl} Upgrade: ${perks[lvl - 1] ?? "Heavy rocket blast upgrade."}`;
      } else if (id === "star_laser") {
        const perks = [
          "",
          "Dual high-energy laser beams piercing 4 monsters & +45% damage bonus.",
          "Triple Laser array (Left, Center, Right) sweeping all 3 lanes.",
          "Quad Radiant Violet Plasma Beams cutting through entire enemy waves!",
          "Hyperthermal Photonic Evolution: 4 Golden Auroral Beams sweeping the roadway!",
        ];
        return `Tier ${lvl} Upgrade: ${perks[lvl - 1] ?? "Continuous laser beam upgrade."}`;
      } else if (id === "star_shield") {
        return `Tier ${lvl} Upgrade: +120 Max HP & reinforced barrier deflection.`;
      }
    }

    return upgradeDescEnglish[id] ?? defaultDesc;
  },
  upgradeTarget(targetLabel: string) {
    if (language !== "en") return targetLabel;

    let res = targetLabel;
    for (const [k, v] of Object.entries(targetLabelEnglish)) {
      if (res.includes(k)) {
        res = res.replace(k, v);
      }
    }
    // Replace dynamic tier text: (Cấp X ➔ ⭐ Cấp Y) or (Cấp X) or (Tầng X/Y)
    res = res.replace(/Cấp\s*(\d+)/g, "Tier $1");
    res = res.replace(/Tầng\s*(\d+)/g, "Tier $1");
    return res;
  },
  rarity(value: string, fallback: string) {
    if (language !== "en") return fallback;
    return (
      (
        {
          common: "COMMON",
          rare: "RARE",
          epic: "EPIC",
          legendary: "LEGENDARY",
          corrupted: "CURSED",
        } as Record<string, string>
      )[value] ?? value
    );
  },
  action(value: string, fallback: string) {
    if (language !== "en") return fallback;
    return (
      (
        {
          upgrade_module: "⭐ STAR UP",
          stat_boost: "✨ UPGRADE",
          new_module: "🆕 NEW WEAPON",
        } as Record<string, string>
      )[value] ?? value
    );
  },
  setLanguage(next: Language) {
    language = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
      document.title =
        next === "en"
          ? "Monster Convoy — Roguelite"
          : "Quái Vật Hộ Tống — Roguelite";
      document.documentElement.lang = next;
    } catch {
      // Storage can be unavailable in an embedded host.
    }
    EventBus.emit("language:changed", next);
  },
};
