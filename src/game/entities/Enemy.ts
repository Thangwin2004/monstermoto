import { Container, Graphics, GraphicsContext } from "pixi.js";
import { EnemyDefinition, EnemyArchetype } from "../data/enemies";
import { EventBus } from "../utils/EventBus";

export type EnemyState = "approaching" | "attacking" | "leaping" | "dead";

// Performance Cache: Share static GraphicsContext across all spawned enemies to eliminate GPU/CPU rebuilds
const enemyContextCache = new Map<string, GraphicsContext>();
const shadowContextCache = new Map<number, GraphicsContext>();

function getShadowContext(radius: number): GraphicsContext {
  const rounded = Math.round(radius);
  if (!shadowContextCache.has(rounded)) {
    const ctx = new GraphicsContext();
    ctx.ellipse(0, rounded * 0.7, rounded * 0.9, rounded * 0.4)
       .fill({ color: 0x000000, alpha: 0.45 });
    shadowContextCache.set(rounded, ctx);
  }
  return shadowContextCache.get(rounded)!;
}

export class Enemy extends Container {
  public hp: number = 0;
  public maxHp: number = 0;
  public speed: number = 0;
  public radius: number = 0;
  public damage: number = 0;
  public active: boolean = false;
  public archetype: EnemyArchetype = "runner";
  public state: EnemyState = "approaching";
  public xpReward: number = 0;
  public scrapReward: number = 0;
  public color: number = 0xef4444;

  // Behavior
  public behavior: string = "rush";
  public attackRange: number = 0;
  public attackCooldown: number = 0;
  public attackDamage: number = 0;
  public attackTimer: number = 0;
  public leapRange: number = 0;

  // Status effects
  public burnTimer: number = 0;
  public burnDamage: number = 0;
  public burnTickTimer: number = 0;
  public shockTimer: number = 0;
  public slowMultiplier: number = 1;

  // Leap
  public leapTargetX: number = 0;
  public leapTargetY: number = 0;
  public leapProgress: number = 0;
  public leapStartX: number = 0;
  public leapStartY: number = 0;

  // Visuals & Hit Stun FX
  private shadow: Graphics;
  private spriteContainer: Container;
  private monsterBody: Graphics;
  private statusGlow: Graphics;
  private hpBar: Graphics;
  private flashTimer: number = 0;
  private hitTwitchTimer: number = 0; // ⚡ Hit-Stun Convulsion / Twitching
  private animTime: number = 0;

  constructor() {
    super();

    // 1. Drop shadow
    this.shadow = new Graphics();
    this.addChild(this.shadow);

    // 2. Animated container
    this.spriteContainer = new Container();
    this.addChild(this.spriteContainer);

    // 3. High-Quality Comic Monster Vector Graphic
    this.monsterBody = new Graphics();
    this.spriteContainer.addChild(this.monsterBody);

    // 4. Status effect aura (burn flames, electric shock)
    this.statusGlow = new Graphics();
    this.spriteContainer.addChild(this.statusGlow);

    // 5. HP bar (pill shape)
    this.hpBar = new Graphics();
    this.addChild(this.hpBar);
  }

  /** Configure from definition data */
  reset(def: EnemyDefinition, hpScale: number = 1) {
    this.archetype = def.id;
    this.maxHp = Math.round(def.maxHp * hpScale);
    this.hp = this.maxHp;
    this.speed = def.speed;
    this.radius = def.radius;
    this.damage = def.damage;
    this.xpReward = def.xpReward;
    this.scrapReward = def.scrapReward;
    this.color = def.color;
    this.behavior = def.behavior;
    this.attackRange = def.attackRange ?? 0;
    this.attackCooldown = def.attackCooldown ?? 0;
    this.attackDamage = def.attackDamage ?? 0;
    this.attackTimer = 0;
    this.leapRange = def.leapRange ?? 0;

    this.state = "approaching";
    this.active = true;
    this.visible = true;

    // Reset visual transforms & timers
    this.hitTwitchTimer = 0;
    this.flashTimer = 0;
    this.spriteContainer.x = 0;
    this.spriteContainer.y = 0;
    this.spriteContainer.rotation = 0;
    this.spriteContainer.scale.set(1);
    this.monsterBody.tint = 0xffffff;

    // Reset status effects
    this.burnTimer = 0;
    this.burnDamage = 0;
    this.shockTimer = 0;
    this.slowMultiplier = 1;
    this.leapProgress = 0;

    // Setup drop shadow via cached context (Instant 0ms)
    this.shadow.context = getShadowContext(def.radius);

    // Render / bind cached comic monster artwork (Instant 0ms)
    this.bindMonsterGraphic(def);
    this.updateHpBar();
  }

  /** 🎨 Bind Cached Comic Monster GraphicsContext */
  private bindMonsterGraphic(def: EnemyDefinition) {
    if (!enemyContextCache.has(def.id)) {
      const g = new GraphicsContext();
      this.drawMonsterGraphicToContext(g, def);
      enemyContextCache.set(def.id, g);
    }
    this.monsterBody.context = enemyContextCache.get(def.id)!;
  }

  private drawMonsterGraphicToContext(g: GraphicsContext, def: EnemyDefinition) {
    const r = def.radius;

    switch (def.id) {
      case "runner": {
        // ── 🏃 QUÁI CHẠY NHANH (Shadow Fiend) ──
        // Dark demon body with bold black outline
        g.ellipse(0, 0, r * 0.9, r * 1.1)
          .fill(0xb91c1c)
          .stroke({ color: 0x000000, width: 3.5 });

        // Inner muscle shading
        g.ellipse(0, 2, r * 0.65, r * 0.75).fill(0xef4444);

        // Dual curved swept-back horns
        g.poly([-r * 0.5, -r * 0.5, -r * 0.2, -r * 0.8, -r * 0.8, -r * 1.4])
          .fill(0x18181b)
          .stroke({ color: 0x000000, width: 2 });
        g.poly([r * 0.5, -r * 0.5, r * 0.2, -r * 0.8, r * 0.8, -r * 1.4])
          .fill(0x18181b)
          .stroke({ color: 0x000000, width: 2 });

        // Glowing Yellow Slit Eyes
        g.ellipse(-r * 0.35, -r * 0.1, r * 0.22, r * 0.12)
          .fill(0xfacc15)
          .stroke({ color: 0x000000, width: 1.5 });
        g.ellipse(r * 0.35, -r * 0.1, r * 0.22, r * 0.12)
          .fill(0xfacc15)
          .stroke({ color: 0x000000, width: 1.5 });
        g.circle(-r * 0.35, -r * 0.1, r * 0.08).fill(0x000000);
        g.circle(r * 0.35, -r * 0.1, r * 0.08).fill(0x000000);

        // Sharp fanged maw
        g.poly([-r * 0.4, r * 0.3, 0, r * 0.55, r * 0.4, r * 0.3]).fill(
          0x000000,
        );
        g.poly([
          -r * 0.25,
          r * 0.3,
          -r * 0.15,
          r * 0.3,
          -r * 0.2,
          r * 0.45,
        ]).fill(0xffffff);
        g.poly([r * 0.15, r * 0.3, r * 0.25, r * 0.3, r * 0.2, r * 0.45]).fill(
          0xffffff,
        );
        break;
      }

      case "tank": {
        // ── 🛡️ QUÁI THIẾT GIÁP (Horned Iron Brute) ──
        // Heavy stone/iron body
        g.roundRect(-r * 0.95, -r * 0.95, r * 1.9, r * 1.9, 12)
          .fill(0x3f3f46)
          .stroke({ color: 0x000000, width: 4 });

        // Spiked Iron Shoulder Pauldrons
        g.poly([-r * 1.2, -r * 0.2, -r * 0.7, -r * 0.8, -r * 0.7, r * 0.4])
          .fill(0x71717a)
          .stroke({ color: 0x000000, width: 2.5 });
        g.poly([r * 1.2, -r * 0.2, r * 0.7, -r * 0.8, r * 0.7, r * 0.4])
          .fill(0x71717a)
          .stroke({ color: 0x000000, width: 2.5 });

        // 2 Huge Front Iron Horns
        g.poly([-r * 0.6, -r * 0.7, -r * 0.2, -r * 0.9, -r * 0.7, -r * 1.5])
          .fill(0xd4d4d8)
          .stroke({ color: 0x000000, width: 2 });
        g.poly([r * 0.6, -r * 0.7, r * 0.2, -r * 0.9, r * 0.7, -r * 1.5])
          .fill(0xd4d4d8)
          .stroke({ color: 0x000000, width: 2 });

        // Iron Visor & Glowing Cyan Eye Slit
        g.roundRect(-r * 0.6, -r * 0.25, r * 1.2, r * 0.4, 4).fill(0x18181b);
        g.rect(-r * 0.45, -r * 0.15, r * 0.9, r * 0.2).fill(0x00f0ff);

        // Heavy Iron Jaw Plate with Bolts
        g.roundRect(-r * 0.5, r * 0.25, r * 1.0, r * 0.45, 4)
          .fill(0x52525b)
          .stroke({ color: 0x000000, width: 2 });
        g.circle(-r * 0.35, r * 0.45, 2.5).fill(0xfacc15);
        g.circle(r * 0.35, r * 0.45, 2.5).fill(0xfacc15);
        break;
      }

      case "spitter": {
        // ── 🟢 QUÁI PHUN GAI AXIT (Toxic Stalker) ──
        // 4 Spidery Legs
        g.poly([
          -r * 0.8,
          -r * 0.3,
          -r * 1.3,
          -r * 0.7,
          -r * 1.1,
          -r * 0.1,
        ]).fill(0x14532d);
        g.poly([r * 0.8, -r * 0.3, r * 1.3, -r * 0.7, r * 1.1, -r * 0.1]).fill(
          0x14532d,
        );
        g.poly([-r * 0.8, r * 0.3, -r * 1.3, r * 0.7, -r * 1.1, r * 0.1]).fill(
          0x14532d,
        );
        g.poly([r * 0.8, r * 0.3, r * 1.3, r * 0.7, r * 1.1, r * 0.1]).fill(
          0x14532d,
        );

        // Glowing Neon-Green Acid Abdomen
        g.circle(0, 0, r * 0.85)
          .fill(0x15803d)
          .stroke({ color: 0x000000, width: 3.5 });

        // Pulsing Acid Sac
        g.circle(0, -r * 0.1, r * 0.55).fill(0x22c55e);
        g.circle(-r * 0.15, -r * 0.2, r * 0.18).fill(0x86efac);

        // Curved Stinger Tail
        g.poly([0, r * 0.6, -r * 0.3, r * 1.2, 0, r * 1.5, r * 0.2, r * 1.1])
          .fill(0x166534)
          .stroke({ color: 0x000000, width: 2 });
        g.poly([0, r * 1.5, -r * 0.1, r * 1.8, 0.1, r * 1.8]).fill(0x86efac); // Glowing venom tip

        // Multi-eyes
        g.circle(-r * 0.3, -r * 0.45, r * 0.12).fill(0xfacc15);
        g.circle(r * 0.3, -r * 0.45, r * 0.12).fill(0xfacc15);
        g.circle(0, -r * 0.55, r * 0.14).fill(0xfacc15);
        break;
      }

      case "jumper": {
        // ── 🦘 QUÁI NHẢY CÁNH QUỶ (Leap Gargoyle) ──
        // Jagged Bat Wings
        g.poly([
          -r * 0.5,
          0,
          -r * 1.4,
          -r * 0.9,
          -r * 1.2,
          r * 0.3,
          -r * 0.6,
          r * 0.3,
        ])
          .fill(0x581c87)
          .stroke({ color: 0x000000, width: 2.5 });
        g.poly([
          r * 0.5,
          0,
          r * 1.4,
          -r * 0.9,
          r * 1.2,
          r * 0.3,
          r * 0.6,
          r * 0.3,
        ])
          .fill(0x581c87)
          .stroke({ color: 0x000000, width: 2.5 });

        // Purple demon body
        g.ellipse(0, 0, r * 0.8, r * 0.95)
          .fill(0x7c3aed)
          .stroke({ color: 0x000000, width: 3.5 });

        // Spring Legs
        g.poly([-r * 0.5, r * 0.6, -r * 0.8, r * 1.2, -r * 0.3, r * 1.3])
          .fill(0x4c1d95)
          .stroke({ color: 0x000000, width: 2 });
        g.poly([r * 0.5, r * 0.6, r * 0.8, r * 1.2, r * 0.3, r * 1.3])
          .fill(0x4c1d95)
          .stroke({ color: 0x000000, width: 2 });

        // Glowing Neon Violet Eyes
        g.circle(-r * 0.3, -r * 0.15, r * 0.18)
          .fill(0xf0abfc)
          .stroke({ color: 0x000000, width: 1.5 });
        g.circle(r * 0.3, -r * 0.15, r * 0.18)
          .fill(0xf0abfc)
          .stroke({ color: 0x000000, width: 1.5 });
        break;
      }

      case "swarm": {
        // ── 🐜 TIỂU QUÁI GAI (Desert Swarmling) ──
        g.circle(0, 0, r * 0.9)
          .fill(0xef4444)
          .stroke({ color: 0x000000, width: 2.5 });
        // Front Pincers
        g.poly([
          -r * 0.5,
          -r * 0.5,
          -r * 0.7,
          -r * 1.1,
          -r * 0.2,
          -r * 0.8,
        ]).fill(0xf59e0b);
        g.poly([r * 0.5, -r * 0.5, r * 0.7, -r * 1.1, r * 0.2, -r * 0.8]).fill(
          0xf59e0b,
        );
        // Eyes
        g.circle(-r * 0.3, -r * 0.1, r * 0.2).fill(0xfacc15);
        g.circle(r * 0.3, -r * 0.1, r * 0.2).fill(0xfacc15);
        break;
      }

      case "bomber": {
        // ── 💣 QUÁI CẢM TỬ PHÁT NỔ (Volatile Bomb Fiend) ──
        // Bloated Glowing Magma Belly
        g.circle(0, 2, r * 0.95)
          .fill(0xc2410c)
          .stroke({ color: 0x000000, width: 3.5 });
        g.circle(0, 0, r * 0.7).fill(0xf97316);
        g.circle(-r * 0.2, -r * 0.2, r * 0.35).fill(0xfacc15);

        // Strapped TNT Sticks with Steel Chains
        g.rect(-r * 0.6, r * 0.1, r * 1.2, r * 0.25)
          .fill(0xdc2626)
          .stroke({ color: 0x000000, width: 1.5 });
        g.rect(-r * 0.4, r * 0.35, r * 0.8, r * 0.2)
          .fill(0xdc2626)
          .stroke({ color: 0x000000, width: 1.5 });

        // Burning Sparkling Fuse on Top
        g.poly([0, -r * 0.8, r * 0.3, -r * 1.2, 0, -r * 1.4]).stroke({
          color: 0x71717a,
          width: 3,
        });
        // Sparks
        g.circle(0, -r * 1.4, 4.5).fill(0xfacc15);
        g.circle(0, -r * 1.4, 2.5).fill(0xffffff);

        // Manic Glowing Eyes
        g.circle(-r * 0.35, -r * 0.25, r * 0.2)
          .fill(0xffffff)
          .stroke({ color: 0x000000, width: 1.5 });
        g.circle(r * 0.35, -r * 0.25, r * 0.2)
          .fill(0xffffff)
          .stroke({ color: 0x000000, width: 1.5 });
        g.circle(-r * 0.35, -r * 0.25, r * 0.08).fill(0x000000);
        g.circle(r * 0.35, -r * 0.25, r * 0.08).fill(0x000000);
        break;
      }

      case "colossus": {
        // ── 👹 CỰ THÚ SA MẠC THỐNG TRỊ (Canyon Colossus) ──
        // Massive Demonic Titan Frame
        g.roundRect(-r * 0.95, -r * 0.95, r * 1.9, r * 1.9, 16)
          .fill(0x18181b)
          .stroke({ color: 0x000000, width: 4.5 });

        // Glowing Magma Chest Core & Cracks
        g.poly([
          0,
          -r * 0.3,
          -r * 0.4,
          r * 0.3,
          0,
          r * 0.6,
          r * 0.4,
          r * 0.3,
        ]).fill(0xea580c);
        g.circle(0, 0, r * 0.25).fill(0xfacc15);

        // 4 Colossal Jagged Demonic Horns
        g.poly([-r * 0.7, -r * 0.7, -r * 0.3, -r * 1.0, -r * 1.0, -r * 1.8])
          .fill(0x52525b)
          .stroke({ color: 0x000000, width: 3 });
        g.poly([r * 0.7, -r * 0.7, r * 0.3, -r * 1.0, r * 1.0, -r * 1.8])
          .fill(0x52525b)
          .stroke({ color: 0x000000, width: 3 });
        // Red Blood-Tipped Horns
        g.poly([
          -r * 0.85,
          -r * 1.5,
          -r * 0.7,
          -r * 1.3,
          -r * 1.0,
          -r * 1.8,
        ]).fill(0xdc2626);
        g.poly([r * 0.85, -r * 1.5, r * 0.7, -r * 1.3, r * 1.0, -r * 1.8]).fill(
          0xdc2626,
        );

        // Glowing Demonic Eyes
        g.ellipse(-r * 0.4, -r * 0.4, r * 0.22, r * 0.12)
          .fill(0xf97316)
          .stroke({ color: 0x000000, width: 2 });
        g.ellipse(r * 0.4, -r * 0.4, r * 0.22, r * 0.12)
          .fill(0xf97316)
          .stroke({ color: 0x000000, width: 2 });
        break;
      }

      case "stalker": {
        // ── ⚡ SÁT THỦ HẮC ÁM (Shadow Assassin) ──
        // Sleek Shadow Ninja Demon Body
        g.ellipse(0, 0, r * 0.75, r * 1.05)
          .fill(0x312e81)
          .stroke({ color: 0x000000, width: 3.5 });

        // Dual Glowing Purple Energy Scythes
        g.poly([-r * 0.6, -r * 0.2, -r * 1.5, -r * 0.8, -r * 1.2, r * 0.5])
          .fill(0xa855f7)
          .stroke({ color: 0x000000, width: 2 });
        g.poly([r * 0.6, -r * 0.2, r * 1.5, -r * 0.8, r * 1.2, r * 0.5])
          .fill(0xa855f7)
          .stroke({ color: 0x000000, width: 2 });

        // Narrow Glowing Purple Eye Visor
        g.rect(-r * 0.4, -r * 0.2, r * 0.8, r * 0.15).fill(0xf0abfc);
        break;
      }

      case "acid_queen": {
        // ── ☣️ NỮ CHÚA AXIT (Acid Broodmother) ──
        // Crown of Spikes
        g.poly([-r * 0.8, -r * 0.6, 0, -r * 1.4, r * 0.8, -r * 0.6])
          .fill(0x064e3b)
          .stroke({ color: 0x000000, width: 3 });

        // Royal Carapace
        g.circle(0, 0, r * 0.95)
          .fill(0x047857)
          .stroke({ color: 0x000000, width: 4 });

        // 4 Glowing Acid Gems
        g.circle(-r * 0.4, -r * 0.2, r * 0.22).fill(0x34d399);
        g.circle(r * 0.4, -r * 0.2, r * 0.22).fill(0x34d399);
        g.circle(-r * 0.3, r * 0.35, r * 0.25).fill(0x10b981);
        g.circle(r * 0.3, r * 0.35, r * 0.25).fill(0x10b981);
        break;
      }
    }
  }

  takeDamage(amount: number): boolean {
    if (!this.active) return false;

    this.hp -= amount;
    this.flashDamage();
    this.updateHpBar();

    // ⚡ Trigger Violent Hit-Stun Convulsion / Twitching (Giật giật giật khi trúng đạn)
    this.hitTwitchTimer = 0.28;

    // Subtle physical knockback / hit push
    this.y -= Math.min(10, 2 + amount * 0.15);

    if (this.hp <= 0) {
      this.hp = 0;
      this.active = false;
      this.state = "dead";
      this.visible = false;
      return true; // killed
    }
    return false;
  }

  applyBurn(damage: number, duration: number) {
    this.burnDamage = damage;
    this.burnTimer = duration;
  }

  applyShock(duration: number) {
    this.shockTimer = duration;
    this.slowMultiplier = 0.3;
  }

  getEffectiveSpeed(): number {
    let s = this.speed;
    if (this.shockTimer > 0) s *= this.slowMultiplier;
    // Slow down during violent hit flinch
    if (this.hitTwitchTimer > 0) s *= 0.45;
    return s;
  }

  hasBurn(): boolean {
    return this.burnTimer > 0;
  }
  hasShock(): boolean {
    return this.shockTimer > 0;
  }

  updateStatusEffects(dtSec: number) {
    // Burn tick with floating damage numbers
    if (this.burnTimer > 0) {
      this.burnTimer -= dtSec;
      this.burnTickTimer -= dtSec;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 0.35;
        const tickDmg = Math.max(3, Math.round(this.burnDamage * 0.35));
        this.hp -= tickDmg;
        this.updateHpBar();
        EventBus.emit("damage:number", {
          x: this.x + (Math.random() - 0.5) * 16,
          y: this.y - 25,
          amount: tickDmg,
          status: "burn",
        });
      }
      if (this.hp <= 0) {
        this.hp = 0;
        this.active = false;
        this.state = "dead";
        this.visible = false;
      }
    }

    // Shock tick
    if (this.shockTimer > 0) {
      this.shockTimer -= dtSec;
      if (this.shockTimer <= 0) this.slowMultiplier = 1;
    }

    // Ultra-Vibrant Status Visual Effects
    this.statusGlow.clear();
    if (this.burnTimer > 0) {
      // Dancing orange/red fire tongues
      const r = this.radius;
      this.statusGlow
        .circle(0, 0, r + 8)
        .fill({ color: 0xff3b30, alpha: 0.25 });

      for (let i = 0; i < 5; i++) {
        const angle = ((Math.PI * 2) / 5) * i + this.animTime * 4;
        const fx = Math.cos(angle) * (r + 4);
        const fy =
          Math.sin(angle) * (r + 4) -
          Math.abs(Math.sin(this.animTime * 12 + i)) * 12;
        this.statusGlow
          .circle(fx, fy, 6 + Math.sin(this.animTime * 10 + i) * 3)
          .fill(i % 2 === 0 ? 0xff6600 : 0xffcc00);
      }
      this.monsterBody.tint = 0xff7733;
    } else if (this.shockTimer > 0) {
      // Ultra-Vivid High-Voltage Electric Arcs & Convulsion Twitching
      const r = this.radius;
      const strobe = Math.sin(this.animTime * 30) > 0;

      // Pulsing Electric Field
      this.statusGlow
        .circle(0, 0, r + 10)
        .stroke({ color: 0x00f0ff, width: 3, alpha: 0.85 });
      this.statusGlow
        .circle(0, 0, r + 14)
        .stroke({ color: 0x67e8f9, width: 1.5, alpha: 0.45 });

      // Violent Jagged Lightning Arcs crawling across the monster
      for (let i = 0; i < 6; i++) {
        const a1 = ((Math.PI * 2) / 6) * i + Math.random() * 0.4;
        const a2 = a1 + 1.2;
        const x1 = Math.cos(a1) * (r * 0.3);
        const y1 = Math.sin(a1) * (r * 0.3);
        const x2 = Math.cos(a2) * (r + 8);
        const y2 = Math.sin(a2) * (r + 8);
        const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 16;
        const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 16;

        // Outer cyan arc
        this.statusGlow
          .moveTo(x1, y1)
          .lineTo(midX, midY)
          .lineTo(x2, y2)
          .stroke({ color: 0x00e5ff, width: 3.5 });

        // Inner bright white arc
        this.statusGlow
          .moveTo(x1, y1)
          .lineTo(midX, midY)
          .lineTo(x2, y2)
          .stroke({ color: 0xffffff, width: 1.5 });
      }

      // High-voltage convulsion strobe tint
      this.monsterBody.tint = strobe ? 0xffffff : 0x00d4ff;
    } else if (this.flashTimer <= 0) {
      this.monsterBody.tint = 0xffffff;
    }
  }

  private updateHpBar() {
    this.hpBar.clear();
    if (this.hp >= this.maxHp || !this.active) return;

    const ratio = Math.max(0, this.hp / this.maxHp);
    const barW = Math.max(34, this.radius * 2);
    const barH = 6;
    const barY = -this.radius - 14;

    // Shadow
    this.hpBar
      .roundRect(-barW / 2 + 1, barY + 1, barW, barH, 3)
      .fill({ color: 0x000000, alpha: 0.4 });
    // Bg
    this.hpBar
      .roundRect(-barW / 2, barY, barW, barH, 3)
      .fill(0x1a1a24)
      .stroke({ color: 0xffffff, width: 1 });
    // Fill
    const fillW = Math.max(2, (barW - 2) * ratio);
    const fillColor =
      ratio < 0.3 ? 0xff3b30 : ratio < 0.6 ? 0xffcc00 : 0x34c759;
    this.hpBar
      .roundRect(-barW / 2 + 1, barY + 1, fillW, barH - 2, 2)
      .fill(fillColor);
  }

  private flashDamage() {
    this.flashTimer = 0.15;
    this.monsterBody.tint = 0xffffff; // Bright white arcade flash on impact
  }

  update(dt: number) {
    const dtSec = dt * (1 / 60);
    this.animTime += dtSec;

    // Flash recovery
    if (this.flashTimer > 0) {
      this.flashTimer -= dtSec;
      if (this.flashTimer <= 0.08 && this.flashTimer > 0) {
        this.monsterBody.tint = 0xff3333; // Secondary intense red flash
      } else if (this.flashTimer <= 0) {
        this.monsterBody.tint = 0xffffff;
      }
    }

    // ⚡ Hit-Stun Convulsion / Twitching Animation (Giật giật giật khi dính đạn)
    if (this.hitTwitchTimer > 0) {
      this.hitTwitchTimer -= dtSec;
      const intensity = Math.min(1.0, this.hitTwitchTimer / 0.18);

      // High-frequency violent jitter displacement
      this.spriteContainer.x = (Math.random() - 0.5) * 16 * intensity;
      this.spriteContainer.y = (Math.random() - 0.5) * 16 * intensity;
      this.spriteContainer.rotation = (Math.random() - 0.5) * 0.38 * intensity;

      // Convulsive squash/stretch twitch
      const twitchScale = 1 + Math.sin(this.animTime * 65) * 0.22 * intensity;
      this.spriteContainer.scale.set(twitchScale, 2 - twitchScale);
    } else {
      this.spriteContainer.x = 0;
      this.spriteContainer.y = 0;

      // Normal locomotion animation
      if (this.state === "approaching") {
        const bounce = Math.sin(this.animTime * 8) * 0.08;
        const wobble = Math.cos(this.animTime * 6) * 0.05;
        this.spriteContainer.scale.x = 1 + wobble;
        this.spriteContainer.scale.y = 1 + bounce;
        this.spriteContainer.rotation = wobble * 0.5;
      } else if (this.state === "leaping") {
        const airScale = 1 + Math.sin(this.leapProgress * Math.PI) * 0.5;
        this.spriteContainer.scale.set(airScale);
        this.shadow.scale.set(1 / airScale);
        this.shadow.alpha = 0.35 / airScale;
      }
    }

    this.updateStatusEffects(dtSec);
  }
}
