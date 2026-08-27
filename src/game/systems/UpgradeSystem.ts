import { Convoy } from "../entities/Convoy";
import { Module } from "../entities/Module";
import {
  UpgradeDefinition,
  UpgradeEffect,
  getAvailableUpgrades,
} from "../data/upgrades";
import { ModuleDefinitions } from "../data/modules";
import { gameRng } from "../utils/RNG";
import { UPGRADE_CHOICES } from "../constants";
import { EventBus } from "../utils/EventBus";

/**
 * Manages the upgrade selection and application during a run.
 * Uses weighted pools biased toward the player's current build tags.
 */
export class UpgradeSystem {
  public chosenUpgrades: UpgradeDefinition[] = [];

  /** Generate upgrade choices biased toward the player's current tags */
  generateChoices(
    convoy: Convoy,
    count: number = UPGRADE_CHOICES,
  ): UpgradeDefinition[] {
    const tags = convoy.getAllTags();
    const available = getAvailableUpgrades(tags);

    if (available.length === 0) return [];

    const warRig = convoy.modules.find(
      (m) => !m.isDead && m.data.type === "weapon",
    );
    const engine = convoy.getEngine();

    const mgLvl = warRig?.getWeaponLevel("machine_gun") ?? 0;
    const rocketLvl = warRig?.getWeaponLevel("rocket") ?? 0;
    const laserLvl = warRig?.getWeaponLevel("laser") ?? 0;
    const shieldLvl = Math.max(
      engine?.getWeaponLevel("shield") ?? 0,
      warRig?.getWeaponLevel("shield") ?? 0,
    );

    const countChosen = (id: string) =>
      this.chosenUpgrades.filter((u) => u.id === id).length;

    // Build weighted pool & strictly enforce maxPicks limits
    const weighted = available
      .filter((u) => {
        // 1. Max picks filter: once chosen maxPicks times, NEVER appear again!
        const maxLimit = u.maxPicks ?? (u.actionType === "stat_boost" ? 3 : 1);
        if (countChosen(u.id) >= maxLimit) return false;

        // Battery is one-time only
        if (u.id === "card_get_battery" && warRig?.attachments.has("battery"))
          return false;

        // 2. Unlock cards ONLY appear when the weapon is NOT owned yet (level === 0)
        if (u.id === "card_get_rocket" && rocketLvl > 0) return false;
        if (u.id === "card_get_laser" && laserLvl > 0) return false;
        if (u.id === "card_get_shield" && shieldLvl > 0) return false;

        // 3. Star upgrades ONLY appear when the weapon IS ALREADY OWNED (level >= 1) and not maxed (< 5)
        if (u.id === "star_machine_gun" && (mgLvl < 1 || mgLvl >= 5))
          return false;
        if (u.id === "star_rocket" && (rocketLvl < 1 || rocketLvl >= 5))
          return false;
        if (u.id === "star_laser" && (laserLvl < 1 || laserLvl >= 5))
          return false;
        if (u.id === "star_shield" && (shieldLvl < 1 || shieldLvl >= 5))
          return false;

        return true;
      })
      .map((u) => {
        // Deep copy and dynamically inject clear level / stack label
        const customized: UpgradeDefinition = { ...u };
        const curPicks = countChosen(u.id);
        const maxLimit = u.maxPicks ?? (u.actionType === "stat_boost" ? 3 : 1);

        // Stack counter for stackable stat boost cards
        if (u.actionType === "stat_boost" && maxLimit > 1 && maxLimit < 90) {
          customized.name = `${u.name} (Tầng ${curPicks + 1}/${maxLimit})`;
        }

        if (u.id === "star_machine_gun") {
          const nextLvl = mgLvl + 1;
          const nextBullets = Math.min(6, nextLvl + (warRig?.stats.extraProjectiles ?? 0));
          customized.name = `⭐ Lên Sao Súng Máy (Cấp ${nextLvl})`;
          customized.targetLabel = `🔫 Súng Máy (Cấp ${mgLvl} ➔ ⭐ Cấp ${nextLvl})`;
          customized.description = `Nâng cấp Cấp ${nextLvl}: Bắn thêm +1 tia đạn tập trung (Tổng: ${nextBullets} tia đạn) & tăng +15% sát thương.`;
        } else if (u.id === "star_rocket") {
          const nextLvl = rocketLvl + 1;
          const perk =
            nextLvl === 2
              ? "Bắn tên lửa bọc thép uy lực hơn, nổ AOE 65px & tăng +40% sát thương."
              : nextLvl === 3
                ? "Bắn 4 tên lửa theo loạt (2 thẳng, 2 lượn chéo) nổ diện rộng 80px."
                : nextLvl === 4
                  ? "Bão Micro-Missile 6 quả phân tán quét sạch cụm quái từ xa."
                  : "Tiến hóa Tên Lửa Nhiệt Hạch Thần Thoại: 6 tên lửa hạt nhân mini nổ chùm liên hoàn!";
          customized.name = `⭐ Lên Sao Tên Lửa (Cấp ${nextLvl})`;
          customized.targetLabel = `🚀 Tên Lửa (Cấp ${rocketLvl} ➔ ⭐ Cấp ${nextLvl})`;
          customized.description = `Nâng cấp Cấp ${nextLvl}: ${perk}`;
        } else if (u.id === "star_laser") {
          const nextLvl = laserLvl + 1;
          const perk =
            nextLvl === 2
              ? "Tia Laser kép năng lượng cao, xuyên qua 4 quái vật & tăng +45% sát thương."
              : nextLvl === 3
                ? "3 chùm tia Laser (Trái, Giữa, Phải) quét dọc 3 làn đường."
                : nextLvl === 4
                  ? "4 chùm tia Laser Plasma Tím rực rỡ xuyên thấu toàn bộ hàng quái!"
                  : "Tiến hóa Pháo Quang Tử Siêu Nhiệt: 4 chùm Laser Vàng Kim quét sạch toàn bộ tuyến đường!";
          customized.name = `⭐ Lên Sao Pháo Laser (Cấp ${nextLvl})`;
          customized.targetLabel = `⚡ Pháo Laser (Cấp ${laserLvl} ➔ ⭐ Cấp ${nextLvl})`;
          customized.description = `Nâng cấp Cấp ${nextLvl}: ${perk}`;
        } else if (u.id === "star_shield") {
          customized.name = `⭐ Lên Sao Khiên (Cấp ${shieldLvl + 1})`;
          customized.targetLabel = `🛡️ Khiên (Cấp ${shieldLvl} ➔ ⭐ Cấp ${shieldLvl + 1})`;
        }

        let weight = 1;

        // Rarity weight
        switch (u.rarity) {
          case "common":
            weight = 10;
            break;
          case "rare":
            weight = 6;
            break;
          case "epic":
            weight = 3;
            break;
          case "legendary":
            weight = 0.8;
            break;
          case "corrupted":
            weight = 1.2;
            break;
        }

        // Tag synergy bonus
        if (u.requireTags) {
          const matchCount = u.requireTags.filter((t) => tags.has(t)).length;
          weight *= 1 + matchCount * 0.6;
        }

        return { item: customized, weight };
      });

    if (weighted.length === 0) return [];

    // Pick without replacement
    const choices: UpgradeDefinition[] = [];
    const pool = [...weighted];

    for (let i = 0; i < Math.min(count, pool.length); i++) {
      const pick = gameRng.weightedPick(pool);
      choices.push(pick);
      // Remove from pool
      const idx = pool.findIndex((p) => p.item.id === pick.id);
      if (idx >= 0) pool.splice(idx, 1);
    }

    return choices;
  }

  /** Apply a chosen upgrade to the convoy (executes one-time mutations once) */
  applyUpgrade(upgrade: UpgradeDefinition, convoy: Convoy) {
    this.chosenUpgrades.push(upgrade);

    for (const effect of upgrade.effects) {
      switch (effect.type) {
        case "upgrade_module_star":
          if (effect.moduleId === "shield") {
            const engine = convoy.getEngine();
            if (engine) engine.upgradeWeapon("shield");
          } else if (effect.moduleId) {
            const warRig = convoy.modules.find(
              (m) => !m.isDead && m.data.type === "weapon",
            );
            if (warRig) {
              warRig.upgradeWeapon(effect.moduleId);
            }
          }
          break;

        case "add_new_module":
          if (effect.moduleId && ModuleDefinitions[effect.moduleId]) {
            convoy.addOrUpgradeModule(ModuleDefinitions[effect.moduleId]);
          }
          break;

        case "heal_all":
          for (const m of convoy.modules) {
            if (!m.isDead) m.heal(effect.value);
          }
          break;

        case "heal_engine": {
          const engine = convoy.getEngine();
          if (engine) engine.heal(effect.value);
          break;
        }

        case "add_module_hp":
          for (const m of convoy.modules) {
            if (m.isDead) continue;
            m.data.maxHp += effect.value;
            if (effect.value > 0) m.heal(effect.value);
          }
          break;
      }
    }

    EventBus.emit("upgrade:chosen", {
      upgradeId: upgrade.id,
      rarity: upgrade.rarity,
    });
  }

  /** Reapply all continuous stat modifiers across all chosen upgrades on top of base stats */
  reapplyAll(convoy: Convoy) {
    for (const upgrade of this.chosenUpgrades) {
      for (const effect of upgrade.effects) {
        this.applyStatEffect(effect, convoy);
      }
    }
  }

  private applyStatEffect(effect: UpgradeEffect, convoy: Convoy) {
    switch (effect.type) {
      case "add_damage":
        this.forEachModule(convoy, effect.targetTag, (m) => {
          if (m.data.attack)
            m.stats.damageMultiplier += effect.value / m.data.attack.damage;
          else m.stats.damageMultiplier += 0.2;
        });
        break;

      case "multiply_damage":
        this.forEachModule(convoy, effect.targetTag, (m) => {
          m.stats.damageMultiplier *= effect.value;
        });
        break;

      case "add_projectile":
        this.forEachModule(convoy, effect.targetTag, (m) => {
          m.stats.extraProjectiles += effect.value;
        });
        break;

      case "add_attack_speed":
        this.forEachModule(convoy, effect.targetTag, (m) => {
          m.stats.attackSpeedMultiplier *= 1 + effect.value;
        });
        break;

      case "add_chain_targets":
        this.forEachModule(convoy, effect.targetTag, (m) => {
          m.stats.extraChainTargets += effect.value;
        });
        break;

      case "add_burn_chance":
        this.forEachModule(convoy, effect.targetTag, (m) => {
          m.stats.burnChance += effect.value;
        });
        break;

      case "add_shock_chance":
        this.forEachModule(convoy, effect.targetTag, (m) => {
          m.stats.shockChance += effect.value;
        });
        break;

      case "add_crit_chance":
        this.forEachModule(convoy, effect.targetTag, (m) => {
          m.stats.critChance += effect.value;
        });
        break;

      case "add_explosion_on_kill":
        this.forEachModule(convoy, effect.targetTag, (m) => {
          m.stats.explosionOnKill = true;
        });
        break;

      case "add_bullet_bounce":
        this.forEachModule(convoy, effect.targetTag, (m) => {
          m.stats.bulletBounce += effect.value;
        });
        break;

      case "reduce_damage_taken":
        for (const m of convoy.modules) {
          if (m.isDead) continue;
          m.stats.damageTakenMultiplier *= 1 - effect.value;
        }
        break;

      case "shield_regen":
        this.forEachModule(convoy, "defense", (m) => {
          (m as any)._shieldRegen = effect.value;
        });
        break;
    }
  }

  private forEachModule(
    convoy: Convoy,
    targetTag: string | undefined,
    fn: (m: Module) => void,
  ) {
    for (const m of convoy.modules) {
      if (m.isDead) continue;
      if (targetTag) {
        const hasDirectTag = m.data.tags.includes(targetTag);
        const hasAttachedTag =
          (targetTag === "explosive" && m.getWeaponLevel("rocket") > 0) ||
          (targetTag === "laser" && m.getWeaponLevel("laser") > 0) ||
          (targetTag === "defense" && m.getWeaponLevel("shield") > 0) ||
          (targetTag === "projectile" && (m.getWeaponLevel("machine_gun") > 0 || m.getWeaponLevel("rocket") > 0));
        if (!hasDirectTag && !hasAttachedTag) continue;
      }
      if (
        m.data.attack ||
        m.data.type !== "engine" ||
        targetTag === "defense"
      ) {
        fn(m);
      }
    }
  }
}
