import { Container, Graphics, Text, BlurFilter } from "pixi.js";
import { Scene, SceneManager } from "./SceneManager";
import { RoadSystem } from "../systems/RoadSystem";
import { ConvoySystem } from "../systems/ConvoySystem";
import { EnemySystem } from "../systems/EnemySystem";
import { ProjectileSystem } from "../systems/ProjectileSystem";
import { CombatSystem } from "../systems/CombatSystem";
import { LootSystem } from "../systems/LootSystem";
import { BossSystem } from "../systems/BossSystem";
import { AdjacencySystem } from "../systems/AdjacencySystem";
import { UpgradeSystem } from "../systems/UpgradeSystem";
import { ParticleSystem } from "../systems/ParticleSystem";
import { HUD } from "../ui/HUD";
import { UpgradePanel } from "../ui/UpgradePanel";
import { SettingsModal } from "../ui/SettingsModal";
import { HyperCircleButton } from "../ui/HyperButton";
import { SaveManager } from "../utils/SaveManager";
import { ModuleDefinitions } from "../data/modules";
import { EventBus } from "../utils/EventBus";
import { AudioMixer } from "../utils/AudioMixer";
import { RunState } from "../utils/RunState";
import { resetRng } from "../utils/RNG";
import { winkGame, type WinkRound } from "../../integrations/wink/client";
import { PICKUP_CONFIGS, type PickupType } from "../entities/Pickup";
import {
  ROAD_SPEED,
  HP_SCALE_PER_MINUTE,
  RUN_BOSS_TIME,
  GAME_WIDTH,
  GAME_HEIGHT,
  BOSS_HP_BAR_Y,
} from "../constants";

export class RunScene extends Container implements Scene {
  // Layers
  private gameLayer: Container;
  private currentWinkRound: WinkRound | null = null;
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
  private shakeDuration: number = 0;
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
      this.particleSystem,
    );

    this.adjacencySystem = new AdjacencySystem();
    this.upgradeSystem = new UpgradeSystem();
  }

  private initUI() {
    this.hud = new HUD(() => {
      this.isPaused = true;
      const blur = new BlurFilter({ strength: 8, quality: 3 });
      this.gameLayer.filters = [blur];
      this.hud.filters = [blur];

      const modal = new SettingsModal(() => {
        this.gameLayer.filters = [];
        this.hud.filters = [];
        this.isPaused = false;
      });
      this.uiLayer.addChild(modal);
    });
    this.uiLayer.addChild(this.hud);

    this.upgradePanel = new UpgradePanel();
    this.uiLayer.addChild(this.upgradePanel);

    this.upgradePanel.onSelect = (upgrade) => {
      this.gameLayer.filters = [];
      this.hud.filters = [];
      this.upgradeSystem.applyUpgrade(upgrade, this.convoySystem.convoy);
      this.recalculateFormationAndUpgrades();
      this.isPaused = false;
      AudioMixer.playSFX("sfx_button");
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
    EventBus.on("level:up", () => {
      const choices = this.upgradeSystem.generateChoices(
        this.convoySystem.convoy,
      );
      if (choices.length > 0) {
        this.isPaused = true;
        const blur = new BlurFilter({ strength: 8, quality: 3 });
        this.gameLayer.filters = [blur];
        this.hud.filters = [blur];
        this.upgradePanel.show(choices);
        AudioMixer.playSFX("sfx_levelup");
      }
    });

    // Module destroyed
    EventBus.on("module:destroyed", () => {
      this.recalculateFormationAndUpgrades();
      this.triggerShake(5, 0.2);
      AudioMixer.playSFX("sfx_explosion");
      RunState.current.modulesLost++;
    });

    // Camera shake
    EventBus.on("camera:shake", (data) => {
      this.triggerShake(data.intensity, data.duration);
    });

    // Boss spawned
    EventBus.on("boss:spawned", () => {
      this.hud.showBossHp("KẺ THU THẬP");
      AudioMixer.playSFX("sfx_shake");
      this.triggerShake(5, 0.3);
    });

    // Boss defeated
    EventBus.on("boss:defeated", (data) => {
      this.hud.hideBossHp();
      this.particleSystem.explode(data.x, data.y, 120, 0xff0000);
      RunState.current.bossDefeated = true;
    });

    // Scrap collected sparkle
    EventBus.on("scrap:collected", (data) => {
      if (data.x !== undefined && data.y !== undefined) {
        this.particleSystem.sparkle(data.x, data.y, 0xffe600);
      }
    });

    // Run ended
    EventBus.on("run:ended", (data) => {
       if (this.isGameOver) return;
       this.isGameOver = true;

       const totalRunScrap =
         this.lootSystem.totalScrap +
         Math.floor(this.distanceMeters / 6) +
         (data.victory ? 250 : 0);

       RunState.current.victory = data.victory;
       RunState.current.distance = this.distanceMeters;
       RunState.current.kills = this.lootSystem.totalKills;
       RunState.current.level = this.lootSystem.level;
       RunState.current.scrap = totalRunScrap;
       RunState.current.runTime = this.runTime;

       // Save meta-progression currency & run records
       SaveManager.addScrap(totalRunScrap);
       SaveManager.recordRun(this.distanceMeters, this.lootSystem.totalKills);
       RunState.saveBestScore(RunState.current.getScore());

       if (this.currentWinkRound) {
         winkGame.completeRound(this.currentWinkRound, {
           playDurationMs: Math.floor(this.runTime * 1000),
           metadata: {
             victory: data.victory,
             kills: this.lootSystem.totalKills,
             level: this.lootSystem.level,
             distance: Math.floor(this.distanceMeters),
           },
         });
       }

       setTimeout(() => {
         SceneManager.switchScene("GameOverScene");
       }, 800);
     });
  }

  start() {
    this.currentWinkRound = winkGame.startRound();
    AudioMixer.playBGM("bgm_game");
  }

  update(dt: number) {
    if (this.isPaused || this.isGameOver) return;

    const dtSec = dt * (1 / 60);
    this.runTime += dtSec;
    this.distanceMeters += ROAD_SPEED * dtSec * 0.05;

    // Progressive Escalating Difficulty Scaling (Độ khó tăng mạnh theo cự ly, quái đông và trâu hơn)
    const distKm = this.distanceMeters / 1000;
    const difficultyLevel = Math.max(
      1,
      Math.floor(this.distanceMeters / 200) + 1,
    );
    const hpScale =
      1 +
      distKm * 2.8 +
      Math.pow(distKm, 1.6) * 1.2 +
      (this.runTime / 90) * 0.5;
    const speedScale = 1 + Math.min(0.75, distKm * 0.16);
    const densityMultiplier = Math.min(
      4.8,
      1 + distKm * 0.85,
    );
    const eliteChance = Math.min(
      0.75,
      0.05 + distKm * 0.16,
    );

    this.enemySystem.setDifficulty(
      difficultyLevel,
      hpScale,
      speedScale,
      densityMultiplier,
      eliteChance,
    );

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
          120,
        );
        this.particleSystem.exhaustPuff(
          this.convoySystem.convoy.x + 20 + (Math.random() - 0.5) * 6,
          backY,
          0,
          120,
        );
      }
    }

    // Update all systems
    this.roadSystem.update(dt);

    const modulePositions = this.convoySystem.convoy.modules
      .filter((m) => !m.isDead)
      .map((m) => ({
        x: this.convoySystem.convoy.x + m.x,
        y: this.convoySystem.convoy.y + m.y,
      }));

    this.lootSystem.update(
      dt,
      this.convoySystem.convoy.x,
      this.convoySystem.convoy.y,
      modulePositions,
      (type) => {
        this.handlePickupCollected(type);
      },
    );
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
    this.hud.updateScrap(this.lootSystem.totalScrap);
    this.hud.updateXp(this.lootSystem.getXpRatio(), this.lootSystem.level);
    this.hud.updateBuffs(
      this.lootSystem.rapidFireTimer,
      this.lootSystem.invincibleTimer,
    );

    const warRig = this.convoySystem.convoy.modules.find(
      (m) => !m.isDead && m.data.type === "weapon",
    );
    const engine = this.convoySystem.convoy.getEngine();
    if (warRig) {
      this.hud.updateWeapons({
        machine_gun: warRig.getWeaponLevel("machine_gun"),
        rocket: warRig.getWeaponLevel("rocket"),
        laser: warRig.getWeaponLevel("laser"),
        shield:
          (engine ? engine.getWeaponLevel("shield") : 0) ||
          warRig.getWeaponLevel("shield"),
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
    const warRig = this.convoySystem.convoy.modules.find(
      (m) => !m.isDead && m.data.type === "weapon",
    );
    const cfg = PICKUP_CONFIGS[type as PickupType] || PICKUP_CONFIGS.buff_rapid;

    // Trigger floating notification toast on HUD
    EventBus.emit("pickup:toast", {
      text: cfg.label,
      color: cfg.color,
      icon: cfg.icon,
    });

    if (type === "buff_nuke") {
      // Massive Screen-Wiping Bomb Explosion SFX & Shockwave
      AudioMixer.playNukeExplosion();
      this.triggerShake(7, 0.3);

      // Central explosive shockwaves & particles
      this.particleSystem.explode(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        240,
        0xef4444,
      );
      this.particleSystem.critBurst(GAME_WIDTH / 2, GAME_HEIGHT / 2);

      // Annihilate all enemies on screen with explosion bursts
      for (const e of this.enemySystem.enemies) {
        if (e.active) {
          e.takeDamage(99999);
          this.particleSystem.explode(e.x, e.y, 45, 0xffaa00);
        }
      }

      // Deal heavy tactical burst damage to boss if active
      if (this.bossSystem.active) {
        this.bossSystem.takeDamage(600);
        this.particleSystem.explode(
          GAME_WIDTH / 2,
          BOSS_HP_BAR_Y + 120,
          80,
          0xff0055,
        );
        this.particleSystem.critBurst(GAME_WIDTH / 2, BOSS_HP_BAR_Y + 120);
      }
    } else if (type === "buff_rapid") {
      AudioMixer.playRapidBuff();
      this.particleSystem.sparkle(cx, cy, 0xf59e0b);
      this.particleSystem.electricSpark(cx, cy);
      EventBus.emit("damage:number", {
        x: cx,
        y: cy - 60,
        amount: 0,
        status: "crit",
      });
    } else if (type === "buff_shield") {
      AudioMixer.playShieldBuff();
      this.particleSystem.sparkle(cx, cy, 0x0284c7);
    } else if (type === "buff_heal") {
      AudioMixer.playHealBuff();
      for (const m of this.convoySystem.convoy.modules) {
        if (!m.isDead) m.heal(120);
      }
      this.particleSystem.sparkle(cx, cy, 0x22c55e);
      EventBus.emit("damage:number", {
        x: cx,
        y: cy - 60,
        amount: 120,
        heal: true,
      });
    } else if (type === "star_upgrade") {
      AudioMixer.playStarUpgrade();
      this.triggerShake(3, 0.15);
      this.particleSystem.sparkle(cx, cy, 0xfacc15);

      const engine = this.convoySystem.convoy.getEngine();
      const upgradableWeapons: {
        id: string;
        name: string;
        targetModule: any;
        curLvl: number;
      }[] = [];

      if (warRig) {
        const mgLvl = warRig.getWeaponLevel("machine_gun");
        if (mgLvl >= 1 && mgLvl < 5) {
          upgradableWeapons.push({
            id: "machine_gun",
            name: "SÚNG MÁY",
            targetModule: warRig,
            curLvl: mgLvl,
          });
        }

        const rocketLvl = warRig.getWeaponLevel("rocket");
        if (rocketLvl >= 1 && rocketLvl < 5) {
          upgradableWeapons.push({
            id: "rocket",
            name: "TÊN LỬA",
            targetModule: warRig,
            curLvl: rocketLvl,
          });
        }

        const laserLvl = warRig.getWeaponLevel("laser");
        if (laserLvl >= 1 && laserLvl < 5) {
          upgradableWeapons.push({
            id: "laser",
            name: "PHÁO LASER",
            targetModule: warRig,
            curLvl: laserLvl,
          });
        }

        const shieldLvl = warRig.getWeaponLevel("shield");
        if (shieldLvl >= 1 && shieldLvl < 5) {
          upgradableWeapons.push({
            id: "shield",
            name: "KHIÊN",
            targetModule: warRig,
            curLvl: shieldLvl,
          });
        }
      }

      if (engine) {
        const shieldLvl = engine.getWeaponLevel("shield");
        if (
          shieldLvl >= 1 &&
          shieldLvl < 5 &&
          !upgradableWeapons.some((w) => w.id === "shield")
        ) {
          upgradableWeapons.push({
            id: "shield",
            name: "KHIÊN",
            targetModule: engine,
            curLvl: shieldLvl,
          });
        }
      }

      if (upgradableWeapons.length > 0) {
        // Pick one among already-owned upgradable weapons
        const picked =
          upgradableWeapons[
            Math.floor(Math.random() * upgradableWeapons.length)
          ];
        picked.targetModule.upgradeWeapon(picked.id);
        this.recalculateFormationAndUpgrades();

        EventBus.emit("pickup:toast", {
          text: `⭐ ${picked.name} LÊN CẤP ${picked.curLvl + 1}!`,
          color: 0xfacc15,
          icon: "⭐",
        });
      } else {
        // All owned weapons are already max level (or none upgradable) -> grant repair bonus
        for (const m of this.convoySystem.convoy.modules) {
          if (!m.isDead) m.heal(150);
        }
        EventBus.emit("pickup:toast", {
          text: "⭐ VŨ KHÍ ĐÃ TỐI ĐA (+150 HP!)",
          color: 0xfacc15,
          icon: "⭐",
        });
      }
    }
  }

  private triggerShake(intensity: number, duration: number) {
    if (!SaveManager.getSettings().screenShake) return;
    this.shakeIntensity = Math.min(5.5, Math.max(this.shakeIntensity, intensity));
    this.shakeDuration = Math.max(this.shakeDuration, duration);
    this.shakeTimer = this.shakeDuration;
  }

  private updateShake(dtSec: number) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dtSec;
      if (this.shakeTimer <= 0) {
        this.gameLayer.x = 0;
        this.gameLayer.y = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
      } else {
        const progress = this.shakeTimer / (this.shakeDuration || 1);
        const currentAmp = this.shakeIntensity * progress;
        this.gameLayer.x = (Math.random() * 2 - 1) * currentAmp;
        this.gameLayer.y = (Math.random() * 2 - 1) * currentAmp;
      }
    }
  }

  resize() {}
}
