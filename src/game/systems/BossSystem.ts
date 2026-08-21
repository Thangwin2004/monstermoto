import { Container, Graphics, Text } from 'pixi.js';
import { ConvoySystem } from './ConvoySystem';
import { EnemySystem } from './EnemySystem';
import { GAME_WIDTH, GAME_HEIGHT, BOSS_HP } from '../constants';
import { BossDefinitions, BossDefinition, BossPhase } from '../data/bosses';
import { EventBus } from '../utils/EventBus';
import { gameRng } from '../utils/RNG';

export class BossSystem {
    public container: Container;
    public active: boolean = false;
    public hp: number = 0;
    public maxHp: number = 0;

    private convoySystem: ConvoySystem;
    private enemySystem!: EnemySystem;
    private bossDef: BossDefinition;
    private currentPhase!: BossPhase;

    // Visual layers
    private shadow: Graphics;
    private warRigGfx: Graphics;
    private laserGfx: Graphics;
    private hookGraphics: Graphics;
    private hpBarContainer: Container;
    private hpBarFill: Graphics;
    private nameLabel: Text;

    // State
    private state: 'idle' | 'approach' | 'combat' | 'hooking' | 'hooked' | 'defeated' = 'idle';
    private hookCooldown: number = 0;
    private hookTargetModuleIndex: number = -1;
    private hookTimer: number = 0;
    private animTime: number = 0;
    private flashTimer: number = 0;

    constructor(parent: Container, convoySystem: ConvoySystem) {
        this.convoySystem = convoySystem;
        this.bossDef = BossDefinitions.the_collector;

        this.container = new Container();
        this.container.visible = false;
        parent.addChild(this.container);

        // 1. Drop shadow
        this.shadow = new Graphics();
        this.container.addChild(this.shadow);

        // 2. Heavy War Rig Base & Giant Canyon Overlord Demon
        this.warRigGfx = new Graphics();
        this.container.addChild(this.warRigGfx);

        // 3. Laser target line & Hook chain
        this.laserGfx = new Graphics();
        parent.addChild(this.laserGfx);

        this.hookGraphics = new Graphics();
        parent.addChild(this.hookGraphics);

        // 4. Head HP bar
        this.hpBarContainer = new Container();
        this.container.addChild(this.hpBarContainer);

        const hpBarBg = new Graphics();
        hpBarBg.roundRect(-80, -90, 160, 12, 6)
            .fill(0x1a1a24)
            .stroke({ color: 0xff4444, width: 2 });
        this.hpBarContainer.addChild(hpBarBg);

        this.hpBarFill = new Graphics();
        this.hpBarContainer.addChild(this.hpBarFill);

        this.nameLabel = new Text({
            text: 'CỰ THÚ SA MẠC THỐNG TRỊ',
            style: {
                fontFamily: 'Be Vietnam Pro, sans-serif',
                fontSize: 16,
                fontWeight: '900',
                fill: 0xff3b30,
                stroke: { color: 0x000000, width: 3 },
            },
        });
        this.nameLabel.anchor.set(0.5);
        this.nameLabel.y = -105;
        this.hpBarContainer.addChild(this.nameLabel);
    }

    private renderWarRig() {
        this.warRigGfx.clear();
        this.shadow.clear();
        const g = this.warRigGfx;

        // Massive Shadow
        this.shadow.ellipse(0, 50, 120, 50)
            .fill({ color: 0x000000, alpha: 0.5 });

        // 1. Armored Mad Max War-rig Platform
        g.roundRect(-95, -45, 190, 110, 20)
            .fill(0x18181b)
            .stroke({ color: 0x000000, width: 4.5 });

        // Hazard Stripes on front bumper
        for (let x = -80; x < 75; x += 30) {
            g.rect(x, 44, 15, 18).fill(0xfacc15);
            g.rect(x + 15, 44, 15, 18).fill(0x000000);
        }

        // Heavy Steel Spikes on Front Bumper (7 Spikes)
        for (let x = -75; x <= 75; x += 25) {
            g.poly([x - 10, 62, x + 10, 62, x, 88])
                .fill(0x71717a)
                .stroke({ color: 0x000000, width: 2.5 });
            g.circle(x, 86, 2).fill(0xffffff);
        }

        // Heavy Side Rocket Pods & Exhaust Stacks
        g.roundRect(-112, -35, 20, 70, 4).fill(0x3f3f46).stroke({ color: 0x000000, width: 2.5 });
        g.roundRect(92, -35, 20, 70, 4).fill(0x3f3f46).stroke({ color: 0x000000, width: 2.5 });
        // Red Rocket Warheads in pods
        g.circle(-102, -20, 6).fill(0xef4444);
        g.circle(-102, 0, 6).fill(0xef4444);
        g.circle(102, -20, 6).fill(0xef4444);
        g.circle(102, 0, 6).fill(0xef4444);

        // 2. Giant Canyon Overlord Demon Body on Top
        g.roundRect(-55, -40, 110, 80, 16)
            .fill(0x27272a)
            .stroke({ color: 0x000000, width: 4 });

        // Glowing Magma Core & Chest Veins
        g.poly([0, -25, -24, 10, 0, 30, 24, 10]).fill(0xea580c);
        g.circle(0, 5, 16).fill(0xfacc15);

        // 4 Colossal Jagged Demonic Horns
        g.poly([-35, -35, -15, -50, -65, -95]).fill(0x52525b).stroke({ color: 0x000000, width: 3 });
        g.poly([35, -35, 15, -50, 65, -95]).fill(0x52525b).stroke({ color: 0x000000, width: 3 });
        // Blood Red Horn Tips
        g.poly([-55, -80, -45, -70, -65, -95]).fill(0xdc2626);
        g.poly([55, -80, 45, -70, 65, -95]).fill(0xdc2626);

        // Spiked Iron Skull Mask & Burning Eyes
        g.roundRect(-30, -35, 60, 35, 8).fill(0x18181b).stroke({ color: 0x000000, width: 2 });
        g.ellipse(-14, -20, 10, 5).fill(0xf97316).stroke({ color: 0x000000, width: 1.5 });
        g.ellipse(14, -20, 10, 5).fill(0xf97316).stroke({ color: 0x000000, width: 1.5 });
        g.circle(-14, -20, 3).fill(0xffffff);
        g.circle(14, -20, 3).fill(0xffffff);

        // Heavy Iron Jaw with Steel Teeth
        g.roundRect(-24, 0, 48, 16, 4).fill(0x52525b).stroke({ color: 0x000000, width: 2 });
        g.poly([-16, 0, -10, 0, -13, 8]).fill(0xffffff);
        g.poly([-4, 0, 2, 0, -1, 8]).fill(0xffffff);
        g.poly([8, 0, 14, 0, 11, 8]).fill(0xffffff);
    }

    setEnemySystem(enemySystem: EnemySystem) {
        this.enemySystem = enemySystem;
    }

    spawn() {
        this.active = true;
        this.container.visible = true;
        this.container.x = GAME_WIDTH / 2;
        this.container.y = -150;
        this.maxHp = this.bossDef.maxHp;
        this.hp = this.maxHp;
        this.state = 'approach';
        this.currentPhase = this.bossDef.phases[0];
        this.hookCooldown = this.currentPhase.hookInterval;

        this.renderWarRig();
        this.updateHpBar();

        EventBus.emit('boss:spawned', { bossId: this.bossDef.id });
    }

    takeDamage(amount: number) {
        if (!this.active) return;
        this.hp -= amount;
        this.flashTimer = 0.12;
        this.updateHpBar();

        // Check phase transitions
        const hpRatio = this.hp / this.maxHp;
        for (let i = this.bossDef.phases.length - 1; i >= 0; i--) {
            if (hpRatio <= this.bossDef.phases[i].hpThreshold) {
                this.currentPhase = this.bossDef.phases[i];
                break;
            }
        }

        // Boss defeated
        if (this.hp <= 0) {
            this.hp = 0;
            this.active = false;
            this.container.visible = false;
            this.hookGraphics.clear();
            this.laserGfx.clear();

            EventBus.emit('boss:defeated', {
                bossId: this.bossDef.id,
                x: this.container.x,
                y: this.container.y,
            });

            // Victory after short delay
            setTimeout(() => {
                EventBus.emit('run:ended', {
                    victory: true,
                    distance: 0,
                    kills: 0,
                    score: 0,
                });
            }, 1500);
        }
    }

    private updateHpBar() {
        this.hpBarFill.clear();
        const ratio = Math.max(0, this.hp / this.maxHp);
        const fillW = Math.max(0, 156 * ratio);
        this.hpBarFill.roundRect(-78, -88, fillW, 8, 4)
            .fill(0xff3b30);
    }

    getHpRatio(): number {
        return this.maxHp > 0 ? this.hp / this.maxHp : 0;
    }

    update(dt: number) {
        if (!this.active) return;

        const dtSec = dt * (1 / 60);
        this.animTime += dtSec;

        // Damage flash recovery
        if (this.flashTimer > 0) {
            this.flashTimer -= dtSec;
            this.warRigGfx.tint = 0xff3333;
        } else {
            this.warRigGfx.tint = 0xffffff;
        }

        switch (this.state) {
            case 'approach':
                this.container.y += 120 * dtSec;
                if (this.container.y >= 200) {
                    this.container.y = 200;
                    this.state = 'combat';
                }
                break;

            case 'combat':
                // Sinusoidal patrol movement
                this.container.x = GAME_WIDTH / 2 + Math.sin(this.animTime * 1.5) * 160;
                this.container.y = 200 + Math.sin(this.animTime * 2.5) * 20;

                // Hook attack cooldown & laser aim warning
                this.hookCooldown -= dtSec;

                // Aim laser 1s before hook
                if (this.hookCooldown <= 1.0 && this.hookCooldown > 0) {
                    this.renderAimLaser();
                } else {
                    this.laserGfx.clear();
                }

                if (this.hookCooldown <= 0) {
                    this.startHookAttack();
                }
                break;

            case 'hooking':
                this.updateHooking(dtSec);
                break;

            case 'hooked':
                this.updateHooked(dtSec);
                break;
        }
    }

    private renderAimLaser() {
        this.laserGfx.clear();
        const convoy = this.convoySystem.convoy;
        this.laserGfx.moveTo(this.container.x, this.container.y + 40)
            .lineTo(convoy.x, convoy.y)
            .stroke({ color: 0xff0000, width: 2, alpha: 0.5 + Math.sin(this.animTime * 20) * 0.4 });
    }

    private startHookAttack() {
        const aliveIndices = this.convoySystem.convoy.getAliveIndices();
        if (aliveIndices.length === 0) return;

        this.hookTargetModuleIndex = gameRng.pick(aliveIndices);
        this.state = 'hooking';
        this.hookTimer = 0;
        this.laserGfx.clear();
    }

    private updateHooking(dtSec: number) {
        this.hookTimer += dtSec;
        const hookDuration = 0.35;
        const progress = Math.min(1, this.hookTimer / hookDuration);

        const mod = this.convoySystem.convoy.modules[this.hookTargetModuleIndex];
        if (!mod || mod.isDead) {
            this.state = 'combat';
            this.hookCooldown = this.currentPhase.hookInterval;
            this.hookGraphics.clear();
            return;
        }

        const startX = this.container.x;
        const startY = this.container.y + 40;
        const targetX = this.convoySystem.convoy.x + mod.x;
        const targetY = this.convoySystem.convoy.y + mod.y;

        const curX = startX + (targetX - startX) * progress;
        const curY = startY + (targetY - startY) * progress;

        this.drawChainAndHook(startX, startY, curX, curY);

        if (progress >= 1) {
            this.state = 'hooked';
            this.hookTimer = 0;
        }
    }

    private updateHooked(dtSec: number) {
        this.hookTimer += dtSec;
        const mod = this.convoySystem.convoy.modules[this.hookTargetModuleIndex];

        if (!mod || mod.isDead) {
            this.state = 'combat';
            this.hookCooldown = this.currentPhase.hookInterval;
            this.hookGraphics.clear();
            return;
        }

        const startX = this.container.x;
        const startY = this.container.y + 40;
        const targetX = this.convoySystem.convoy.x + mod.x;
        const targetY = this.convoySystem.convoy.y + mod.y;

        this.drawChainAndHook(startX, startY, targetX, targetY);

        // Constant crush damage to hooked module
        mod.takeDamage(30 * dtSec);

        // Release hook after duration
        if (this.hookTimer >= this.currentPhase.hookDuration) {
            this.state = 'combat';
            this.hookCooldown = this.currentPhase.hookInterval;
            this.hookGraphics.clear();
        }
    }

    private drawChainAndHook(x1: number, y1: number, x2: number, y2: number) {
        this.hookGraphics.clear();

        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const linkCount = Math.floor(dist / 16);

        // Draw segmented chain links
        for (let i = 0; i <= linkCount; i++) {
            const t = i / linkCount;
            const lx = x1 + dx * t;
            const ly = y1 + dy * t;
            this.hookGraphics.ellipse(lx, ly, 4, 7)
                .fill(0x374151)
                .stroke({ color: 0x9ca3af, width: 1.5 });
        }

        // Heavy Steel Iron Hook Head
        const hookAngle = Math.atan2(dy, dx);
        this.hookGraphics.circle(x2, y2, 10).fill(0x1f2937);
        // Hook claws
        this.hookGraphics.moveTo(x2, y2)
            .lineTo(x2 + Math.cos(hookAngle + 0.8) * 22, y2 + Math.sin(hookAngle + 0.8) * 22)
            .stroke({ color: 0xf59e0b, width: 4 });
        this.hookGraphics.moveTo(x2, y2)
            .lineTo(x2 + Math.cos(hookAngle - 0.8) * 22, y2 + Math.sin(hookAngle - 0.8) * 22)
            .stroke({ color: 0xf59e0b, width: 4 });
    }
}
