import { Container, FederatedPointerEvent } from "pixi.js";
import { Convoy } from "../entities/Convoy";
import {
  GAME_WIDTH,
  CONVOY_Y,
  CONVOY_MOVE_SPEED,
  CONVOY_CLAMP_MARGIN,
  ROAD_LEFT,
  ROAD_RIGHT,
} from "../constants";
import { EventBus } from "../utils/EventBus";
import { moveTowards } from "../utils/MathUtils";

export class ConvoySystem {
  public convoy: Convoy;

  private isDragging = false;
  private targetX: number = GAME_WIDTH / 2;
  private dragOffsetX = 0;
  private gameOverEmitted = false;

  constructor(parent: Container) {
    this.convoy = new Convoy();
    this.convoy.x = GAME_WIDTH / 2;
    this.convoy.y = CONVOY_Y;
    parent.addChild(this.convoy);

    this.setupInput(parent);
  }

  private setupInput(parent: Container) {
    parent.eventMode = "static";
    parent.hitArea = { contains: () => true } as any;

    parent.on("pointerdown", (e: FederatedPointerEvent) => {
      this.isDragging = true;
      const pos = this.convoy.parent!.toLocal(e.global);
      this.dragOffsetX = this.convoy.x - pos.x;
    });

    parent.on("pointermove", (e: FederatedPointerEvent) => {
      if (!this.isDragging) return;
      const pos = this.convoy.parent!.toLocal(e.global);
      this.targetX = pos.x + this.dragOffsetX;
      this.targetX = Math.max(
        ROAD_LEFT + CONVOY_CLAMP_MARGIN,
        Math.min(ROAD_RIGHT - CONVOY_CLAMP_MARGIN, this.targetX),
      );
    });

    parent.on("pointerup", () => {
      this.isDragging = false;
    });
    parent.on("pointerupoutside", () => {
      this.isDragging = false;
    });
  }

  update(dt: number) {
    const dtSec = dt * (1 / 60);

    // Smooth movement towards target
    this.convoy.x = moveTowards(
      this.convoy.x,
      this.targetX,
      CONVOY_MOVE_SPEED * dtSec,
    );

    // Update modules
    this.convoy.update(dt);

    // Passive gentle convoy auto-repair (+2.5 HP/sec)
    for (const m of this.convoy.modules) {
      if (!m.isDead && m.hp < m.data.maxHp) {
        m.heal(2.5 * dtSec);
      }
    }

    // Remove dead modules
    this.convoy.removeDeadModules();

    // Check engine death → emit run:ended (RunScene handles scene transition)
    if (!this.gameOverEmitted && this.convoy.isEngineDead()) {
      this.gameOverEmitted = true;
      EventBus.emit("run:ended", {
        victory: false,
        distance: 0,
        kills: 0,
        score: 0,
      });
    }
  }
}
