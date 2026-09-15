import { Container, FederatedPointerEvent, Graphics, Text } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { SaveManager, GARAGE_UPGRADE_CONFIGS } from "../utils/SaveManager";
import { AudioMixer } from "../utils/AudioMixer";
import { HyperCircleButton } from "./HyperButton";
import { VectorIcons } from "./VectorIcons";
import { I18n } from "../utils/I18n";
import { EventBus } from "../utils/EventBus";
import { SceneManager } from "../scenes/SceneManager";

export class GarageModal extends Container {
  private modalHeight: number;
  private headerContainer!: Container;
  private titleText!: Text;
  private wrenchIcon!: Container;
  private scrapText!: Text;
  private scrollWrapper!: Container;
  private scrollContainer!: Container;
  private scrollMask!: Graphics;
  private scrollbarGfx!: Graphics;
  private onCloseCallback: () => void;

  // Scroll state
  private scrollY: number = 0;
  private minScrollY: number = 0;
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartScrollY: number = 0;
  private hasDragged: boolean = false;

  constructor(onClose: () => void, customHeight?: number) {
    super();
    this.onCloseCallback = onClose;
    const virtualH = SceneManager.getVirtualSize?.()?.height ?? GAME_HEIGHT;
    this.modalHeight = Math.max(GAME_HEIGHT, virtualH, customHeight ?? 0);

    this.initLayout();
  }

  public resize(_width: number, height: number) {
    this.modalHeight = Math.max(GAME_HEIGHT, height);
    this.initLayout();
  }

  private initLayout() {
    this.removeChildren();

    // 1. Full-Screen Workshop Backdrop (Oversized to guarantee zero black bars at bottom)
    const backdrop = new Graphics();
    backdrop
      .rect(
        -100,
        -100,
        GAME_WIDTH + 200,
        Math.max(3500, this.modalHeight + 600),
      )
      .fill(0x070b14);
    backdrop.eventMode = "static";
    backdrop.on("pointerdown", (e) => e.stopPropagation());
    this.addChild(backdrop);

    // Subtle dark industrial grid vignette
    const vignette = new Graphics();
    vignette.rect(0, 0, GAME_WIDTH, 140).fill({ color: 0x000000, alpha: 0.4 });
    vignette
      .rect(0, this.modalHeight - 120, GAME_WIDTH, 120)
      .fill({ color: 0x000000, alpha: 0.65 });
    this.addChild(vignette);

    // 2. Fixed Top Header Bar (Height: 146px, zero overlap)
    const headerH = 146;
    this.headerContainer = new Container();
    this.addChild(this.headerContainer);

    const headerBg = new Graphics();
    headerBg.rect(0, 0, GAME_WIDTH, headerH).fill({ color: 0x0f172a, alpha: 0.98 });
    headerBg.rect(0, headerH - 2, GAME_WIDTH, 2).fill(0x334155);
    headerBg.rect(GAME_WIDTH / 2 - 180, headerH - 2, 360, 2).fill(0xf59e0b);
    this.headerContainer.addChild(headerBg);

    // Row 1: Title & Close Button (y = 42)
    const titleRow = new Container();
    titleRow.y = 42;
    this.headerContainer.addChild(titleRow);

    this.wrenchIcon = VectorIcons.createIcon("wrench", 34, 0xf59e0b);
    titleRow.addChild(this.wrenchIcon);

    this.titleText = new Text({
      text: I18n.t("garage.title"),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 30,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x78350f, width: 5 },
        letterSpacing: 1.2,
      },
    });
    this.titleText.anchor.set(0, 0.5);
    titleRow.addChild(this.titleText);

    this.updateTitlePosition();

    // Close Button (Top-Right, easily clickable)
    const closeBtn = new HyperCircleButton({
      vectorIcon: "cross",
      radius: 27,
      color: 0xef4444,
      shadowColor: 0x991b1b,
      strokeWidth: 3.5,
      onClick: () => {
        this.destroy();
        this.onCloseCallback();
      },
    });
    closeBtn.x = GAME_WIDTH - 46;
    closeBtn.y = 42;
    this.headerContainer.addChild(closeBtn);

    // Row 2: Scrap Balance Pill (y = 100, plenty of breathing room from title row)
    const scrapPillW = 360;
    const scrapPillH = 48;
    const scrapPillY = 100;

    const scrapPill = new Graphics();
    scrapPill
      .roundRect(
        GAME_WIDTH / 2 - scrapPillW / 2,
        scrapPillY - scrapPillH / 2,
        scrapPillW,
        scrapPillH,
        scrapPillH / 2,
      )
      .fill(0x1e293b)
      .stroke({ color: 0xfacc15, width: 2.5 });
    this.headerContainer.addChild(scrapPill);

    this.scrapText = new Text({
      text: I18n.t("garage.scrap", { value: SaveManager.getScrap() }),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 24,
        fontWeight: "900",
        fill: 0xfacc15,
        letterSpacing: 1.0,
      },
    });
    this.scrapText.anchor.set(0.5);
    this.scrapText.x = GAME_WIDTH / 2;
    this.scrapText.y = scrapPillY;
    this.headerContainer.addChild(this.scrapText);

    // 3. Scrollable Cards List Area
    const listTopY = 154;
    const listBottomY = this.modalHeight - 16;
    const listH = Math.max(300, listBottomY - listTopY);
    const listW = GAME_WIDTH;

    this.scrollWrapper = new Container();
    this.scrollWrapper.x = 0;
    this.scrollWrapper.y = listTopY;
    this.addChild(this.scrollWrapper);

    this.scrollMask = new Graphics();
    this.scrollMask.rect(0, 0, listW, listH).fill(0xffffff);
    this.scrollWrapper.addChild(this.scrollMask);

    this.scrollContainer = new Container();
    this.scrollContainer.mask = this.scrollMask;
    this.scrollWrapper.addChild(this.scrollContainer);

    this.scrollbarGfx = new Graphics();
    this.scrollWrapper.addChild(this.scrollbarGfx);

    // Setup Drag & Wheel Listeners
    this.setupScrollInteraction(this.scrollWrapper, listH);

    // Render cards into scrollContainer
    this.renderUpgradeCards(listW, listH);

    // Re-render when language changes
    EventBus.on("language:changed", () => {
      this.titleText.text = I18n.t("garage.title");
      this.updateTitlePosition();
      this.scrapText.text = I18n.t("garage.scrap", {
        value: SaveManager.getScrap(),
      });
      this.renderUpgradeCards(listW, listH);
    });
  }

  private updateTitlePosition() {
    const spacing = 14;
    const totalW = 34 + spacing + this.titleText.width;
    const startX = (GAME_WIDTH - totalW) / 2;
    this.wrenchIcon.x = startX + 17;
    this.titleText.x = startX + 34 + spacing;
  }

  private setupScrollInteraction(scrollWrapper: Container, listH: number) {
    scrollWrapper.eventMode = "static";

    scrollWrapper.on("pointerdown", (e) => {
      this.isDragging = true;
      this.hasDragged = false;
      this.dragStartY = e.global.y;
      this.dragStartScrollY = this.scrollY;
    });

    const onPointerMove = (e: FederatedPointerEvent) => {
      if (!this.isDragging) return;
      const delta = e.global.y - this.dragStartY;
      if (Math.abs(delta) > 5) {
        this.hasDragged = true;
      }
      this.setScroll(this.dragStartScrollY + delta, listH);
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    scrollWrapper.on("globalpointermove", onPointerMove);
    scrollWrapper.on("pointerup", onPointerUp);
    scrollWrapper.on("pointerupoutside", onPointerUp);

    // Mouse wheel support
    const wheelHandler = (e: WheelEvent) => {
      this.setScroll(this.scrollY - e.deltaY * 0.7, listH);
    };
    window.addEventListener("wheel", wheelHandler, { passive: true });
    this.on("destroyed", () => {
      window.removeEventListener("wheel", wheelHandler);
    });
  }

  private setScroll(nextY: number, listH: number) {
    if (this.minScrollY >= 0) {
      this.scrollY = 0;
      this.scrollContainer.y = 0;
      this.scrollbarGfx.clear();
      return;
    }
    this.scrollY = Math.max(this.minScrollY, Math.min(0, nextY));
    this.scrollContainer.y = this.scrollY;
    this.updateScrollbar(listH);
  }

  private updateScrollbar(listH: number) {
    this.scrollbarGfx.clear();
    if (this.minScrollY >= 0) return;

    const contentH = Math.abs(this.minScrollY) + listH;
    if (contentH <= listH + 10) return;

    const barW = 5;
    const thumbH = Math.max(40, (listH / contentH) * listH);
    const scrollRatio = -this.scrollY / Math.abs(this.minScrollY || 1);
    const thumbY = scrollRatio * (listH - thumbH);

    this.scrollbarGfx
      .roundRect(GAME_WIDTH - 12, thumbY, barW, thumbH, 2.5)
      .fill({ color: 0xfacc15, alpha: 0.75 });
  }

  private renderUpgradeCards(listW: number, listH: number) {
    this.scrollContainer.removeChildren();
    if (this.scrapText) {
      this.scrapText.text = I18n.t("garage.scrap", {
        value: SaveManager.getScrap(),
      });
    }

    const configs = Object.values(GARAGE_UPGRADE_CONFIGS);
    const cardW = 684; // Maximized width for mobile (18px side margins on 720px width)
    const cardH = 166; // Substantially taller to host bold, large mobile fonts without any crowding
    const gap = 16;
    const rowH = cardH + gap;
    const startY = 16 + cardH / 2;
    const currentScrap = SaveManager.getScrap();

    for (let i = 0; i < configs.length; i++) {
      const cfg = configs[i];
      const curLvl = SaveManager.getUpgradeLevel(cfg.id);
      const isMax = curLvl >= cfg.maxLevel;
      const cost = SaveManager.getUpgradeCost(cfg.id);
      const canAfford = currentScrap >= cost && !isMax;

      const rowY = startY + i * rowH;
      const row = new Container();
      row.x = listW / 2;
      row.y = rowY;
      this.scrollContainer.addChild(row);

      // 1. 3D Card Shadow Base
      const shadow = new Graphics();
      shadow
        .roundRect(-cardW / 2, -cardH / 2 + 5, cardW, cardH, 22)
        .fill(0x04070e);
      row.addChild(shadow);

      // 2. Card Body
      const body = new Graphics();
      body
        .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 22)
        .fill(0x1e293b)
        .stroke({ color: canAfford ? 0x64748b : 0x334155, width: 2.2 });
      row.addChild(body);

      // 3. Vibrant Large Icon Badge (94 x 94)
      const iconBg = new Graphics();
      iconBg
        .roundRect(-cardW / 2 + 18, -47, 94, 94, 20)
        .fill(cfg.color)
        .stroke({ color: 0xffffff, width: 2.5 });
      row.addChild(iconBg);

      const iconText = new Text({
        text: cfg.icon,
        style: { fontSize: 46 },
      });
      iconText.anchor.set(0.5);
      iconText.x = -cardW / 2 + 65;
      iconText.y = 0;
      row.addChild(iconText);

      // 4. Content Column (x = -cardW / 2 + 128)
      const colX = -cardW / 2 + 128;

      // Line 1: Title + Level Badge (y = -cardH / 2 + 20)
      const upgradeName = I18n.t(`garage.name.${cfg.id}`) || cfg.name;
      const title = new Text({
        text: upgradeName,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 27,
          fontWeight: "900",
          fill: 0xffffff,
          stroke: { color: 0x0f172a, width: 3.5 },
        },
      });
      title.x = colX;
      title.y = -cardH / 2 + 20;
      row.addChild(title);

      const lvlBadge = new Text({
        text: isMax
          ? I18n.t("garage.maxed")
          : I18n.t("garage.level", { cur: curLvl, max: cfg.maxLevel }),
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 20,
          fontWeight: "900",
          fill: isMax ? 0x22c55e : 0xfacc15,
          stroke: { color: 0x000000, width: 2.5 },
        },
      });
      lvlBadge.x = colX + title.width + 12;
      lvlBadge.y = -cardH / 2 + 24;
      row.addChild(lvlBadge);

      // Line 2: 10 Level Pips (Thick and clear)
      const pipsGfx = new Graphics();
      const pipW = 21;
      const pipH = 9.5;
      const pipGap = 4.5;
      for (let p = 0; p < cfg.maxLevel; p++) {
        const px = colX + p * (pipW + pipGap);
        const py = -cardH / 2 + 60;
        pipsGfx
          .roundRect(px, py, pipW, pipH, 4.5)
          .fill(p < curLvl ? 0xfacc15 : 0x334155);
      }
      row.addChild(pipsGfx);

      // Line 3: Stat description text (Large, high-contrast, 22.5px bold)
      const curBonus = curLvl * cfg.valuePerLevel;
      const nextBonus = (curLvl + 1) * cfg.valuePerLevel;
      const curValStr = cfg.isMultiplier
        ? `+${Math.round(curBonus * 100)}%`
        : `+${curBonus} ${cfg.unit}`;
      const nextValStr = cfg.isMultiplier
        ? `+${Math.round(nextBonus * 100)}%`
        : `+${nextBonus} ${cfg.unit}`;

      const upgradeShortDesc = I18n.t(`garage.desc.${cfg.id}`) || cfg.shortDesc;
      const descText = isMax
        ? I18n.t("garage.current", {
            value: curValStr,
            desc: upgradeShortDesc,
          })
        : `${curValStr} ➔ ${nextValStr} (${upgradeShortDesc})`;

      const desc = new Text({
        text: descText,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 22,
          fontWeight: "700",
          fill: 0xf8fafc,
          wordWrap: true,
          wordWrapWidth: 385,
          lineHeight: 28,
        },
      });
      desc.x = colX;
      desc.y = -cardH / 2 + 84;
      row.addChild(desc);

      // 5. Action Upgrade Button (152 x 72)
      const btnW = 152;
      const btnH = 72;
      const btnX = cardW / 2 - 92;

      const btn = new Container();
      btn.x = btnX;
      btn.y = 0;

      const btnContent = new Container();
      btn.addChild(btnContent);

      const btnBg = new Graphics();
      if (isMax) {
        btnBg.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 18).fill(0x334155);
      } else if (canAfford) {
        // Shadow base
        const sh = new Graphics();
        sh.roundRect(-btnW / 2, -btnH / 2 + 5, btnW, btnH, 18).fill(0xc2410c);
        btn.addChildAt(sh, 0);

        btnBg
          .roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 18)
          .fill(0xf97316)
          .stroke({ color: 0xffffff, width: 2.5 });
        btnBg
          .roundRect(-btnW / 2 + 4, -btnH / 2 + 2, btnW - 8, btnH * 0.38, 8)
          .fill({ color: 0xffffff, alpha: 0.35 });
      } else {
        btnBg
          .roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 18)
          .fill(0x1e293b)
          .stroke({ color: 0x475569, width: 2 });
      }
      btnContent.addChild(btnBg);

      const btnLabel = new Text({
        text: isMax ? I18n.t("garage.maxed") : `🔩 ${cost}`,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: isMax ? 22 : 27,
          fontWeight: "900",
          fill: isMax ? 0x94a3b8 : canAfford ? 0xffffff : 0x64748b,
          stroke: canAfford ? { color: 0xc2410c, width: 3 } : undefined,
        },
      });
      btnLabel.anchor.set(0.5);
      btnContent.addChild(btnLabel);

      if (canAfford) {
        btn.eventMode = "static";
        btn.cursor = "pointer";
        btn.on("pointerover", () => btn.scale.set(1.05));
        btn.on("pointerout", () => {
          btn.scale.set(1.0);
          btnContent.y = 0;
        });
        btn.on("pointerdown", (e) => {
          e.stopPropagation();
          btnContent.y = 4;
          btn.scale.set(0.95);
        });
        btn.on("pointerup", (e) => {
          e.stopPropagation();
          btnContent.y = 0;
          btn.scale.set(1.0);
          if (!this.hasDragged) {
            if (SaveManager.buyUpgrade(cfg.id)) {
              AudioMixer.playSFX("sfx_button");
              this.renderUpgradeCards(listW, listH);
            }
          }
        });
      }

      row.addChild(btn);
    }

    // Helpful Tip Banner below the last upgrade card
    const lastCardBottom = startY + (configs.length - 1) * rowH + cardH / 2;
    const tipBoxY = lastCardBottom + 18;
    const tipBoxW = cardW;
    const tipBoxH = 58;

    const tipContainer = new Container();
    tipContainer.x = listW / 2;
    tipContainer.y = tipBoxY + tipBoxH / 2;

    const tipBg = new Graphics();
    tipBg
      .roundRect(-tipBoxW / 2, -tipBoxH / 2, tipBoxW, tipBoxH, 16)
      .fill({ color: 0x0f172a, alpha: 0.92 })
      .stroke({ color: 0x334155, width: 2 });
    tipContainer.addChild(tipBg);

    const tipText = new Text({
      text: I18n.t("garage.tip"),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 19.5,
        fontWeight: "700",
        fill: 0x94a3b8,
      },
    });
    tipText.anchor.set(0.5);
    tipContainer.addChild(tipText);
    this.scrollContainer.addChild(tipContainer);

    const totalH = tipBoxY + tipBoxH + 24;

    // Check if scrolling is really needed
    if (totalH <= listH) {
      this.minScrollY = 0;
      this.scrollY = 0;
      this.scrollContainer.y = 0;
      this.scrollbarGfx.clear();
    } else {
      this.minScrollY = listH - totalH;
      this.updateScrollbar(listH);
    }
  }
}
