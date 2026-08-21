import { Container, Graphics, Text } from "pixi.js";
import { ROAD_SPEED } from "../constants";

export type PickupType =
  "buff_rapid" | "buff_shield" | "buff_heal" | "buff_nuke" | "star_upgrade";

export interface PickupConfig {
  type: PickupType;
  label: string;
  icon: string;
  color: number;
  shadowColor: number;
  duration?: number;
}

export const PICKUP_CONFIGS: Record<PickupType, PickupConfig> = {
  buff_rapid: {
    type: "buff_rapid",
    label: "⚡ HỎA LỰC CUỒNG NỘ (10s)!",
    icon: "⚡",
    color: 0xf59e0b,
    shadowColor: 0x78350f,
    duration: 10,
  },
  buff_shield: {
    type: "buff_shield",
    label: "🛡️ BẤT TỬ (8s)!",
    icon: "🛡️",
    color: 0x0284c7,
    shadowColor: 0x075985,
    duration: 8,
  },
  buff_heal: {
    type: "buff_heal",
    label: "💚 HỒI 100 HP!",
    icon: "💊",
    color: 0x16a34a,
    shadowColor: 0x14532d,
  },
  buff_nuke: {
    type: "buff_nuke",
    label: "💣 QUÉT SẠCH QUÁI VẬT!",
    icon: "💣",
    color: 0xdc2626,
    shadowColor: 0x7f1d1d,
  },
  star_upgrade: {
    type: "star_upgrade",
    label: "⭐ LÊN SAO VŨ KHÍ!",
    icon: "⭐",
    color: 0xfacc15,
    shadowColor: 0x854d0e,
  },
};

export class Pickup extends Container {
  public active: boolean = false;
  public pickupType: PickupType = "buff_rapid";
  public radius: number = 24;

  private crateGfx: Graphics;
  private iconText: Text;
  private auraGfx: Graphics;
  private animTime: number = 0;

  constructor() {
    super();
    this.auraGfx = new Graphics();
    this.addChild(this.auraGfx);

    this.crateGfx = new Graphics();
    this.addChild(this.crateGfx);

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
    this.addChild(this.iconText);
  }

  spawn(x: number, y: number, type: PickupType = "buff_rapid") {
    this.x = x;
    this.y = y;
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

    // 1. Soft Shadow
    this.crateGfx
      .roundRect(-22, -18, 44, 44, 12)
      .fill({ color: 0x000000, alpha: 0.35 });

    // 2. 3D Crate Body
    this.crateGfx.roundRect(-20, -20 + 4, 40, 40, 10).fill(cfg.shadowColor);
    this.crateGfx
      .roundRect(-20, -20, 40, 40, 10)
      .fill(cfg.color)
      .stroke({ color: 0xffffff, width: 2.5 });

    // 3. Top Gloss Sheen
    this.crateGfx
      .roundRect(-16, -18, 32, 16, 6)
      .fill({ color: 0xffffff, alpha: 0.3 });
  }

  deactivate() {
    this.active = false;
    this.visible = false;
  }

  /** Move with the road, pulse aura, and test collision with the convoy */
  updatePickup(
    dt: number,
    convoyX: number,
    convoyY: number,
    roadSpeed: number,
  ): boolean {
    if (!this.active) return false;

    const dtSec = dt * (1 / 60);
    this.animTime += dtSec;

    // Move down with the road
    this.y += roadSpeed * dtSec;

    // Pulsing glow aura
    this.auraGfx.clear();
    const cfg = PICKUP_CONFIGS[this.pickupType] || PICKUP_CONFIGS.buff_rapid;
    const pulse = 1 + Math.sin(this.animTime * 6) * 0.15;
    this.auraGfx
      .circle(0, 0, 26 * pulse)
      .fill({ color: cfg.color, alpha: 0.25 })
      .stroke({ color: 0xffffff, width: 1.5, alpha: 0.6 });

    // Slight float bobbing
    this.crateGfx.y = Math.sin(this.animTime * 4) * 4;
    this.iconText.y = this.crateGfx.y;

    // Collision check with convoy
    const dx = convoyX - this.x;
    const dy = convoyY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Collected when convoy touches it
    if (dist < 65) {
      return true;
    }

    // Off bottom of screen
    if (this.y > 1350) {
      this.deactivate();
    }

    return false;
  }
}
