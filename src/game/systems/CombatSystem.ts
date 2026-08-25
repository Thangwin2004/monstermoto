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

    const speedBuff = this.lootSystem.rapidFireTimer > 0 ? 0.5 : 1.0;

    for (const module of convoy.modules) {
      if (module.isDead || !module.data.attack) continue;

      module.cooldownTimer -= dtSec;

      const mPos = getModulePos(convoy.x, convoy.y, module);
      // Turret always aims straight forward in travel direction
      module.setAimAngle(-Math.PI / 2);

      // Continuously auto-fire straight forward in travel direction
      if (module.cooldownTimer <= 0) {
        this.fireWeaponForward(module, mPos);
        module.cooldownTimer = module.getEffectiveCooldown() * speedBuff;
      }

      // ── Integrated Side Mount: Multi-Stream Progressive Flamethrowers (Phun Bão Lửa) ──
      const flameLvl = module.getWeaponLevel("flamethrower");
      if (flameLvl > 0) {
        module.flameCooldownTimer -= dtSec;
        if (module.flameCooldownTimer <= 0) {
          module.flameCooldownTimer = Math.max(0.09, 0.18 - flameLvl * 0.018);
          const flameDmg = Math.round(
            (24 + flameLvl * 18) * module.stats.damageMultiplier,
          );
          const burnChance = Math.min(1.0, 0.4 + flameLvl * 0.15);
          const aoe = 50 + flameLvl * 14;
          const isPlasma = flameLvl >= 5;

          AudioMixer.playShoot("flame");

          // Progressive Multi-Stream Cone based on Star Level:
          // Level 1: 2 front streams
          // Level 2: 2 wider front streams + higher velocity
          // Level 3: 3 streams (Left, Center heavy jet, Right) -> 3-lane cone!
          // Level 4: 4 streams (2 forward + 2 diagonal flank sweeps)
          // Level 5: 5 streams of Blue/Purple Plasma Hellfire covering entire forward road!
          const streams: { x: number; y: number; vx: number; vy: number }[] = [];

          if (flameLvl === 1) {
            streams.push({ x: mPos.x - 34, y: mPos.y - 10, vx: -30, vy: -540 });
            streams.push({ x: mPos.x + 34, y: mPos.y - 10, vx: 30, vy: -540 });
          } else if (flameLvl === 2) {
            streams.push({ x: mPos.x - 36, y: mPos.y - 10, vx: -55, vy: -580 });
            streams.push({ x: mPos.x + 36, y: mPos.y - 10, vx: 55, vy: -580 });
          } else if (flameLvl === 3) {
            streams.push({ x: mPos.x - 38, y: mPos.y - 10, vx: -85, vy: -580 });
            streams.push({ x: mPos.x, y: mPos.y - 28, vx: 0, vy: -650 }); // Center heavy flame
            streams.push({ x: mPos.x + 38, y: mPos.y - 10, vx: 85, vy: -580 });
          } else if (flameLvl === 4) {
            streams.push({ x: mPos.x - 42, y: mPos.y - 4, vx: -160, vy: -480 });
            streams.push({ x: mPos.x - 20, y: mPos.y - 24, vx: -45, vy: -620 });
            streams.push({ x: mPos.x + 20, y: mPos.y - 24, vx: 45, vy: -620 });
            streams.push({ x: mPos.x + 42, y: mPos.y - 4, vx: 160, vy: -480 });
          } else {
            // Level 5: 5 Plasma Hellfire Streams
            streams.push({ x: mPos.x - 44, y: mPos.y - 4, vx: -220, vy: -500 });
            streams.push({ x: mPos.x - 24, y: mPos.y - 22, vx: -85, vy: -660 });
            streams.push({ x: mPos.x, y: mPos.y - 32, vx: 0, vy: -720 });
            streams.push({ x: mPos.x + 24, y: mPos.y - 22, vx: 85, vy: -660 });
            streams.push({ x: mPos.x + 44, y: mPos.y - 4, vx: 220, vy: -500 });
          }

          for (const s of streams) {
            this.projectileSystem.spawn(
              s.x,
              s.y,
              s.vx + (Math.random() - 0.5) * 30,
              s.vy + (Math.random() - 0.5) * 30,
              flameDmg,
              "flame",
              {
                aoeRadius: aoe,
                burnChance: burnChance,
              },
            );
            if (isPlasma) {
              this.particleSystem.plasmaFlamePuff(s.x, s.y, s.vx * 0.45, s.vy * 0.45);
            } else {
              this.particleSystem.flamePuff(s.x, s.y, s.vx * 0.45, s.vy * 0.45);
            }
          }
        }
      }

      // ── Integrated Side Mount: Multi-Target Tesla Lightning Storm (Phóng Sấm Sét Đa Mục Tiêu) ──
      const teslaLvl = module.getWeaponLevel("tesla");
      if (teslaLvl > 0) {
        module.teslaCooldownTimer -= dtSec;
        if (module.teslaCooldownTimer <= 0) {
          module.teslaCooldownTimer = Math.max(0.35, 0.75 - teslaLvl * 0.08);
          const teslaDmg = Math.round(
            (60 + teslaLvl * 35) * module.stats.damageMultiplier,
          );

          // Star level determines simultaneous primary target count & chain depth
          // ⭐ Level 1: 1 target, chain 2
          // ⭐ Level 2: 2 targets, chain 3
          // ⭐ Level 3: 3 targets, chain 4 + EMP shockwave
          // ⭐ Level 4: 4 targets, chain 5 + EMP shockwave
          // ⭐ Level 5: 5 targets, chain 6 + Golden Titan Lightning + Thunderclaps!
          const targetCount = Math.min(5, teslaLvl);
          const chainPerTarget = Math.min(6, 1 + teslaLvl);
          const boltColor = teslaLvl >= 5 ? 0xfacc15 : teslaLvl >= 3 ? 0xa855f7 : 0x00f0ff;

          const leftCoilX = mPos.x - 34;
          const rightCoilX = mPos.x + 34;
          const coilY = mPos.y + 14;

          const targets = this.findMultipleTargets(mPos, 580, targetCount);

          if (targets.length > 0) {
            AudioMixer.playShoot("tesla");

            // EMP shockwave for Level 3+
            if (teslaLvl >= 3) {
              this.particleSystem.empShockwave(mPos.x, mPos.y, 80 + teslaLvl * 20, boltColor);
            }

            for (let tIdx = 0; tIdx < targets.length; tIdx++) {
              const target = targets[tIdx];
              const originX = tIdx % 2 === 0 ? leftCoilX : rightCoilX;

              // Primary bolt
              this.particleSystem.lightningBolt(originX, coilY, target.x, target.y, boltColor);

              // Thunderclap for Level 5
              if (teslaLvl >= 5) {
                this.particleSystem.thunderStrike(target.x, target.y, 0xfacc15);
              }

              const killed = target.takeDamage(teslaDmg);
              target.applyShock(3.0);
              this.particleSystem.hitSpark(target.x, target.y, boltColor, 10);
              EventBus.emit("damage:number", {
                x: target.x,
                y: target.y - 20,
                amount: teslaDmg,
                status: "shock",
              });
              if (killed) this.onEnemyKilled(target);

              // Chain to secondary nearby enemies
              let lastX = target.x;
              let lastY = target.y;
              let chained = 0;

              for (const other of this.enemySystem.enemies) {
                if (!other.active || other === target || targets.includes(other)) continue;
                if (distance(lastX, lastY, other.x, other.y) < 260) {
                  this.particleSystem.lightningBolt(lastX, lastY, other.x, other.y, boltColor);
                  const chainDmg = Math.round(teslaDmg * (0.75 + teslaLvl * 0.05));
                  const k2 = other.takeDamage(chainDmg);
                  other.applyShock(3.0);
                  this.particleSystem.hitSpark(other.x, other.y, boltColor, 6);
                  EventBus.emit("damage:number", {
                    x: other.x,
                    y: other.y - 20,
                    amount: chainDmg,
                    status: "shock",
                  });
                  if (k2) this.onEnemyKilled(other);
                  lastX = other.x;
                  lastY = other.y;
                  chained++;
                  if (chained >= chainPerTarget) break;
                }
              }
            }
          } else {
            // Ambient forward discharge when driving
            this.particleSystem.lightningBolt(
              leftCoilX,
              coilY,
              mPos.x - 20 + (Math.random() - 0.5) * 40,
              mPos.y - 220,
              boltColor,
            );
            this.particleSystem.lightningBolt(
              rightCoilX,
              coilY,
              mPos.x + 20 + (Math.random() - 0.5) * 40,
              mPos.y - 220,
              boltColor,
            );
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
    if (module.data.tags.includes("fire")) projType = "flame";
    else if (module.data.tags.includes("electric")) projType = "lightning";
    else if (module.data.tags.includes("explosive")) projType = "rocket";

    // Play Firing Sound with Rate Limiter & Multi-variation
    AudioMixer.playShoot(
      projType === "flame"
        ? "flame"
        : projType === "lightning"
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

    // Calculate distinct barrel origins and trajectory angles so bullets never overlap
    const barrelSpacing = projCount > 1 ? Math.min(11, 46 / (projCount - 1)) : 0;
    const totalBarrelWidth = barrelSpacing * (projCount - 1);
    const totalSpreadAngle =
      projCount > 1 ? Math.min(0.38, 0.08 * (projCount - 1)) : 0;

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

      if (projType === "flame") {
        this.particleSystem.flamePuff(spawnX, from.y - 24, vx * 0.5, vy * 0.5);
      }
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
      if (!enemy.active) continue;
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

  /** Find multiple distinct enemy targets within range */
  private findMultipleTargets(
    fromPos: { x: number; y: number },
    range: number,
    maxCount: number = 1,
  ): Enemy[] {
    const valid = this.enemySystem.enemies
      .filter((e) => e.active && distance(fromPos.x, fromPos.y, e.x, e.y) < range)
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
        if (!e.active) continue;

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

          // 2. High-Impact VFX on Hit
          const sparkColor =
            p.projType === "flame"
              ? 0xff6600
              : p.projType === "lightning"
                ? 0x00ffff
                : 0xffea00;
          this.particleSystem.hitSpark(
            p.x,
            p.y,
            sparkColor,
            isCrit ? 10 : 6,
            p.vx * 0.15,
            p.vy * 0.15,
          );
          this.particleSystem.bloodSplatter(e.x, e.y, e.color, 4);

          if (isCrit) {
            this.particleSystem.critBurst(p.x, p.y);
            EventBus.emit("camera:shake", { intensity: 4, duration: 0.1 });
          }

          if (p.projType === "lightning" || p.shockChance > 0) {
            this.particleSystem.electricSpark(p.x, p.y);
          } else if (
            p.projType === "flame" ||
            p.aoeRadius > 0 ||
            p.burnChance > 0
          ) {
            this.particleSystem.explode(p.x, p.y, 25, 0xff5500);
          }

          if (p.burnChance > 0 && gameRng.chance(p.burnChance)) {
            e.applyBurn(Math.max(12, Math.round(p.damage * 0.6)), 3.5);
            this.particleSystem.sparkle(e.x, e.y, 0xff5500);
          }
          if (p.shockChance > 0 && gameRng.chance(p.shockChance)) {
            e.applyShock(2.5);
            this.particleSystem.electricSpark(e.x, e.y);
          }

          EventBus.emit("damage:number", {
            x: e.x,
            y: e.y - 20,
            amount: p.damage,
            crit: isCrit || p.damage >= 25,
          });

          if (killed) {
            this.onEnemyKilled(e);
          }

          if (p.aoeRadius > 0) {
            this.handleSplashDamage(p.x, p.y, p.aoeRadius, p.damage * 0.5);
          }

          if (p.bounceCount > 0) {
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
      if (!e.active) continue;
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
          EventBus.emit("camera:shake", { intensity: 6, duration: 0.15 });

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
    // Monster explosion & debris
    this.particleSystem.explode(enemy.x, enemy.y, enemy.radius * 2.2, 0xff6600);
    this.particleSystem.bloodSplatter(enemy.x, enemy.y, enemy.color, 8);

    // Sound effect (rate limited & varied)
    AudioMixer.playKill(enemy.radius >= 35);

    // Screen shake on heavy kills
    if (enemy.radius >= 35) {
      EventBus.emit("camera:shake", { intensity: 5, duration: 0.15 });
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
      this.particleSystem.explode(enemy.x, enemy.y, 80, 0xef4444);
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
