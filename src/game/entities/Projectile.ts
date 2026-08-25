import { Container, Graphics, GraphicsContext } from "pixi.js";

export type ProjectileType =
  | "bullet" | "flame" | "lightning" | "rocket" | "acid";

export interface ProjectileSpawnOptions {
  aoeRadius?: number;
  burnChance?: number;
  shockChance?: number;
  bounceCount?: number;
  chainTargets?: number;
  isEnemy?: boolean;
  radius?: number;
}

// Performance Cache: Static GraphicsContext for all projectile visuals
const projectileContextCache = new Map<string, GraphicsContext>();

function getProjectileContext(key: string, drawFn: (g: GraphicsContext) => void): GraphicsContext {
  if (!projectileContextCache.has(key)) {
    const ctx = new GraphicsContext();
    drawFn(ctx);
    projectileContextCache.set(key, ctx);
  }
  return projectileContextCache.get(key)!;
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

    this.bindVisual();
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

  private bindVisual() {
    if (this.projType === "bullet") {
      this.radius = 6;
      const key = this.burnChance > 0 ? "bullet_burn" : this.shockChance > 0 ? "bullet_shock" : "bullet_normal";
      this.gfx.context = getProjectileContext(key, (g) => {
        let tracerColor = 0xffea00;
        let auraColor = 0xf59e0b;
        let coreColor = 0xffffff;

        if (this.burnChance > 0) {
          tracerColor = 0xff4500;
          auraColor = 0xef4444;
        } else if (this.shockChance > 0) {
          tracerColor = 0x00f0ff;
          auraColor = 0x0284c7;
        }

        const tailLen = this.burnChance > 0 || this.shockChance > 0 ? 96 : 76;
        g.poly([10, -7, 10, 7, -tailLen, 0])
          .fill({ color: auraColor, alpha: 0.32 });
        g.poly([8, -4, 8, 4, -tailLen * 0.72, 0])
          .fill({ color: tracerColor, alpha: 0.78 });
        g.poly([6, -2, 6, 2, -tailLen * 0.45, 0])
          .fill({ color: coreColor, alpha: 0.95 });
        g.roundRect(-8, -3.5, 16, 7, 3.5)
          .fill(tracerColor)
          .stroke({ color: 0xffffff, width: 1.5 });
        g.circle(6, 0, 3).fill(0xffffff);

        if (this.burnChance > 0) {
          g.circle(-18, -1.5, 3.5).fill(0xff7700);
          g.circle(-34, 1.5, 2.5).fill(0xffaa00);
          g.circle(-52, -1, 1.8).fill(0xffdd00);
        } else if (this.shockChance > 0) {
          g.circle(-18, 1.5, 3).fill(0xa5f3fc);
          g.circle(-36, -2, 2.2).fill(0x38bdf8);
          g.circle(-54, 1, 1.6).fill(0x0284c7);
        } else {
          g.circle(-16, 0, 2.5).fill({ color: 0xfffbeb, alpha: 0.85 });
          g.circle(-32, 0, 2.0).fill({ color: 0xfde047, alpha: 0.65 });
          g.circle(-48, 0, 1.5).fill({ color: 0xf59e0b, alpha: 0.45 });
        }
      });
    } else if (this.projType === "flame") {
      this.radius = 16;
      this.gfx.context = getProjectileContext("flame", (g) => {
        g.poly([6, -16, 6, 16, -42, 0]).fill({ color: 0xff3300, alpha: 0.35 });
        g.circle(0, 0, 16).fill({ color: 0xff3300, alpha: 0.45 });
        g.circle(0, 0, 11).fill({ color: 0xff7700, alpha: 0.75 });
        g.circle(0, 0, 6).fill(0xffffaa);
      });
    } else if (this.projType === "lightning") {
      this.radius = 10;
      this.gfx.context = getProjectileContext("lightning", (g) => {
        g.poly([4, -8, 4, 8, -32, 0]).fill({ color: 0x00f0ff, alpha: 0.35 });
        g.circle(0, 0, 10).fill({ color: 0x00d4ff, alpha: 0.4 });
        g.circle(0, 0, 6)
          .fill(0xffffff)
          .stroke({ color: 0x00e5ff, width: 2 });
        for (let i = 0; i < 4; i++) {
          const a = ((Math.PI * 2) / 4) * i;
          g.moveTo(0, 0)
            .lineTo(Math.cos(a) * 14, Math.sin(a) * 14)
            .stroke({ color: 0xa5f3fc, width: 2 });
        }
      });
    } else if (this.projType === "rocket") {
      this.radius = 12;
      this.gfx.context = getProjectileContext("rocket", (g) => {
        g.poly([-10, -6, -10, 6, -48, 0]).fill({ color: 0x94a3b8, alpha: 0.45 });
        g.poly([-12, -4, -12, 4, -32, 0]).fill({ color: 0xf97316, alpha: 0.85 });
        g.roundRect(-14, -5, 28, 10, 4)
          .fill(0x334155)
          .stroke({ color: 0xffffff, width: 1.5 });
        g.roundRect(8, -5, 8, 10, 3).fill(0xef4444);
        g.rect(-14, -8, 6, 16).fill(0xf59e0b);
        g.circle(-16, 0, 5).fill(0xfff0aa);
      });
    } else if (this.projType === "acid") {
      this.radius = 10;
      this.gfx.context = getProjectileContext("acid", (g) => {
        g.poly([4, -8, 4, 8, -28, 0]).fill({ color: 0x15803d, alpha: 0.4 });
        g.circle(0, 0, 10).fill({ color: 0x22c55e, alpha: 0.7 });
        g.circle(0, 0, 6)
          .fill(0x86efac)
          .stroke({ color: 0x15803d, width: 2 });
        g.circle(-4, -4, 2.5).fill(0xffffff);
        g.circle(3, 3, 2).fill(0xdcfce7);
      });
    }
  }

  update(dtSec: number) {
    this.animTime += dtSec;
    this.x += this.vx * dtSec;
    this.y += this.vy * dtSec;

    if (this.projType === "lightning") {
      this.rotation += 0.2;
    }
  }

  deactivate() {
    this.active = false;
    this.visible = false;
  }
}
