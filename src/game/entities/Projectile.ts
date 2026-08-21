import { Container, Graphics } from "pixi.js";

export type ProjectileType =
  "bullet" | "flame" | "lightning" | "rocket" | "acid";

export interface ProjectileSpawnOptions {
  aoeRadius?: number;
  burnChance?: number;
  shockChance?: number;
  bounceCount?: number;
  chainTargets?: number;
  isEnemy?: boolean;
  radius?: number;
}

export class Projectile extends Container {
  public vx: number = 0;
  public vy: number = 0;
  public speed: number = 0;
  public damage: number = 0;
  public active: boolean = false;
  public radius: number = 6;
  public projType: ProjectileType = "bullet";
  public isEnemyProjectile: boolean = false;

  public aoeRadius: number = 0;
  public burnChance: number = 0;
  public shockChance: number = 0;
  public bounceCount: number = 0;
  public chainTargets: number = 0;

  private gfx: Graphics;
  private animTime: number = 0;

  constructor() {
    super();
    this.gfx = new Graphics();
    this.addChild(this.gfx);
  }

  reset(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    type: ProjectileType = "bullet",
    opts: ProjectileSpawnOptions = {},
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.speed = Math.sqrt(vx * vx + vy * vy);
    this.damage = damage;
    this.projType = type;
    this.active = true;
    this.visible = true;
    this.isEnemyProjectile = opts.isEnemy ?? false;
    this.aoeRadius = opts.aoeRadius ?? 0;
    this.burnChance = opts.burnChance ?? 0;
    this.shockChance = opts.shockChance ?? 0;
    this.bounceCount = opts.bounceCount ?? 0;
    this.animTime = 0;

    const angle = Math.atan2(vy, vx);
    this.rotation = angle;

    this.renderVisual();
  }

  spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    type: ProjectileType = "bullet",
    opts: ProjectileSpawnOptions = {},
  ) {
    this.reset(x, y, vx, vy, damage, type, opts);
  }

  private renderVisual() {
    this.gfx.clear();

    if (this.projType === "bullet") {
      this.radius = 6;
      let tracerColor = 0xffea00;
      let auraColor = 0xff9900;

      if (this.burnChance > 0) {
        tracerColor = 0xff4500;
        auraColor = 0xff2200;
      } else if (this.shockChance > 0) {
        tracerColor = 0x00ffff;
        auraColor = 0x0088ff;
      }

      // Glowing tracer round
      this.gfx
        .roundRect(-12, -3, 24, 6, 3)
        .fill(tracerColor)
        .stroke({ color: 0xffffff, width: 1.5 });
      // Soft glow aura
      this.gfx
        .roundRect(-16, -5, 32, 10, 5)
        .fill({ color: auraColor, alpha: 0.45 });

      if (this.burnChance > 0) {
        // Mini fire flame tail
        this.gfx.circle(-14, 0, 4).fill(0xff6600);
      } else if (this.shockChance > 0) {
        // Mini electric lightning spark
        this.gfx.circle(-14, 0, 4).fill(0x67e8f9);
      }
    } else if (this.projType === "flame") {
      this.radius = 16;
      // Multi-layered fireball
      this.gfx.circle(0, 0, 16).fill({ color: 0xff3300, alpha: 0.4 });
      this.gfx.circle(0, 0, 11).fill({ color: 0xff7700, alpha: 0.7 });
      this.gfx.circle(0, 0, 6).fill(0xffff66);
    } else if (this.projType === "lightning") {
      this.radius = 10;
      // Electric Plasma Orb with crackles
      this.gfx.circle(0, 0, 10).fill({ color: 0x00d4ff, alpha: 0.4 });
      this.gfx
        .circle(0, 0, 6)
        .fill(0xffffff)
        .stroke({ color: 0x00e5ff, width: 2 });
      // Mini lightning spokes
      for (let i = 0; i < 4; i++) {
        const a = ((Math.PI * 2) / 4) * i;
        this.gfx
          .moveTo(0, 0)
          .lineTo(Math.cos(a) * 14, Math.sin(a) * 14)
          .stroke({ color: 0xa5f3fc, width: 2 });
      }
    } else if (this.projType === "rocket") {
      this.radius = 12;
      // Missile body
      this.gfx
        .roundRect(-14, -5, 28, 10, 4)
        .fill(0x334155)
        .stroke({ color: 0xffffff, width: 1.5 });
      // Red warhead
      this.gfx.roundRect(8, -5, 8, 10, 3).fill(0xef4444);
      // Stabilizer fins
      this.gfx.rect(-14, -8, 6, 16).fill(0xf59e0b);
      // Exhaust flame
      this.gfx.circle(-16, 0, 5).fill(0xffaa00);
    } else if (this.projType === "acid") {
      this.radius = 10;
      // Toxic Slime Spit
      this.gfx.circle(0, 0, 10).fill({ color: 0x22c55e, alpha: 0.7 });
      this.gfx
        .circle(0, 0, 6)
        .fill(0x86efac)
        .stroke({ color: 0x15803d, width: 2 });
      // Toxic Bubbles
      this.gfx.circle(-4, -4, 2.5).fill(0xffffff);
      this.gfx.circle(3, 3, 2).fill(0xdcfce7);
    }
  }

  update(dtSec: number) {
    this.animTime += dtSec;
    this.x += this.vx * dtSec;
    this.y += this.vy * dtSec;

    // Dynamic pulsing animation for energy/flame projectiles
    if (this.projType === "flame") {
      const scale = 1 + Math.sin(this.animTime * 20) * 0.15;
      this.gfx.scale.set(scale);
    } else if (this.projType === "lightning") {
      this.rotation += 0.2;
    }
  }

  deactivate() {
    this.active = false;
    this.visible = false;
  }
}
