import { Container, Graphics } from "pixi.js";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
  decay: number;
  gravity?: number;
  shrink?: boolean;
  spin?: number;
  rotation?: number;
  shape?: "circle" | "rect" | "spark" | "ring";
}

export interface LightningBolt {
  segments: { x1: number; y1: number; x2: number; y2: number }[];
  life: number;
  maxLife: number;
  color: number;
}

export class ParticleSystem {
  public container: Container;
  private particles: Particle[] = [];
  private bolts: LightningBolt[] = [];
  private gfx: Graphics;

  constructor(parent: Container) {
    this.container = new Container();
    parent.addChild(this.container);

    this.gfx = new Graphics();
    this.container.addChild(this.gfx);
  }

  explode(x: number, y: number, count: number = 20, color: number = 0xff6600) {
    // Shockwave Ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.25,
      maxLife: 0.25,
      size: 15,
      color: 0xffffff,
      alpha: 1,
      decay: 4,
      shape: "ring",
    });

    // Fire & Debris particles
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 220;
      const life = 0.25 + Math.random() * 0.45;
      const pColor =
        Math.random() < 0.35
          ? 0xffffff
          : Math.random() < 0.5
            ? 0xffcc00
            : color;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: 3 + Math.random() * 5,
        color: pColor,
        alpha: 1,
        decay: 1 / life,
        shrink: true,
      });
    }
  }

  muzzleFlash(x: number, y: number, angle: number, color: number = 0xfacc15) {
    // Bright central flash
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.08,
      maxLife: 0.08,
      size: 14,
      color: 0xffffff,
      alpha: 1,
      decay: 1 / 0.08,
      shape: "circle",
      shrink: true,
    });

    // Directional muzzle sparks
    for (let i = 0; i < 6; i++) {
      const a = angle + (Math.random() - 0.5) * 0.5;
      const spd = 160 + Math.random() * 140;
      const life = 0.12 + Math.random() * 0.08;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life,
        maxLife: life,
        size: 3 + Math.random() * 3,
        color: Math.random() < 0.4 ? 0xffffff : color,
        alpha: 1,
        decay: 1 / life,
        shape: "spark",
        shrink: true,
      });
    }
  }

  /** High-energy impact sparks when projectile strikes enemy */
  hitSpark(
    x: number,
    y: number,
    color: number = 0xffea00,
    count: number = 6,
    baseVx: number = 0,
    baseVy: number = 0,
  ) {
    // Mini impact flash ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.12,
      maxLife: 0.12,
      size: 10,
      color: 0xffffff,
      alpha: 0.9,
      decay: 1 / 0.12,
      shape: "ring",
    });

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 160;
      const life = 0.15 + Math.random() * 0.15;
      const pColor = Math.random() < 0.4 ? 0xffffff : color;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed + baseVx * 0.3,
        vy: Math.sin(angle) * speed + baseVy * 0.3,
        life,
        maxLife: life,
        size: 2.5 + Math.random() * 2.5,
        color: pColor,
        alpha: 1,
        decay: 1 / life,
        shape: "spark",
        shrink: true,
      });
    }
  }

  /** Monster splatter goo when struck */
  bloodSplatter(
    x: number,
    y: number,
    color: number = 0xef4444,
    count: number = 5,
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      const life = 0.2 + Math.random() * 0.2;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        life,
        maxLife: life,
        size: 3 + Math.random() * 3,
        color,
        alpha: 0.9,
        decay: 1 / life,
        shrink: true,
      });
    }
  }

  /** Dramatic critical hit burst */
  critBurst(x: number, y: number) {
    // Shock ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.2,
      maxLife: 0.2,
      size: 24,
      color: 0xff0055,
      alpha: 1,
      decay: 1 / 0.2,
      shape: "ring",
    });

    for (let i = 0; i < 12; i++) {
      const angle = ((Math.PI * 2) / 12) * i;
      const spd = 180 + Math.random() * 80;
      const life = 0.22 + Math.random() * 0.1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life,
        maxLife: life,
        size: 4,
        color: i % 2 === 0 ? 0xffffff : 0xff0055,
        alpha: 1,
        decay: 1 / life,
        shape: "spark",
      });
    }
  }

  flamePuff(x: number, y: number, vx: number, vy: number) {
    const colors = [0xff3300, 0xff7700, 0xffbb00, 0xffffff];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const life = 0.2 + Math.random() * 0.2;
    this.particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: vx + (Math.random() - 0.5) * 40,
      vy: vy + (Math.random() - 0.5) * 40,
      life,
      maxLife: life,
      size: 8 + Math.random() * 8,
      color,
      alpha: 0.85,
      decay: 1 / life,
      shrink: true,
    });
  }

  /** Supercharged Blue/Purple Plasma Hellfire for Level 5 Flamethrower */
  plasmaFlamePuff(x: number, y: number, vx: number, vy: number) {
    const colors = [0x00f0ff, 0x38bdf8, 0xa855f7, 0xc084fc, 0xffffff];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const life = 0.25 + Math.random() * 0.22;
    this.particles.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 12,
      vx: vx + (Math.random() - 0.5) * 50,
      vy: vy + (Math.random() - 0.5) * 50,
      life,
      maxLife: life,
      size: 12 + Math.random() * 12,
      color,
      alpha: 0.95,
      decay: 1 / life,
      shrink: true,
    });
  }

  /** Expanding EMP Shockwave Ring for High-Tier Tesla Strikes */
  empShockwave(x: number, y: number, radius: number = 80, color: number = 0x00f0ff) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.28,
      maxLife: 0.28,
      size: radius,
      color,
      alpha: 1,
      decay: 1 / 0.28,
      shape: "ring",
    });
  }

  /** Divine Thunder Strike Spark Burst on Target */
  thunderStrike(x: number, y: number, color: number = 0xfacc15) {
    // Vertical flash bolt indicator
    this.lightningBolt(x, y - 220, x, y, color);
    this.empShockwave(x, y, 45, color);
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 140 + Math.random() * 120;
      const life = 0.2 + Math.random() * 0.15;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life,
        maxLife: life,
        size: 4 + Math.random() * 3,
        color: Math.random() < 0.5 ? 0xffffff : color,
        alpha: 1,
        decay: 1 / life,
        shape: "spark",
      });
    }
  }

  exhaustPuff(x: number, y: number, vx: number, vy: number) {
    const life = 0.35 + Math.random() * 0.25;
    this.particles.push({
      x,
      y,
      vx: vx + (Math.random() - 0.5) * 20,
      vy: vy + (Math.random() - 0.5) * 20,
      life,
      maxLife: life,
      size: 5 + Math.random() * 5,
      color: 0x64748b,
      alpha: 0.22,
      decay: 1 / life,
      shrink: false,
    });
  }

  sparkle(x: number, y: number, color: number = 0xfacc15) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 50 + Math.random() * 80;
      const life = 0.3 + Math.random() * 0.3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life,
        maxLife: life,
        size: 3 + Math.random() * 3,
        color,
        alpha: 1,
        decay: 1 / life,
        shrink: true,
      });
    }
  }

  electricSpark(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const angle = ((Math.PI * 2) / 8) * i + (Math.random() - 0.5) * 0.4;
      const spd = 120 + Math.random() * 100;
      const life = 0.18 + Math.random() * 0.12;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life,
        maxLife: life,
        size: 3,
        color: Math.random() < 0.5 ? 0xffffff : 0x00f0ff,
        alpha: 1,
        decay: 1 / life,
        shape: "spark",
      });
    }
  }

  /** High-Voltage Realistic Jagged Chain Lightning Bolt */
  lightningBolt(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: number = 0x00e5ff,
  ) {
    const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(4, Math.floor(dist / 22));

    let curX = x1;
    let curY = y1;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      let targetX = x1 + dx * t;
      let targetY = y1 + dy * t;

      if (i < steps) {
        // Perpendicular jagged jitter
        const perpX = -dy / dist;
        const perpY = dx / dist;
        const jitter = (Math.random() - 0.5) * Math.min(36, dist * 0.25);
        targetX += perpX * jitter;
        targetY += perpY * jitter;
      }

      segments.push({ x1: curX, y1: curY, x2: targetX, y2: targetY });

      // Branch fork occasionally
      if (Math.random() < 0.35 && i < steps - 1) {
        const branchAngle =
          Math.atan2(dy, dx) + (Math.random() < 0.5 ? 0.6 : -0.6);
        const branchLen = 20 + Math.random() * 25;
        segments.push({
          x1: targetX,
          y1: targetY,
          x2: targetX + Math.cos(branchAngle) * branchLen,
          y2: targetY + Math.sin(branchAngle) * branchLen,
        });
      }

      curX = targetX;
      curY = targetY;
    }

    const life = 0.16;
    this.bolts.push({
      segments,
      life,
      maxLife: life,
      color,
    });

    // Flash and sparks at endpoints
    this.electricSpark(x1, y1);
    this.electricSpark(x2, y2);
  }

  update(dt: number) {
    const dtSec = dt * (1 / 60);
    this.gfx.clear();

    // 1. Render Lightning Bolts (Glow + Bright White Core)
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.life -= dtSec;
      if (b.life <= 0) {
        this.bolts.splice(i, 1);
        continue;
      }

      const alpha = Math.max(0, b.life / b.maxLife);

      // Outer Neon Glow Arc
      for (const seg of b.segments) {
        this.gfx
          .moveTo(seg.x1, seg.y1)
          .lineTo(seg.x2, seg.y2)
          .stroke({ color: b.color, width: 6, alpha: alpha * 0.75 });
      }

      // Inner Core Bright Arc
      for (const seg of b.segments) {
        this.gfx
          .moveTo(seg.x1, seg.y1)
          .lineTo(seg.x2, seg.y2)
          .stroke({ color: 0xffffff, width: 2.5, alpha: alpha });
      }
    }

    // 2. Render Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dtSec;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;

      if (p.gravity) {
        p.vy += p.gravity * dtSec;
      }

      const progress = 1 - p.life / p.maxLife;
      p.alpha = 1 - progress;

      let curSize = p.size;
      if (p.shrink) {
        curSize = p.size * (1 - progress);
      } else if (p.shape === "ring") {
        curSize = p.size * (1 + progress * 2);
      }

      if (p.shape === "ring") {
        this.gfx
          .circle(p.x, p.y, curSize)
          .stroke({ color: p.color, width: 3, alpha: p.alpha });
      } else if (p.shape === "spark") {
        const len = Math.max(4, Math.sqrt(p.vx * p.vx + p.vy * p.vy) * 0.04);
        const angle = Math.atan2(p.vy, p.vx);
        this.gfx
          .moveTo(p.x, p.y)
          .lineTo(p.x - Math.cos(angle) * len, p.y - Math.sin(angle) * len)
          .stroke({ color: p.color, width: curSize, alpha: p.alpha });
      } else {
        this.gfx
          .circle(p.x, p.y, Math.max(1, curSize))
          .fill({ color: p.color, alpha: p.alpha });
      }
    }
  }

  clear() {
    this.particles = [];
    this.bolts = [];
    this.gfx.clear();
  }
}
