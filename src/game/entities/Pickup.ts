import { Container, Graphics, Text } from "pixi.js";
import { ROAD_SPEED } from "../constants";
import { SaveManager } from "../utils/SaveManager";
import { VectorIcons } from "../ui/VectorIcons";

export type PickupType =
  | "buff_rapid"
  | "buff_shield"
  | "buff_heal"
  | "buff_nuke"
  | "star_upgrade";

export interface PickupConfig {
  type: PickupType;
  label: string;
  color: number;
  shadowColor: number;
  glowColor: number;
  icon: string;
  vectorIcon?: "lightning" | "speaker" | "check";
}

export const PICKUP_CONFIGS: Record<PickupType, PickupConfig> = {
  buff_rapid: {
    type: "buff_rapid",
    label: "HỎA LỰC CUỒNG NỘ (10S)!",
    color: 0xf59e0b,
    shadowColor: 0xb45309,
    glowColor: 0xfbbf24,
    icon: "⚡",
  },
  buff_shield: {
    type: "buff_shield",
    label: "KHIÊN VÔ ĐỊCH (8S)!",
    color: 0x0ea5e9,
    shadowColor: 0x0369a1,
    glowColor: 0x38bdf8,
    icon: "🛡️",
  },
  buff_heal: {
    type: "buff_heal",
    label: "HỒI PHỤC CHIẾN XA (+100 HP)!",
    color: 0x22c55e,
    shadowColor: 0x15803d,
    glowColor: 0x4ade80,
    icon: "💊",
  },
  buff_nuke: {
    type: "buff_nuke",
    label: "BOM TẬN DIỆT QUÁI VẬT!",
    color: 0xef4444,
    shadowColor: 0x991b1b,
    glowColor: 0xf87171,
    icon: "💣",
  },
  star_upgrade: {
    type: "star_upgrade",
    label: "LÊN SAO VŨ KHÍ TỰ ĐỘNG (+1★)!",
    color: 0xa855f7,
    shadowColor: 0x7e22ce,
    glowColor: 0xc084fc,
    icon: "⭐",
  },
};

export class Pickup extends Container {
  public active: boolean = false;
  public pickupType: PickupType = "buff_rapid";
  public radius: number = 22;

  // Velocity (magnet / road)
  private vx: number = 0;
  private vy: number = 0;

  // Visuals: 3D Glowing Candy Crate
  private crateGfx: Graphics;
  private iconText: Text;
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
        fontSize: 22,
        fill: 0xffffff,
        fontWeight: "900",
      },
    });
    this.iconText.anchor.set(0.5);
    this.iconText.y = -1;
    this.addChild(this.iconText);
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

    this.renderCrate(cfg);
  }

  private renderCrate(cfg: PickupConfig) {
    this.crateGfx.clear();

    const w = 44;
    const h = 44;
    const r = 14;

    // 1. Soft Ambient Shadow
    this.crateGfx
      .roundRect(-w / 2, -h / 2 + 5, w, h, r)
      .fill({ color: 0x000000, alpha: 0.4 });

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
      .fill({ color: 0xffffff, alpha: 0.38 });
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
    const magnetRadius = 120 + SaveManager.getStatBonus("magnet");
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
      .circle(0, 0, 30 * pulse)
      .fill({ color: cfg.glowColor, alpha: 0.28 });
    // Outer ripple ring
    this.auraGfx
      .circle(0, 0, 36 * ringPulse)
      .stroke({ color: 0xffffff, width: 2, alpha: 0.75 });

    // Floating bobbing
    this.crateGfx.y = Math.sin(this.animTime * 6) * 3;
    this.iconText.y = -1 + Math.sin(this.animTime * 6) * 3;

    // Out of screen bottom
    if (this.y > 1320) {
      this.deactivate();
      return false;
    }

    // 4. Pickup Trigger Hitbox check
    const collectRadius = 40;
    if (dist < collectRadius) {
      this.deactivate();
      return true; // Picked up!
    }

    return false;
  }
}
