import { Container, Graphics } from "pixi.js";
import { SaveManager } from "../utils/SaveManager";
import { EventBus } from "../utils/EventBus";

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
  shape?: "circle" | "spark" | "ring" | "star";
}

export interface LightningBolt {
  segments: { x1: number; y1: number; x2: number; y2: number }[];
  life: number;
  maxLife: number;
  color: number;
}

const MAX_PARTICLES = 220;
const MAX_BOLTS = 8;

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

    // React immediately when setting is toggled: prune excess particles smoothly
    EventBus.on("settings:changed", (data) => {
      if (data.lowParticles) {
        if (this.particles.length > 25) {
          this.particles.splice(25);
        }
      }
    });
  }

  /**
   * 💥 HIGH-PRIORITY JUICY MONSTER DEATH BURST
   * - High Mode: Double shockwave rings, diamond star flash, and 12 colorful debris particles.
   * - Low Mode: 1 quick minimal shockwave ring + 2 small shards (ultra-lightweight, 0 lag).
   */
  monsterDeath(x: number, y: number, radius: number = 24, monsterColor: number = 0xef4444) {
    const isLow = SaveManager.getSettings().lowParticles;
    const maxP = isLow ? 35 : MAX_PARTICLES;

    if (this.particles.length >= maxP - 8) {
      this.particles.splice(0, isLow ? 6 : 18);
    }

    if (isLow) {
      // ── LOW MODE: Minimal 3-particle pop (ultra lightweight & clean) ──
      // 1. Quick Crisp Shockwave Ring
      this.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        life: 0.15,
        maxLife: 0.15,
        size: Math.max(12, radius * 0.75),
        color: monsterColor,
        alpha: 0.85,
        decay: 1 / 0.15,
        shape: "ring",
      });

      // 2. 2 Quick Minimal Shards
      for (let i = 0; i < 2; i++) {
        const angle = ((Math.PI * 2) / 2) * i + Math.random() * 0.3;
        const speed = 90;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.16,
          maxLife: 0.16,
          size: 2.5,
          color: i === 0 ? 0xffffff : monsterColor,
          alpha: 0.85,
          decay: 1 / 0.16,
          shape: "circle",
          shrink: true,
        });
      }
      return;
    }

    // ── HIGH MODE: Stunning Arcade Double-Ring & Diamond Burst ──
    // 1. Central Diamond Star Pop Flash
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.14,
      maxLife: 0.14,
      size: Math.max(16, radius * 1.1),
      color: 0xffffff,
      alpha: 1,
      decay: 1 / 0.14,
      shape: "star",
      shrink: true,
    });

    // 2. Primary Outer White Shockwave Ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.24,
      maxLife: 0.24,
      size: Math.max(18, radius * 0.9),
      color: 0xffffff,
      alpha: 1,
      decay: 1 / 0.24,
      shape: "ring",
    });

    // 3. Secondary Monster-Tinted Glow Ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.20,
      maxLife: 0.20,
      size: Math.max(14, radius * 0.65),
      color: monsterColor,
      alpha: 0.85,
      decay: 1 / 0.20,
      shape: "ring",
    });

    // 4. 12 Vibrant Monster Shards, Stars & Fiery Embers
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = ((Math.PI * 2) / count) * i + (Math.random() - 0.5) * 0.35;
      const speed = 120 + Math.random() * 160;
      const life = 0.26 + Math.random() * 0.15;
      const color =
        i % 4 === 0
          ? 0xffffff
          : i % 4 === 1
            ? 0xfacc15
            : i % 4 === 2
              ? 0xff7700
              : monsterColor;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: 3.5 + Math.random() * 3.0,
        color,
        alpha: 1,
        decay: 1 / life,
        shape: i % 3 === 0 ? "star" : i % 2 === 0 ? "spark" : "circle",
        shrink: true,
      });
    }
  }

  explode(x: number, y: number, count: number = 8, color: number = 0xff6600) {
    const isLow = SaveManager.getSettings().lowParticles;
    const maxP = isLow ? 35 : MAX_PARTICLES;

    if (this.particles.length >= maxP - 6) {
      this.particles.splice(0, isLow ? 4 : 8);
    }

    // Shockwave Ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: isLow ? 0.15 : 0.22,
      maxLife: isLow ? 0.15 : 0.22,
      size: isLow ? 12 : 18,
      color: 0xffffff,
      alpha: 1,
      decay: 1 / (isLow ? 0.15 : 0.22),
      shape: "ring",
    });

    const pCount = isLow ? 2 : Math.max(7, Math.min(11, count));
    for (let i = 0; i < pCount; i++) {
      const angle = ((Math.PI * 2) / pCount) * i + Math.random() * 0.4;
      const speed = isLow ? 80 : 90 + Math.random() * 140;
      const life = isLow ? 0.16 : 0.24 + Math.random() * 0.12;
      const pColor = i % 2 === 0 ? 0xffffff : color;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: isLow ? 2.5 : 4.5,
        color: pColor,
        alpha: 1,
        decay: 1 / life,
        shape: isLow ? "circle" : i % 3 === 0 ? "star" : "circle",
        shrink: true,
      });
    }
  }

  muzzleFlash(x: number, y: number, angle: number, color: number = 0xfacc15) {
    if (SaveManager.getSettings().lowParticles) return;
    if (this.particles.length >= MAX_PARTICLES - 3) return;

    // 4-point Diamond Lens Flare Flash
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.07,
      maxLife: 0.07,
      size: 14,
      color: 0xffffff,
      alpha: 1,
      decay: 1 / 0.07,
      shape: "star",
      shrink: true,
    });

    // 2 Velocity Directional Embers
    for (let i = 0; i < 2; i++) {
      const a = angle + (Math.random() - 0.5) * 0.35;
      const spd = 140 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 0.09,
        maxLife: 0.09,
        size: 3.5,
        color: i === 0 ? 0xffffff : color,
        alpha: 0.9,
        decay: 1 / 0.09,
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
    _count: number = 2,
    baseVx: number = 0,
    baseVy: number = 0,
  ) {
    if (SaveManager.getSettings().lowParticles) return;
    if (this.particles.length >= MAX_PARTICLES - 3) return;

    const count = Math.min(3, _count);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 90;
      const life = 0.14 + Math.random() * 0.08;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed + baseVx * 0.2,
        vy: Math.sin(angle) * speed + baseVy * 0.2,
        life,
        maxLife: life,
        size: 3.0,
        color: i === 0 ? 0xffffff : color,
        alpha: 0.95,
        decay: 1 / life,
        shape: i === 0 ? "star" : "spark",
        shrink: true,
      });
    }
  }

  /** Monster splatter goo when struck */
  bloodSplatter(
    x: number,
    y: number,
    color: number = 0xef4444,
    _count: number = 2,
  ) {
    if (SaveManager.getSettings().lowParticles) return;
    if (this.particles.length >= MAX_PARTICLES - 2) return;

    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 45 + Math.random() * 60;
      const life = 0.16 + Math.random() * 0.1;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: 3.0,
        color,
        alpha: 0.85,
        decay: 1 / life,
        shape: "circle",
        shrink: true,
      });
    }
  }

  /** Dramatic critical hit burst (Diamond Starburst + Ruby Shockwave) */
  critBurst(x: number, y: number) {
    if (this.particles.length >= MAX_PARTICLES - 6) return;

    // Large Gold Starburst Flare
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.18,
      maxLife: 0.18,
      size: 26,
      color: 0xfacc15,
      alpha: 1,
      decay: 1 / 0.18,
      shape: "star",
      shrink: true,
    });

    // Ruby Shock Ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.22,
      maxLife: 0.22,
      size: 28,
      color: 0xff0055,
      alpha: 1,
      decay: 1 / 0.22,
      shape: "ring",
    });

    for (let i = 0; i < 4; i++) {
      const angle = ((Math.PI * 2) / 4) * i;
      const spd = 130 + Math.random() * 50;
      const life = 0.20;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life,
        maxLife: life,
        size: 4.0,
        color: i % 2 === 0 ? 0xffffff : 0xfacc15,
        alpha: 1,
        decay: 1 / life,
        shape: "spark",
      });
    }
  }

  flamePuff(x: number, y: number, vx: number, vy: number) {
    if (SaveManager.getSettings().lowParticles) return;
    if (this.particles.length >= MAX_PARTICLES - 1) return;
    const life = 0.20;
    this.particles.push({
      x,
      y,
      vx: vx * 0.5,
      vy: vy * 0.5,
      life,
      maxLife: life,
      size: 9,
      color: Math.random() < 0.5 ? 0xff3b30 : 0xfb923c,
      alpha: 0.75,
      decay: 1 / life,
      shape: "circle",
      shrink: true,
    });
  }

  plasmaFlamePuff(x: number, y: number, vx: number, vy: number) {
    if (SaveManager.getSettings().lowParticles) return;
    if (this.particles.length >= MAX_PARTICLES - 1) return;
    const life = 0.20;
    this.particles.push({
      x,
      y,
      vx: vx * 0.5,
      vy: vy * 0.5,
      life,
      maxLife: life,
      size: 11,
      color: Math.random() < 0.5 ? 0x00f0ff : 0xa855f7,
      alpha: 0.8,
      decay: 1 / life,
      shape: "circle",
      shrink: true,
    });
  }

  empShockwave(x: number, y: number, radius: number = 60, color: number = 0x00f0ff) {
    if (this.particles.length >= MAX_PARTICLES - 1) return;
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.22,
      maxLife: 0.22,
      size: radius,
      color,
      alpha: 0.95,
      decay: 1 / 0.22,
      shape: "ring",
    });
  }

  thunderStrike(x: number, y: number, color: number = 0xfacc15) {
    this.empShockwave(x, y, 45, color);
    this.critBurst(x, y);
  }

  exhaustPuff(x: number, y: number, vx: number, vy: number) {
    if (SaveManager.getSettings().lowParticles) return;
    if (this.particles.length >= MAX_PARTICLES - 1) return;
    const life = 0.24;
    this.particles.push({
      x,
      y,
      vx: vx * 0.5,
      vy: vy * 0.5,
      life,
      maxLife: life,
      size: 5.5,
      color: 0x64748b,
      alpha: 0.25,
      decay: 1 / life,
      shape: "circle",
      shrink: false,
    });
  }

  sparkle(x: number, y: number, color: number = 0xfacc15) {
    if (SaveManager.getSettings().lowParticles) return;
    if (this.particles.length >= MAX_PARTICLES - 3) return;
    for (let i = 0; i < 3; i++) {
      const angle = ((Math.PI * 2) / 3) * i + Math.random() * 0.4;
      const spd = 70 + Math.random() * 40;
      const life = 0.24;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 30,
        life,
        maxLife: life,
        size: 3.5,
        color: i === 0 ? 0xffffff : color,
        alpha: 1,
        decay: 1 / life,
        shape: "star",
        shrink: true,
      });
    }
  }

  electricSpark(x: number, y: number) {
    if (SaveManager.getSettings().lowParticles) return;
    if (this.particles.length >= MAX_PARTICLES - 2) return;
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 110;
      const life = 0.14;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life,
        maxLife: life,
        size: 3.0,
        color: i === 0 ? 0xffffff : 0x00f0ff,
        alpha: 0.95,
        decay: 1 / life,
        shape: "spark",
      });
    }
  }

  /** High-Performance Dual-Pass Lightning Bolt */
  lightningBolt(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: number = 0x00e5ff,
  ) {
    if (this.bolts.length >= MAX_BOLTS) return;

    const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 22;
    const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 22;

    const segments = [
      { x1, y1, x2: midX, y2: midY },
      { x1: midX, y1: midY, x2, y2 },
    ];

    this.bolts.push({
      segments,
      life: 0.14,
      maxLife: 0.14,
      color,
    });
  }

  update(dt: number) {
    const isLow = SaveManager.getSettings().lowParticles;
    const dtSec = dt * (1 / 60);
    this.gfx.clear();

    // In Low Mode: Cap max particles at 35 to prevent any backlog
    if (isLow && this.particles.length > 35) {
      this.particles.splice(35);
    }

    // 1. Render Lightning Bolts (Dual-pass in High mode, fast single-pass in Low mode)
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.life -= dtSec;
      if (b.life <= 0) {
        this.bolts.splice(i, 1);
        continue;
      }

      const alpha = Math.max(0, b.life / b.maxLife);

      if (!isLow) {
        // Outer Neon Glow Arc
        for (const seg of b.segments) {
          this.gfx
            .moveTo(seg.x1, seg.y1)
            .lineTo(seg.x2, seg.y2)
            .stroke({ color: b.color, width: 5.5, alpha: alpha * 0.75 });
        }
      }

      // Inner Bright White Core
      for (const seg of b.segments) {
        this.gfx
          .moveTo(seg.x1, seg.y1)
          .lineTo(seg.x2, seg.y2)
          .stroke({ color: 0xffffff, width: isLow ? 1.8 : 2.0, alpha });
      }
    }

    // 2. Render Particles (Batched Vector Shapes)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dtSec;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;

      const progress = 1 - p.life / p.maxLife;
      p.alpha = 1 - progress;

      let curSize = p.size;
      if (p.shrink) {
        curSize = p.size * (1 - progress);
      } else if (p.shape === "ring") {
        curSize = p.size * (1 + progress * 1.6);
      }

      if (p.shape === "ring") {
        this.gfx
          .circle(p.x, p.y, curSize)
          .stroke({ color: p.color, width: isLow ? 1.5 : 3, alpha: p.alpha * 0.8 });
      } else if (p.shape === "spark") {
        const len = Math.max(3.5, Math.sqrt(p.vx * p.vx + p.vy * p.vy) * 0.035);
        const angle = Math.atan2(p.vy, p.vx);
        this.gfx
          .moveTo(p.x, p.y)
          .lineTo(p.x - Math.cos(angle) * len, p.y - Math.sin(angle) * len)
          .stroke({ color: p.color, width: curSize, alpha: p.alpha });
      } else if (p.shape === "star" && !isLow) {
        // 4-point Diamond Comic Starburst
        const s = Math.max(1, curSize);
        const sSub = s * 0.32;
        this.gfx
          .poly([
            p.x, p.y - s,
            p.x + sSub, p.y - sSub,
            p.x + s, p.y,
            p.x + sSub, p.y + sSub,
            p.x, p.y + s,
            p.x - sSub, p.y + sSub,
            p.x - s, p.y,
            p.x - sSub, p.y - sSub,
          ])
          .fill({ color: p.color, alpha: p.alpha });
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
