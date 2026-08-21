import { Convoy } from '../entities/Convoy';
import { Module } from '../entities/Module';
import { UpgradeDefinition, UpgradeEffect, getAvailableUpgrades } from '../data/upgrades';
import { ModuleDefinitions } from '../data/modules';
import { gameRng } from '../utils/RNG';
import { UPGRADE_CHOICES } from '../constants';
import { EventBus } from '../utils/EventBus';

/**
 * Manages the upgrade selection and application during a run.
 * Uses weighted pools biased toward the player's current build tags.
 */
export class UpgradeSystem {
    public chosenUpgrades: UpgradeDefinition[] = [];

    /** Generate upgrade choices biased toward the player's current tags */
    generateChoices(convoy: Convoy, count: number = UPGRADE_CHOICES): UpgradeDefinition[] {
        const tags = convoy.getAllTags();
        const available = getAvailableUpgrades(tags);

        if (available.length === 0) return [];

        const warRig = convoy.modules.find(m => !m.isDead && m.data.type === 'weapon');
        const engine = convoy.getEngine();

        // Build weighted pool & filter out maxed upgrades
        const weighted = available
            .filter(u => {
                // Battery is one-time only
                if (u.id === 'card_get_battery' && warRig?.attachments.has('battery')) return false;

                // Star upgrades max out at level 5
                if (u.id === 'star_machine_gun' && (warRig?.getWeaponLevel('machine_gun') ?? 0) >= 5) return false;
                if (u.id === 'star_flamethrower' && (warRig?.getWeaponLevel('flamethrower') ?? 0) >= 5) return false;
                if (u.id === 'star_tesla' && (warRig?.getWeaponLevel('tesla') ?? 0) >= 5) return false;
                if (u.id === 'star_shield' && ((engine?.getWeaponLevel('shield') ?? 0) >= 5 || (warRig?.getWeaponLevel('shield') ?? 0) >= 5)) return false;

                // Add module cards max out at level 5
                if (u.id === 'card_get_flame' && (warRig?.getWeaponLevel('flamethrower') ?? 0) >= 5) return false;
                if (u.id === 'card_get_tesla' && (warRig?.getWeaponLevel('tesla') ?? 0) >= 5) return false;
                if (u.id === 'card_get_shield' && (engine?.getWeaponLevel('shield') ?? 0) >= 5) return false;

                return true;
            })
            .map(u => {
                let weight = 1;

                // Rarity weight
                switch (u.rarity) {
                    case 'common': weight = 10; break;
                    case 'rare': weight = 5; break;
                    case 'epic': weight = 2; break;
                    case 'legendary': weight = 0.5; break;
                    case 'corrupted': weight = 1; break;
                }

                // Tag synergy bonus: if convoy has matching tags, increase weight
                if (u.requireTags) {
                    const matchCount = u.requireTags.filter(t => tags.has(t)).length;
                    weight *= (1 + matchCount * 0.5);
                }

                return { item: u, weight };
            });

        if (weighted.length === 0) return [];

        // Pick without replacement
        const choices: UpgradeDefinition[] = [];
        const pool = [...weighted];

        for (let i = 0; i < Math.min(count, pool.length); i++) {
            const pick = gameRng.weightedPick(pool);
            choices.push(pick);
            // Remove from pool
            const idx = pool.findIndex(p => p.item.id === pick.id);
            if (idx >= 0) pool.splice(idx, 1);
        }

        return choices;
    }

    /** Apply a chosen upgrade to the convoy (executes one-time mutations once) */
    applyUpgrade(upgrade: UpgradeDefinition, convoy: Convoy) {
        this.chosenUpgrades.push(upgrade);

        for (const effect of upgrade.effects) {
            switch (effect.type) {
                case 'upgrade_module_star':
                    if (effect.moduleId === 'shield') {
                        const engine = convoy.getEngine();
                        if (engine) engine.upgradeWeapon('shield');
                    } else if (effect.moduleId) {
                        const warRig = convoy.modules.find(m => !m.isDead && m.data.type === 'weapon');
                        if (warRig) {
                            warRig.upgradeWeapon(effect.moduleId);
                        }
                    }
                    break;

                case 'add_new_module':
                    if (effect.moduleId && ModuleDefinitions[effect.moduleId]) {
                        convoy.addOrUpgradeModule(ModuleDefinitions[effect.moduleId]);
                    }
                    break;

                case 'heal_all':
                    for (const m of convoy.modules) {
                        if (!m.isDead) m.heal(effect.value);
                    }
                    break;

                case 'heal_engine': {
                    const engine = convoy.getEngine();
                    if (engine) engine.heal(effect.value);
                    break;
                }

                case 'add_module_hp':
                    for (const m of convoy.modules) {
                        if (m.isDead) continue;
                        m.data.maxHp += effect.value;
                        if (effect.value > 0) m.heal(effect.value);
                    }
                    break;
            }
        }

        EventBus.emit('upgrade:chosen', { upgradeId: upgrade.id, rarity: upgrade.rarity });
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
            case 'add_damage':
                this.forEachModule(convoy, effect.targetTag, m => {
                    if (m.data.attack) m.stats.damageMultiplier += effect.value / m.data.attack.damage;
                    else m.stats.damageMultiplier += 0.2;
                });
                break;

            case 'multiply_damage':
                this.forEachModule(convoy, effect.targetTag, m => {
                    m.stats.damageMultiplier *= effect.value;
                });
                break;

            case 'add_projectile':
                this.forEachModule(convoy, effect.targetTag, m => {
                    m.stats.extraProjectiles += effect.value;
                });
                break;

            case 'add_attack_speed':
                this.forEachModule(convoy, effect.targetTag, m => {
                    m.stats.attackSpeedMultiplier *= (1 + effect.value);
                });
                break;

            case 'add_chain_targets':
                this.forEachModule(convoy, effect.targetTag, m => {
                    m.stats.extraChainTargets += effect.value;
                });
                break;

            case 'add_burn_chance':
                this.forEachModule(convoy, effect.targetTag, m => {
                    m.stats.burnChance += effect.value;
                });
                break;

            case 'add_shock_chance':
                this.forEachModule(convoy, effect.targetTag, m => {
                    m.stats.shockChance += effect.value;
                });
                break;

            case 'add_crit_chance':
                this.forEachModule(convoy, effect.targetTag, m => {
                    m.stats.critChance += effect.value;
                });
                break;

            case 'add_explosion_on_kill':
                this.forEachModule(convoy, effect.targetTag, m => {
                    m.stats.explosionOnKill = true;
                });
                break;

            case 'add_bullet_bounce':
                this.forEachModule(convoy, effect.targetTag, m => {
                    m.stats.bulletBounce += effect.value;
                });
                break;

            case 'reduce_damage_taken':
                for (const m of convoy.modules) {
                    if (m.isDead) continue;
                    m.stats.damageTakenMultiplier *= (1 - effect.value);
                }
                break;

            case 'shield_regen':
                this.forEachModule(convoy, 'defense', m => {
                    (m as any)._shieldRegen = effect.value;
                });
                break;
        }
    }

    private forEachModule(convoy: Convoy, targetTag: string | undefined, fn: (m: Module) => void) {
        for (const m of convoy.modules) {
            if (m.isDead) continue;
            if (targetTag) {
                const hasDirectTag = m.data.tags.includes(targetTag);
                const hasAttachedTag = (targetTag === 'fire' && m.getWeaponLevel('flamethrower') > 0)
                    || (targetTag === 'electric' && m.getWeaponLevel('tesla') > 0)
                    || (targetTag === 'defense' && m.getWeaponLevel('shield') > 0)
                    || (targetTag === 'projectile' && m.getWeaponLevel('machine_gun') > 0);
                if (!hasDirectTag && !hasAttachedTag) continue;
            }
            if (m.data.attack || m.data.type !== 'engine' || targetTag === 'defense') {
                fn(m);
            }
        }
    }
}
