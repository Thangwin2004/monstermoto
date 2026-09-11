import { Container, Graphics } from "pixi.js";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  ROAD_SPEED,
  ROAD_WIDTH,
  ROAD_LEFT,
  ROAD_RIGHT,
} from "../constants";

/**
 * Vibrant scrolling highway cutting through wilderness with lush grass terrain, guardrails, and road markings.
 */
export class RoadSystem {
  public container: Container;
  public speed: number = ROAD_SPEED;
  private roadHeight: number;
  private staticRoadBg: Graphics;
  private scrollElements: { gfx: Graphics; y: number; speed: number }[] = [];

  constructor(height: number = GAME_HEIGHT) {
    this.container = new Container();
    this.roadHeight = Math.max(GAME_HEIGHT, height);

    // ── 1. Static Highway & Canyon Terrain (Consolidated Graphics) ──
    this.staticRoadBg = new Graphics();
    this.container.addChild(this.staticRoadBg);
    this.redrawRoadBackground(this.roadHeight);

    // ── 2. Scrolling Props (Cacti & Boulders) ──
    const propSpacing = 140;
    const numProps = Math.ceil(this.roadHeight / propSpacing) + 3;
    for (let i = 0; i < numProps; i++) {
      // Left Cactus or Rock
      const isCactusLeft = i % 2 === 0;
      const leftProp = isCactusLeft
        ? this.createCactus()
        : this.createDesertBoulder();
      leftProp.x = 10 + (ROAD_LEFT - 40) * Math.random();
      this.container.addChild(leftProp);
      this.scrollElements.push({
        gfx: leftProp,
        y: i * propSpacing - propSpacing,
        speed: 0.9,
      });

      // Right Cactus or Rock
      const isCactusRight = (i + 1) % 2 === 0;
      const rightProp = isCactusRight
        ? this.createCactus()
        : this.createDesertBoulder();
      rightProp.x =
        ROAD_RIGHT + 24 + (GAME_WIDTH - ROAD_RIGHT - 50) * Math.random();
      this.container.addChild(rightProp);
      this.scrollElements.push({
        gfx: rightProp,
        y: i * propSpacing - propSpacing + 70,
        speed: 0.9,
      });
    }

    // ── 3. Center Dashed Line (White, Scrolling) ──
    const dashSpacing = 130;
    const dashH = 50;
    const numDashes = Math.ceil(this.roadHeight / dashSpacing) + 3;
    for (let i = 0; i < numDashes; i++) {
      const dash = new Graphics();
      dash.roundRect(-3, 0, 6, dashH, 3);
      dash.fill({ color: 0xffffff, alpha: 0.85 });
      dash.x = GAME_WIDTH / 2;
      const startY = i * dashSpacing - dashSpacing;

      this.container.addChild(dash);
      this.scrollElements.push({ gfx: dash, y: startY, speed: 1 });
    }

    // ── 4. Metal Crash Guardrails (Scrolling on edges) ──
    const railSpacing = 90;
    const numRails = Math.ceil(this.roadHeight / railSpacing) + 3;
    for (let i = 0; i < numRails; i++) {
      const leftRail = this.createGuardrail();
      leftRail.x = ROAD_LEFT - 8;
      this.container.addChild(leftRail);
      this.scrollElements.push({
        gfx: leftRail,
        y: i * railSpacing - railSpacing,
        speed: 1,
      });

      const rightRail = this.createGuardrail();
      rightRail.x = ROAD_RIGHT + 2;
      this.container.addChild(rightRail);
      this.scrollElements.push({
        gfx: rightRail,
        y: i * railSpacing - railSpacing,
        speed: 1,
      });
    }
  }

  private redrawRoadBackground(h: number) {
    this.staticRoadBg.clear();

    // Outer Desert Canyon Cliff Terrain (Bright Sunny Golden Sandstone)
    this.staticRoadBg.rect(0, 0, ROAD_LEFT - 14, h).fill(0xb45309);
    this.staticRoadBg
      .rect(ROAD_RIGHT + 14, 0, GAME_WIDTH - ROAD_RIGHT - 14, h)
      .fill(0xb45309);

    // Desert Dirt & Sand Shoulders (Vibrant Golden Sand)
    this.staticRoadBg.rect(ROAD_LEFT - 14, 0, 14, h).fill(0xd97706);
    this.staticRoadBg.rect(ROAD_RIGHT, 0, 14, h).fill(0xd97706);

    // Clean Highway Asphalt (Bright Slate)
    this.staticRoadBg.rect(ROAD_LEFT, 0, ROAD_WIDTH, h).fill(0x334155);

    // Solid Sunshine Yellow Edge Lines
    this.staticRoadBg.rect(ROAD_LEFT, 0, 4, h).fill(0xfbbf24);
    this.staticRoadBg.rect(ROAD_RIGHT - 4, 0, 4, h).fill(0xfbbf24);
  }

  private createCactus(): Graphics {
    const gfx = new Graphics();
    // Saguaro Cactus Body with comic outline
    gfx
      .roundRect(-4, -18, 8, 36, 4)
      .fill(0x15803d)
      .stroke({ color: 0x000000, width: 2 });
    // Left Arm
    gfx
      .poly([-4, -2, -12, -2, -12, -12, -8, -12, -8, 2, -4, 2])
      .fill(0x16a34a)
      .stroke({ color: 0x000000, width: 1.5 });
    // Right Arm
    gfx
      .poly([4, 4, 12, 4, 12, -6, 8, -6, 8, 8, 4, 8])
      .fill(0x16a34a)
      .stroke({ color: 0x000000, width: 1.5 });
    // Cactus Spines / Highlight
    gfx.rect(-1, -14, 2, 28).fill(0x86efac);
    return gfx;
  }

  private createDesertBoulder(): Graphics {
    const gfx = new Graphics();
    // Chunky Canyon Rock with sharp facets
    gfx
      .poly([-12, 6, -8, -10, 6, -12, 14, -2, 10, 8, -6, 10])
      .fill(0x9a3412)
      .stroke({ color: 0x000000, width: 2 });
    // Top highlight
    gfx.poly([-6, -8, 4, -10, 8, -3, 0, -2]).fill(0xf97316);
    return gfx;
  }

  private createGuardrail(): Graphics {
    const gfx = new Graphics();
    // Galvanized Steel Highway Guardrail Post + Beam
    gfx
      .roundRect(0, 0, 6, 45, 2)
      .fill(0x94a3b8)
      .stroke({ color: 0x000000, width: 1.5 });
    gfx.circle(3, 10, 2).fill(0xfacc15); // Reflector
    gfx.circle(3, 35, 2).fill(0xef4444);
    return gfx;
  }

  resize(_width: number, height: number) {
    this.roadHeight = Math.max(GAME_HEIGHT, height);
    this.redrawRoadBackground(this.roadHeight);
  }

  update(dt: number) {
    const dtSec = dt * (1 / 60);
    const scrollDist = this.speed * dtSec;

    for (const el of this.scrollElements) {
      el.y += scrollDist * el.speed;
      el.gfx.y = el.y;

      // Loop back to top
      if (el.y > this.roadHeight + 100) {
        el.y -= this.roadHeight + 240;
        el.gfx.y = el.y;
      }
    }
  }
}
