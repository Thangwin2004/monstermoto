export type UpgradeRarity =
  "common" | "rare" | "epic" | "legendary" | "corrupted";

export type EffectType =
  | "add_damage"
  | "multiply_damage"
  | "add_projectile"
  | "add_attack_speed"
  | "add_chain_targets"
  | "add_burn_chance"
  | "add_shock_chance"
  | "add_crit_chance"
  | "add_explosion_on_kill"
  | "add_bullet_bounce"
  | "heal_all"
  | "heal_engine"
  | "add_module_hp"
  | "reduce_damage_taken"
  | "shield_regen"
  | "upgrade_module_star"
  | "add_new_module";

export interface UpgradeEffect {
  type: EffectType;
  value: number;
  targetTag?: string;
  moduleId?: string;
}

export interface UpgradeDefinition {
  id: string;
  name: string;
  rarity: UpgradeRarity;
  actionType: "stat_boost" | "upgrade_module" | "new_module";
  targetLabel: string;
  requireTags?: string[];
  description: string;
  effects: UpgradeEffect[];
}

export const UpgradeDefinitions: UpgradeDefinition[] = [
  // ── Lên Sao / Thêm Module ──
  {
    id: "star_machine_gun",
    name: "⭐ Nâng Cấp Súng Máy",
    rarity: "rare",
    actionType: "upgrade_module",
    targetLabel: "🔫 Súng Máy",
    requireTags: ["physical"],
    description:
      "Tăng +1 Sao ⭐ cho Súng Máy: +50% Sát thương, +20% Tốc bắn & thêm đạn.",
    effects: [
      { type: "upgrade_module_star", value: 1, moduleId: "machine_gun" },
    ],
  },
  {
    id: "star_flamethrower",
    name: "⭐ Nâng Cấp Phun Lửa",
    rarity: "rare",
    actionType: "upgrade_module",
    targetLabel: "🔥 Phun Lửa",
    requireTags: ["fire"],
    description:
      "Tăng +1 Sao ⭐ cho Phun Lửa: +50% Sát thương & mở rộng vòm lửa.",
    effects: [
      { type: "upgrade_module_star", value: 1, moduleId: "flamethrower" },
    ],
  },
  {
    id: "star_tesla",
    name: "⭐ Nâng Cấp Tesla",
    rarity: "epic",
    actionType: "upgrade_module",
    targetLabel: "⚡ Tháp Sét Tesla",
    requireTags: ["electric"],
    description:
      "Tăng +1 Sao ⭐ cho Tesla: +50% Sát thương & giật thêm +1 mục tiêu.",
    effects: [{ type: "upgrade_module_star", value: 1, moduleId: "tesla" }],
  },
  {
    id: "star_shield",
    name: "⭐ Nâng Cấp Khiên",
    rarity: "rare",
    actionType: "upgrade_module",
    targetLabel: "🛡️ Khiên Năng Lượng",
    requireTags: ["defense"],
    description:
      "Tăng +1 Sao ⭐ cho Khiên: +120 Máu tối đa & tăng giáp bảo vệ.",
    effects: [{ type: "upgrade_module_star", value: 1, moduleId: "shield" }],
  },
  {
    id: "card_get_shield",
    name: "🛡️ Thêm / Hợp Nhất Khiên",
    rarity: "common",
    actionType: "new_module",
    targetLabel: "🛡️ Khiên Toa Xe",
    description:
      "Thêm Khiên vào đoàn xe. Nếu đã có Khiên: Tự động Hợp Nhất lên sao ⭐!",
    effects: [{ type: "add_new_module", value: 1, moduleId: "shield" }],
  },
  {
    id: "card_get_flame",
    name: "🔥 Thêm / Hợp Nhất Phun Lửa",
    rarity: "common",
    actionType: "new_module",
    targetLabel: "🔥 Súng Phun Lửa",
    description:
      "Thêm Phun Lửa vào đoàn xe. Nếu đã có: Tự động Hợp Nhất lên sao ⭐!",
    effects: [{ type: "add_new_module", value: 1, moduleId: "flamethrower" }],
  },
  {
    id: "card_get_tesla",
    name: "⚡ Thêm / Hợp Nhất Tesla",
    rarity: "rare",
    actionType: "new_module",
    targetLabel: "⚡ Tháp Sét Tesla",
    description:
      "Thêm Tesla phóng điện. Nếu đã có: Tự động Hợp Nhất lên sao ⭐!",
    effects: [{ type: "add_new_module", value: 1, moduleId: "tesla" }],
  },
  {
    id: "card_get_battery",
    name: "🔋 Thêm Bộ Pin Tụ Điện",
    rarity: "common",
    actionType: "new_module",
    targetLabel: "🔋 Pin Năng Lượng",
    description:
      "Tăng +35% Tốc bắn cho tất cả vũ khí Năng Lượng (Tesla, v.v.).",
    effects: [{ type: "add_new_module", value: 1, moduleId: "battery" }],
  },

  // ── Nâng Cấp Chỉ Số ──
  {
    id: "extra_bullet",
    name: "+1 Viên Đạn",
    rarity: "common",
    actionType: "stat_boost",
    targetLabel: "🔫 Súng Máy & Vũ Khí Đạn",
    requireTags: ["projectile"],
    description: "Bắn thêm +1 viên đạn mỗi loạt bắn.",
    effects: [{ type: "add_projectile", value: 1, targetTag: "projectile" }],
  },
  {
    id: "sharp_ammo",
    name: "Đạn Xuyên Giáp",
    rarity: "common",
    actionType: "stat_boost",
    targetLabel: "🌐 Tất Cả Vũ Khí",
    description: "Tất cả vũ khí tăng vĩnh viễn +4 sát thương cơ bản.",
    effects: [{ type: "add_damage", value: 4 }],
  },
  {
    id: "rapid_fire",
    name: "Bắn Siêu Nhanh",
    rarity: "common",
    actionType: "stat_boost",
    targetLabel: "🌐 Tất Cả Vũ Khí",
    description: "Tất cả vũ khí tăng +20% tốc độ bắn.",
    effects: [{ type: "add_attack_speed", value: 0.2 }],
  },
  {
    id: "armor_plating",
    name: "Gia Cố Giáp Thép",
    rarity: "common",
    actionType: "stat_boost",
    targetLabel: "🌐 Toàn Bộ Đoàn Xe",
    description: "Tất cả toa xe giảm 12% sát thương nhận vào.",
    effects: [{ type: "reduce_damage_taken", value: 0.12 }],
  },
  {
    id: "repair_kit",
    name: "Hồi Phục Động Cơ",
    rarity: "common",
    actionType: "stat_boost",
    targetLabel: "🚙 Động Cơ Đầu Tàu",
    description: "Hồi ngay 80 HP cho Động Cơ xe dẫn đầu.",
    effects: [{ type: "heal_engine", value: 80 }],
  },
  {
    id: "full_repair",
    name: "Sửa Chữa Khẩn Cấp",
    rarity: "common",
    actionType: "stat_boost",
    targetLabel: "🌐 Toàn Bộ Đoàn Xe",
    description: "Hồi 50 HP cho tất cả các toa xe trong đoàn.",
    effects: [{ type: "heal_all", value: 50 }],
  },

  // ── Hiếm ──
  {
    id: "ignite_bullets",
    name: "Đạn Cháy Thiêu Đốt",
    rarity: "rare",
    actionType: "stat_boost",
    targetLabel: "🔫 Súng Máy (Hiệu ứng Lửa)",
    requireTags: ["projectile"],
    description: "Đạn có 35% cơ hội thiêu đốt quái vật liên tục.",
    effects: [
      { type: "add_burn_chance", value: 0.35, targetTag: "projectile" },
    ],
  },
  {
    id: "shock_bullets",
    name: "Đạn Tê Liệt Điện",
    rarity: "rare",
    actionType: "stat_boost",
    targetLabel: "🔫 Súng Máy (Hiệu ứng Điện)",
    requireTags: ["projectile"],
    description: "Đạn có 30% cơ hội làm chậm và giật điện quái.",
    effects: [
      { type: "add_shock_chance", value: 0.3, targetTag: "projectile" },
    ],
  },
  {
    id: "critical_hits",
    name: "Đạn Chí Mạng",
    rarity: "rare",
    actionType: "stat_boost",
    targetLabel: "🌐 Tất Cả Vũ Khí",
    description: "+20% tỉ lệ phát đòn Chí Mạng (gây x2 sát thương).",
    effects: [{ type: "add_crit_chance", value: 0.2 }],
  },

  // ── Sử Thi ──
  {
    id: "explosion_on_kill",
    name: "Xác Nổ Dây Chuyền",
    rarity: "epic",
    actionType: "stat_boost",
    targetLabel: "💀 Toàn Bộ Quái Bị Hạ",
    description:
      "Quái vật chết sẽ phát nổ, gây sát thương lan cho quái xung quanh.",
    effects: [{ type: "add_explosion_on_kill", value: 1 }],
  },
  {
    id: "damage_surge",
    name: "Bùng Nổ Hỏa Lực",
    rarity: "epic",
    actionType: "stat_boost",
    targetLabel: "🌐 Tất Cả Vũ Khí",
    description: "Tăng vĩnh viễn +50% toàn bộ sát thương của đoàn xe.",
    effects: [{ type: "multiply_damage", value: 1.5 }],
  },
  {
    id: "shield_regen",
    name: "Tái Tạo Trường Lực",
    rarity: "epic",
    actionType: "stat_boost",
    targetLabel: "🛡️ Khiên Năng Lượng",
    requireTags: ["defense"],
    description: "Khiên tự động hồi 6 HP/giây khi không bị tấn công.",
    effects: [{ type: "shield_regen", value: 6 }],
  },

  // ── Huyền Thoại ──
  {
    id: "double_fire",
    name: "Nòng Đôi Tối Thượng",
    rarity: "legendary",
    actionType: "stat_boost",
    targetLabel: "🔫 Súng Máy",
    requireTags: ["projectile"],
    description: "Súng Máy bắn thêm +2 viên đạn mỗi phát bắn.",
    effects: [{ type: "add_projectile", value: 2, targetTag: "projectile" }],
  },
  {
    id: "chain_lightning_master",
    name: "Bão Sét Hủy Diệt",
    rarity: "legendary",
    actionType: "stat_boost",
    targetLabel: "⚡ Tháp Sét Tesla",
    requireTags: ["electric"],
    description: "Tesla giật thêm +4 mục tiêu, tăng +40% sát thương sấm sét.",
    effects: [
      { type: "add_chain_targets", value: 4, targetTag: "electric" },
      { type: "multiply_damage", value: 1.4, targetTag: "electric" },
    ],
  },

  // ── Bị Nguyền ──
  {
    id: "berserk_engine",
    name: "Động Cơ Quá Tải",
    rarity: "corrupted",
    actionType: "stat_boost",
    targetLabel: "⚠️ Động Cơ & Vũ Khí",
    description: "+80% tốc bắn, +40% sát thương, nhưng giảm -30 HP tối đa.",
    effects: [
      { type: "add_attack_speed", value: 0.8 },
      { type: "multiply_damage", value: 1.4 },
      { type: "add_module_hp", value: -30 },
    ],
  },
];

export function getAvailableUpgrades(
  convoyTags: Set<string>,
): UpgradeDefinition[] {
  return UpgradeDefinitions.filter((u) => {
    if (!u.requireTags || u.requireTags.length === 0) return true;
    return u.requireTags.some((tag) => convoyTags.has(tag));
  });
}
