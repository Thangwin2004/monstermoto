import { Container } from "pixi.js";
import { Pickup, PickupType, PICKUP_CONFIGS } from "../entities/Pickup";
import { Pool } from "../utils/Pool";
import {
  ROAD_SPEED,
  XP_PER_LEVEL_BASE,
  XP_PER_LEVEL_GROWTH,
  ROAD_LEFT,
  ROAD_RIGHT,
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

  // Anti-spam cooldown: minimum time between crate drops
  private dropCooldownTimer: number = 0;
  private supplyDropTimer: number = 60; // 60s fallback emergency supply

  constructor(parent: Container) {
    this.container = new Container();
    parent.addChild(this.container);

    this.pool = new Pool<Pickup>(() => {
      const p = new Pickup();
      this.container.addChild(p);
      return p;
    }, 15);
  }

  /**
   * Paced, tactical powerup crate drops:
   * - Max 2 crates on screen at once
   * - 8s cooldown between drops to prevent flood
   * - 2.5% chance from regular mobs, 35% from elites
   */
  onEnemyDefeated(x: number, y: number, isElite: boolean = false) {
    this.totalKills++;
    this.gainXp(isElite ? 35 : 12);

    // 1. Cap active crates on screen to at most 2
    const activeCount = this.pickups.filter((p) => p.active).length;
    if (activeCount >= 2) return;

    // 2. Cooldown check for regular mobs (minimum 8s between drops)
    if (!isElite && this.dropCooldownTimer > 0) return;

    // 3. Drop chance
    const dropChance = isElite ? 0.35 : 0.025;
    if (!gameRng.chance(dropChance)) return;

    this.dropCooldownTimer = isElite ? 4 : 8; // Reset cooldown
    this.supplyDropTimer = 60;

    // 4. Weighted roll
    const roll = Math.random();
    let type: PickupType = "buff_rapid";

    if (roll < 0.08) {
      type = "star_upgrade"; // ⭐ Rare Weapon Star Upgrade
    } else if (roll < 0.28) {
      type = "buff_nuke"; // 💣 Tactical Bomb
    } else if (roll < 0.54) {
      type = "buff_rapid"; // ⚡ Rapid Fire 10s
    } else if (roll < 0.78) {
      type = "buff_shield"; // 🛡️ Invincible Shield 8s
    } else {
      type = "buff_heal"; // 💊 Repair Kit (+100 HP)
    }

    const p = this.pool.get();
    p.spawn(x, y, type);
    this.pickups.push(p);
  }

  /** Spawn a specific scripted drop (e.g. boss rewards) */
  spawnDrop(x: number, y: number, type: PickupType) {
    const activeCount = this.pickups.filter((p) => p.active).length;
    if (activeCount >= 3) return;

    const p = this.pool.get();
    p.spawn(x, y, type);
    this.pickups.push(p);
  }

  /** Grant XP and check level up */
  gainXp(amount: number) {
    this.xp += amount;

    let required = this.getXpRequired();
    while (this.xp >= required) {
      this.xp -= required;
      this.level++;
      EventBus.emit("level:up", { level: this.level });
      required = this.getXpRequired();
    }
  }

  getXpRequired(): number {
    return XP_PER_LEVEL_BASE + (this.level - 1) * XP_PER_LEVEL_GROWTH;
  }

  getXpRatio(): number {
    return Math.min(1, Math.max(0, this.xp / this.getXpRequired()));
  }

  update(
    dt: number,
    convoyX: number,
    convoyY: number,
    modulePositions: { x: number; y: number }[] = [],
    onCollect: (type: PickupType) => void,
  ) {
    const dtSec = dt * (1 / 60);

    // Update active timed buffs
    if (this.rapidFireTimer > 0) this.rapidFireTimer -= dtSec;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dtSec;

    // Cooldown timers
    if (this.dropCooldownTimer > 0) this.dropCooldownTimer -= dtSec;

    // Emergency supply airdrop only if 60s pass with zero crate drops
    this.supplyDropTimer -= dtSec;
    if (this.supplyDropTimer <= 0) {
      this.supplyDropTimer = 60;
      const activeCount = this.pickups.filter((p) => p.active).length;
      if (activeCount < 1) {
        const roadX = ROAD_LEFT + 80 + Math.random() * (ROAD_RIGHT - ROAD_LEFT - 160);
        const types: PickupType[] = ["buff_heal", "buff_rapid", "buff_nuke", "buff_shield", "star_upgrade"];
        const chosen = types[Math.floor(Math.random() * types.length)];
        this.spawnDrop(roadX, -60, chosen);
      }
    }

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];

      if (!p.active) {
        this.pool.release(p);
        this.pickups.splice(i, 1);
        continue;
      }

      const collected = p.updatePickup(
        dt,
        convoyX,
        convoyY,
        modulePositions,
        ROAD_SPEED,
      );

      if (collected) {
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


