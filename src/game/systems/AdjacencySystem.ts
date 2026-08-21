import { Convoy } from "../entities/Convoy";
import { Module, AdjacencyEffect } from "../entities/Module";

/**
 * Recalculates adjacency bonuses whenever formation changes.
 * Call recalculate() after any swap, module add, or module destruction.
 */
export class AdjacencySystem {
  /** Recalculate all adjacency effects for the convoy */
  recalculate(convoy: Convoy) {
    // 1. Reset all module stats to defaults
    for (const m of convoy.modules) {
      if (m.isDead) continue;
      m.resetStats();
    }

    // 2. Apply each module's adjacency effects to neighbors
    for (let i = 0; i < convoy.modules.length; i++) {
      const m = convoy.modules[i];
      if (m.isDead || !m.data.adjacencyEffects) continue;

      for (const effect of m.data.adjacencyEffects) {
        const targets = this.getTargetModules(convoy, i, effect);
        for (const target of targets) {
          this.applyEffect(target, effect);
        }
      }
    }
  }

  private getTargetModules(
    convoy: Convoy,
    sourceIndex: number,
    effect: AdjacencyEffect,
  ): Module[] {
    const results: Module[] = [];
    const { front, behind } = convoy.getAdjacentModules(sourceIndex);

    switch (effect.target) {
      case "front":
        if (front && !front.isDead) {
          if (
            !effect.requireTag ||
            front.data.tags.includes(effect.requireTag)
          ) {
            results.push(front);
          }
        }
        break;

      case "behind":
        if (behind && !behind.isDead) {
          if (
            !effect.requireTag ||
            behind.data.tags.includes(effect.requireTag)
          ) {
            results.push(behind);
          }
        }
        break;

      case "adjacent":
        if (front && !front.isDead) {
          if (
            !effect.requireTag ||
            front.data.tags.includes(effect.requireTag)
          ) {
            results.push(front);
          }
        }
        if (behind && !behind.isDead) {
          if (
            !effect.requireTag ||
            behind.data.tags.includes(effect.requireTag)
          ) {
            results.push(behind);
          }
        }
        break;

      case "all":
        for (const m of convoy.modules) {
          if (m.isDead) continue;
          if (!effect.requireTag || m.data.tags.includes(effect.requireTag)) {
            results.push(m);
          }
        }
        break;
    }

    return results;
  }

  private applyEffect(module: Module, effect: AdjacencyEffect) {
    switch (effect.stat) {
      case "damage":
        if (effect.isMultiplier) module.stats.damageMultiplier *= effect.value;
        else module.stats.damageMultiplier += effect.value;
        break;

      case "attackSpeed":
        if (effect.isMultiplier)
          module.stats.attackSpeedMultiplier *= effect.value;
        else module.stats.attackSpeedMultiplier += effect.value;
        break;

      case "damageTaken":
        if (effect.isMultiplier)
          module.stats.damageTakenMultiplier *= effect.value;
        else module.stats.damageTakenMultiplier += effect.value;
        break;
    }
  }
}
