import { Container } from "pixi.js";
import { Pickup, PickupType, PICKUP_CONFIGS } from "../entities/Pickup";
import { Pool } from "../utils/Pool";
import {
  ROAD_SPEED,
  XP_PER_LEVEL_BASE,
  XP_PER_LEVEL_GROWTH,
} from "../constants";
import { EventBus } from "../utils/EventBus";
import { gameRng } from "../utils/RNG";

export class LootSystem {
  public container: Container;
  public pickups: Pickup[] = [];
  private pool: Pool<Pickup>;

  public xp: number = 0;
  public level: number = 1;
  public totalKills: number = 0;

  // Active Timed Buffs
  public rapidFireTimer: number = 0;
  public invincibleTimer: number = 0;

  constructor(parent: Container) {
    this.container = new Container();
    parent.addChild(this.container);

    this.pool = new Pool<Pickup>(() => {
      const p = new Pickup();
      this.container.addChild(p);
      return p;
    }, 30);
  }

  /** Roll for powerup crate drops on enemy kill (22% regular, 60% elite) */
  onEnemyDefeated(x: number, y: number, isElite: boolean = false) {
    this.totalKills++;
    this.gainXp(isElite ? 40 : 18);

    const dropChance = isElite ? 0.65 : 0.22;
    if (!gameRng.chance(dropChance)) return;

    // Roll crate type
    const roll = Math.random();
    let type: PickupType = "buff_rapid";

    if (roll < 0.12) {
      type = "star_upgrade"; // ⭐ Rare Star Upgrade
    } else if (roll < 0.38) {
      type = "buff_rapid"; // ⚡ Rapid Fire 10s
    } else if (roll < 0.6) {
      type = "buff_shield"; // 🛡️ Invincible Shield 8s
    } else if (roll < 0.82) {
      type = "buff_heal"; // 💊 Repair Kit (+100 HP)
    } else {
      type = "buff_nuke"; // 💣 Screen Nuke
    }

    const p = this.pool.get();
    p.spawn(x, y, type);
    this.pickups.push(p);
  }

  /** Grant XP and check level up */
  gainXp(amount: number) {
    this.xp += amount;

    const required = this.getXpRequired();
    if (this.xp >= required) {
      this.xp -= required;
      this.level++;
      EventBus.emit("level:up", { level: this.level });
    }
  }

  getXpRequired(): number {
    return (
      XP_PER_LEVEL_BASE * 1.1 + (this.level - 1) * (XP_PER_LEVEL_GROWTH * 1.1)
    );
  }

  getXpRatio(): number {
    return Math.min(1, Math.max(0, this.xp / this.getXpRequired()));
  }

  update(
    dt: number,
    convoyX: number,
    convoyY: number,
    onCollect: (type: PickupType) => void,
  ) {
    const dtSec = dt * (1 / 60);

    // Update active timed buffs
    if (this.rapidFireTimer > 0) this.rapidFireTimer -= dtSec;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dtSec;

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];

      if (!p.active) {
        this.pool.release(p);
        this.pickups.splice(i, 1);
        continue;
      }

      const collected = p.updatePickup(dt, convoyX, convoyY, ROAD_SPEED);

      if (collected) {
        const cfg = PICKUP_CONFIGS[p.pickupType];

        if (p.pickupType === "buff_rapid") {
          this.rapidFireTimer = 10;
        } else if (p.pickupType === "buff_shield") {
          this.invincibleTimer = 8;
        }

        onCollect(p.pickupType);
        p.deactivate();
      }
    }
  }
}
