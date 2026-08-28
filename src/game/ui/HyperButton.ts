import { Container, Graphics, Text } from "pixi.js";
import { AudioMixer } from "../utils/AudioMixer";
import { VectorIcons } from "./VectorIcons";

export type VectorIconType =
  | "play"
  | "gear"
  | "wrench"
  | "speaker"
  | "music"
  | "vibration"
  | "lightning"
  | "home"
  | "check"
  | "cross";

export interface HyperButtonOptions {
  label: string;
  width?: number;
  height?: number;
  fontSize?: number;
  color?: number;
  colorBottom?: number;
  shadowColor?: number;
  vectorIcon?: VectorIconType;
  icon?: string;
  pulse?: boolean;
  strokeWidth?: number;
  radius?: number;
  onClick: () => void;
}

/**
 * HyperButton: Standardized Hyper-Casual 3D Juicy Capsule Button with
 * crisp vector icons, squash-and-stretch jelly micro-interactions,
 * thick white border, glossy highlight sheen, and rich color depth.
 */
export class HyperButton extends Container {
  private content: Container;
  private bodyGfx: Graphics;
  private shadowGfx: Graphics;
  private labelText: Text;
  private iconGfx?: Container;
  private options: HyperButtonOptions;
  private isPressed: boolean = false;
  private animTimer: number = 0;

  constructor(options: HyperButtonOptions) {
    super();
    this.options = {
      width: 320,
      height: 72,
      fontSize: 24,
      color: 0xf97316, // Orange
      shadowColor: 0xc2410c,
      strokeWidth: 4.5,
      pulse: false,
      ...options,
    };

    const w = this.options.width!;
    const h = this.options.height!;
    const r = this.options.radius ?? h / 2;
    const shadowOffset = Math.max(5, Math.round(h * 0.11));

    // 1. Shadow Base (placed in main container, doesn't move with content)
    this.shadowGfx = new Graphics();
    this.shadowGfx.roundRect(-w / 2, -h / 2 + shadowOffset, w, h, r).fill(this.options.shadowColor!);
    this.addChild(this.shadowGfx);

    // 2. Animated Content Container (moves down when pressed)
    this.content = new Container();
    this.addChild(this.content);

    // 3. Main 3D Body
    this.bodyGfx = new Graphics();
    this.bodyGfx
      .roundRect(-w / 2, -h / 2, w, h, r)
      .fill(this.options.color!)
      .stroke({ color: 0xffffff, width: this.options.strokeWidth });

    // Glossy Highlight Sheen (translucent curved arc on top half)
    const sheenW = w - Math.max(16, r * 0.8);
    const sheenH = h * 0.38;
    this.bodyGfx
      .roundRect(-sheenW / 2, -h / 2 + 4, sheenW, sheenH, Math.min(12, r * 0.5))
      .fill({ color: 0xffffff, alpha: 0.35 });

    // Subtle bottom inner shade
    this.bodyGfx
      .roundRect(-w / 2 + 8, h / 2 - 8, w - 16, 4, 2)
      .fill({ color: 0x000000, alpha: 0.15 });

    this.content.addChild(this.bodyGfx);

    // 4. Label & Optional Crisp Vector Icon
    const labelRow = new Container();
    this.content.addChild(labelRow);

    const hasVectorIcon = !!this.options.vectorIcon;
    const iconSize = Math.round(this.options.fontSize! * 1.15);

    this.labelText = new Text({
      text: this.options.label,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: this.options.fontSize,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: this.options.shadowColor, width: Math.max(3, this.options.fontSize! * 0.16) },
        letterSpacing: 1.5,
      },
    });
    this.labelText.anchor.set(0, 0.5);

    if (hasVectorIcon) {
      this.iconGfx = VectorIcons.createIcon(this.options.vectorIcon!, iconSize, 0xffffff);
      labelRow.addChild(this.iconGfx);

      const gap = 12;
      const totalContentW = iconSize + gap + this.labelText.width;
      this.iconGfx.x = -totalContentW / 2 + iconSize / 2;
      this.iconGfx.y = -2;

      this.labelText.x = -totalContentW / 2 + iconSize + gap;
      this.labelText.y = -2;
      labelRow.addChild(this.labelText);
    } else {
      this.labelText.anchor.set(0.5);
      this.labelText.x = 0;
      this.labelText.y = -2;
      labelRow.addChild(this.labelText);
    }

    // 5. Interactive Micro-Interactions (Juicy Jelly Feel)
    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointerover", () => {
      if (!this.isPressed) {
        this.scale.set(1.05);
      }
    });

    this.on("pointerout", () => {
      this.isPressed = false;
      this.content.y = 0;
      this.scale.set(1.0);
    });

    this.on("pointerdown", (e) => {
      e.stopPropagation();
      this.isPressed = true;
      this.content.y = shadowOffset * 0.75;
      this.scale.set(0.94, 0.91);
      AudioMixer.playSFX("sfx_button");
    });

    this.on("pointerup", (e) => {
      e.stopPropagation();
      if (this.isPressed) {
        this.isPressed = false;
        this.content.y = 0;
        this.scale.set(1.08);
        setTimeout(() => {
          this.scale.set(1.0);
        }, 80);
        this.options.onClick();
      }
    });

    this.on("pointerupoutside", () => {
      this.isPressed = false;
      this.content.y = 0;
      this.scale.set(1.0);
    });
  }

  public setLabel(text: string) {
    this.labelText.text = text;
  }

  public updatePulse(dtSec: number) {
    if (this.options.pulse && !this.isPressed) {
      this.animTimer += dtSec;
      const s = 1.0 + Math.sin(this.animTimer * 4.5) * 0.03;
      this.scale.set(s);
    }
  }
}

export interface HyperCircleButtonOptions {
  vectorIcon?: VectorIconType;
  icon?: string;
  radius?: number;
  color?: number;
  shadowColor?: number;
  strokeWidth?: number;
  fontSize?: number;
  onClick: () => void;
}

/**
 * HyperCircleButton: 3D Juicy Circular Button with crisp Vector Icon.
 */
export class HyperCircleButton extends Container {
  private content: Container;
  private isPressed: boolean = false;

  constructor(options: HyperCircleButtonOptions) {
    super();
    const r = options.radius ?? 26;
    const shadowOffset = Math.max(3, Math.round(r * 0.16));
    const color = options.color ?? 0x0ea5e9;
    const shadowColor = options.shadowColor ?? 0x0369a1;
    const strokeWidth = options.strokeWidth ?? 3.5;
    const iconSize = Math.round(r * 1.05);

    // 1. Shadow Base
    const shadow = new Graphics();
    shadow.circle(0, shadowOffset, r).fill(shadowColor);
    this.addChild(shadow);

    // 2. Animated Content Container
    this.content = new Container();
    this.addChild(this.content);

    // 3. Body
    const body = new Graphics();
    body.circle(0, 0, r).fill(color).stroke({ color: 0xffffff, width: strokeWidth });
    // Glossy Sheen
    body.ellipse(0, -r * 0.35, r * 0.7, r * 0.3).fill({ color: 0xffffff, alpha: 0.38 });
    this.content.addChild(body);

    // 4. Crisp Vector Icon or Text Icon
    if (options.vectorIcon) {
      const icon = VectorIcons.createIcon(options.vectorIcon, iconSize, 0xffffff);
      icon.y = -1;
      this.content.addChild(icon);
    } else if (options.icon) {
      const iconText = new Text({
        text: options.icon,
        style: {
          fontSize: options.fontSize ?? Math.round(r * 0.85),
          align: "center",
        },
      });
      iconText.anchor.set(0.5);
      iconText.y = -1;
      this.content.addChild(iconText);
    }

    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointerover", () => {
      if (!this.isPressed) this.scale.set(1.08);
    });
    this.on("pointerout", () => {
      this.isPressed = false;
      this.content.y = 0;
      this.scale.set(1.0);
    });
    this.on("pointerdown", (e) => {
      e.stopPropagation();
      this.isPressed = true;
      this.content.y = shadowOffset * 0.75;
      this.scale.set(0.92);
      AudioMixer.playSFX("sfx_button");
    });
    this.on("pointerup", (e) => {
      e.stopPropagation();
      if (this.isPressed) {
        this.isPressed = false;
        this.content.y = 0;
        this.scale.set(1.1);
        setTimeout(() => this.scale.set(1.0), 80);
        options.onClick();
      }
    });
    this.on("pointerupoutside", () => {
      this.isPressed = false;
      this.content.y = 0;
      this.scale.set(1.0);
    });
  }
}
