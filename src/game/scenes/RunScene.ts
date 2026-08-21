import { Container } from 'pixi.js';
import { Scene, SceneManager } from './SceneManager';
import { RoadSystem } from '../systems/RoadSystem';
import { ConvoySystem } from '../systems/ConvoySystem';
import { EnemySystem } from '../systems/EnemySystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { LootSystem } from '../systems/LootSystem';
import { BossSystem } from '../systems/BossSystem';
import { AdjacencySystem } from '../systems/AdjacencySystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { HUD } from '../ui/HUD';
import { UpgradePanel } from '../ui/UpgradePanel';
import { ModuleDefinitions } from '../data/modules';
import { EventBus } from '../utils/EventBus';
import { AudioMixer } from '../utils/AudioMixer';
import { RunState } from '../utils/RunState';
import { resetRng } from '../utils/RNG';
import {
    ROAD_SPEED, HP_SCALE_PER_MINUTE, RUN_BOSS_TIME, GAME_WIDTH, GAME_HEIGHT,
} from '../constants';

export class RunScene extends Container implements Scene {
    // Layers
    private gameLayer: Container;
    private uiLayer: Container;

    // Systems
    private roadSystem!: RoadSystem;
    private convoySystem!: ConvoySystem;
    private enemySystem!: EnemySystem;
    private projectileSystem!: ProjectileSystem;
    private combatSystem!: CombatSystem;
    private lootSystem!: LootSystem;
    private bossSystem!: BossSystem;
    private adjacencySystem!: AdjacencySystem;
    private upgradeSystem!: UpgradeSystem;
    private particleSystem!: ParticleSystem;

    // UI
    private hud!: HUD;
    private upgradePanel!: UpgradePanel;

    // Run state
    private isPaused: boolean = false;
    private runTime: number = 0;
    private distanceMeters: number = 0;
    private bossSpawned: boolean = false;
    private isGameOver: boolean = false;

    // Camera shake
    private shakeTimer: number = 0;
    private shakeIntensity: number = 0;

    constructor() {
        super();

        // Reset RNG and RunState for new run
        resetRng();
        RunState.reset();

        // Create layers
        this.gameLayer = new Container();
        this.addChild(this.gameLayer);

        this.uiLayer = new Container();
        this.addChild(this.uiLayer);

        this.initSystems();
        this.initUI();
        this.initConvoy();
        this.initEvents();
    }

    private initSystems() {
        this.roadSystem = new RoadSystem();
        this.gameLayer.addChild(this.roadSystem.container);

        this.lootSystem = new LootSystem(this.gameLayer);
        this.convoySystem = new ConvoySystem(this.gameLayer);
        this.enemySystem = new EnemySystem(this.gameLayer, this.convoySystem);
        this.projectileSystem = new ProjectileSystem(this.gameLayer);
        this.bossSystem = new BossSystem(this.gameLayer, this.convoySystem);
        this.bossSystem.setEnemySystem(this.enemySystem);
        this.particleSystem = new ParticleSystem(this.gameLayer);

        this.combatSystem = new CombatSystem(
            this.convoySystem,
            this.enemySystem,
            this.projectileSystem,
            this.lootSystem,
            this.bossSystem,
            this.particleSystem
        );

        this.adjacencySystem = new AdjacencySystem();
        this.upgradeSystem = new UpgradeSystem();
    }

    private initUI() {
        this.hud = new HUD();
        this.uiLayer.addChild(this.hud);

        this.upgradePanel = new UpgradePanel();
        this.uiLayer.addChild(this.upgradePanel);

        this.upgradePanel.onSelect = (upgrade) => {
            this.upgradeSystem.applyUpgrade(upgrade, this.convoySystem.convoy);
            this.recalculateFormationAndUpgrades();
            this.isPaused = false;
            AudioMixer.playSFX('sfx_button');
        };
    }

    private initConvoy() {
        // Start with Engine + Machine Gun
        this.convoySystem.convoy.addOrUpgradeModule(ModuleDefinitions.engine);
        this.convoySystem.convoy.addOrUpgradeModule(ModuleDefinitions.machine_gun);
        this.recalculateFormationAndUpgrades();
    }

    private recalculateFormationAndUpgrades() {
        this.adjacencySystem.recalculate(this.convoySystem.convoy);
        this.upgradeSystem.reapplyAll(this.convoySystem.convoy);
    }

    private initEvents() {
        // Level up → show upgrade choices (Player chooses all new modules & upgrades directly from cards)
        EventBus.on('level:up', () => {
            const choices = this.upgradeSystem.generateChoices(this.convoySystem.convoy);
            if (choices.length > 0) {
                this.isPaused = true;
                this.upgradePanel.show(choices);
                AudioMixer.playSFX('sfx_levelup');
            }
        });

        // Module destroyed
        EventBus.on('module:destroyed', () => {
            this.recalculateFormationAndUpgrades();
            this.triggerShake(12, 0.45);
            AudioMixer.playSFX('sfx_explosion');
            RunState.current.modulesLost++;
        });

        // Camera shake
        EventBus.on('camera:shake', (data) => {
            this.triggerShake(data.intensity, data.duration);
        });

        // Boss spawned
        EventBus.on('boss:spawned', () => {
            this.hud.showBossHp('KẺ THU THẬP');
            AudioMixer.playSFX('sfx_shake');
            this.triggerShake(18, 1.2);
        });

        // Boss defeated
        EventBus.on('boss:defeated', (data) => {
            this.hud.hideBossHp();
            this.particleSystem.explode(data.x, data.y, 120, 0xff0000);
            RunState.current.bossDefeated = true;
        });

        // Scrap collected sparkle
        EventBus.on('scrap:collected', (data) => {
            if (data.x !== undefined && data.y !== undefined) {
                this.particleSystem.sparkle(data.x, data.y, 0xffe600);
            }
        });

        // Run ended
        EventBus.on('run:ended', (data) => {
            if (this.isGameOver) return;
            this.isGameOver = true;

            RunState.current.victory = data.victory;
            RunState.current.distance = this.distanceMeters;
            RunState.current.kills = this.lootSystem.totalKills;
            RunState.current.level = this.lootSystem.level;
            RunState.current.scrap = this.lootSystem.totalKills * 5;
            RunState.current.runTime = this.runTime;

            RunState.saveBestScore(RunState.current.getScore());

            setTimeout(() => {
                SceneManager.switchScene('GameOverScene');
            }, 800);
        });

        // Enemy killed — light shake
        EventBus.on('enemy:killed', () => {
            this.triggerShake(2.5, 0.05);
        });
    }

    start() {
        AudioMixer.playBGM('bgm_game');
    }

    update(dt: number) {
        if (this.isPaused || this.isGameOver) return;

        const dtSec = dt * (1 / 60);
        this.runTime += dtSec;
        this.distanceMeters += ROAD_SPEED * dtSec * 0.05;

        // Dynamic Distance-based Scaling (Điều chỉnh độ khó mượt mà, công bằng và hấp dẫn)
        const difficultyLevel = Math.min(8, Math.floor(this.distanceMeters / 350) + 1);
        const hpScale = 1 + (this.distanceMeters / 600) * 0.25 + (this.runTime / 180) * 0.15;
        const speedScale = 1 + Math.min(0.3, (this.distanceMeters / 1200) * 0.15);
        const densityMultiplier = Math.min(2.2, 1 + (this.distanceMeters / 600) * 0.3);
        const eliteChance = Math.min(0.25, 0.03 + (this.distanceMeters / 1000) * 0.08);

        this.enemySystem.setDifficulty(difficultyLevel, hpScale, speedScale, densityMultiplier, eliteChance);

        // Boss trigger
        if (!this.bossSpawned && this.runTime > RUN_BOSS_TIME) {
            this.bossSystem.spawn();
            this.bossSpawned = true;
        }

        // Exhaust smoke emitted only from behind the very last module, drifting backwards away from convoy
        if (Math.random() < 0.2) {
            const backMod = this.convoySystem.convoy.getBackModule();
            if (backMod && !backMod.isDead) {
                const backY = this.convoySystem.convoy.y + backMod.y + 44;
                this.particleSystem.exhaustPuff(
                    this.convoySystem.convoy.x - 20 + (Math.random() - 0.5) * 6,
                    backY,
                    0,
                    120
                );
                this.particleSystem.exhaustPuff(
                    this.convoySystem.convoy.x + 20 + (Math.random() - 0.5) * 6,
                    backY,
                    0,
                    120
                );
            }
        }

        // Update all systems
        this.roadSystem.update(dt);
        this.lootSystem.update(dt, this.convoySystem.convoy.x, this.convoySystem.convoy.y, (type) => {
            this.handlePickupCollected(type);
        });
        this.convoySystem.update(dt);

        if (!this.bossSpawned || !this.bossSystem.active) {
            this.enemySystem.update(dt);
        }

        this.bossSystem.update(dt);
        this.projectileSystem.update(dt);
        this.combatSystem.update(dt);
        this.particleSystem.update(dt);

        // HUD
        this.hud.updateDistance(this.distanceMeters);
        this.hud.updateKills(this.lootSystem.totalKills);
        this.hud.updateScrap(0);
        this.hud.updateXp(this.lootSystem.getXpRatio(), this.lootSystem.level);

        const warRig = this.convoySystem.convoy.modules.find(m => !m.isDead && m.data.type === 'weapon');
        const engine = this.convoySystem.convoy.getEngine();
        if (warRig) {
            this.hud.updateWeapons({
                machine_gun: warRig.getWeaponLevel('machine_gun'),
                flamethrower: warRig.getWeaponLevel('flamethrower'),
                tesla: warRig.getWeaponLevel('tesla'),
                shield: (engine ? engine.getWeaponLevel('shield') : 0) || warRig.getWeaponLevel('shield'),
            });
        }

        if (this.bossSystem.active) {
            this.hud.updateBossHp(this.bossSystem.getHpRatio());
        }

        this.hud.update(dt);

        // Camera shake
        this.updateShake(dtSec);
    }

    private handlePickupCollected(type: string) {
        const cx = this.convoySystem.convoy.x;
        const cy = this.convoySystem.convoy.y;
        const warRig = this.convoySystem.convoy.modules.find(m => !m.isDead && m.data.type === 'weapon');

        if (type === 'buff_rapid') {
            AudioMixer.playSFX('sfx_levelup');
            this.particleSystem.sparkle(cx, cy, 0xf59e0b);
            EventBus.emit('damage:number', { x: cx, y: cy - 60, amount: 0, status: 'crit' });
        } else if (type === 'buff_shield') {
            AudioMixer.playSFX('sfx_shield');
            this.particleSystem.sparkle(cx, cy, 0x0284c7);
        } else if (type === 'buff_heal') {
            AudioMixer.playSFX('sfx_heal');
            for (const m of this.convoySystem.convoy.modules) {
                if (!m.isDead) m.heal(100);
            }
            this.particleSystem.sparkle(cx, cy, 0x22c55e);
            EventBus.emit('damage:number', { x: cx, y: cy - 60, amount: 100, heal: true });
        } else if (type === 'buff_nuke') {
            AudioMixer.playSFX('sfx_explosion');
            this.triggerShake(22, 0.6);
            this.particleSystem.explode(GAME_WIDTH / 2, GAME_HEIGHT / 2, 200, 0xef4444);
            for (const e of this.enemySystem.enemies) {
                if (e.active) {
                    e.takeDamage(9999);
                    this.particleSystem.explode(e.x, e.y, 40, 0xffaa00);
                }
            }
        } else if (type === 'star_upgrade') {
            AudioMixer.playSFX('sfx_levelup');
            this.triggerShake(12, 0.4);
            this.particleSystem.sparkle(cx, cy, 0xfacc15);

            if (warRig) {
                const candidates = ['machine_gun', 'flamethrower', 'tesla', 'shield'];
                const picked = candidates[Math.floor(Math.random() * candidates.length)];
                warRig.upgradeWeapon(picked);
                this.recalculateFormationAndUpgrades();
            }
        }
    }

    private triggerShake(intensity: number, duration: number) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeTimer = Math.max(this.shakeTimer, duration);
    }

    private updateShake(dtSec: number) {
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dtSec;
            const t = this.shakeTimer > 0 ? this.shakeIntensity : 0;
            this.gameLayer.x = (Math.random() - 0.5) * t * 2;
            this.gameLayer.y = (Math.random() - 0.5) * t * 2;

            if (this.shakeTimer <= 0) {
                this.gameLayer.x = 0;
                this.gameLayer.y = 0;
                this.shakeIntensity = 0;
            }
        }
    }

    resize() {}
}
