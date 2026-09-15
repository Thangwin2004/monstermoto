import { Container, Graphics, Text } from "pixi.js";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  BOSS_HP_BAR_WIDTH,
  BOSS_HP_BAR_Y,
} from "../constants";
import { EventBus } from "../utils/EventBus";
import { HyperCircleButton } from "./HyperButton";
import { VectorIcons } from "./VectorIcons";
import { SaveManager } from "../utils/SaveManager";
import { I18n } from "../utils/I18n";

interface WeaponSlotUI {
  id: string;
  card: Container;
  bg: Graphics;
  iconGfx: Graphics;
  badge: Text;
  strokeColor: number;
  lastLvl: number;
}

export class HUD extends Container {
  // Top Unified Header Bar
  private headerBg: Graphics;

  // Left Stats (Distance & Scrap)
  private distanceText: Text;
  private scrapText: Text;
  private scrapPill: Container;
  private lastScrap: number = -1;
  private currentDistance: number = 0;
  private lastIntDistance: number = -1;

  // Right Stats (Kills & Settings)
  private killText: Text;
  private killPill: Container;
  private lastKills: number = -1;
  private currentKills: number = 0;
  private settingsBtn: HyperCircleButton;

  // Center Weapons Dock (Zero Allocation)
  private weaponsContainer: Container;
  private weaponSlots: WeaponSlotUI[] = [];
  private lastWeaponLevels: Record<string, number> = {};

  // Active Buffs Dock (Zero Allocation)
  private buffsContainer: Container;
  private rapidBadge!: Container;
  private rapidText!: Text;
  private lastRapidSec: string = "";
  private invincibleBadge!: Container;
  private invincibleText!: Text;
  private lastInvincibleSec: string = "";

  // Boss HP Bar
  private bossHpContainer: Container;
  private bossHpBg: Graphics;
  private bossHpFill: Graphics;
  private bossNameText: Text;

  // XP Bar (Bottom)
  private bottomBarContainer: Container;
  private xpBarBg: Graphics;
  private xpBarFill: Graphics;
  private levelText: Text;
  private levelBadge: Container;
  private currentLevel: number = 1;
  private currentXpRatio: number = 0;
  private lastLevel: number = -1;
  private lastXpWidth: number = -1;

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

    // Pre-populate pool with 24 items to avoid runtime allocations
    for (let i = 0; i < 24; i++) {
      const dn = new DamageNumber();
      dn.visible = false;
      this.damageNumbersContainer.addChild(dn);
      this.damageNumberPool.push(dn);
    }

    // React immediately when graphics setting is changed
    EventBus.on("settings:changed", (data) => {
      if (data.lowParticles !== undefined) {
        if (data.lowParticles) {
          this.clearDamageNumbers();
          this.damageNumbersContainer.visible = false;
        } else {
          this.damageNumbersContainer.visible = true;
        }
      }
    });

    if (SaveManager.getSettings().lowParticles) {
      this.damageNumbersContainer.visible = false;
    }

    // ── 2. Unified Frosted Top Header Bar (Height 112px) ──
    this.headerBg = new Graphics();
    this.headerBg
      .rect(0, 0, GAME_WIDTH, 112)
      .fill({ color: 0x090a0f, alpha: 0.96 });
    this.headerBg.rect(0, 110, GAME_WIDTH, 2).fill(0x334155);
    this.addChild(this.headerBg);

    // ── 3. Row 1: Left Stats (Distance & Scrap Side-by-Side, y = 25) ──
    // Distance Capsule (x = 76, y = 25, w = 124, h = 36)
    const distContainer = new Container();
    distContainer.x = 76;
    distContainer.y = 25;
    this.addChild(distContainer);

    const distBg = new Graphics();
    distBg
      .roundRect(-62, -18, 124, 36, 12)
      .fill(0x1e293b)
      .stroke({ color: 0x38bdf8, width: 2.2 });
    distContainer.addChild(distBg);

    this.distanceText = new Text({
      text: I18n.t("hud.distance", { value: 0 }),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 18,
        fontWeight: "900",
        fill: 0x38bdf8,
      },
    });
    this.distanceText.anchor.set(0.5);
    this.distanceText.x = 0;
    this.distanceText.y = 0;
    distContainer.addChild(this.distanceText);

    // Scrap Capsule (x = 194, y = 25, w = 100, h = 36)
    this.scrapPill = new Container();
    this.scrapPill.x = 194;
    this.scrapPill.y = 25;
    this.addChild(this.scrapPill);

    const scrapBg = new Graphics();
    scrapBg
      .roundRect(-50, -18, 100, 36, 12)
      .fill(0x1e293b)
      .stroke({ color: 0xfacc15, width: 2.2 });
    this.scrapPill.addChild(scrapBg);

    this.scrapText = new Text({
      text: I18n.t("hud.scrap", { value: 0 }),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 18,
        fontWeight: "900",
        fill: 0xfacc15,
      },
    });
    this.scrapText.anchor.set(0.5);
    this.scrapText.x = 0;
    this.scrapText.y = 0;
    this.scrapPill.addChild(this.scrapText);

    // ── 4. Row 1: Right Controls (Kills & Settings, y = 25) ──
    // Kills Capsule (x = 604, y = 25, w = 96, h = 36)
    this.killPill = new Container();
    this.killPill.x = 604;
    this.killPill.y = 25;
    this.addChild(this.killPill);

    const killBg = new Graphics();
    killBg
      .roundRect(-48, -18, 96, 36, 12)
      .fill(0x1e293b)
      .stroke({ color: 0xf43f5e, width: 2.2 });
    this.killPill.addChild(killBg);

    this.killText = new Text({
      text: I18n.t("hud.kills", { value: 0 }),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 18,
        fontWeight: "900",
        fill: 0xf43f5e,
      },
    });
    this.killText.anchor.set(0.5);
    this.killText.x = 0;
    this.killText.y = 0;
    this.killPill.addChild(this.killText);

    // Settings Button (x = 684, y = 25, radius = 21)
    this.settingsBtn = new HyperCircleButton({
      vectorIcon: "gear",
      radius: 21,
      color: 0x0ea5e9,
      shadowColor: 0x0369a1,
      strokeWidth: 3,
      onClick: () => {
        if (onSettingsClick) onSettingsClick();
      },
    });
    this.settingsBtn.x = 684;
    this.settingsBtn.y = 25;
    this.addChild(this.settingsBtn);

    // ── 5. Row 2: Tactical Weapons Arsenal Dock (Centered at y = 54) ──
    this.weaponsContainer = new Container();
    this.weaponsContainer.y = 54;
    this.addChild(this.weaponsContainer);
    this.initWeaponsTray();

    // ── 6. Active Buffs Notification Strip (Floating cleanly below header at y = 122) ──
    this.buffsContainer = new Container();
    this.buffsContainer.y = 122;
    this.addChild(this.buffsContainer);
    this.initBuffsDock();

    // ── 7. Boss HP Bar (Top Center Overlay) ──
    this.bossHpContainer = new Container();
    this.bossHpContainer.y = BOSS_HP_BAR_Y;
    this.bossHpContainer.visible = false;
    this.addChild(this.bossHpContainer);

    this.bossHpBg = new Graphics();
    this.bossHpBg
      .roundRect(-BOSS_HP_BAR_WIDTH / 2, 0, BOSS_HP_BAR_WIDTH, 28, 14)
      .fill(0x450a0a)
      .stroke({ color: 0xffffff, width: 3.5 });
    this.bossHpContainer.addChild(this.bossHpBg);

    this.bossHpFill = new Graphics();
    this.bossHpContainer.addChild(this.bossHpFill);

    this.bossNameText = new Text({
      text: I18n.t("hud.bossName"),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 18,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x991b1b, width: 3.5 },
      },
    });
    this.bossNameText.anchor.set(0.5);
    this.bossNameText.y = 14;
    this.bossHpContainer.addChild(this.bossNameText);

    this.bossHpContainer.x = GAME_WIDTH / 2;

    // ── 8. XP Bar (Bottom - Grouped in container for responsive height) ──
    this.bottomBarContainer = new Container();
    this.bottomBarContainer.y = GAME_HEIGHT - 46;
    this.addChild(this.bottomBarContainer);

    const xpBarW = GAME_WIDTH - 162;

    this.xpBarBg = new Graphics();
    this.xpBarBg.roundRect(118, 2, xpBarW, 28, 14).fill(0x0f172a);
    this.xpBarBg
      .roundRect(118, 0, xpBarW, 28, 14)
      .fill(0x1e293b)
      .stroke({ color: 0x38bdf8, width: 2.5 });
    this.bottomBarContainer.addChild(this.xpBarBg);

    this.xpBarFill = new Graphics();
    this.bottomBarContainer.addChild(this.xpBarFill);

    // Level Pill (w = 94, h = 36)
    this.levelBadge = new Container();
    this.levelBadge.x = 16 + 47;
    this.levelBadge.y = 14;
    this.bottomBarContainer.addChild(this.levelBadge);

    const lvlShadow = new Graphics();
    lvlShadow.roundRect(-47, -18 + 3, 94, 36, 18).fill(0x0369a1);
    this.levelBadge.addChild(lvlShadow);

    const lvlBody = new Graphics();
    lvlBody
      .roundRect(-47, -18, 94, 36, 18)
      .fill(0x0ea5e9)
      .stroke({ color: 0xffffff, width: 2.5 });
    this.levelBadge.addChild(lvlBody);

    this.levelText = new Text({
      text: I18n.t("hud.level", { value: 1 }),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 17,
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

    // Language changed listener
    EventBus.on("language:changed", () => {
      this.distanceText.text = I18n.t("hud.distance", {
        value: Math.floor(this.currentDistance),
      });
      this.scrapText.text = I18n.t("hud.scrap", {
        value: SaveManager.getScrap(),
      });
      this.killText.text = I18n.t("hud.kills", { value: this.currentKills });
      this.levelText.text = I18n.t("hud.level", { value: this.currentLevel });
      this.bossNameText.text = I18n.t("hud.bossName");
      this.updateWeapons(this.lastWeaponLevels);
    });
  }

  /**
   * Adapts the bottom XP bar to screen height without letterboxing.
   */
  resize(_width: number, height: number) {
    this.bottomBarContainer.y = height - 46;
  }

  private initWeaponsTray() {
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
        color: 0xf59e0b,
        strokeColor: 0xfbbf24,
        drawIcon: (g, s) => {
          g.roundRect(-s * 0.4, -s * 0.12, s * 0.8, s * 0.24, 2).fill(0xffffff);
          g.rect(-s * 0.1, -s * 0.22, s * 0.25, s * 0.44).fill(0xd97706);
        },
      },
      {
        id: "rocket",
        label: "Tên Lửa",
        color: 0xf97316,
        strokeColor: 0xfb923c,
        drawIcon: (g, s) => {
          g.poly([
            0,
            -s * 0.42,
            s * 0.22,
            -s * 0.1,
            s * 0.22,
            s * 0.25,
            s * 0.35,
            s * 0.4,
            -s * 0.35,
            s * 0.4,
            -s * 0.22,
            s * 0.25,
            -s * 0.22,
            -s * 0.1,
          ]).fill(0xffffff);
        },
      },
      {
        id: "laser",
        label: "Pháo Laser",
        color: 0x0284c7,
        strokeColor: 0x38bdf8,
        drawIcon: (g, s) => {
          VectorIcons.drawLightning(g, s * 0.9, 0xffffff);
        },
      },
      {
        id: "shield",
        label: "Khiên",
        color: 0x10b981,
        strokeColor: 0x34d399,
        drawIcon: (g, s) => {
          g.poly([
            0,
            -s * 0.38,
            s * 0.38,
            -s * 0.2,
            s * 0.32,
            s * 0.28,
            0,
            s * 0.42,
            -s * 0.32,
            s * 0.28,
            -s * 0.38,
            -s * 0.2,
          ]).fill(0xffffff);
        },
      },
    ];

    const slotW = 88;
    const slotH = 48;
    const gap = 10;
    const totalW = slotTypes.length * slotW + (slotTypes.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2;

    this.weaponSlots = [];

    for (let i = 0; i < slotTypes.length; i++) {
      const slotDef = slotTypes[i];
      const card = new Container();
      card.x = startX + i * (slotW + gap);

      const bg = new Graphics();
      card.addChild(bg);

      const iconGfx = new Graphics();
      iconGfx.x = 24;
      iconGfx.y = slotH / 2;
      slotDef.drawIcon(iconGfx, 24);
      card.addChild(iconGfx);

      const badge = new Text({
        text: "—",
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 17,
          fill: 0x64748b,
          fontWeight: "900",
        },
      });
      badge.anchor.set(1, 0.5);
      badge.x = slotW - 8;
      badge.y = slotH / 2;
      card.addChild(badge);

      this.weaponsContainer.addChild(card);

      const slotUI: WeaponSlotUI = {
        id: slotDef.id,
        card,
        bg,
        iconGfx,
        badge,
        strokeColor: slotDef.strokeColor,
        lastLvl: -1,
      };
      this.weaponSlots.push(slotUI);
      this.drawSlotBg(slotUI, false);
    }
  }

  private drawSlotBg(slot: WeaponSlotUI, isOwned: boolean) {
    const slotW = 88;
    const slotH = 48;
    slot.bg.clear();
    if (isOwned) {
      slot.bg
        .roundRect(0, 0, slotW, slotH, 10)
        .fill(0x1e293b)
        .stroke({ color: slot.strokeColor, width: 2.2 });
      slot.bg
        .roundRect(3, 2, slotW - 6, slotH * 0.36, 5)
        .fill({ color: 0xffffff, alpha: 0.18 });
    } else {
      slot.bg
        .roundRect(0, 0, slotW, slotH, 10)
        .fill({ color: 0x0f172a, alpha: 0.75 })
        .stroke({ color: 0x475569, width: 1.8 });
    }
  }

  private initBuffsDock() {
    // Rapid Fire Badge
    this.rapidBadge = new Container();
    this.rapidBadge.visible = false;
    const rapidBg = new Graphics();
    rapidBg
      .roundRect(0, 0, 240, 42, 18)
      .fill(0x0f172a)
      .stroke({ color: 0xfbbf24, width: 2.5 });
    rapidBg
      .roundRect(4, 2, 232, 14, 7)
      .fill({ color: 0xd97706, alpha: 0.4 });
    this.rapidBadge.addChild(rapidBg);

    this.rapidText = new Text({
      text: "",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 16,
        fontWeight: "900",
        fill: 0xfbbf24,
      },
    });
    this.rapidText.anchor.set(0.5);
    this.rapidText.x = 120;
    this.rapidText.y = 21;
    this.rapidBadge.addChild(this.rapidText);
    this.buffsContainer.addChild(this.rapidBadge);

    // Invincible Badge
    this.invincibleBadge = new Container();
    this.invincibleBadge.visible = false;
    const invBg = new Graphics();
    invBg
      .roundRect(0, 0, 240, 42, 18)
      .fill(0x0f172a)
      .stroke({ color: 0x38bdf8, width: 2.5 });
    invBg
      .roundRect(4, 2, 232, 14, 7)
      .fill({ color: 0x0284c7, alpha: 0.4 });
    this.invincibleBadge.addChild(invBg);

    this.invincibleText = new Text({
      text: "",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 16,
        fontWeight: "900",
        fill: 0x38bdf8,
      },
    });
    this.invincibleText.anchor.set(0.5);
    this.invincibleText.x = 120;
    this.invincibleText.y = 21;
    this.invincibleBadge.addChild(this.invincibleText);
    this.buffsContainer.addChild(this.invincibleBadge);
  }

  /** Zero-allocation active buff badges with cached string diffing */
  updateBuffs(rapidTimer: number, invincibleTimer: number) {
    const hasRapid = rapidTimer > 0;
    const hasInv = invincibleTimer > 0;

    if (!hasRapid && !hasInv) {
      if (this.rapidBadge.visible) this.rapidBadge.visible = false;
      if (this.invincibleBadge.visible) this.invincibleBadge.visible = false;
      this.lastRapidSec = "";
      this.lastInvincibleSec = "";
      return;
    }

    const badgeW = 240;
    const gap = 12;
    const activeCount = (hasRapid ? 1 : 0) + (hasInv ? 1 : 0);
    const totalW = activeCount * badgeW + (activeCount - 1) * gap;
    let curX = (GAME_WIDTH - totalW) / 2;

    if (hasRapid) {
      this.rapidBadge.visible = true;
      this.rapidBadge.x = curX;
      curX += badgeW + gap;

      const secStr = rapidTimer.toFixed(1);
      if (secStr !== this.lastRapidSec) {
        this.lastRapidSec = secStr;
        this.rapidText.text = I18n.t("buff.rapid", { sec: secStr });
      }
    } else {
      this.rapidBadge.visible = false;
      this.lastRapidSec = "";
    }

    if (hasInv) {
      this.invincibleBadge.visible = true;
      this.invincibleBadge.x = curX;

      const secStr = invincibleTimer.toFixed(1);
      if (secStr !== this.lastInvincibleSec) {
        this.lastInvincibleSec = secStr;
        this.invincibleText.text = I18n.t("buff.invincible", { sec: secStr });
      }
    } else {
      this.invincibleBadge.visible = false;
      this.lastInvincibleSec = "";
    }
  }

  showPickupToast(text: string, color: number = 0xf59e0b, icon: string = "🎁") {
    const toast = new PickupToast(GAME_WIDTH / 2, 140, text, color, icon);
    this.addChild(toast);
    this.pickupToasts.push(toast);
  }

  updateDistance(distanceMeters: number) {
    this.currentDistance = distanceMeters;
    const intDist = Math.floor(distanceMeters);
    if (intDist !== this.lastIntDistance) {
      this.lastIntDistance = intDist;
      this.distanceText.text = I18n.t("hud.distance", { value: intDist });
    }
  }

  updateKills(kills: number) {
    this.currentKills = kills;
    if (kills !== this.lastKills) {
      if (kills > this.lastKills && this.lastKills !== -1) {
        this.killPill.scale.set(1.2);
      }
      this.lastKills = kills;
      this.killText.text = I18n.t("hud.kills", { value: kills });
    }
  }

  updateScrap(scrap: number) {
    if (scrap !== this.lastScrap) {
      if (scrap > this.lastScrap && this.lastScrap !== -1) {
        this.scrapPill.scale.set(1.22);
      }
      this.lastScrap = scrap;
      this.scrapText.text = I18n.t("hud.scrap", { value: scrap });
    }
  }

  updateXp(ratio: number, level: number) {
    this.currentLevel = level;
    this.currentXpRatio = ratio;

    const maxW = GAME_WIDTH - 162 - 4;
    const w = Math.round(maxW * Math.min(1, Math.max(0, ratio)));

    if (w !== this.lastXpWidth) {
      this.lastXpWidth = w;
      this.xpBarFill.clear();
      this.xpBarFill.roundRect(120, 2, w, 24, 12).fill(0x0284c7);
      this.xpBarFill
        .roundRect(120, 2, w, 8, 4)
        .fill({ color: 0xffffff, alpha: 0.45 });
    }

    if (level !== this.lastLevel) {
      this.lastLevel = level;
      this.levelText.text = I18n.t("hud.level", { value: level });
    }
  }

  /** Zero-allocation equipped weapons tray with level diff checking */
  updateWeapons(weaponLevels: Record<string, number>) {
    this.lastWeaponLevels = weaponLevels;

    for (const slot of this.weaponSlots) {
      const lvl = weaponLevels[slot.id] || 0;
      if (lvl === slot.lastLvl) continue;

      const wasOwned = slot.lastLvl > 0;
      const isOwned = lvl > 0;
      slot.lastLvl = lvl;

      if (wasOwned !== isOwned) {
        this.drawSlotBg(slot, isOwned);
        slot.iconGfx.alpha = isOwned ? 1 : 0.55;
      }

      slot.badge.text = isOwned ? `★${lvl}` : "—";
      slot.badge.style.fill = isOwned ? 0xfacc15 : 0x64748b;
    }
  }

  showBossHp(name?: string) {
    this.bossHpContainer.visible = true;
    this.bossNameText.text =
      name && name !== "KẺ THU THẬP" ? name : I18n.t("hud.bossName");
  }

  updateBossHp(ratio: number) {
    this.bossHpFill.clear();
    const maxW = BOSS_HP_BAR_WIDTH - 8;
    const w = maxW * Math.max(0, Math.min(1, ratio));
    this.bossHpFill.roundRect(-BOSS_HP_BAR_WIDTH / 2 + 4, 4, w, 20, 10);
    this.bossHpFill.fill(0xef4444);
    this.bossHpFill
      .roundRect(-BOSS_HP_BAR_WIDTH / 2 + 4, 4, w, 8, 4)
      .fill({ color: 0xffffff, alpha: 0.35 });
  }

  hideBossHp() {
    this.bossHpContainer.visible = false;
  }

  private clearDamageNumbers() {
    for (const dn of this.damageNumbers) {
      dn.visible = false;
      this.damageNumberPool.push(dn);
    }
    this.damageNumbers.length = 0;
  }

  spawnDamageNumber(
    x: number,
    y: number,
    amount: number,
    crit?: boolean,
    heal?: boolean,
    status?: "burn" | "shock" | "crit",
  ) {
    if (SaveManager.getSettings().lowParticles) return;

    // Hard limit: max 24 concurrent damage numbers to prevent runaway texture allocations
    if (this.damageNumbers.length >= 24) {
      const oldest = this.damageNumbers.shift();
      if (oldest) {
        oldest.visible = false;
        this.damageNumberPool.push(oldest);
      }
    }

    let dn = this.damageNumberPool.pop();
    if (!dn) {
      dn = new DamageNumber();
      this.damageNumbersContainer.addChild(dn);
    }
    dn.reset(x, y, amount, crit, heal, status);
    dn.visible = true;
    this.damageNumbers.push(dn);
  }

  update(dt: number) {
    const dtSec = dt * (1 / 60);

    // Animate pills bounce on update
    if (this.killPill.scale.x > 1.0) {
      const s = Math.max(1.0, this.killPill.scale.x - 1.2 * dtSec);
      this.killPill.scale.set(s);
    }
    if (this.scrapPill.scale.x > 1.0) {
      const s = Math.max(1.0, this.scrapPill.scale.x - 1.2 * dtSec);
      this.scrapPill.scale.set(s);
    }

    // Damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.life -= dtSec;
      dn.y -= 45 * dtSec;

      const progress = 1 - dn.life / dn.maxLife;
      if (progress > 0.6) {
        dn.alpha = (1 - progress) / 0.4;
      }

      if (dn.life <= 0) {
        dn.visible = false;
        this.damageNumbers.splice(i, 1);
        this.damageNumberPool.push(dn);
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
        toast.scale.set(1.02);
        toast.alpha = 1;
      }

      if (toast.life <= 0) {
        this.removeChild(toast);
        toast.destroy({ children: true });
        this.pickupToasts.splice(i, 1);
      }
    }
  }
}

/**
 * Toast notification with auto-expanded background width (never overflows)
 */
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
    this.life = 1.4;
    this.maxLife = 1.4;
    this.eventMode = "none";

    const label = new Text({
      text: `${icon} ${text}`,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 19,
        fontWeight: "900",
        fill: 0xffffff,
        letterSpacing: 0.8,
        wordWrap: true,
        wordWrapWidth: 540,
        align: "center",
      },
    });

    const badgeW = Math.max(340, Math.min(680, label.width + 64));
    const badgeH = Math.max(54, label.height + 24);

    const bg = new Graphics();
    bg.roundRect(-badgeW / 2, 0, badgeW, badgeH, badgeH / 2)
      .fill(0x0f172a)
      .stroke({ color: color, width: 3 });
    bg.roundRect(-badgeW / 2 + 8, 4, badgeW - 16, badgeH * 0.35, 10).fill({
      color: 0xffffff,
      alpha: 0.2,
    });
    this.addChild(bg);

    label.anchor.set(0.5);
    label.x = 0;
    label.y = badgeH / 2;
    this.addChild(label);
  }
}

class DamageNumber extends Text {
  public life: number = 0;
  public maxLife: number = 0.42;

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
    let baseScale = 1.0;

    if (status === "burn") {
      color = 0xff5500;
      prefix = "🔥 ";
      baseScale = 0.85;
    } else if (status === "shock") {
      color = 0x00e5ff;
      prefix = "⚡ ";
      baseScale = 0.95;
    } else if (crit || status === "crit") {
      color = 0xfacc15;
      prefix = "💥 ";
      baseScale = 1.25;
    } else if (heal) {
      color = 0x22c55e;
      prefix = "+";
      baseScale = 0.95;
    }

    this.text = `${prefix}${Math.round(amount)}`;
    this.style.fill = color;
    // Scale on GPU vertex transform instead of mutating style.fontSize (prevents canvas backing store churning)
    this.x = x + (Math.random() - 0.5) * 16;
    this.y = y;
    this.scale.set(crit ? baseScale * 1.2 : baseScale);
    this.alpha = 1;
    this.life = 0.42;
    this.maxLife = 0.42;
  }
}
