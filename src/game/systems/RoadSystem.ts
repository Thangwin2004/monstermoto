import { Container, Graphics } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, ROAD_SPEED, ROAD_WIDTH, ROAD_LEFT, ROAD_RIGHT } from '../constants';

/**
 * Vibrant scrolling highway cutting through wilderness with lush grass terrain, guardrails, and road markings.
 */
export class RoadSystem {
    public container: Container;
    public speed: number = ROAD_SPEED;

    private scrollElements: { gfx: Graphics; y: number; speed: number }[] = [];

    constructor() {
        this.container = new Container();

        // ── 1. Outer Desert Canyon Cliff Terrain (Red & Ochre Clay) ──
        const leftOuter = new Graphics();
        leftOuter.rect(0, 0, ROAD_LEFT - 14, GAME_HEIGHT);
        leftOuter.fill(0x7c2d12); // Red desert canyon rock
        this.container.addChild(leftOuter);

        const rightOuter = new Graphics();
        rightOuter.rect(ROAD_RIGHT + 14, 0, GAME_WIDTH - ROAD_RIGHT - 14, GAME_HEIGHT);
        rightOuter.fill(0x7c2d12);
        this.container.addChild(rightOuter);

        // Scrolling Desert Cacti & Canyon Boulders
        const propSpacing = 140;
        const numProps = Math.ceil(GAME_HEIGHT / propSpacing) + 2;
        for (let i = 0; i < numProps; i++) {
            // Left Cactus or Rock
            const isCactusLeft = i % 2 === 0;
            const leftProp = isCactusLeft ? this.createCactus() : this.createDesertBoulder();
            leftProp.x = 10 + (ROAD_LEFT - 40) * Math.random();
            this.container.addChild(leftProp);
            this.scrollElements.push({ gfx: leftProp, y: i * propSpacing - propSpacing, speed: 0.9 });

            // Right Cactus or Rock
            const isCactusRight = (i + 1) % 2 === 0;
            const rightProp = isCactusRight ? this.createCactus() : this.createDesertBoulder();
            rightProp.x = ROAD_RIGHT + 24 + (GAME_WIDTH - ROAD_RIGHT - 50) * Math.random();
            this.container.addChild(rightProp);
            this.scrollElements.push({ gfx: rightProp, y: i * propSpacing - propSpacing + 70, speed: 0.9 });
        }

        // ── 2. Desert Dirt & Sand Shoulders (Warm Orange Sand) ──
        const leftShoulder = new Graphics();
        leftShoulder.rect(ROAD_LEFT - 14, 0, 14, GAME_HEIGHT);
        leftShoulder.fill(0xc2410c);
        this.container.addChild(leftShoulder);

        const rightShoulder = new Graphics();
        rightShoulder.rect(ROAD_RIGHT, 0, 14, GAME_HEIGHT);
        rightShoulder.fill(0xc2410c);
        this.container.addChild(rightShoulder);

        // ── 3. Dark Asphalt Canyon Highway ──
        const roadBg = new Graphics();
        roadBg.rect(ROAD_LEFT, 0, ROAD_WIDTH, GAME_HEIGHT);
        roadBg.fill(0x18181b);
        this.container.addChild(roadBg);

        // ── 4. Solid Yellow Edge Lines ──
        const leftEdge = new Graphics();
        leftEdge.rect(ROAD_LEFT, 0, 4, GAME_HEIGHT);
        leftEdge.fill(0xf59e0b);
        this.container.addChild(leftEdge);

        const rightEdge = new Graphics();
        rightEdge.rect(ROAD_RIGHT - 4, 0, 4, GAME_HEIGHT);
        rightEdge.fill(0xf59e0b);
        this.container.addChild(rightEdge);

        // ── 5. Center Dashed Line (White, Scrolling) ──
        const dashSpacing = 130;
        const dashH = 50;
        const numDashes = Math.ceil(GAME_HEIGHT / dashSpacing) + 2;
        for (let i = 0; i < numDashes; i++) {
            const dash = new Graphics();
            dash.roundRect(-3, 0, 6, dashH, 3);
            dash.fill({ color: 0xffffff, alpha: 0.65 });
            dash.x = GAME_WIDTH / 2;
            const startY = i * dashSpacing - dashSpacing;

            this.container.addChild(dash);
            this.scrollElements.push({ gfx: dash, y: startY, speed: 1 });
        }

        // ── 6. Metal Crash Guardrails (Scrolling on edges) ──
        const railSpacing = 90;
        const numRails = Math.ceil(GAME_HEIGHT / railSpacing) + 2;
        for (let i = 0; i < numRails; i++) {
            const leftRail = this.createGuardrail();
            leftRail.x = ROAD_LEFT - 8;
            this.container.addChild(leftRail);
            this.scrollElements.push({ gfx: leftRail, y: i * railSpacing - railSpacing, speed: 1 });

            const rightRail = this.createGuardrail();
            rightRail.x = ROAD_RIGHT + 2;
            this.container.addChild(rightRail);
            this.scrollElements.push({ gfx: rightRail, y: i * railSpacing - railSpacing, speed: 1 });
        }
    }

    private createCactus(): Graphics {
        const gfx = new Graphics();
        // Saguaro Cactus Body with comic outline
        gfx.roundRect(-4, -18, 8, 36, 4).fill(0x15803d).stroke({ color: 0x000000, width: 2 });
        // Left Arm
        gfx.poly([-4, -2, -12, -2, -12, -12, -8, -12, -8, 2, -4, 2]).fill(0x16a34a).stroke({ color: 0x000000, width: 1.5 });
        // Right Arm
        gfx.poly([4, 4, 12, 4, 12, -6, 8, -6, 8, 8, 4, 8]).fill(0x16a34a).stroke({ color: 0x000000, width: 1.5 });
        // Cactus Spines / Highlight
        gfx.rect(-1, -14, 2, 28).fill(0x86efac);
        return gfx;
    }

    private createDesertBoulder(): Graphics {
        const gfx = new Graphics();
        // Chunky Canyon Rock with sharp facets
        gfx.poly([-12, 6, -8, -10, 6, -12, 14, -2, 10, 8, -6, 10])
            .fill(0x9a3412)
            .stroke({ color: 0x000000, width: 2 });
        // Top highlight
        gfx.poly([-6, -8, 4, -10, 8, -3, 0, -2]).fill(0xf97316);
        return gfx;
    }

    private createGuardrail(): Graphics {
        const gfx = new Graphics();
        // Galvanized Steel Highway Guardrail Post + Beam
        gfx.roundRect(0, 0, 6, 45, 2).fill(0x94a3b8).stroke({ color: 0x000000, width: 1.5 });
        gfx.circle(3, 10, 2).fill(0xfacc15); // Reflector
        gfx.circle(3, 35, 2).fill(0xef4444);
        return gfx;
    }

    update(dt: number) {
        const dtSec = dt * (1 / 60);
        const scrollDist = this.speed * dtSec;

        for (const el of this.scrollElements) {
            el.y += scrollDist * el.speed;
            el.gfx.y = el.y;

            // Loop back to top
            if (el.y > GAME_HEIGHT + 100) {
                el.y -= GAME_HEIGHT + 240;
                el.gfx.y = el.y;
            }
        }
    }
}
