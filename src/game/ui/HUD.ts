import { Container, Graphics, Text } from "pixi.js";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  BOSS_HP_BAR_WIDTH,
  BOSS_HP_BAR_HEIGHT,
  BOSS_HP_BAR_Y,
} from "../constants";
import { EventBus } from "../utils/EventBus";
import { HyperCircleButton } from "./HyperButton";
import { VectorIcons } from "./VectorIcons";

export class HUD extends Container {
  // Top Unified Header Bar
  private headerBg: Graphics;

  // Left Stats (Distance & Scrap)
  private distanceText: Text;
  private scrapText: Text;
  private scrapPill: Container;
  private lastScrap: number = 0;

  // Right Stats (Kills & Settings)
  private killText: Text;
  private killPill: Container;
  private lastKills: number = 0;
  private settingsBtn: HyperCircleButton;

  // Center Weapons Dock
  private weaponsContainer: Container;

  // Active Buffs Dock (Floating cleanly below header)
  private buffsContainer: Container;

  // Boss HP Bar
  private bossHpContainer: Container;
  private bossHpBg: Graphics;
  private bossHpFill: Graphics;
  private bossNameText: Text;

  // XP Bar (Bottom)
  private xpBarBg: Graphics;
  private xpBarFill: Graphics;
  private levelText: Text;
  private levelBadge: Container;

  // Damage Numbers (Pooled)
  private damageNumbersContainer: Container;
  private damageNumbers: DamageNumber[] = [];
  private damageNumberPool: DamageNumber[] = [];

  // Pickup Toasts
  private pickupToasts: PickupToast[] = [];

  constructor(onSettingsClick?: () => void) {
    super();

    // ── 1. Damage Numbers Container ──
    this.damageNumbersContainer = new Container();
    this.damageNumbersContainer.eventMode = "none";
    this.addChild(this.damageNumbersContainer);

    // ── 2. Unified Frosted Top Header Bar ──
    this.headerBg = new Graphics();
    // Dark Frosted Slate Background
    this.headerBg.rect(0, 0, GAME_WIDTH, 66).fill({ color: 0x090a0f, alpha: 0.92 });
    // Bottom border line
    this.headerBg.rect(0, 64, GAME_WIDTH, 2).fill(0x334155);
    this.addChild(this.headerBg);

    // ── 3. Top Left Stats: Distance & Scrap Dock ──
    // Distance Capsule (x = 16, y = 14, w = 96, h = 38)
    const distContainer = new Container();
    distContainer.x = 16;
    distContainer.y = 14;
    this.addChild(distContainer);

    const distBg = new Graphics();
    distBg.roundRect(0, 0, 96, 38, 12).fill(0x1e293b).stroke({ color: 0x38bdf8, width: 2 });
    distContainer.addChild(distBg);

    this.distanceText = new Text({
      text: "📏 0m",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 14,
        fontWeight: "900",
        fill: 0x38bdf8,
      },
    });
    this.distanceText.anchor.set(0.5);
    this.distanceText.x = 48;
    this.distanceText.y = 19;
    distContainer.addChild(this.distanceText);

    // Scrap Capsule (x = 118, y = 14, w = 84, h = 38)
    this.scrapPill = new Container();
    this.scrapPill.x = 118 + 42;
    this.scrapPill.y = 14 + 19;
    this.addChild(this.scrapPill);

    const scrapBg = new Graphics();
    scrapBg.roundRect(-42, -19, 84, 38, 12).fill(0x1e293b).stroke({ color: 0xfacc15, width: 2 });
    this.scrapPill.addChild(scrapBg);

    this.scrapText = new Text({
      text: "🔩 0",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 14,
        fontWeight: "900",
        fill: 0xfacc15,
      },
    });
    this.scrapText.anchor.set(0.5);
    this.scrapText.x = 0;
    this.scrapText.y = 0;
    this.scrapPill.addChild(this.scrapText);

    // ── 4. Top Center: Tactical Weapons Arsenal Dock ──
    this.weaponsContainer = new Container();
    this.weaponsContainer.y = 14;
    this.addChild(this.weaponsContainer);

    // ── 5. Top Right: Kills Capsule & Settings Button ──
    // Kills Capsule (x = GAME_WIDTH - 150, y = 14, w = 82, h = 38)
    this.killPill = new Container();
    this.killPill.x = GAME_WIDTH - 150 + 41;
    this.killPill.y = 14 + 19;
    this.addChild(this.killPill);

    const killBg = new Graphics();
    killBg.roundRect(-41, -19, 82, 38, 12).fill(0x1e293b).stroke({ color: 0xf43f5e, width: 2 });
    this.killPill.addChild(killBg);

    this.killText = new Text({
      text: "💀 0",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 14,
        fontWeight: "900",
        fill: 0xf43f5e,
      },
    });
    this.killText.anchor.set(0.5);
    this.killText.x = 0;
    this.killText.y = 0;
    this.killPill.addChild(this.killText);

    // Settings Button (x = GAME_WIDTH - 36, y = 33)
    this.settingsBtn = new HyperCircleButton({
      vectorIcon: "gear",
      radius: 19,
      color: 0x0ea5e9,
      shadowColor: 0x0369a1,
      strokeWidth: 2.5,
      onClick: () => {
        if (onSettingsClick) onSettingsClick();
      },
    });
    this.settingsBtn.x = GAME_WIDTH - 34;
    this.settingsBtn.y = 33;
    this.addChild(this.settingsBtn);

    // ── 6. Active Buffs Notification Strip (Floating cleanly below header at y = 76) ──
    this.buffsContainer = new Container();
    this.buffsContainer.y = 76;
    this.addChild(this.buffsContainer);

    // ── 7. Boss HP Bar (Top Center Overlay) ──
    this.bossHpContainer = new Container();
    this.bossHpContainer.y = BOSS_HP_BAR_Y;
    this.bossHpContainer.visible = false;
    this.addChild(this.bossHpContainer);

    this.bossHpBg = new Graphics();
    this.bossHpBg
      .roundRect(-BOSS_HP_BAR_WIDTH / 2, 0, BOSS_HP_BAR_WIDTH, BOSS_HP_BAR_HEIGHT, 10)
      .fill(0x450a0a)
      .stroke({ color: 0xffffff, width: 3 });
    this.bossHpContainer.addChild(this.bossHpBg);

    this.bossHpFill = new Graphics();
    this.bossHpContainer.addChild(this.bossHpFill);

    this.bossNameText = new Text({
      text: "BOSS: TITAN SA MẠC",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 15,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x991b1b, width: 3 },
      },
    });
    this.bossNameText.anchor.set(0.5);
    this.bossNameText.y = BOSS_HP_BAR_HEIGHT / 2;
    this.bossHpContainer.addChild(this.bossNameText);

    this.bossHpContainer.x = GAME_WIDTH / 2;

    // ── 8. XP Bar (Bottom - Frosted Frame) ──
    const xpY = GAME_HEIGHT - 34;
    const xpBarW = GAME_WIDTH - 146;

    this.xpBarBg = new Graphics();
    this.xpBarBg.roundRect(104, xpY + 2, xpBarW, 20, 10).fill(0x0f172a);
    this.xpBarBg
      .roundRect(104, xpY, xpBarW, 20, 10)
      .fill(0x1e293b)
      .stroke({ color: 0x38bdf8, width: 2 });
    this.addChild(this.xpBarBg);

    this.xpBarFill = new Graphics();
    this.addChild(this.xpBarFill);

    // Level Pill
    this.levelBadge = new Container();
    this.levelBadge.x = 16 + 40;
    this.levelBadge.y = xpY + 10;
    this.addChild(this.levelBadge);

    const lvlShadow = new Graphics();
    lvlShadow.roundRect(-40, -13 + 3, 80, 26, 13).fill(0x0369a1);
    this.levelBadge.addChild(lvlShadow);

    const lvlBody = new Graphics();
    lvlBody
      .roundRect(-40, -13, 80, 26, 13)
      .fill(0x0ea5e9)
      .stroke({ color: 0xffffff, width: 2 });
    this.levelBadge.addChild(lvlBody);

    this.levelText = new Text({
      text: "CẤP 1",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 13,
        fill: 0xffffff,
        fontWeight: "900",
      },
    });
    this.levelText.anchor.set(0.5);
    this.levelText.y = -1;
    this.levelBadge.addChild(this.levelText);

    // Damage number listener
    EventBus.on("damage:number", (data) => {
      this.spawnDamageNumber(
        data.x,
        data.y,
        data.amount,
        data.crit,
        data.heal,
        data.status,
      );
    });

    // Pickup toast listener
    EventBus.on("pickup:toast", (data) => {
      this.showPickupToast(data.text, data.color, data.icon);
    });
  }

  /** Display active buff badges with live timers centered cleanly at y = 76 */
  updateBuffs(rapidTimer: number, invincibleTimer: number) {
    this.buffsContainer.removeChildren();

    const activeBuffs: { label: string; timer: number; color: number; strokeColor: number }[] = [];
    if (rapidTimer > 0) {
      activeBuffs.push({
        label: `⚡ CUỒNG NỘ ${rapidTimer.toFixed(1)}s`,
        timer: rapidTimer,
        color: 0xd97706,
        strokeColor: 0xfbbf24,
      });
    }
    if (invincibleTimer > 0) {
      activeBuffs.push({
        label: `🛡️ BẤT TỬ ${invincibleTimer.toFixed(1)}s`,
        timer: invincibleTimer,
        color: 0x0284c7,
        strokeColor: 0x38bdf8,
      });
    }

    if (activeBuffs.length === 0) return;

    const badgeW = 140;
    const badgeH = 28;
    const gap = 10;
    const totalW = activeBuffs.length * badgeW + (activeBuffs.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2;

    for (let i = 0; i < activeBuffs.length; i++) {
      const b = activeBuffs[i];
      const cont = new Container();
      cont.x = startX + i * (badgeW + gap);

      const gfx = new Graphics();
      gfx.roundRect(0, 0, badgeW, badgeH, 14)
        .fill(0x0f172a)
        .stroke({ color: b.strokeColor, width: 2 });
      gfx.roundRect(4, 2, badgeW - 8, 10, 5).fill({ color: b.color, alpha: 0.4 });
      cont.addChild(gfx);

      const txt = new Text({
        text: b.label,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 12,
          fontWeight: "900",
          fill: b.strokeColor,
        },
      });
      txt.anchor.set(0.5);
      txt.x = badgeW / 2;
      txt.y = badgeH / 2;
      cont.addChild(txt);

      this.buffsContainer.addChild(cont);
    }
  }

  showPickupToast(text: string, color: number = 0xf59e0b, icon: string = "🎁") {
    const toast = new PickupToast(GAME_WIDTH / 2, 130, text, color, icon);
    this.addChild(toast);
    this.pickupToasts.push(toast);
  }

  updateDistance(distanceMeters: number) {
    this.distanceText.text = `📏 ${Math.floor(distanceMeters)}m`;
  }

  updateKills(kills: number) {
    if (kills > this.lastKills) {
      this.killPill.scale.set(1.2);
      this.lastKills = kills;
    }
    this.killText.text = `💀 ${kills}`;
  }

  updateScrap(scrap: number) {
    if (scrap > this.lastScrap) {
      this.scrapPill.scale.set(1.22);
      this.lastScrap = scrap;
    }
    this.scrapText.text = `🔩 ${scrap}`;
  }

  updateXp(ratio: number, level: number) {
    this.xpBarFill.clear();
    const xpY = GAME_HEIGHT - 34;
    const maxW = GAME_WIDTH - 146 - 4;
    const w = maxW * Math.min(1, Math.max(0, ratio));

    // Smooth Neon Blue Fill
    this.xpBarFill.roundRect(106, xpY + 2, w, 16, 8).fill(0x0284c7);
    this.xpBarFill
      .roundRect(106, xpY + 2, w, 6, 3)
      .fill({ color: 0xffffff, alpha: 0.45 });

    this.levelText.text = `CẤP ${level}`;
  }

  /** Update equipped weapons dock tray (Compact, centered between x = 210 and x = 530) */
  updateWeapons(weaponLevels: Record<string, number>) {
    this.weaponsContainer.removeChildren();

    const slotTypes: {
      id: string;
      label: string;
      color: number;
      strokeColor: number;
      drawIcon: (g: Graphics, size: number) => void;
    }[] = [
      {
        id: "machine_gun",
        label: "Súng Máy",
        color: 0xef4444,
        strokeColor: 0xf87171,
        drawIcon: (g, s) => {
          // Machine gun vector silhouette
          g.rect(-s * 0.4, -s * 0.15, s * 0.8, s * 0.3).fill(0xffffff);
          g.rect(-s * 0.1, s * 0.1, s * 0.2, s * 0.3).fill(0xffffff);
        },
      },
      {
        id: "rocket",
        label: "Tên Lửa",
        color: 0xf97316,
        strokeColor: 0xfb923c,
        drawIcon: (g, s) => {
          // Rocket vector silhouette
          g.poly([0, -s * 0.4, s * 0.25, s * 0.1, -s * 0.25, s * 0.1]).fill(0xffffff);
          g.rect(-s * 0.2, 0, s * 0.4, s * 0.4).fill(0xffffff);
        },
      },
      {
        id: "laser",
        label: "Pháo Laser",
        color: 0x0284c7,
        strokeColor: 0x38bdf8,
        drawIcon: (g, s) => {
          // Laser lightning bolt
          VectorIcons.drawLightning(g, s * 0.85, 0xffffff);
        },
      },
      {
        id: "shield",
        label: "Khiên",
        color: 0x10b981,
        strokeColor: 0x34d399,
        drawIcon: (g, s) => {
          // Shield polygon
          g.poly([
            0, -s * 0.35,
            s * 0.35, -s * 0.2,
            s * 0.3, s * 0.25,
            0, s * 0.4,
            -s * 0.3, s * 0.25,
            -s * 0.35, -s * 0.2,
          ]).fill(0xffffff);
        },
      },
    ];

    const slotW = 68;
    const slotH = 38;
    const gap = 6;
    const totalW = slotTypes.length * slotW + (slotTypes.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2;

    for (let i = 0; i < slotTypes.length; i++) {
      const slot = slotTypes[i];
      const lvl = weaponLevels[slot.id] || 0;
      const isOwned = lvl > 0;

      const card = new Container();
      card.x = startX + i * (slotW + gap);

      // Card Background
      const bg = new Graphics();
      if (isOwned) {
        bg.roundRect(0, 0, slotW, slotH, 10)
          .fill(0x1e293b)
          .stroke({ color: slot.strokeColor, width: 2 });
      } else {
        // Empty Slot
        bg.roundRect(0, 0, slotW, slotH, 10)
          .fill({ color: 0x0f172a, alpha: 0.6 })
          .stroke({ color: 0x334155, width: 1.5 });
      }
      card.addChild(bg);

      // Vector Icon
      const iconGfx = new Graphics();
      iconGfx.x = 18;
      iconGfx.y = slotH / 2;
      iconGfx.alpha = isOwned ? 1 : 0.3;
      slot.drawIcon(iconGfx, 20);
      card.addChild(iconGfx);

      // Star Badge / Level Text
      const badge = new Text({
        text: isOwned ? `★${lvl}` : "—",
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 13,
          fill: isOwned ? 0xfacc15 : 0x475569,
          fontWeight: "900",
        },
      });
      badge.anchor.set(1, 0.5);
      badge.x = slotW - 8;
      badge.y = slotH / 2;
      card.addChild(badge);

      this.weaponsContainer.addChild(card);
    }
  }

  showBossHp(name: string) {
    this.bossHpContainer.visible = true;
    this.bossNameText.text = name;
  }

  updateBossHp(ratio: number) {
    this.bossHpFill.clear();
    const maxW = BOSS_HP_BAR_WIDTH - 8;
    const w = maxW * Math.max(0, Math.min(1, ratio));
    this.bossHpFill.roundRect(
      -BOSS_HP_BAR_WIDTH / 2 + 4,
      4,
      w,
      BOSS_HP_BAR_HEIGHT - 8,
      8,
    );
    this.bossHpFill.fill(0xef4444);
    this.bossHpFill
      .roundRect(
        -BOSS_HP_BAR_WIDTH / 2 + 4,
        4,
        w,
        (BOSS_HP_BAR_HEIGHT - 8) * 0.4,
        4,
      )
      .fill({ color: 0xffffff, alpha: 0.35 });
  }

  hideBossHp() {
    this.bossHpContainer.visible = false;
  }

  private spawnDamageNumber(
    x: number,
    y: number,
    amount: number,
    crit?: boolean,
    heal?: boolean,
    status?: "burn" | "shock" | "crit",
  ) {
    if (this.damageNumbers.length >= 30 && (status === "burn" || status === "shock") && !crit) {
      return;
    }

    let dn = this.damageNumberPool.pop();
    if (!dn) {
      dn = new DamageNumber();
      this.damageNumbersContainer.addChild(dn);
    } else {
      dn.visible = true;
    }

    dn.reset(x, y, amount, crit, heal, status);
    this.damageNumbers.push(dn);
  }

  update(dt: number) {
    const dtSec = dt * (1 / 60);

    // Smooth bouncy decay on Scrap and Kill pills
    if (this.scrapPill.scale.x > 1.0) {
      const s = Math.max(1.0, this.scrapPill.scale.x - 1.2 * dtSec);
      this.scrapPill.scale.set(s);
    }
    if (this.killPill.scale.x > 1.0) {
      const s = Math.max(1.0, this.killPill.scale.x - 1.2 * dtSec);
      this.killPill.scale.set(s);
    }

    // Damage numbers (Pooled)
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.life -= dtSec;
      dn.y -= 65 * dtSec;
      dn.alpha = Math.max(0, dn.life / dn.maxLife);

      if (dn.life <= 0) {
        dn.visible = false;
        this.damageNumberPool.push(dn);
        this.damageNumbers.splice(i, 1);
      }
    }

    // Pickup Toast notifications
    for (let i = this.pickupToasts.length - 1; i >= 0; i--) {
      const toast = this.pickupToasts[i];
      toast.life -= dtSec;
      toast.y -= 25 * dtSec;

      const progress = 1 - toast.life / toast.maxLife;
      if (progress < 0.15) {
        const s = progress / 0.15;
        toast.scale.set(0.8 + 0.25 * s);
        toast.alpha = s;
      } else if (progress > 0.75) {
        toast.alpha = (1 - progress) / 0.25;
      } else {
        toast.scale.set(1.05);
        toast.alpha = 1;
      }

      if (toast.life <= 0) {
        this.removeChild(toast);
        toast.destroy();
        this.pickupToasts.splice(i, 1);
      }
    }
  }
}

class PickupToast extends Container {
  public life: number;
  public maxLife: number;

  constructor(
    x: number,
    y: number,
    text: string,
    color: number = 0xf59e0b,
    icon: string = "🎁",
  ) {
    super();
    this.x = x;
    this.y = y;
    this.life = 1.3;
    this.maxLife = 1.3;
    this.eventMode = "none";

    const badgeW = 200;
    const badgeH = 34;

    const bg = new Graphics();
    bg.roundRect(-badgeW / 2, 0, badgeW, badgeH, 17)
      .fill(0x0f172a)
      .stroke({ color: color, width: 2 });
    this.addChild(bg);

    const label = new Text({
      text: `${icon} ${text}`,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 15,
        fontWeight: "900",
        fill: 0xffffff,
        letterSpacing: 1,
      },
    });
    label.anchor.set(0.5);
    label.y = badgeH / 2;
    this.addChild(label);
  }
}

class DamageNumber extends Text {
  public life: number = 0;
  public maxLife: number = 0.65;

  constructor() {
    super({
      text: "0",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 22,
        fill: 0xffffff,
        fontWeight: "900",
        stroke: { color: 0x000000, width: 3.5 },
      },
    });
    this.anchor.set(0.5);
    this.eventMode = "none";
  }

  reset(
    x: number,
    y: number,
    amount: number,
    crit?: boolean,
    heal?: boolean,
    status?: "burn" | "shock" | "crit",
  ) {
    let color = 0xffffff;
    let prefix = "";
    let size = 22;

    if (status === "burn") {
      color = 0xff5500;
      prefix = "🔥 ";
      size = 20;
    } else if (status === "shock") {
      color = 0x00e5ff;
      prefix = "⚡ ";
      size = 22;
    } else if (crit || status === "crit") {
      color = 0xfacc15;
      prefix = "💥 ";
      size = 30;
    } else if (heal) {
      color = 0x22c55e;
      prefix = "+";
      size = 22;
    }

    this.text = `${prefix}${Math.round(amount)}`;
    this.style.fill = color;
    this.style.fontSize = size;
    this.x = x + (Math.random() - 0.5) * 20;
    this.y = y;
    this.scale.set(crit ? 1.25 : 1.0);
    this.alpha = 1;
    this.life = 0.65;
    this.maxLife = 0.65;
  }
}
