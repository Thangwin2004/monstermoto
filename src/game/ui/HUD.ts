import { Container, Graphics, Text } from "pixi.js";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS,
  BOSS_HP_BAR_WIDTH,
  BOSS_HP_BAR_HEIGHT,
  BOSS_HP_BAR_Y,
} from "../constants";
import { EventBus } from "../utils/EventBus";

export class HUD extends Container {
  // Top bar Pills
  private distanceText: Text;
  private killText: Text;
  private scrapText: Text;

  // XP bar (bottom)
  private xpBarBg: Graphics;
  private xpBarFill: Graphics;
  private levelText: Text;

  // Boss HP bar (top center)
  private bossHpContainer: Container;
  private bossHpBg: Graphics;
  private bossHpFill: Graphics;
  private bossNameText: Text;

  // Weapons Inventory Dock
  private weaponsContainer: Container;

  // Damage numbers (Pooled)
  private damageNumbersContainer: Container;
  private damageNumbers: DamageNumber[] = [];
  private damageNumberPool: DamageNumber[] = [];

  // Active Buffs Dock (Below weapons dock)
  private buffsContainer: Container;

  // Pickup Toasts
  private pickupToasts: PickupToast[] = [];

  constructor() {
    super();

    this.damageNumbersContainer = new Container();
    this.damageNumbersContainer.eventMode = "none";
    this.addChild(this.damageNumbersContainer);

    // ── 1. Distance Pill (Top Left - Radiant Cyan) ──
    const distPill = new Graphics();
    distPill.roundRect(14, 16, 126, 38, 19).fill(0x0369a1);
    distPill
      .roundRect(14, 14, 126, 38, 19)
      .fill(0x0ea5e9)
      .stroke({ color: 0xffffff, width: 2.5 });
    distPill
      .roundRect(22, 17, 110, 14, 7)
      .fill({ color: 0xffffff, alpha: 0.35 });
    this.addChild(distPill);

    this.distanceText = new Text({
      text: "📏 0 m",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 17,
        fill: 0xffffff,
        fontWeight: "900",
        stroke: { color: 0x0369a1, width: 3 },
      },
    });
    this.distanceText.anchor.set(0, 0.5);
    this.distanceText.x = 24;
    this.distanceText.y = 33;
    this.addChild(this.distanceText);

    // ── 2. Kills Pill (Top Right - Bright Crimson / Ruby) ──
    const killPill = new Graphics();
    killPill.roundRect(GAME_WIDTH - 134, 16, 120, 38, 19).fill(0xbe123c);
    killPill
      .roundRect(GAME_WIDTH - 134, 14, 120, 38, 19)
      .fill(0xf43f5e)
      .stroke({ color: 0xffffff, width: 2.5 });
    killPill
      .roundRect(GAME_WIDTH - 126, 17, 104, 14, 7)
      .fill({ color: 0xffffff, alpha: 0.35 });
    this.addChild(killPill);

    this.killText = new Text({
      text: "💀 0",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 17,
        fill: 0xffffff,
        fontWeight: "900",
        stroke: { color: 0x9f1239, width: 3 },
      },
    });
    this.killText.anchor.set(0.5);
    this.killText.x = GAME_WIDTH - 74;
    this.killText.y = 33;
    this.addChild(this.killText);

    // ── 3. Scrap Pill (Below Kills - Sunburst Gold) ──
    const scrapPill = new Graphics();
    scrapPill.roundRect(GAME_WIDTH - 124, 58, 110, 28, 14).fill(0xb45309);
    scrapPill
      .roundRect(GAME_WIDTH - 124, 56, 110, 28, 14)
      .fill(0xf59e0b)
      .stroke({ color: 0xffffff, width: 2 });
    scrapPill
      .roundRect(GAME_WIDTH - 118, 58, 98, 10, 5)
      .fill({ color: 0xffffff, alpha: 0.4 });
    this.addChild(scrapPill);

    this.scrapText = new Text({
      text: "🔩 0",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 15,
        fill: 0xffffff,
        fontWeight: "900",
        stroke: { color: 0x78350f, width: 2.5 },
      },
    });
    this.scrapText.anchor.set(0.5);
    this.scrapText.x = GAME_WIDTH - 69;
    this.scrapText.y = 70;
    this.addChild(this.scrapText);

    // ── 4. XP Bar (Bottom - Bright Clean Frame) ──
    const xpY = GAME_HEIGHT - 34;
    const xpBarW = GAME_WIDTH - 150;

    // Shadow & Frame
    this.xpBarBg = new Graphics();
    this.xpBarBg.roundRect(110, xpY + 2, xpBarW, 20, 10).fill(0x1e293b);
    this.xpBarBg
      .roundRect(110, xpY, xpBarW, 20, 10)
      .fill(0xffffff)
      .stroke({ color: 0x0284c7, width: 2.5 });
    this.addChild(this.xpBarBg);

    this.xpBarFill = new Graphics();
    this.addChild(this.xpBarFill);

    // Level Pill (Royal Blue & White)
    const levelBadge = new Graphics();
    levelBadge.roundRect(16, xpY - 2, 84, 26, 13).fill(0x1d4ed8);
    levelBadge
      .roundRect(16, xpY - 4, 84, 26, 13)
      .fill(0x3b82f6)
      .stroke({ color: 0xffffff, width: 2.5 });
    this.addChild(levelBadge);

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
    this.levelText.x = 58;
    this.levelText.y = xpY + 9;
    this.addChild(this.levelText);

    // ── 5. Weapons Tray (Top Center Dock - Compact & Isolated) ──
    this.weaponsContainer = new Container();
    this.weaponsContainer.y = 14;
    this.addChild(this.weaponsContainer);

    // ── 6. Active Buffs Container (Under weapons tray in center gap) ──
    this.buffsContainer = new Container();
    this.buffsContainer.y = 56;
    this.addChild(this.buffsContainer);

    // ── 7. Boss HP Bar (Top Center Overlay) ──
    this.bossHpContainer = new Container();
    this.bossHpContainer.y = BOSS_HP_BAR_Y;
    this.bossHpContainer.visible = false;
    this.addChild(this.bossHpContainer);

    this.bossHpBg = new Graphics();
    this.bossHpBg
      .roundRect(
        -BOSS_HP_BAR_WIDTH / 2,
        0,
        BOSS_HP_BAR_WIDTH,
        BOSS_HP_BAR_HEIGHT,
        10,
      )
      .fill(0x450a0a)
      .stroke({ color: 0xffffff, width: 3 });
    this.bossHpContainer.addChild(this.bossHpBg);

    this.bossHpFill = new Graphics();
    this.bossHpContainer.addChild(this.bossHpFill);

    this.bossNameText = new Text({
      text: "👹 BOSS: TITAN SA MẠC",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 16,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x991b1b, width: 3 },
      },
    });
    this.bossNameText.anchor.set(0.5);
    this.bossNameText.y = BOSS_HP_BAR_HEIGHT / 2;
    this.bossHpContainer.addChild(this.bossNameText);

    this.bossHpContainer.x = GAME_WIDTH / 2;

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

  /** Display active buff badges with live timers in center gap */
  updateBuffs(rapidTimer: number, invincibleTimer: number) {
    this.buffsContainer.removeChildren();

    const activeBuffs: { icon: string; label: string; timer: number; color: number; bg: number }[] = [];
    if (rapidTimer > 0) {
      activeBuffs.push({
        icon: "⚡",
        label: `CUỒNG NỘ ${rapidTimer.toFixed(1)}s`,
        timer: rapidTimer,
        color: 0xf59e0b,
        bg: 0x78350f,
      });
    }
    if (invincibleTimer > 0) {
      activeBuffs.push({
        icon: "🛡️",
        label: `BẤT TỬ ${invincibleTimer.toFixed(1)}s`,
        timer: invincibleTimer,
        color: 0x0284c7,
        bg: 0x075985,
      });
    }

    if (activeBuffs.length === 0) return;

    const badgeW = 135;
    const badgeH = 26;
    const gap = 8;
    const totalW = activeBuffs.length * badgeW + (activeBuffs.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2;

    for (let i = 0; i < activeBuffs.length; i++) {
      const b = activeBuffs[i];
      const cont = new Container();
      cont.x = startX + i * (badgeW + gap);

      const gfx = new Graphics();
      gfx.roundRect(0, 2, badgeW, badgeH, 13).fill(b.bg);
      gfx.roundRect(0, 0, badgeW, badgeH, 13)
        .fill(b.color)
        .stroke({ color: 0xffffff, width: 2 });
      gfx.roundRect(4, 2, badgeW - 8, 9, 4.5).fill({ color: 0xffffff, alpha: 0.35 });
      cont.addChild(gfx);

      const txt = new Text({
        text: `${b.icon} ${b.label}`,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 12,
          fontWeight: "900",
          fill: 0xffffff,
          stroke: { color: b.bg, width: 2 },
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
    this.distanceText.text = `📏 ${Math.floor(distanceMeters)} m`;
  }

  updateKills(kills: number) {
    this.killText.text = `💀 ${kills}`;
  }

  updateScrap(scrap: number) {
    this.scrapText.text = `🔩 ${scrap}`;
  }

  updateXp(ratio: number, level: number) {
    this.xpBarFill.clear();
    const xpY = GAME_HEIGHT - 34;
    const maxW = GAME_WIDTH - 150 - 4;
    const w = maxW * Math.min(1, Math.max(0, ratio));

    // Gradient Vibrant XP bar
    this.xpBarFill.roundRect(112, xpY + 2, w, 16, 8).fill(0x06b6d4);
    this.xpBarFill
      .roundRect(112, xpY + 2, w, 6, 3)
      .fill({ color: 0xffffff, alpha: 0.5 });

    this.levelText.text = `CẤP ${level}`;
  }

  /** Update equipped weapons dock tray (Compact 66px width, perfectly centered with zero overlap) */
  updateWeapons(weaponLevels: Record<string, number>) {
    this.weaponsContainer.removeChildren();

    const slotTypes = [
      {
        id: "machine_gun",
        icon: "🔫",
        label: "Súng Máy",
        color: 0xef4444,
        bg: 0xfef2f2,
      },
      {
        id: "flamethrower",
        icon: "🔥",
        label: "Phun Lửa",
        color: 0xf97316,
        bg: 0xfff7ed,
      },
      {
        id: "tesla",
        icon: "⚡",
        label: "Tesla",
        color: 0x0284c7,
        bg: 0xf0f9ff,
      },
      {
        id: "shield",
        icon: "🛡️",
        label: "Khiên",
        color: 0x22c55e,
        bg: 0xf0fdf4,
      },
    ];

    const slotW = 66;
    const slotH = 36;
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
        // Bright 3D Equipped Card
        bg.roundRect(0, 3, slotW, slotH, 8).fill(0x0f172a, 0.2);
        bg.roundRect(0, 0, slotW, slotH, 8)
          .fill(slot.bg)
          .stroke({ color: slot.color, width: 2 });
      } else {
        // Locked slot
        bg.roundRect(0, 0, slotW, slotH, 8)
          .fill(0xffffff, 0.4)
          .stroke({ color: 0x94a3b8, width: 1.5 });
      }
      card.addChild(bg);

      const icon = new Text({
        text: slot.icon,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 16,
        },
      });
      icon.anchor.set(0, 0.5);
      icon.x = 6;
      icon.y = slotH / 2;
      icon.alpha = isOwned ? 1 : 0.35;
      card.addChild(icon);

      // Star Badge / Level Text (e.g. ⭐4 or —)
      const badge = new Text({
        text: isOwned ? `⭐${lvl}` : "—",
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 12,
          fill: isOwned ? 0xca8a04 : 0x94a3b8,
          fontWeight: "900",
        },
      });
      badge.anchor.set(1, 0.5);
      badge.x = slotW - 6;
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
    const maxW = BOSS_HP_BAR_WIDTH - 6;
    const w = maxW * Math.max(0, Math.min(1, ratio));
    this.bossHpFill.roundRect(
      (GAME_WIDTH - BOSS_HP_BAR_WIDTH) / 2 + 3,
      BOSS_HP_BAR_Y + 3,
      w,
      BOSS_HP_BAR_HEIGHT - 6,
      6,
    );
    this.bossHpFill.fill(0xef4444);
    this.bossHpFill
      .roundRect(
        (GAME_WIDTH - BOSS_HP_BAR_WIDTH) / 2 + 3,
        BOSS_HP_BAR_Y + 3,
        w,
        (BOSS_HP_BAR_HEIGHT - 6) * 0.4,
        4,
      )
      .fill({ color: 0xffffff, alpha: 0.3 });
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
    // Throttle minor burn/shock ticks if screen is already saturated with numbers
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
        // Pop in scale
        const s = progress / 0.15;
        toast.scale.set(0.8 + 0.25 * s);
        toast.alpha = s;
      } else if (progress > 0.75) {
        // Fade out
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
    this.y = y;
    this.life = 1.3;
    this.maxLife = 1.3;
    this.eventMode = "none";

    const badgeW = 200;
    const badgeH = 34;

    const bg = new Graphics();
    bg.roundRect(-badgeW / 2, -badgeH / 2 + 3, badgeW, badgeH, 17).fill(0x0f172a);
    bg.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 17)
      .fill(0x1e293b)
      .stroke({ color: color, width: 2 });
    this.addChild(bg);

    const label = new Text({
      text: `${icon} ${text}`,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 16,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 3 },
        letterSpacing: 1,
      },
    });
    label.anchor.set(0.5);
    label.y = 0;
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
