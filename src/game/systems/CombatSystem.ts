import { ConvoySystem } from "./ConvoySystem";
import { EnemySystem } from "./EnemySystem";
import { ProjectileSystem } from "./ProjectileSystem";
import { LootSystem } from "./LootSystem";
import { BossSystem } from "./BossSystem";
import { ParticleSystem } from "./ParticleSystem";
import { Module } from "../entities/Module";
import { Enemy } from "../entities/Enemy";
import { ProjectileType } from "../entities/Projectile";
import { EventBus } from "../utils/EventBus";
import { AudioMixer } from "../utils/AudioMixer";
import { circlesOverlap, distance, normalize } from "../utils/MathUtils";
import { gameRng } from "../utils/RNG";
import { MODULE_COLLISION_RADIUS } from "../constants";
import { SaveManager } from "../utils/SaveManager";

/**
 * Helper: get module position in gameLayer space.
 */
function getModulePos(
  convoyX: number,
  convoyY: number,
  module: Module,
): { x: number; y: number } {
  return {
    x: convoyX + module.x,
    y: convoyY + module.y,
  };
}

export class CombatSystem {
  private convoySystem: ConvoySystem;
  private enemySystem: EnemySystem;
  private projectileSystem: ProjectileSystem;
  private lootSystem: LootSystem;
  private bossSystem: BossSystem;
  private particleSystem: ParticleSystem;

  constructor(
    convoySystem: ConvoySystem,
    enemySystem: EnemySystem,
    projectileSystem: ProjectileSystem,
    lootSystem: LootSystem,
    bossSystem: BossSystem,
    particleSystem: ParticleSystem,
  ) {
    this.convoySystem = convoySystem;
    this.enemySystem = enemySystem;
    this.projectileSystem = projectileSystem;
    this.lootSystem = lootSystem;
    this.bossSystem = bossSystem;
    this.particleSystem = particleSystem;
  }

  update(dt: number) {
    this.handleAutoFire(dt);
    this.handleProjectileVsEnemy();
    this.handleProjectileVsBoss();
    this.handleEnemyVsConvoy();
    this.handleEnemyProjectilesVsConvoy();
    this.handleSpitterAttacks(dt);
  }

  // ─── Auto Fire ───

  private handleAutoFire(dt: number) {
    const convoy = this.convoySystem.convoy;
    const dtSec = dt * (1 / 60);

    const speedBuff = this.lootSystem.rapidFireTimer > 0 ? 0.75 : 1.0;

    for (const module of convoy.modules) {
      if (module.isDead || !module.data.attack) continue;

      module.cooldownTimer -= dtSec;

      const mPos = getModulePos(convoy.x, convoy.y, module);
      // Turret always aims straight forward in travel direction
      module.setAimAngle(-Math.PI / 2);

      // Continuously auto-fire straight forward in travel direction
      if (module.cooldownTimer <= 0) {
        this.fireWeaponForward(module, mPos);
        module.cooldownTimer = Math.max(0.16, module.getEffectiveCooldown() * speedBuff);
      }

      // ── Integrated Side Mount: Heavy Swarm Rocket Launch Pods (Bệ Phóng Tên Lửa) ──
      const rocketLvl = module.getWeaponLevel("rocket");
      if (rocketLvl > 0) {
        module.rocketCooldownTimer -= dtSec;
        if (module.rocketCooldownTimer <= 0) {
          module.rocketCooldownTimer = Math.max(0.70, 1.25 - rocketLvl * 0.11);
          const heavyBonus = 1 + SaveManager.getStatBonus("heavyWeapon");
          const rocketDmg = Math.round(
            (28 + rocketLvl * 15) * module.stats.damageMultiplier * heavyBonus,
          );
          const aoe = 60 + rocketLvl * 10;
          const isNuclear = rocketLvl >= 5;

          AudioMixer.playShoot("rocket");

          // Progressive Missile Salvo based on Star Level:
          // Level 1: 2 rockets (Left & Right)
          // Level 2: 2 heavy high-speed rockets (Bigger AOE)
          // Level 3: 4 rockets (2 center + 2 flanking angled)
          // Level 4: 6 micro-missiles fanning out across roadway
          // Level 5: 6 Titan Nuclear Rockets with Cluster Blast
          const rockets: { x: number; y: number; vx: number; vy: number }[] = [];
          const leftX = mPos.x - 38;
          const rightX = mPos.x + 38;
          const podY = mPos.y - 6;

          if (rocketLvl === 1) {
            rockets.push({ x: leftX, y: podY, vx: -15, vy: -680 });
            rockets.push({ x: rightX, y: podY, vx: 15, vy: -680 });
          } else if (rocketLvl === 2) {
            rockets.push({ x: leftX, y: podY, vx: -25, vy: -740 });
            rockets.push({ x: rightX, y: podY, vx: 25, vy: -740 });
          } else if (rocketLvl === 3) {
            rockets.push({ x: leftX - 4, y: podY, vx: -65, vy: -700 });
            rockets.push({ x: leftX + 4, y: podY - 10, vx: -10, vy: -760 });
            rockets.push({ x: rightX - 4, y: podY - 10, vx: 10, vy: -760 });
            rockets.push({ x: rightX + 4, y: podY, vx: 65, vy: -700 });
          } else if (rocketLvl === 4) {
            rockets.push({ x: leftX - 8, y: podY, vx: -110, vy: -660 });
            rockets.push({ x: leftX, y: podY - 6, vx: -45, vy: -720 });
            rockets.push({ x: leftX + 8, y: podY - 12, vx: -15, vy: -780 });
            rockets.push({ x: rightX - 8, y: podY - 12, vx: 15, vy: -780 });
            rockets.push({ x: rightX, y: podY - 6, vx: 45, vy: -720 });
            rockets.push({ x: rightX + 8, y: podY, vx: 110, vy: -660 });
          } else {
            // Level 5: 6 Nuclear Cluster Warheads
            rockets.push({ x: leftX - 10, y: podY, vx: -130, vy: -720 });
            rockets.push({ x: leftX - 2, y: podY - 8, vx: -50, vy: -780 });
            rockets.push({ x: leftX + 6, y: podY - 16, vx: -15, vy: -840 });
            rockets.push({ x: rightX - 6, y: podY - 16, vx: 15, vy: -840 });
            rockets.push({ x: rightX + 2, y: podY - 8, vx: 50, vy: -780 });
            rockets.push({ x: rightX + 10, y: podY, vx: 130, vy: -720 });
          }

          for (const r of rockets) {
            this.projectileSystem.spawn(
              r.x,
              r.y,
              r.vx,
              r.vy,
              rocketDmg,
              "rocket",
              {
                aoeRadius: aoe,
                isEnemy: false,
              },
            );
            this.particleSystem.exhaustPuff(r.x, r.y + 12, -r.vx * 0.3, 100);
            if (isNuclear) {
              this.particleSystem.critBurst(r.x, r.y);
            }
          }
        }
      }

      // ── Integrated Side Mount: Twin High-Tech Heavy Plasma Laser Cannons (Pháo Laser Xuyên Phá) ──
      const laserLvl = module.getWeaponLevel("laser");
      if (laserLvl > 0) {
        module.laserCooldownTimer -= dtSec;
        if (module.laserCooldownTimer <= 0) {
          module.laserCooldownTimer = Math.max(0.48, 0.90 - laserLvl * 0.08);
          const heavyBonus = 1 + SaveManager.getStatBonus("heavyWeapon");
          const laserDmg = Math.round(
            (26 + laserLvl * 14) * module.stats.damageMultiplier * heavyBonus,
          );
          const pierce = laserLvl >= 5 ? 99 : laserLvl >= 4 ? 12 : laserLvl >= 3 ? 6 : laserLvl * 2;
          const isHyper = laserLvl >= 5;

          AudioMixer.playShoot("tesla");

          const leftRailX = mPos.x - 30;
          const rightRailX = mPos.x + 30;
          const railY = mPos.y - 20;

          const beams: { x: number; y: number; vx: number; vy: number }[] = [];

          if (laserLvl <= 2) {
            beams.push({ x: leftRailX, y: railY, vx: 0, vy: -1400 });
            beams.push({ x: rightRailX, y: railY, vx: 0, vy: -1400 });
          } else if (laserLvl === 3) {
            beams.push({ x: leftRailX, y: railY, vx: -45, vy: -1400 });
            beams.push({ x: mPos.x, y: railY - 12, vx: 0, vy: -1450 });
            beams.push({ x: rightRailX, y: railY, vx: 45, vy: -1400 });
          } else {
            // Level 4 & 5: 4-Beam Hyper Photon Array
            beams.push({ x: leftRailX - 8, y: railY, vx: -90, vy: -1450 });
            beams.push({ x: leftRailX + 4, y: railY - 10, vx: -25, vy: -1500 });
            beams.push({ x: rightRailX - 4, y: railY - 10, vx: 25, vy: -1500 });
            beams.push({ x: rightRailX + 8, y: railY, vx: 90, vy: -1450 });
          }

          for (const b of beams) {
            this.projectileSystem.spawn(
              b.x,
              b.y,
              b.vx,
              b.vy,
              laserDmg,
              "laser",
              {
                pierceCount: pierce,
                shockChance: 0.25,
              },
            );
            this.particleSystem.electricSpark(b.x, b.y);
            if (isHyper) {
              this.particleSystem.sparkle(b.x, b.y, 0xfde047);
            }
          }
        }
      }
    }
  }

  private fireWeaponForward(module: Module, from: { x: number; y: number }) {
    const attack = module.data.attack!;
    const baseDamage = module.getEffectiveDamage();
    const projCount = module.getProjectileCount();
    const speed = attack.projectileSpeed ?? 1000;

    let projType: ProjectileType = "bullet";
    if (module.data.tags.includes("laser")) projType = "laser";
    else if (module.data.tags.includes("explosive")) projType = "rocket";
    else if (module.data.tags.includes("acid")) projType = "acid";

    // Play Firing Sound with Rate Limiter & Multi-variation
    AudioMixer.playShoot(
      projType === "laser"
        ? "tesla"
        : projType === "rocket"
          ? "rocket"
          : "bullet",
    );

    // Straight forward direction (-90 deg = -Math.PI / 2)
    const mainAngle = -Math.PI / 2;

    // Muzzle flash particle
    this.particleSystem.muzzleFlash(
      from.x,
      from.y - 24,
      mainAngle,
      module.data.color,
    );

    // Natural, punchy bullet spacing across truck hood (không bị bó dính, không xòe rộng)
    const totalBarrelWidth = Math.min(38, 7.5 * (projCount - 1));
    const barrelSpacing = projCount > 1 ? totalBarrelWidth / (projCount - 1) : 0;
    const totalSpreadAngle =
      projCount > 1 ? Math.min(0.13, 0.026 * (projCount - 1)) : 0;

    for (let i = 0; i < projCount; i++) {
      let spawnX = from.x;
      let spreadAngle = 0;

      if (projCount > 1) {
        spawnX = from.x - totalBarrelWidth / 2 + barrelSpacing * i;
        spreadAngle =
          -totalSpreadAngle / 2 + (totalSpreadAngle / (projCount - 1)) * i;
      }

      const angle = mainAngle + spreadAngle;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      let finalDamage = baseDamage;
      let isCrit = false;
      if (
        module.stats.critChance > 0 &&
        gameRng.chance(module.stats.critChance)
      ) {
        finalDamage = Math.round(baseDamage * module.stats.critMultiplier);
        isCrit = true;
      }

      const spawnedP = this.projectileSystem.spawn(
        spawnX,
        from.y - 24,
        vx,
        vy,
        finalDamage,
        projType,
        {
          aoeRadius: attack.aoeRadius,
          burnChance: module.stats.burnChance,
          shockChance: module.stats.shockChance,
          bounceCount: module.stats.bulletBounce,
        },
      );
      if (spawnedP) (spawnedP as any).isCrit = isCrit;
    }

    module.triggerFire();
  }

  private findTarget(
    fromPos: { x: number; y: number },
    range: number,
  ): { x: number; y: number } | null {
    let closest: { x: number; y: number } | null = null;
    let minDist = range;

    for (const enemy of this.enemySystem.enemies) {
      if (!enemy.active || enemy.y < 20) continue;
      const d = distance(fromPos.x, fromPos.y, enemy.x, enemy.y);
      if (d < minDist) {
        minDist = d;
        closest = { x: enemy.x, y: enemy.y };
      }
    }

    if (!closest && this.bossSystem.active) {
      const bx = this.bossSystem.container.x;
      const by = this.bossSystem.container.y;
      const d = distance(fromPos.x, fromPos.y, bx, by);
      if (d < range) {
        closest = { x: bx, y: by };
      }
    }

    return closest;
  }

  /** Find multiple distinct enemy targets within range (only visible on-screen enemies) */
  private findMultipleTargets(
    fromPos: { x: number; y: number },
    range: number,
    maxCount: number = 1,
  ): Enemy[] {
    const valid = this.enemySystem.enemies
      .filter((e) => e.active && e.y >= 20 && distance(fromPos.x, fromPos.y, e.x, e.y) < range)
      .sort(
        (a, b) =>
          distance(fromPos.x, fromPos.y, a.x, a.y) -
          distance(fromPos.x, fromPos.y, b.x, b.y),
      );

    return valid.slice(0, maxCount);
  }

  // ─── Projectile vs Enemy Collision ───

  private handleProjectileVsEnemy() {
    for (const p of this.projectileSystem.projectiles) {
      if (!p.active || p.isEnemyProjectile) continue;

      for (const e of this.enemySystem.enemies) {
        // ONLY collide with active enemies that have entered visible screen area
        if (!e.active || e.y < 10) continue;

        // Fast Bounding-Box Broadphase Filter (Skips ~95% unnecessary distance checks)
        const maxDist = p.radius + e.radius;
        const dx = p.x - e.x;
        if (dx > maxDist || dx < -maxDist) continue;
        const dy = p.y - e.y;
        if (dy > maxDist || dy < -maxDist) continue;

        if (dx * dx + dy * dy <= maxDist * maxDist) {
          const isCrit = (p as any).isCrit === true;
          const killed = e.takeDamage(p.damage);

          // 1. Play Soft Punchy Hit Sound (Rate limited & smooth pitch variation)
          AudioMixer.playHit(isCrit);

          // 2. High-Performance Streamlined VFX on Hit
          if (isCrit) {
            this.particleSystem.critBurst(p.x, p.y);
            this.particleSystem.hitSpark(p.x, p.y, 0xffea00, 3, p.vx * 0.1, p.vy * 0.1);
          } else if (Math.random() < 0.4) {
            const sparkColor =
              p.projType === "laser" ? 0x00f0ff : p.projType === "rocket" ? 0xf97316 : 0xffea00;
            this.particleSystem.hitSpark(p.x, p.y, sparkColor, 1, p.vx * 0.1, p.vy * 0.1);
          }

          if (p.projType === "rocket" || p.aoeRadius > 0) {
            this.particleSystem.explode(p.x, p.y, 6, 0xff5500);
            EventBus.emit("camera:shake", { intensity: 1.8, duration: 0.08 });
          }

          if (p.burnChance > 0 && gameRng.chance(p.burnChance)) {
            e.applyBurn(Math.max(12, Math.round(p.damage * 0.6)), 3.0);
          }
          if (p.shockChance > 0 && gameRng.chance(p.shockChance)) {
            e.applyShock(2.0);
          }

          EventBus.emit("damage:number", {
            x: e.x,
            y: e.y - 20,
            amount: p.damage,
            crit: isCrit || p.damage >= 30,
          });

          if (killed) {
            this.onEnemyKilled(e);
          }

          if (p.aoeRadius > 0) {
            this.handleSplashDamage(p.x, p.y, p.aoeRadius, p.damage * 0.5);
          }

          if (p.pierceCount > 0) {
            p.pierceCount--;
          } else if (p.bounceCount > 0) {
            this.bounceProjectile(p, e);
          } else {
            p.deactivate();
          }
          break;
        }
      }
    }
  }

  private handleSplashDamage(
    x: number,
    y: number,
    radius: number,
    damage: number,
  ) {
    this.particleSystem.explode(x, y, radius, 0xff7700);
    AudioMixer.playExplosion();

    for (const e of this.enemySystem.enemies) {
      if (!e.active || e.y < 10) continue;
      const maxDist = radius + e.radius;
      const dx = x - e.x;
      if (dx > maxDist || dx < -maxDist) continue;
      const dy = y - e.y;
      if (dy > maxDist || dy < -maxDist) continue;

      if (dx * dx + dy * dy <= maxDist * maxDist) {
        const killed = e.takeDamage(damage);
        this.particleSystem.hitSpark(e.x, e.y, 0xff7700, 6);
        if (killed) this.onEnemyKilled(e);
      }
    }
  }

  private bounceProjectile(p: any, hitEnemy: Enemy) {
    let nearest: Enemy | null = null;
    let minDist = 300;
    for (const e of this.enemySystem.enemies) {
      if (!e.active || e === hitEnemy) continue;
      const d = distance(p.x, p.y, e.x, e.y);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    }

    if (nearest) {
      const [nx, ny] = normalize(nearest.x - p.x, nearest.y - p.y);
      p.vx = nx * p.speed;
      p.vy = ny * p.speed;
      p.bounceCount--;
    } else {
      p.deactivate();
    }
  }

  // ─── Projectile vs Boss ───

  private handleProjectileVsBoss() {
    if (!this.bossSystem.active) return;

    const bx = this.bossSystem.container.x;
    const by = this.bossSystem.container.y;
    const bossRadius = 80;

    for (const p of this.projectileSystem.projectiles) {
      if (!p.active || p.isEnemyProjectile) continue;

      const maxDist = p.radius + bossRadius;
      const dx = p.x - bx;
      if (dx > maxDist || dx < -maxDist) continue;
      const dy = p.y - by;
      if (dy > maxDist || dy < -maxDist) continue;

      if (dx * dx + dy * dy <= maxDist * maxDist) {
        this.bossSystem.takeDamage(p.damage);
        this.particleSystem.hitSpark(
          p.x,
          p.y,
          0xffaa00,
          8,
          p.vx * 0.15,
          p.vy * 0.15,
        );
        AudioMixer.playHit(true);

        EventBus.emit("damage:number", {
          x: bx + (Math.random() - 0.5) * 40,
          y: by - 40,
          amount: p.damage,
        });
        p.deactivate();
      }
    }
  }

  // ─── Enemy vs Convoy Collision ───

  private handleEnemyVsConvoy() {
    if (this.lootSystem.invincibleTimer > 0) return;
    const convoy = this.convoySystem.convoy;

    for (const e of this.enemySystem.enemies) {
      if (!e.active) continue;

      for (const m of convoy.modules) {
        if (m.isDead) continue;

        const mPos = getModulePos(convoy.x, convoy.y, m);
        const maxDist = MODULE_COLLISION_RADIUS + e.radius;
        const dx = mPos.x - e.x;
        if (dx > maxDist || dx < -maxDist) continue;
        const dy = mPos.y - e.y;
        if (dy > maxDist || dy < -maxDist) continue;

        if (dx * dx + dy * dy <= maxDist * maxDist) {
          const dmg = m.takeDamage(e.damage);
          this.particleSystem.explode(mPos.x, mPos.y, 40, 0xff3b30);
          AudioMixer.playExplosion();
          EventBus.emit("camera:shake", { intensity: 3.5, duration: 0.1 });

          EventBus.emit("module:damaged", {
            moduleIndex: m.slotIndex,
            damage: dmg,
            currentHp: m.hp,
            maxHp: m.data.maxHp,
          });

          e.takeDamage(9999);
          this.onEnemyKilled(e);
          break;
        }
      }
    }
  }

  // ─── Spitter Ranged Attacks ───

  private handleSpitterAttacks(dt: number) {
    const dtSec = dt * (1 / 60);
    const convoy = this.convoySystem.convoy;

    for (const e of this.enemySystem.enemies) {
      if (!e.active || e.behavior !== "ranged") continue;

      const targetDist = distance(e.x, e.y, convoy.x, convoy.y);
      if (targetDist > e.attackRange) continue;

      e.attackTimer -= dtSec;
      if (e.attackTimer <= 0) {
        const dx = convoy.x - e.x;
        const dy = convoy.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          const speed = 320;
          this.projectileSystem.spawn(
            e.x,
            e.y,
            (dx / dist) * speed,
            (dy / dist) * speed,
            e.attackDamage,
            "acid",
            { isEnemy: true, radius: 10 },
          );
          AudioMixer.playShoot("flame");
        }
        e.attackTimer = e.attackCooldown;
      }
    }
  }

  // ─── Enemy acid projectiles vs convoy modules ───

  private handleEnemyProjectilesVsConvoy() {
    const convoy = this.convoySystem.convoy;

    for (const p of this.projectileSystem.projectiles) {
      if (!p.active || !p.isEnemyProjectile) continue;

      for (const m of convoy.modules) {
        if (m.isDead) continue;

        const mPos = getModulePos(convoy.x, convoy.y, m);
        if (
          circlesOverlap(
            p.x,
            p.y,
            p.radius,
            mPos.x,
            mPos.y,
            MODULE_COLLISION_RADIUS,
          )
        ) {
          const dmg = m.takeDamage(p.damage);
          this.particleSystem.explode(p.x, p.y, 25, 0x22c55e);
          AudioMixer.playHit();

          EventBus.emit("module:damaged", {
            moduleIndex: m.slotIndex,
            damage: dmg,
            currentHp: m.hp,
            maxHp: m.data.maxHp,
          });
          p.deactivate();
          break;
        }
      }
    }
  }

  // ─── On enemy killed ───

  private onEnemyKilled(enemy: Enemy) {
    // High-Priority Juicy Monster Death Burst (Guaranteed visual pop on every kill)
    this.particleSystem.monsterDeath(enemy.x, enemy.y, enemy.radius, enemy.color);

    // Sound effect (rate limited & varied)
    AudioMixer.playKill(enemy.radius >= 35);

    // Subtle tactile screen shake on heavy enemies (colossus, tank, bomber)
    if (enemy.archetype === "colossus" || enemy.archetype === "tank" || enemy.archetype === "bomber") {
      EventBus.emit("camera:shake", { intensity: 2.2, duration: 0.1 });
    }

    EventBus.emit("enemy:killed", {
      x: enemy.x,
      y: enemy.y,
      enemyType: enemy.archetype,
      hasBurn: enemy.hasBurn(),
      hasShock: enemy.hasShock(),
    });

    this.lootSystem.onEnemyDefeated(
      enemy.x,
      enemy.y,
      enemy.archetype === "tank" || enemy.archetype === "colossus",
    );

    // Volatile bomber explodes on death damaging surrounding monsters
    if (enemy.archetype === "bomber") {
      this.particleSystem.explode(enemy.x, enemy.y, 8, 0xef4444);
      this.handleSplashDamage(enemy.x, enemy.y, 110, 45);
    }

    const convoy = this.convoySystem.convoy;
    for (const m of convoy.modules) {
      if (m.isDead) continue;
      if (m.stats.explosionOnKill) {
        this.handleSplashDamage(enemy.x, enemy.y, 90, 20);
        break;
      }
    }
  }
}
