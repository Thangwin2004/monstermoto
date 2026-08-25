import { Container, Graphics, Text } from "pixi.js";
import { ROAD_SPEED } from "../constants";

export type PickupType =
  | "buff_rapid"
  | "buff_shield"
  | "buff_heal"
  | "buff_nuke"
  | "star_upgrade";

export interface PickupConfig {
  type: PickupType;
  label: string;
  badge: string;
  icon: string;
  color: number;
  shadowColor: number;
  glowColor: number;
  duration?: number;
}

export const PICKUP_CONFIGS: Record<PickupType, PickupConfig> = {
  buff_rapid: {
    type: "buff_rapid",
    label: "⚡ HỎA LỰC CUỒNG NỘ (10S)!",
    badge: "⚡ CUỒNG NỘ",
    icon: "⚡",
    color: 0xf59e0b,
    shadowColor: 0x78350f,
    glowColor: 0xfbbf24,
    duration: 10,
  },
  buff_shield: {
    type: "buff_shield",
    label: "🛡️ KHIÊN BẤT TỬ (8S)!",
    badge: "🛡️ BẤT TỬ",
    icon: "🛡️",
    color: 0x0284c7,
    shadowColor: 0x075985,
    glowColor: 0x38bdf8,
    duration: 8,
  },
  buff_heal: {
    type: "buff_heal",
    label: "💚 HỒI PHỤC 100 HP!",
    badge: "💊 HỒI MÁU",
    icon: "💊",
    color: 0x16a34a,
    shadowColor: 0x14532d,
    glowColor: 0x4ade80,
  },
  buff_nuke: {
    type: "buff_nuke",
    label: "💣 BOM NỔ QUÉT SẠCH QUÁI!",
    badge: "💣 BOM NỔ",
    icon: "💣",
    color: 0xdc2626,
    shadowColor: 0x7f1d1d,
    glowColor: 0xf87171,
  },
  star_upgrade: {
    type: "star_upgrade",
    label: "⭐ LÊN SAO VŨ KHÍ!",
    badge: "⭐ NÂNG CẤP",
    icon: "⭐",
    color: 0xfacc15,
    shadowColor: 0x854d0e,
    glowColor: 0xfef08a,
  },
};

export class Pickup extends Container {
  public active: boolean = false;
  public pickupType: PickupType = "buff_rapid";
  public radius: number = 28;

  public vx: number = 0;
  public vy: number = 0;

  private crateGfx: Graphics;
  private iconText: Text;
  private badgeGfx: Graphics;
  private badgeText: Text;
  private auraGfx: Graphics;
  private animTime: number = 0;

  constructor() {
    super();

    // 1. Radiant Aura
    this.auraGfx = new Graphics();
    this.addChild(this.auraGfx);

    // 2. 3D Capsule / Crate
    this.crateGfx = new Graphics();
    this.addChild(this.crateGfx);

    // 3. Central Icon
    this.iconText = new Text({
      text: "⚡",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 24,
        fill: 0xffffff,
        fontWeight: "900",
      },
    });
    this.iconText.anchor.set(0.5);
    this.addChild(this.iconText);

    // 4. Floating Mini Badge Pill above crate
    this.badgeGfx = new Graphics();
    this.addChild(this.badgeGfx);

    this.badgeText = new Text({
      text: "⚡ CUỒNG NỘ",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 11,
        fill: 0xffffff,
        fontWeight: "900",
        stroke: { color: 0x000000, width: 3 },
      },
    });
    this.badgeText.anchor.set(0.5);
    this.addChild(this.badgeText);
  }

  spawn(x: number, y: number, type: PickupType = "buff_rapid") {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.pickupType = type;
    this.active = true;
    this.visible = true;
    this.animTime = Math.random() * Math.PI * 2;

    const cfg = PICKUP_CONFIGS[type] || PICKUP_CONFIGS.buff_rapid;
    this.iconText.text = cfg.icon;
    this.badgeText.text = cfg.badge;

    this.renderCrate(cfg);
  }

  private renderCrate(cfg: PickupConfig) {
    this.crateGfx.clear();

    const w = 42;
    const h = 42;
    const r = 12;

    // 1. Soft Ambient Shadow
    this.crateGfx
      .roundRect(-w / 2, -h / 2 + 6, w, h, r)
      .fill({ color: 0x000000, alpha: 0.35 });

    // 2. 3D Bevel Shadow Base
    this.crateGfx
      .roundRect(-w / 2, -h / 2 + 3, w, h, r)
      .fill(cfg.shadowColor);

    // 3. Main Vibrant Body with Crisp White Stroke
    this.crateGfx
      .roundRect(-w / 2, -h / 2, w, h, r)
      .fill(cfg.color)
      .stroke({ color: 0xffffff, width: 2.5 });

    // 4. Glossy Highlight Sheen
    this.crateGfx
      .roundRect(-w / 2 + 4, -h / 2 + 3, w - 8, h * 0.36, 6)
      .fill({ color: 0xffffff, alpha: 0.35 });

    // Badge Pill Background (compact above crate)
    this.badgeGfx.clear();
    const bw = 70;
    const bh = 16;
    this.badgeGfx
      .roundRect(-bw / 2, -32, bw, bh, 8)
      .fill(0x0f172a)
      .stroke({ color: cfg.glowColor, width: 1.5 });
    this.badgeText.y = -24;
    this.badgeText.style.fontSize = 10;
  }

  deactivate() {
    this.active = false;
    this.visible = false;
  }

  /**
   * Move with the road, apply magnetic pull towards convoy, and test collision
   */
  updatePickup(
    dt: number,
    convoyX: number,
    convoyY: number,
    modulePositions: { x: number; y: number }[] = [],
    roadSpeed: number = ROAD_SPEED,
  ): boolean {
    if (!this.active) return false;

    const dtSec = dt * (1 / 60);
    this.animTime += dtSec;

    // 1. Find the closest convoy point (either convoy center or any active module)
    let closestX = convoyX;
    let closestY = convoyY;
    let minDistSq = (convoyX - this.x) ** 2 + (convoyY - this.y) ** 2;

    for (const pos of modulePositions) {
      const dSq = (pos.x - this.x) ** 2 + (pos.y - this.y) ** 2;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestX = pos.x;
        closestY = pos.y;
      }
    }

    const dist = Math.sqrt(minDistSq);

    // 2. Magnetic Attraction Physics (Smooth homing when in range)
    const magnetRadius = 220; // 220px magnet range
    if (dist < magnetRadius && dist > 1) {
      const pullForce = 850 * (1 - dist / magnetRadius) + 250;
      const dirX = (closestX - this.x) / dist;
      const dirY = (closestY - this.y) / dist;

      this.vx += dirX * pullForce * dtSec;
      this.vy += dirY * pullForce * dtSec;

      // Friction / Drag on magnet velocity
      this.vx *= 0.94;
      this.vy *= 0.94;
    } else {
      // Normal road movement when far
      this.vx *= 0.9;
      this.vy = roadSpeed;
    }

    this.x += this.vx * dtSec;
    this.y += this.vy * dtSec;

    // 3. Pulsing glow aura & bobbing animation
    const cfg = PICKUP_CONFIGS[this.pickupType] || PICKUP_CONFIGS.buff_rapid;
    const pulse = 1 + Math.sin(this.animTime * 7) * 0.2;
    const ringPulse = 1 + Math.cos(this.animTime * 5) * 0.15;

    this.auraGfx.clear();
    // Inner soft glow
    this.auraGfx
      .circle(0, 0, 32 * pulse)
      .fill({ color: cfg.glowColor, alpha: 0.28 });
    // Outer ripple ring
    this.auraGfx
      .circle(0, 0, 38 * ringPulse)
      .stroke({ color: 0xffffff, width: 2, alpha: 0.75 });

    // Floating bobbing
    const bob = Math.sin(this.animTime * 4.5) * 5;
    this.crateGfx.y = bob;
    this.iconText.y = bob;
    this.badgeGfx.y = bob * 0.5;
    this.badgeText.y = -29 + bob * 0.5;

    // 4. Collision check with convoy
    const collectDistance = 68;
    if (dist < collectDistance) {
      return true;
    }

    // Off screen cleanup
    if (this.y > 1350) {
      this.deactivate();
    }

    return false;
  }
}

