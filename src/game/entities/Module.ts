import { Container, Graphics, Text } from 'pixi.js';
import {
    COLORS, MODULE_SIZE, HP_BAR_WIDTH, HP_BAR_HEIGHT,
} from '../constants';

// ─── Data types ───

export type ModuleType = 'weapon' | 'support' | 'defense' | 'engine';
export type ModuleRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'corrupted';

export interface AttackData {
    damage: number;
    cooldown: number;
    range: number;
    projectileSpeed?: number;
    projectileCount?: number;
    aoeRadius?: number;
    chainTargets?: number;
}

export interface AdjacencyEffect {
    target: 'front' | 'behind' | 'adjacent' | 'all';
    requireTag?: string;
    stat: string;
    value: number;
    isMultiplier: boolean;
}

export interface ModuleData {
    id: string;
    name: string;
    type: ModuleType;
    rarity: ModuleRarity;
    maxHp: number;
    armor: number;
    tags: string[];
    color: number;
    emoji: string;
    attack?: AttackData;
    adjacencyEffects?: AdjacencyEffect[];
    passiveId?: string;
    activeId?: string;
    activeDescription?: string;
}

// ─── Runtime stat modifiers ───

export interface ModuleStats {
    damageMultiplier: number;
    attackSpeedMultiplier: number;
    extraProjectiles: number;
    extraChainTargets: number;
    damageTakenMultiplier: number;
    burnChance: number;
    shockChance: number;
    critChance: number;
    critMultiplier: number;
    explosionOnKill: boolean;
    bulletBounce: number;
}

function defaultStats(): ModuleStats {
    return {
        damageMultiplier: 1,
        attackSpeedMultiplier: 1,
        extraProjectiles: 0,
        extraChainTargets: 0,
        damageTakenMultiplier: 1,
        burnChance: 0,
        shockChance: 0,
        critChance: 0,
        critMultiplier: 2,
        explosionOnKill: false,
        bulletBounce: 0,
    };
}

const RARITY_GRADIENTS: Record<string, { top: number; bot: number; shadow: number }> = {
    common: { top: 0x5a6075, bot: 0x333745, shadow: 0x1d1f27 },
    rare: { top: 0x33ccff, bot: 0x0088cc, shadow: 0x004466 },
    epic: { top: 0xd946ef, bot: 0x9333ea, shadow: 0x581c87 },
    legendary: { top: 0xfacc15, bot: 0xeab308, shadow: 0x854d0e },
    corrupted: { top: 0xef4444, bot: 0x991b1b, shadow: 0x450a0a },
};

export class Module extends Container {
    public data: ModuleData;
    public hp: number;
    public cooldownTimer: number = 0;
    public flameCooldownTimer: number = 0;
    public teslaCooldownTimer: number = 0;
    public stats: ModuleStats;
    public slotIndex: number = 0;
    public isDead: boolean = false;

    public level: number = 1;
    public maxLevel: number = 5;

    // Independent Weapon Levels (Mỗi vũ khí có cấp sao riêng)
    public weaponLevels: Map<string, number> = new Map();

    // Integrated Side Mounts / Wing Attachments
    public attachments: Set<string> = new Set();

    // Visual layers
    private shadowLayer: Graphics;
    private attachmentsLayer: Graphics;
    private treadsLayer: Graphics;
    private chassisLayer: Graphics;
    private turretLayer: Container;
    private turretGfx: Graphics;
    private fxLayer: Graphics;
    private hpBarBg: Graphics;
    private hpBarFill: Graphics;

    private damageFlashTimer: number = 0;
    private fireTimer: number = 0;
    private animTime: number = 0;
    private currentAimAngle: number = -Math.PI / 2;

    constructor(data: ModuleData) {
        super();
        this.data = data;
        this.hp = data.maxHp;
        this.stats = defaultStats();

        // Initialize primary weapon level
        if (data.type === 'weapon') {
            this.weaponLevels.set(data.id, 1);
        }

        // 1. Drop shadow
        this.shadowLayer = new Graphics();
        this.addChild(this.shadowLayer);

        // 2. Side attachments (Flamethrowers 2 bên, Shield wings, Tesla coils)
        this.attachmentsLayer = new Graphics();
        this.addChild(this.attachmentsLayer);

        // 3. Wheels / Treads (sides)
        this.treadsLayer = new Graphics();
        this.addChild(this.treadsLayer);

        // 4. 3D Beveled Chassis
        this.chassisLayer = new Graphics();
        this.addChild(this.chassisLayer);

        // 5. Turret / Device on top
        this.turretLayer = new Container();
        this.addChild(this.turretLayer);

        this.turretGfx = new Graphics();
        this.turretLayer.addChild(this.turretGfx);

        // 6. Special FX (Shield aura, sparks, smoke)
        this.fxLayer = new Graphics();
        this.addChild(this.fxLayer);

        this.hpBarBg = new Graphics();
        this.addChild(this.hpBarBg);

        this.hpBarFill = new Graphics();
        this.addChild(this.hpBarFill);

        this.renderChassis();
        this.renderTurret();
        this.renderAttachments();
        this.updateHpBar();
    }

    /** Get independent star level of a weapon (1..5) */
    public getWeaponLevel(weaponId: string): number {
        if (this.weaponLevels.has(weaponId)) {
            return this.weaponLevels.get(weaponId)!;
        }
        if (this.data.id === weaponId) return this.level;
        if (this.attachments.has(weaponId)) return 1;
        return 0;
    }

    /** Upgrade a specific weapon's independent level / star (⭐) */
    public upgradeWeapon(weaponId: string): boolean {
        const curLvl = this.getWeaponLevel(weaponId);
        if (curLvl >= this.maxLevel) return false;

        const newLvl = curLvl === 0 ? 1 : curLvl + 1;
        this.weaponLevels.set(weaponId, newLvl);
        this.attachments.add(weaponId);

        if (weaponId === this.data.id) {
            this.level = newLvl;
        }

        this.hp = Math.min(this.getMaxHp(), this.hp + 50);
        this.renderAttachments();
        this.renderTurret();
        this.updateHpBar();
        this.flashLevelUp();
        return true;
    }

    /** Add or upgrade attachment */
    public addAttachment(type: string) {
        this.upgradeWeapon(type);
    }

    public upgradeLevel(): boolean {
        return this.upgradeWeapon(this.data.id);
    }

    public getMaxHp(): number {
        let shieldBonus = (this.getWeaponLevel('shield') - 1) * 60;
        if (shieldBonus < 0) shieldBonus = 0;
        return Math.round(this.data.maxHp * (1 + (this.level - 1) * 0.4)) + shieldBonus;
    }

    private flashLevelUp() {
        this.scale.set(1.2);
        this.chassisLayer.tint = 0xfacc15;
        this.damageFlashTimer = 0.3;
    }

    private renderChassis() {
        const w = MODULE_SIZE;
        const h = MODULE_SIZE;
        const halfW = w / 2;
        const halfH = h / 2;
        const isEngine = this.data.id === 'engine';

        // 1. Drop Shadow
        this.shadowLayer.clear();
        this.shadowLayer.roundRect(-halfW - 12, -halfH + 6, w + 24, h + 22, 18)
            .fill({ color: 0x000000, alpha: 0.45 });

        // 2. Heavy Off-Road Spiked Monster Wheels (Left & Right)
        this.treadsLayer.clear();
        const tireW = 14;
        const tireH = 34;
        const tireX = halfW + 4;

        // Draw 4 distinct rugged monster tires (Front-Left, Rear-Left, Front-Right, Rear-Right)
        const tireYs = [-halfH + 18, halfH - 18];
        tireYs.forEach(ty => {
            // Left Tire
            this.treadsLayer.roundRect(-tireX - tireW, ty - tireH / 2, tireW, tireH, 6)
                .fill(0x18181b)
                .stroke({ color: 0x000000, width: 3 });
            // Left Wheel Hub + Spikes
            this.treadsLayer.circle(-tireX - tireW / 2, ty, 5).fill(0x71717a);
            this.treadsLayer.circle(-tireX - tireW / 2, ty, 2).fill(0xd4d4d8);
            // Left Chevron Treads
            for (let dy = -10; dy <= 10; dy += 8) {
                this.treadsLayer.rect(-tireX - tireW + 1, ty + dy, tireW - 2, 3).fill(0x3f3f46);
            }

            // Right Tire
            this.treadsLayer.roundRect(tireX, ty - tireH / 2, tireW, tireH, 6)
                .fill(0x18181b)
                .stroke({ color: 0x000000, width: 3 });
            // Right Wheel Hub + Spikes
            this.treadsLayer.circle(tireX + tireW / 2, ty, 5).fill(0x71717a);
            this.treadsLayer.circle(tireX + tireW / 2, ty, 2).fill(0xd4d4d8);
            // Right Chevron Treads
            for (let dy = -10; dy <= 10; dy += 8) {
                this.treadsLayer.rect(tireX + 1, ty + dy, tireW - 2, 3).fill(0x3f3f46);
            }
        });

        // 3. Mad Max Battle Truck Armor Body
        this.chassisLayer.clear();

        // Base vehicle color (Desert Orange / Mad Max Purple / Toxic Green)
        const baseColor = isEngine ? 0xd97706 : (this.data.id === 'machine_gun' ? 0xb91c1c : (this.data.id === 'flamethrower' ? 0xc2410c : (this.data.id === 'tesla' ? 0x0369a1 : 0x7c3aed)));
        const darkTrim = 0x18181b;

        // Main Truck Cab & Hood
        this.chassisLayer.roundRect(-halfW, -halfH, w, h, 10)
            .fill(baseColor)
            .stroke({ color: darkTrim, width: 3.5 });

        // Comic-style side shadow & highlight
        this.chassisLayer.rect(-halfW + 3, -halfH + 3, 6, h - 6).fill({ color: 0xffffff, alpha: 0.35 });
        this.chassisLayer.rect(halfW - 9, -halfH + 3, 6, h - 6).fill({ color: 0x000000, alpha: 0.35 });

        // Armor Plates & Rivet Bolts
        this.chassisLayer.rect(-halfW + 8, -halfH + 8, w - 16, h - 16)
            .stroke({ color: 0x000000, width: 2, alpha: 0.4 });

        // 4 Golden / Silver Armor Rivets
        const rivetOff = halfW - 8;
        this.chassisLayer.circle(-rivetOff, -rivetOff, 2.5).fill(0xfacc15).stroke({ color: 0x000000, width: 1 });
        this.chassisLayer.circle(rivetOff, -rivetOff, 2.5).fill(0xfacc15).stroke({ color: 0x000000, width: 1 });
        this.chassisLayer.circle(-rivetOff, rivetOff, 2.5).fill(0xfacc15).stroke({ color: 0x000000, width: 1 });
        this.chassisLayer.circle(rivetOff, rivetOff, 2.5).fill(0xfacc15).stroke({ color: 0x000000, width: 1 });

        // 4. FRONT HEAVY SPIKED RAMMING PLOW (Lưỡi ủi gai thép nhọn ở đầu xe)
        if (isEngine) {
            const plowY = -halfH - 4;
            const plowW = w + 14;

            // Heavy Bumper Bar
            this.chassisLayer.roundRect(-plowW / 2, plowY - 8, plowW, 12, 4)
                .fill(0x3f3f46)
                .stroke({ color: 0x000000, width: 3 });

            // 5 Giant Spikes (Gai thép nhọn hoắt chĩa về phía trước)
            const spikeXs = [-28, -14, 0, 14, 28];
            spikeXs.forEach((sx, idx) => {
                const spikeLen = (idx === 2 ? 22 : (Math.abs(idx - 2) === 1 ? 18 : 14));
                this.chassisLayer.poly([
                    sx - 4, plowY - 8,
                    sx + 4, plowY - 8,
                    sx, plowY - 8 - spikeLen
                ]).fill(0x71717a).stroke({ color: 0x000000, width: 2 });
                // Spike tip gleam
                this.chassisLayer.circle(sx, plowY - 8 - spikeLen + 2, 1.5).fill(0xffffff);
            });

            // Supercharger V8 Engine Blower Scoop on Hood
            this.chassisLayer.roundRect(-16, -halfH + 12, 32, 22, 4)
                .fill(0x27272a)
                .stroke({ color: 0x000000, width: 2 });
            // Chrome Blower Intake with 3 Red Butterfly Valves
            this.chassisLayer.rect(-12, -halfH + 15, 24, 6).fill(0x52525b);
            this.chassisLayer.circle(-7, -halfH + 18, 2.5).fill(0xef4444);
            this.chassisLayer.circle(0, -halfH + 18, 2.5).fill(0xef4444);
            this.chassisLayer.circle(7, -halfH + 18, 2.5).fill(0xef4444);

            // Armored Windshield with Metal Mesh Grid
            this.chassisLayer.roundRect(-24, -halfH + 38, 48, 16, 4)
                .fill(0x0284c7)
                .stroke({ color: 0x000000, width: 2.5 });
            // Metal Mesh Grid Bars
            this.chassisLayer.rect(-16, -halfH + 38, 3, 16).fill(0x18181b);
            this.chassisLayer.rect(0, -halfH + 38, 3, 16).fill(0x18181b);
            this.chassisLayer.rect(16, -halfH + 38, 3, 16).fill(0x18181b);

            // Roof Spikes / Shark Fins
            this.chassisLayer.poly([-14, -halfH + 54, -10, -halfH + 54, -12, -halfH + 46]).fill(0x71717a).stroke({ color: 0x000000, width: 1.5 });
            this.chassisLayer.poly([10, -halfH + 54, 14, -halfH + 54, 12, -halfH + 46]).fill(0x71717a).stroke({ color: 0x000000, width: 1.5 });
        } else {
            // Truck Bed with Metal Trim
            this.chassisLayer.roundRect(-halfW + 6, -halfH + 6, w - 12, h - 12, 6)
                .fill(0x27272a)
                .stroke({ color: 0x000000, width: 2 });
            // Diamond Plate Bed Ribs
            for (let by = -halfH + 12; by < halfH - 12; by += 12) {
                this.chassisLayer.rect(-halfW + 10, by, w - 20, 2).fill(0x52525b);
            }
        }

        // 5. Dual Vertical Chrome Exhaust Stacks (2 bên thân xe)
        // Left Exhaust
        this.chassisLayer.roundRect(-halfW - 5, -12, 5, 26, 2)
            .fill(0x71717a)
            .stroke({ color: 0x000000, width: 1.5 });
        this.chassisLayer.rect(-halfW - 5, -8, 5, 4).fill(0xd97706); // Heat shield rust band
        this.chassisLayer.circle(-halfW - 2.5, -13, 2.5).fill(0x18181b); // Pipe opening

        // Right Exhaust
        this.chassisLayer.roundRect(halfW, -12, 5, 26, 2)
            .fill(0x71717a)
            .stroke({ color: 0x000000, width: 1.5 });
        this.chassisLayer.rect(halfW, -8, 5, 4).fill(0xd97706);
        this.chassisLayer.circle(halfW + 2.5, -13, 2.5).fill(0x18181b);
    }

    /** Render Side Mount Attachments */
    private renderAttachments() {
        this.attachmentsLayer.clear();
        const halfW = MODULE_SIZE / 2;
        const flameLvl = this.getWeaponLevel('flamethrower');
        const teslaLvl = this.getWeaponLevel('tesla');
        const shieldLvl = this.getWeaponLevel('shield');

        // 1. Dual Heavy Flamethrowers with Fiery Pilot Lights
        if (flameLvl > 0) {
            const nozW = 10 + flameLvl * 2;
            const nozH = 24 + flameLvl * 2;
            const offset = halfW + 16;

            // Left Flamethrower
            this.attachmentsLayer.roundRect(-offset - nozW, -12, nozW, nozH, 4)
                .fill(0x7c2d12)
                .stroke({ color: 0x000000, width: 2 });
            // Chrome Nozzle Tip
            this.attachmentsLayer.rect(-offset - nozW, -16, nozW, 5).fill(0xf97316).stroke({ color: 0x000000, width: 1.5 });
            // Pilot Flame
            this.attachmentsLayer.poly([
                -offset - nozW + 2, -16,
                -offset - 2, -16,
                -offset - nozW / 2, -24
            ]).fill(0xfacc15);

            // Right Flamethrower
            this.attachmentsLayer.roundRect(offset, -12, nozW, nozH, 4)
                .fill(0x7c2d12)
                .stroke({ color: 0x000000, width: 2 });
            this.attachmentsLayer.rect(offset, -16, nozW, 5).fill(0xf97316).stroke({ color: 0x000000, width: 1.5 });
            this.attachmentsLayer.poly([
                offset + 2, -16,
                offset + nozW - 2, -16,
                offset + nozW / 2, -24
            ]).fill(0xfacc15);
        }

        // 2. Dual Tesla Coils with Electric Energy Orbs
        if (teslaLvl > 0) {
            const coilR = 9 + teslaLvl * 2;
            const offset = halfW + 16;

            // Left Tesla Pylon
            this.attachmentsLayer.rect(-offset - 4, 0, 8, 22).fill(0x1e293b).stroke({ color: 0x000000, width: 2 });
            this.attachmentsLayer.circle(-offset, 0, coilR).fill(0x0284c7).stroke({ color: 0x00f0ff, width: 2.5 });
            this.attachmentsLayer.circle(-offset, 0, 4).fill(0xffffff);

            // Right Tesla Pylon
            this.attachmentsLayer.rect(offset - 4, 0, 8, 22).fill(0x1e293b).stroke({ color: 0x000000, width: 2 });
            this.attachmentsLayer.circle(offset, 0, coilR).fill(0x0284c7).stroke({ color: 0x00f0ff, width: 2.5 });
            this.attachmentsLayer.circle(offset, 0, 4).fill(0xffffff);
        }

        // 3. Heavy Shield Armor Plates with Hazard Stripes
        if (shieldLvl > 0) {
            const shieldW = 8 + shieldLvl * 2;
            const offset = halfW + 16;

            // Left Heavy Armored Wing
            this.attachmentsLayer.roundRect(-offset - shieldW, -24, shieldW, 48, 4)
                .fill(0x0369a1)
                .stroke({ color: 0x000000, width: 2 });
            this.attachmentsLayer.rect(-offset - shieldW + 2, -16, shieldW - 4, 8).fill(0xfacc15); // Hazard stripe
            this.attachmentsLayer.rect(-offset - shieldW + 2, 8, shieldW - 4, 8).fill(0xfacc15);

            // Right Heavy Armored Wing
            this.attachmentsLayer.roundRect(offset, -24, shieldW, 48, 4)
                .fill(0x0369a1)
                .stroke({ color: 0x000000, width: 2 });
            this.attachmentsLayer.rect(offset + 2, -16, shieldW - 4, 8).fill(0xfacc15);
            this.attachmentsLayer.rect(offset + 2, 8, shieldW - 4, 8).fill(0xfacc15);
        }
    }

    /** Render Turret with the Masked Luchador / Brawler Gunner */
    private renderTurret() {
        this.turretGfx.clear();
        const id = this.data.id;
        const mgLvl = this.getWeaponLevel('machine_gun');

        if (id === 'engine') {
            // Mad Max Driver in Open Cab
            // Driver Head with Red Bandana / Spiky Hair
            this.turretGfx.circle(0, 10, 8).fill(0xf59e0b); // Skin
            this.turretGfx.roundRect(-8, 4, 16, 6, 2).fill(0xef4444); // Red Bandana
            this.turretGfx.circle(-3, 10, 1.5).fill(0x000000); // Eyes
            this.turretGfx.circle(3, 10, 1.5).fill(0x000000);
            // Steering Wheel
            this.turretGfx.ellipse(0, 2, 10, 4).stroke({ color: 0x18181b, width: 3 });
        } else if (id === 'machine_gun' || mgLvl > 0) {
            // ── LUCHADOR MASKED BRAWLER GUNNER (Xạ thủ đeo mặt nạ Brawler) ──
            // Gunner Body & Muscular Arms
            this.turretGfx.roundRect(-10, 8, 20, 14, 4)
                .fill(0xd97706)
                .stroke({ color: 0x000000, width: 2 });

            // Muscular Arms holding weapon
            this.turretGfx.circle(-12, 12, 5).fill(0xf59e0b).stroke({ color: 0x000000, width: 1.5 });
            this.turretGfx.circle(12, 12, 5).fill(0xf59e0b).stroke({ color: 0x000000, width: 1.5 });

            // Blue & Yellow Luchador Mask Head
            this.turretGfx.circle(0, 4, 9)
                .fill(0x0284c7)
                .stroke({ color: 0x000000, width: 2 });
            // Yellow Star Pattern on Mask
            this.turretGfx.poly([
                -6, 0,
                6, 0,
                0, 8
            ]).fill(0xfacc15);
            // Mask Eyeholes
            this.turretGfx.circle(-3, 4, 2).fill(0xffffff).stroke({ color: 0x000000, width: 1 });
            this.turretGfx.circle(3, 4, 2).fill(0xffffff).stroke({ color: 0x000000, width: 1 });
            this.turretGfx.circle(-3, 4, 1).fill(0x000000);
            this.turretGfx.circle(3, 4, 1).fill(0x000000);

            // Heavy Dual / Quad Gatling Weapon in front of Gunner
            if (mgLvl <= 2) {
                // Dual Heavy Machine Gun Barrels
                this.turretGfx.roundRect(-12, -28, 7, 24, 2)
                    .fill(0x27272a)
                    .stroke({ color: 0x000000, width: 2 });
                this.turretGfx.roundRect(5, -28, 7, 24, 2)
                    .fill(0x27272a)
                    .stroke({ color: 0x000000, width: 2 });
                // Orange Muzzle Flash Suppressors
                this.turretGfx.rect(-13, -30, 9, 4).fill(0xf59e0b).stroke({ color: 0x000000, width: 1 });
                this.turretGfx.rect(4, -30, 9, 4).fill(0xf59e0b).stroke({ color: 0x000000, width: 1 });
                // Ammo Belt Drum
                this.turretGfx.circle(-14, 0, 5).fill(0xfacc15).stroke({ color: 0x000000, width: 1.5 });
            } else {
                // Triple / Quad Heavy Gatling Guns
                this.turretGfx.roundRect(-14, -30, 6, 26, 2).fill(0x27272a).stroke({ color: 0x000000, width: 2 });
                this.turretGfx.roundRect(-3, -34, 6, 30, 2).fill(0x27272a).stroke({ color: 0x000000, width: 2 });
                this.turretGfx.roundRect(8, -30, 6, 26, 2).fill(0x27272a).stroke({ color: 0x000000, width: 2 });

                this.turretGfx.rect(-15, -32, 8, 4).fill(0xf59e0b).stroke({ color: 0x000000, width: 1 });
                this.turretGfx.rect(-4, -36, 8, 4).fill(0xef4444).stroke({ color: 0x000000, width: 1 });
                this.turretGfx.rect(7, -32, 8, 4).fill(0xf59e0b).stroke({ color: 0x000000, width: 1 });

                // Dual Heavy Golden Ammo Belts
                this.turretGfx.circle(-15, 0, 6).fill(0xfacc15).stroke({ color: 0x000000, width: 1.5 });
                this.turretGfx.circle(15, 0, 6).fill(0xfacc15).stroke({ color: 0x000000, width: 1.5 });
            }
        }
    }

    /** Aim turret towards angle (radians) */
    setAimAngle(angle: number) {
        this.currentAimAngle = angle;
        this.turretLayer.rotation = angle + Math.PI / 2;
    }

    takeDamage(amount: number): number {
        if (this.isDead) return 0;

        const shieldLvl = this.getWeaponLevel('shield');
        const shieldReduction = shieldLvl > 0 ? Math.max(0.4, 1 - (0.2 + shieldLvl * 0.1)) : 1.0;

        const reduced = Math.max(1, amount - this.data.armor);
        const finalDamage = Math.max(0, reduced * this.stats.damageTakenMultiplier * shieldReduction);
        this.hp -= finalDamage;

        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
        }

        this.updateHpBar();
        this.flashDamage();
        return finalDamage;
    }

    heal(amount: number) {
        if (this.isDead) return;
        this.hp = Math.min(this.hp + amount, this.getMaxHp());
        this.updateHpBar();
    }

    resetStats() {
        this.stats = defaultStats();
    }

    getEffectiveCooldown(): number {
        if (!this.data.attack) return 999;
        const mgLvl = this.getWeaponLevel('machine_gun');
        const levelBonus = 1 + (mgLvl - 1) * 0.25;
        let batteryBonus = this.attachments.has('battery') ? 1.35 : 1.0;
        return this.data.attack.cooldown / (levelBonus * batteryBonus * this.stats.attackSpeedMultiplier);
    }

    getEffectiveDamage(): number {
        if (!this.data.attack) return 0;
        const mgLvl = this.getWeaponLevel('machine_gun');
        const levelMultiplier = 1 + (mgLvl - 1) * 0.5;
        return Math.round(this.data.attack.damage * levelMultiplier * this.stats.damageMultiplier);
    }

    getProjectileCount(): number {
        const mgLvl = this.getWeaponLevel('machine_gun');
        const starProjectiles = Math.floor((mgLvl - 1) / 2);
        return (this.data.attack?.projectileCount ?? 1) + starProjectiles + this.stats.extraProjectiles;
    }

    getChainTargets(): number {
        const teslaLvl = this.getWeaponLevel('tesla');
        return Math.max(1, teslaLvl) + this.stats.extraChainTargets;
    }

    /** Trigger muzzle flash / recoil */
    triggerFire() {
        this.fireTimer = 0.1;
        this.turretLayer.scale.set(0.88, 1.2);
    }

    private updateHpBar() {
        this.hpBarFill.clear();
        this.hpBarBg.clear();

        const half = MODULE_SIZE / 2;
        const barY = half + 8;
        const maxHp = this.getMaxHp();
        const ratio = Math.max(0, Math.min(1, this.hp / maxHp));

        this.hpBarBg.roundRect(-HP_BAR_WIDTH / 2, barY, HP_BAR_WIDTH, HP_BAR_HEIGHT + 2, 4)
            .fill(0x111118)
            .stroke({ color: 0xffffff, width: 1.5 });

        let fillColor = 0x34c759;
        if (ratio < 0.3) fillColor = 0xff3b30;
        else if (ratio < 0.6) fillColor = 0xffcc00;

        const maxInnerW = HP_BAR_WIDTH - 2;
        const fillW = Math.max(0, Math.min(maxInnerW, maxInnerW * ratio));
        if (fillW > 0) {
            this.hpBarFill.roundRect(-HP_BAR_WIDTH / 2 + 1, barY + 1, fillW, HP_BAR_HEIGHT, 3)
                .fill(fillColor);
        }
    }

    private flashDamage() {
        this.damageFlashTimer = 0.15;
        this.chassisLayer.tint = 0xff3333;
        this.scale.set(1.1);
    }

    update(dt: number) {
        const dtSec = dt * (1 / 60);
        this.animTime += dtSec;

        // Auto heal shield
        const shieldLvl = this.getWeaponLevel('shield');
        if (shieldLvl >= 3 && !this.isDead && this.hp < this.getMaxHp()) {
            this.heal((2 + shieldLvl * 2) * dtSec);
        }

        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= dtSec;
            if (this.damageFlashTimer <= 0) {
                this.chassisLayer.tint = 0xffffff;
                this.scale.set(1);
            }
        }

        if (this.fireTimer > 0) {
            this.fireTimer -= dtSec;
            if (this.fireTimer <= 0) {
                this.turretLayer.scale.set(1);
            }
        }

        this.fxLayer.clear();
        if (!this.isDead) {
            if (shieldLvl > 0) {
                const pulse = 1 + Math.sin(this.animTime * 4) * 0.05;
                const shieldR = (MODULE_SIZE / 2 + 14 + shieldLvl * 2) * pulse;
                this.fxLayer.circle(0, 0, shieldR)
                    .stroke({ color: 0x38bdf8, width: 2 + shieldLvl * 0.5, alpha: 0.6 + Math.sin(this.animTime * 6) * 0.2 });
            }
            if (this.getWeaponLevel('tesla') > 0) {
                if (Math.random() < 0.25) {
                    const a1 = Math.random() * Math.PI * 2;
                    const r = 28 + Math.random() * 12;
                    this.fxLayer.moveTo(0, 0)
                        .lineTo(Math.cos(a1) * r, Math.sin(a1) * r)
                        .stroke({ color: 0x67e8f9, width: 2, alpha: 0.9 });
                }
            }
        }

        if (!this.isDead && this.hp / this.getMaxHp() < 0.3) {
            const pulse = 0.8 + Math.sin(this.animTime * 12) * 0.2;
            this.chassisLayer.alpha = pulse;
        } else if (this.isDead) {
            this.alpha = 0.35;
            this.chassisLayer.tint = 0x555555;
        } else {
            this.alpha = 1;
        }
    }
}
