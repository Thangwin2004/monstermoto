import { Container, Graphics } from "pixi.js";
 
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
  | "cross"
  | "globe"
  | "flag"
  | "arrowLeft"
  | "trash"
  | "star"
  | "crosshair"
  | "road"
  | "bolt"
  | "coin"
  | "clock"
  | "trophy";

/**
 * VectorIcons: Procedurally renders crisp, scalable, high-resolution vector icons
 * for buttons, pills, and modals. Eliminates low-res/inconsistent OS emojis.
 */
export class VectorIcons {
  /**
   * Draw a crisp Play triangle (centered at 0, 0)
   */
  public static drawPlay(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const half = size * 0.5;
    const left = -half * 0.7;
    const right = half * 0.9;
    const top = -half * 0.85;
    const bottom = half * 0.85;

    g.poly([left, top, right, 0, left, bottom]).fill(color);
  }

  /**
   * Draw a modern 6-tooth mechanical Gear / Settings icon (centered at 0, 0)
   */
  public static drawGear(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
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
    g.circle(0, 0, holeR).cut();
  }

  /**
   * Draw a crisp Wrench / Tool icon (centered at 0, 0)
   */
  public static drawWrench(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const s = size * 0.5;
    // Angled wrench 45 deg
    g.save();
    g.rotateTransform(-Math.PI / 4);

    // Handle
    g.roundRect(-s * 0.22, -s * 0.9, s * 0.44, s * 1.5, s * 0.18).fill(color);
    // Head circle
    g.circle(0, -s * 0.6, s * 0.55).fill(color);
    // Head cutout slot (true transparent cutout)
    g.rect(-s * 0.22, -s * 1.2, s * 0.44, s * 0.65).cut();
    // Bottom knob
    g.circle(0, s * 0.6, s * 0.35).fill(color);
    g.circle(0, s * 0.6, s * 0.16).cut();

    g.restore();
  }

  /**
   * Draw Sound / SFX Speaker icon (centered at 0, 0)
   */
  public static drawSpeaker(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const s = size * 0.5;
    // Speaker box
    g.rect(-s * 0.85, -s * 0.35, s * 0.45, s * 0.7).fill(color);
    // Speaker cone
    g.poly([
      -s * 0.45,
      -s * 0.35,
      0,
      -s * 0.8,
      0,
      s * 0.8,
      -s * 0.45,
      s * 0.35,
    ]).fill(color);

    // Sound waves
    g.arc(s * 0.15, 0, s * 0.45, -Math.PI * 0.3, Math.PI * 0.3).stroke({
      color,
      width: Math.max(2, size * 0.09),
      cap: "round",
    });
    g.arc(s * 0.15, 0, s * 0.8, -Math.PI * 0.35, Math.PI * 0.35).stroke({
      color,
      width: Math.max(2, size * 0.09),
      cap: "round",
    });
  }

  /**
   * Draw Music / BGM Notes icon (centered at 0, 0)
   */
  public static drawMusic(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
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
      -s * 0.22,
      -s * 0.65,
      s * 0.68 + stemW,
      -s * 0.9,
      s * 0.68 + stemW,
      -s * 0.55,
      -s * 0.22,
      -s * 0.3,
    ]).fill(color);
  }

  /**
   * Draw Vibration / Screen Shake icon (centered at 0, 0)
   */
  public static drawVibration(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const s = size * 0.5;
    // Phone body
    g.roundRect(-s * 0.45, -s * 0.85, s * 0.9, s * 1.7, s * 0.18).stroke({
      color,
      width: Math.max(2, size * 0.09),
    });
    // Screen top notch
    g.rect(-s * 0.15, -s * 0.7, s * 0.3, s * 0.08).fill(color);
    // Screen bottom home bar
    g.rect(-s * 0.2, s * 0.65, s * 0.4, s * 0.08).fill(color);

    // Left vibrating wave
    g.arc(-s * 0.45, 0, s * 0.4, Math.PI * 0.7, Math.PI * 1.3).stroke({
      color,
      width: Math.max(2, size * 0.08),
      cap: "round",
    });
    // Right vibrating wave
    g.arc(s * 0.45, 0, s * 0.4, -Math.PI * 0.3, Math.PI * 0.3).stroke({
      color,
      width: Math.max(2, size * 0.08),
      cap: "round",
    });
  }

  /**
   * Draw Lightning / FX icon (centered at 0, 0)
   */
  public static drawLightning(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const s = size * 0.5;
    g.poly([
      -s * 0.1,
      -s * 0.95,
      s * 0.6,
      -s * 0.95,
      -s * 0.05,
      -s * 0.05,
      s * 0.5,
      -s * 0.05,
      -s * 0.5,
      s * 0.95,
      -s * 0.15,
      s * 0.15,
      -s * 0.6,
      s * 0.15,
    ]).fill(color);
  }

  /**
   * Draw Home icon (centered at 0, 0)
   */
  public static drawHome(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const s = size * 0.5;
    // Roof triangle
    g.poly([0, -s * 0.9, -s * 0.9, -s * 0.1, s * 0.9, -s * 0.1]).fill(color);
    // House base
    g.rect(-s * 0.65, -s * 0.1, s * 1.3, s * 0.95).fill(color);
    // Door cutout
    g.roundRect(-s * 0.22, s * 0.25, s * 0.44, s * 0.6, 2).cut();
  }

  /**
   * Draw Checkmark icon (centered at 0, 0)
   */
  public static drawCheckmark(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const s = size * 0.5;
    g.poly([
      -s * 0.8,
      -s * 0.05,
      -s * 0.25,
      s * 0.65,
      s * 0.85,
      -s * 0.7,
      s * 0.65,
      -s * 0.88,
      -s * 0.25,
      s * 0.28,
      -s * 0.6,
      -s * 0.25,
    ]).fill(color);
  }

  /**
   * Draw Cross / Close icon (centered at 0, 0)
   */
  public static drawCross(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const s = size * 0.5;
    const w = Math.max(3, size * 0.18);
    g.save();
    g.rotateTransform(Math.PI / 4);
    g.roundRect(-w / 2, -s * 0.85, w, s * 1.7, w / 2).fill(color);
    g.roundRect(-s * 0.85, -w / 2, s * 1.7, w, w / 2).fill(color);
    g.restore();
  }

  /**
   * Draw Globe / Language icon (centered at 0, 0)
   */
  public static drawGlobe(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const r = size * 0.44;
    const lineW = Math.max(1.8, size * 0.08);
    // Outer circle
    g.circle(0, 0, r).stroke({ color, width: lineW });
    // Equator line
    g.moveTo(-r, 0).lineTo(r, 0).stroke({ color, width: lineW });
    // Prime meridian ellipse
    g.ellipse(0, 0, r * 0.52, r).stroke({ color, width: lineW });
    // Vertical axis line
    g.moveTo(0, -r).lineTo(0, r).stroke({ color, width: lineW });
  }

  /**
   * Draw Flag / Give Up icon (centered at 0, 0)
   */
  public static drawFlag(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const s = size * 0.5;
    const poleW = Math.max(2.2, size * 0.1);
    const poleX = -s * 0.55;
    // Pole
    g.roundRect(poleX - poleW / 2, -s * 0.9, poleW, s * 1.8, poleW / 2).fill(
      color,
    );
    // Flag pennant
    g.poly([
      poleX + poleW / 2,
      -s * 0.85,
      s * 0.75,
      -s * 0.45,
      poleX + poleW / 2,
      -s * 0.05,
    ]).fill(color);
  }

  /**
   * Draw Left Arrow / Back / Return icon (centered at 0, 0)
   */
  public static drawArrowLeft(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const s = size * 0.5;
    const stemH = Math.max(2.6, size * 0.16);
    // Arrow head pointing left + stem to the right
    g.poly([
      -s * 0.8,
      0,
      -s * 0.15,
      -s * 0.65,
      -s * 0.15,
      -stemH / 2,
      s * 0.75,
      -stemH / 2,
      s * 0.75,
      stemH / 2,
      -s * 0.15,
      stemH / 2,
      -s * 0.15,
      s * 0.65,
    ]).fill(color);
  }

  /**
   * Draw Trash / Delete icon (centered at 0, 0)
   */
  public static drawTrash(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const s = size * 0.5;
    const binW = s * 1.0;
    const binH = s * 1.05;
    // Bin container
    g.roundRect(-binW / 2, -s * 0.2, binW, binH, 2.5).fill(color);
    // Lid rim
    g.roundRect(-s * 0.7, -s * 0.48, s * 1.4, s * 0.22, 2).fill(color);
    // Lid handle
    g.roundRect(-s * 0.28, -s * 0.78, s * 0.56, s * 0.25, 2).fill(color);
  }

  /**
   * Draw 5-pointed Star icon (centered at 0, 0)
   */
  public static drawStar(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const r = size * 0.5;
    const innerR = r * 0.42;
    const points: number[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const rad = i % 2 === 0 ? r : innerR;
      points.push(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    g.poly(points).fill(color);
  }

  /**
   * Draw Crosshair / Combat Target icon (centered at 0, 0)
   */
  public static drawCrosshair(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const r = size * 0.44;
    const lineW = Math.max(2, size * 0.1);
    g.circle(0, 0, r).stroke({ color, width: lineW });
    g.circle(0, 0, r * 0.22).fill(color);
    g.moveTo(-size * 0.5, 0)
      .lineTo(-r * 0.45, 0)
      .stroke({ color, width: lineW });
    g.moveTo(r * 0.45, 0)
      .lineTo(size * 0.5, 0)
      .stroke({ color, width: lineW });
    g.moveTo(0, -size * 0.5)
      .lineTo(0, -r * 0.45)
      .stroke({ color, width: lineW });
    g.moveTo(0, r * 0.45)
      .lineTo(0, size * 0.5)
      .stroke({ color, width: lineW });
  }

  /**
   * Draw Road / Distance Highway icon (centered at 0, 0)
   */
  public static drawRoad(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const s = size * 0.5;
    const lineW = Math.max(2, size * 0.12);
    // Left border
    g.poly([-s * 0.25, -s * 0.85, -s * 0.8, s * 0.85]).stroke({
      color,
      width: lineW,
      cap: "round",
    });
    // Right border
    g.poly([s * 0.25, -s * 0.85, s * 0.8, s * 0.85]).stroke({
      color,
      width: lineW,
      cap: "round",
    });
    // Center dashes
    g.poly([0, -s * 0.65, 0, -s * 0.22]).stroke({
      color,
      width: lineW,
      cap: "round",
    });
    g.poly([0, 0.12 * s, 0, s * 0.65]).stroke({
      color,
      width: lineW,
      cap: "round",
    });
  }

  /**
   * Draw Hexagonal Scrap Bolt icon (centered at 0, 0)
   */
  public static drawBolt(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const r = size * 0.5;
    const points: number[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      points.push(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.poly(points).fill(color);
    g.circle(0, 0, r * 0.45).cut();
  }

  /**
   * Draw Coin / Scrap Currency icon (centered at 0, 0)
   */
  public static drawCoin(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
    innerColor: number = 0xb45309,
  ) {
    const r = size * 0.48;
    g.circle(0, 0, r).fill(color);
    g.circle(0, 0, r * 0.72).stroke({
      color: innerColor,
      width: Math.max(1.8, size * 0.09),
    });
    g.circle(0, 0, r * 0.25).fill(innerColor);
  }

  /**
   * Draw Analog Clock / Timer icon (centered at 0, 0)
   */
  public static drawClock(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const r = size * 0.46;
    const lineW = Math.max(2, size * 0.1);
    g.circle(0, 0, r).stroke({ color, width: lineW });
    g.circle(0, 0, r * 0.2).fill(color);
    // Hour hand
    g.poly([0, 0, 0, -r * 0.55]).stroke({
      color,
      width: lineW,
      cap: "round",
    });
    // Minute hand
    g.poly([0, 0, r * 0.48, -r * 0.1]).stroke({
      color,
      width: lineW,
      cap: "round",
    });
  }

  /**
   * Draw Trophy / Championship Cup icon (centered at 0, 0)
   */
  public static drawTrophy(
    g: Graphics,
    size: number = 24,
    color: number = 0xffffff,
  ) {
    const s = size * 0.5;
    // Cup bowl
    g.poly([
      -s * 0.65,
      -s * 0.75,
      s * 0.65,
      -s * 0.75,
      s * 0.5,
      s * 0.05,
      0,
      s * 0.35,
      -s * 0.5,
      s * 0.05,
    ]).fill(color);
    // Stem
    g.rect(-s * 0.16, s * 0.3, s * 0.32, s * 0.3).fill(color);
    // Base
    g.roundRect(-s * 0.55, s * 0.6, s * 1.1, s * 0.25, 2).fill(color);
    // Left handle
    g.arc(-s * 0.5, -s * 0.35, s * 0.26, Math.PI * 0.6, Math.PI * 1.5).stroke({
      color,
      width: Math.max(2, size * 0.09),
      cap: "round",
    });
    // Right handle
    g.arc(s * 0.5, -s * 0.35, s * 0.26, -Math.PI * 0.5, Math.PI * 0.4).stroke({
      color,
      width: Math.max(2, size * 0.09),
      cap: "round",
    });
  }

  /**
   * Create a standalone Container containing any vector icon
   */
  public static createIcon(
    type:
      | "play"
      | "gear"
      | "wrench"
      | "speaker"
      | "music"
      | "vibration"
      | "lightning"
      | "home"
      | "check"
      | "cross"
      | "globe"
      | "flag"
      | "arrowLeft"
      | "trash"
      | "star"
      | "crosshair"
      | "road"
      | "bolt"
      | "coin"
      | "clock"
      | "trophy",
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
      case "globe":
        this.drawGlobe(g, size, color);
        break;
      case "flag":
        this.drawFlag(g, size, color);
        break;
      case "arrowLeft":
        this.drawArrowLeft(g, size, color);
        break;
      case "trash":
        this.drawTrash(g, size, color);
        break;
      case "star":
        this.drawStar(g, size, color);
        break;
      case "crosshair":
        this.drawCrosshair(g, size, color);
        break;
      case "road":
        this.drawRoad(g, size, color);
        break;
      case "bolt":
        this.drawBolt(g, size, color);
        break;
      case "coin":
        this.drawCoin(g, size, color);
        break;
      case "clock":
        this.drawClock(g, size, color);
        break;
      case "trophy":
        this.drawTrophy(g, size, color);
        break;
    }
    cont.addChild(g);
    return cont;
  }
}
