import { Container, Graphics } from "pixi.js";

/**
 * VectorIcons: Procedurally renders crisp, scalable, high-resolution vector icons
 * for buttons, pills, and modals. Eliminates low-res/inconsistent OS emojis.
 */
export class VectorIcons {
  /**
   * Draw a crisp Play triangle (centered at 0, 0)
   */
  public static drawPlay(g: Graphics, size: number = 24, color: number = 0xffffff) {
    const half = size * 0.5;
    const left = -half * 0.7;
    const right = half * 0.9;
    const top = -half * 0.85;
    const bottom = half * 0.85;

    g.poly([
      left, top,
      right, 0,
      left, bottom,
    ]).fill(color);
  }

  /**
   * Draw a modern 6-tooth mechanical Gear / Settings icon (centered at 0, 0)
   */
  public static drawGear(g: Graphics, size: number = 24, color: number = 0xffffff) {
    const r = size * 0.5;
    const innerR = r * 0.65;
    const holeR = r * 0.32;
    const teeth = 6;

    // Outer gear shape with teeth
    const points: number[] = [];
    for (let i = 0; i < teeth; i++) {
      const a1 = (i / teeth) * Math.PI * 2;
      const a2 = ((i + 0.3) / teeth) * Math.PI * 2;
      const a3 = ((i + 0.5) / teeth) * Math.PI * 2;
      const a4 = ((i + 0.8) / teeth) * Math.PI * 2;

      points.push(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
      points.push(Math.cos(a2) * r, Math.sin(a2) * r);
      points.push(Math.cos(a3) * r, Math.sin(a3) * r);
      points.push(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
    }
    g.poly(points).fill(color);

    // Center hole cutout
    g.circle(0, 0, holeR).fill(0x0284c7); // or cut out
  }

  /**
   * Draw a crisp Wrench / Tool icon (centered at 0, 0)
   */
  public static drawWrench(g: Graphics, size: number = 24, color: number = 0xffffff) {
    const s = size * 0.5;
    // Angled wrench 45 deg
    g.save();
    g.rotateTransform(-Math.PI / 4);

    // Handle
    g.roundRect(-s * 0.22, -s * 0.9, s * 0.44, s * 1.5, s * 0.18).fill(color);
    // Head circle
    g.circle(0, -s * 0.6, s * 0.55).fill(color);
    // Head cutout slot
    g.rect(-s * 0.22, -s * 1.2, s * 0.44, s * 0.65).fill(0x047857);
    // Bottom knob
    g.circle(0, s * 0.6, s * 0.35).fill(color);
    g.circle(0, s * 0.6, s * 0.16).fill(0x047857);

    g.restore();
  }

  /**
   * Draw Sound / SFX Speaker icon (centered at 0, 0)
   */
  public static drawSpeaker(g: Graphics, size: number = 24, color: number = 0xffffff) {
    const s = size * 0.5;
    // Speaker box
    g.rect(-s * 0.85, -s * 0.35, s * 0.45, s * 0.7).fill(color);
    // Speaker cone
    g.poly([
      -s * 0.45, -s * 0.35,
      0, -s * 0.8,
      0, s * 0.8,
      -s * 0.45, s * 0.35,
    ]).fill(color);

    // Sound waves
    g.arc(s * 0.15, 0, s * 0.45, -Math.PI * 0.3, Math.PI * 0.3)
      .stroke({ color, width: Math.max(2, size * 0.09), cap: "round" });
    g.arc(s * 0.15, 0, s * 0.8, -Math.PI * 0.35, Math.PI * 0.35)
      .stroke({ color, width: Math.max(2, size * 0.09), cap: "round" });
  }

  /**
   * Draw Music / BGM Notes icon (centered at 0, 0)
   */
  public static drawMusic(g: Graphics, size: number = 24, color: number = 0xffffff) {
    const s = size * 0.5;
    // Left note head
    g.ellipse(-s * 0.45, s * 0.5, s * 0.32, s * 0.24).fill(color);
    // Right note head
    g.ellipse(s * 0.45, s * 0.25, s * 0.32, s * 0.24).fill(color);

    // Stems
    const stemW = Math.max(2, size * 0.1);
    g.rect(-s * 0.22, -s * 0.65, stemW, s * 1.15).fill(color);
    g.rect(s * 0.68, -s * 0.9, stemW, s * 1.15).fill(color);

    // Top beam
    g.poly([
      -s * 0.22, -s * 0.65,
      s * 0.68 + stemW, -s * 0.9,
      s * 0.68 + stemW, -s * 0.55,
      -s * 0.22, -s * 0.3,
    ]).fill(color);
  }

  /**
   * Draw Vibration / Screen Shake icon (centered at 0, 0)
   */
  public static drawVibration(g: Graphics, size: number = 24, color: number = 0xffffff) {
    const s = size * 0.5;
    // Phone body
    g.roundRect(-s * 0.45, -s * 0.85, s * 0.9, s * 1.7, s * 0.18)
      .stroke({ color, width: Math.max(2, size * 0.09) });
    // Screen top notch
    g.rect(-s * 0.15, -s * 0.7, s * 0.3, s * 0.08).fill(color);
    // Screen bottom home bar
    g.rect(-s * 0.2, s * 0.65, s * 0.4, s * 0.08).fill(color);

    // Left vibrating wave
    g.arc(-s * 0.45, 0, s * 0.4, Math.PI * 0.7, Math.PI * 1.3)
      .stroke({ color, width: Math.max(2, size * 0.08), cap: "round" });
    // Right vibrating wave
    g.arc(s * 0.45, 0, s * 0.4, -Math.PI * 0.3, Math.PI * 0.3)
      .stroke({ color, width: Math.max(2, size * 0.08), cap: "round" });
  }

  /**
   * Draw Lightning / FX icon (centered at 0, 0)
   */
  public static drawLightning(g: Graphics, size: number = 24, color: number = 0xffffff) {
    const s = size * 0.5;
    g.poly([
      -s * 0.1, -s * 0.95,
      s * 0.6, -s * 0.95,
      -s * 0.05, -s * 0.05,
      s * 0.5, -s * 0.05,
      -s * 0.5, s * 0.95,
      -s * 0.15, s * 0.15,
      -s * 0.6, s * 0.15,
    ]).fill(color);
  }

  /**
   * Draw Home icon (centered at 0, 0)
   */
  public static drawHome(g: Graphics, size: number = 24, color: number = 0xffffff) {
    const s = size * 0.5;
    // Roof triangle
    g.poly([
      0, -s * 0.9,
      -s * 0.9, -s * 0.1,
      s * 0.9, -s * 0.1,
    ]).fill(color);
    // House base
    g.rect(-s * 0.65, -s * 0.1, s * 1.3, s * 0.95).fill(color);
    // Door cutout
    g.roundRect(-s * 0.22, s * 0.25, s * 0.44, s * 0.6, 2).fill(0x0284c7);
  }

  /**
   * Draw Checkmark icon (centered at 0, 0)
   */
  public static drawCheckmark(g: Graphics, size: number = 24, color: number = 0xffffff) {
    const s = size * 0.5;
    g.poly([
      -s * 0.8, -s * 0.05,
      -s * 0.25, s * 0.65,
      s * 0.85, -s * 0.7,
      s * 0.65, -s * 0.88,
      -s * 0.25, s * 0.28,
      -s * 0.6, -s * 0.25,
    ]).fill(color);
  }

  /**
   * Draw Cross / Close icon (centered at 0, 0)
   */
  public static drawCross(g: Graphics, size: number = 24, color: number = 0xffffff) {
    const s = size * 0.5;
    const w = Math.max(3, size * 0.18);
    g.save();
    g.rotateTransform(Math.PI / 4);
    g.roundRect(-w / 2, -s * 0.85, w, s * 1.7, w / 2).fill(color);
    g.roundRect(-s * 0.85, -w / 2, s * 1.7, w, w / 2).fill(color);
    g.restore();
  }

  /**
   * Create a standalone Container containing any vector icon
   */
  public static createIcon(
    type: "play" | "gear" | "wrench" | "speaker" | "music" | "vibration" | "lightning" | "home" | "check" | "cross",
    size: number = 24,
    color: number = 0xffffff,
  ): Container {
    const cont = new Container();
    const g = new Graphics();
    switch (type) {
      case "play":
        this.drawPlay(g, size, color);
        break;
      case "gear":
        this.drawGear(g, size, color);
        break;
      case "wrench":
        this.drawWrench(g, size, color);
        break;
      case "speaker":
        this.drawSpeaker(g, size, color);
        break;
      case "music":
        this.drawMusic(g, size, color);
        break;
      case "vibration":
        this.drawVibration(g, size, color);
        break;
      case "lightning":
        this.drawLightning(g, size, color);
        break;
      case "home":
        this.drawHome(g, size, color);
        break;
      case "check":
        this.drawCheckmark(g, size, color);
        break;
      case "cross":
        this.drawCross(g, size, color);
        break;
    }
    cont.addChild(g);
    return cont;
  }
}
