import { Container, Graphics, Text } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { SaveManager, GARAGE_UPGRADE_CONFIGS } from "../utils/SaveManager";
import { AudioMixer } from "../utils/AudioMixer";
import { HyperButton, HyperCircleButton } from "./HyperButton";
import { VectorIcons } from "./VectorIcons";

export class GarageModal extends Container {
  private modalContainer: Container;
  private scrapText!: Text;
  private cardsContainer: Container;
  private onCloseCallback: () => void;

  constructor(onClose: () => void) {
    super();
    this.onCloseCallback = onClose;

    // 1. Dark Backdrop
    const backdrop = new Graphics();
    backdrop.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    backdrop.fill({ color: 0x090a0f, alpha: 0.88 });
    backdrop.eventMode = "static";
    backdrop.on("pointerdown", (e) => e.stopPropagation());
    this.addChild(backdrop);

    // 2. Central 3D Modal Window
    this.modalContainer = new Container();
    this.modalContainer.x = GAME_WIDTH / 2;
    this.modalContainer.y = GAME_HEIGHT / 2;
    this.addChild(this.modalContainer);

    const cardW = 620;
    const cardH = 980;

    // Soft Shadow base
    const cardShadow = new Graphics();
    cardShadow
      .roundRect(-cardW / 2 + 6, -cardH / 2 + 14, cardW, cardH, 28)
      .fill({ color: 0x000000, alpha: 0.5 });
    this.modalContainer.addChild(cardShadow);

    // 3D Metallic Slate Border
    const cardBorder = new Graphics();
    cardBorder
      .roundRect(-cardW / 2, -cardH / 2 + 8, cardW, cardH, 28)
      .fill(0x0f172a);
    cardBorder
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 28)
      .fill(0x1e293b)
      .stroke({ color: 0xffffff, width: 4.5 });
    this.modalContainer.addChild(cardBorder);

    // Card Face
    const cardFace = new Graphics();
    cardFace
      .roundRect(-cardW / 2 + 12, -cardH / 2 + 12, cardW - 24, cardH - 24, 20)
      .fill(0x0f172a);
    this.modalContainer.addChild(cardFace);

    // 3. 3D Golden Title Ribbon
    const ribbonW = 440;
    const ribbonH = 64;
    const ribbonY = -cardH / 2;

    const ribbon = new Graphics();
    ribbon
      .roundRect(-ribbonW / 2, ribbonY + 6, ribbonW, ribbonH, ribbonH / 2)
      .fill(0xb45309);
    ribbon
      .roundRect(-ribbonW / 2, ribbonY, ribbonW, ribbonH, ribbonH / 2)
      .fill(0xf59e0b)
      .stroke({ color: 0xffffff, width: 4.5 });
    ribbon
      .roundRect(-ribbonW / 2 + 16, ribbonY + 4, ribbonW - 32, ribbonH * 0.38, 12)
      .fill({ color: 0xffffff, alpha: 0.32 });
    this.modalContainer.addChild(ribbon);

    // Title Row with crisp vector wrench icon + Text
    const titleRow = new Container();
    titleRow.y = ribbonY + ribbonH / 2 - 2;

    const wrenchIcon = VectorIcons.createIcon("wrench", 26, 0xffffff);
    wrenchIcon.x = -130;
    titleRow.addChild(wrenchIcon);

    const titleText = new Text({
      text: "XƯỞNG XE CHIẾN ĐẤU",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 23,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x78350f, width: 4 },
        letterSpacing: 1.5,
      },
    });
    titleText.anchor.set(0, 0.5);
    titleText.x = -105;
    titleRow.addChild(titleText);
    this.modalContainer.addChild(titleRow);

    // 4. Top-Right Close Button (HyperCircleButton with crisp vector cross)
    const closeCornerBtn = new HyperCircleButton({
      vectorIcon: "cross",
      radius: 22,
      color: 0xef4444,
      shadowColor: 0x991b1b,
      strokeWidth: 3,
      onClick: () => {
        this.destroy();
        this.onCloseCallback();
      },
    });
    closeCornerBtn.x = cardW / 2 - 18;
    closeCornerBtn.y = -cardH / 2 + 18;
    this.modalContainer.addChild(closeCornerBtn);

    // 5. Scrap Balance Pill
    const scrapPill = new Graphics();
    scrapPill
      .roundRect(-150, -cardH / 2 + 56, 300, 38, 19)
      .fill(0x1e293b)
      .stroke({ color: 0xfacc15, width: 2.5 });
    this.modalContainer.addChild(scrapPill);

    this.scrapText = new Text({
      text: `🔩 PHẾ LIỆU: ${SaveManager.getScrap()}`,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 17,
        fontWeight: "900",
        fill: 0xfacc15,
        letterSpacing: 1,
      },
    });
    this.scrapText.anchor.set(0.5);
    this.scrapText.y = -cardH / 2 + 75;
    this.modalContainer.addChild(this.scrapText);

    // 6. Upgrade Cards List Container
    this.cardsContainer = new Container();
    this.cardsContainer.y = -cardH / 2 + 104;
    this.modalContainer.addChild(this.cardsContainer);

    this.renderUpgradeCards();

    // 7. Bottom Close Button (HyperButton with crisp vector check)
    const closeBtn = new HyperButton({
      label: "TIẾP TỤC",
      vectorIcon: "check",
      width: 260,
      height: 54,
      fontSize: 20,
      color: 0x0ea5e9,
      shadowColor: 0x0369a1,
      onClick: () => {
        this.destroy();
        this.onCloseCallback();
      },
    });
    closeBtn.y = cardH / 2 - 42;
    this.modalContainer.addChild(closeBtn);
  }

  private renderUpgradeCards() {
    this.cardsContainer.removeChildren();
    this.scrapText.text = `🔩 PHẾ LIỆU: ${SaveManager.getScrap()}`;

    const configs = Object.values(GARAGE_UPGRADE_CONFIGS);
    const rowH = 88;
    const currentScrap = SaveManager.getScrap();

    for (let i = 0; i < configs.length; i++) {
      const cfg = configs[i];
      const curLvl = SaveManager.getUpgradeLevel(cfg.id);
      const isMax = curLvl >= cfg.maxLevel;
      const cost = SaveManager.getUpgradeCost(cfg.id);
      const canAfford = currentScrap >= cost && !isMax;

      const rowY = i * rowH;
      const row = new Container();
      row.y = rowY;
      this.cardsContainer.addChild(row);

      // Row background
      const rowBg = new Graphics();
      rowBg
        .roundRect(-280, 0, 560, 80, 14)
        .fill(0x1e293b)
        .stroke({ color: canAfford ? 0x475569 : 0x334155, width: 2 });
      row.addChild(rowBg);

      // Icon badge
      const iconBg = new Graphics();
      iconBg
        .roundRect(-268, 10, 56, 60, 12)
        .fill(cfg.color);
      row.addChild(iconBg);

      const iconText = new Text({
        text: cfg.icon,
        style: { fontSize: 26 },
      });
      iconText.anchor.set(0.5);
      iconText.x = -240;
      iconText.y = 40;
      row.addChild(iconText);

      // Title & Level text
      const title = new Text({
        text: `${cfg.name}  `,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 15,
          fontWeight: "900",
          fill: 0xffffff,
        },
      });
      title.x = -202;
      title.y = 10;
      row.addChild(title);

      const lvlBadge = new Text({
        text: isMax ? "TỐI ĐA" : `Cấp ${curLvl}/${cfg.maxLevel}`,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 12,
          fontWeight: "900",
          fill: isMax ? 0x22c55e : 0xfacc15,
        },
      });
      lvlBadge.x = -202 + title.width + 4;
      lvlBadge.y = 12;
      row.addChild(lvlBadge);

      // Star Pips (10 pips)
      const pipsGfx = new Graphics();
      const pipW = 14;
      const pipH = 5;
      const pipGap = 3;
      for (let p = 0; p < cfg.maxLevel; p++) {
        const px = -202 + p * (pipW + pipGap);
        const py = 32;
        pipsGfx
          .roundRect(px, py, pipW, pipH, 2)
          .fill(p < curLvl ? 0xfacc15 : 0x334155);
      }
      row.addChild(pipsGfx);

      // Stat Description
      const curBonus = curLvl * cfg.valuePerLevel;
      const nextBonus = (curLvl + 1) * cfg.valuePerLevel;
      const curValStr = cfg.isMultiplier
        ? `+${Math.round(curBonus * 100)}%`
        : `+${curBonus} ${cfg.unit}`;
      const nextValStr = cfg.isMultiplier
        ? `+${Math.round(nextBonus * 100)}%`
        : `+${nextBonus} ${cfg.unit}`;

      const desc = new Text({
        text: isMax ? `Hiện tại: ${curValStr}` : `${curValStr} ➔ ${nextValStr} (${cfg.desc})`,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 11.5,
          fontWeight: "600",
          fill: 0x94a3b8,
        },
      });
      desc.x = -202;
      desc.y = 46;
      row.addChild(desc);

      // Upgrade Action Button (Hyper-Casual Bouncy 3D Capsule)
      const btnW = 116;
      const btnH = 46;
      const btnX = 205;
      const btnY = 40;

      const btn = new Container();
      btn.x = btnX;
      btn.y = btnY;

      const btnContent = new Container();
      btn.addChild(btnContent);

      const btnBg = new Graphics();
      if (isMax) {
        btnBg.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 12).fill(0x334155);
      } else if (canAfford) {
        // Shadow base
        const sh = new Graphics();
        sh.roundRect(-btnW / 2, -btnH / 2 + 4, btnW, btnH, 12).fill(0xc2410c);
        btn.addChildAt(sh, 0);

        btnBg
          .roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 12)
          .fill(0xf97316)
          .stroke({ color: 0xffffff, width: 2.5 });
        btnBg
          .roundRect(-btnW / 2 + 4, -btnH / 2 + 2, btnW - 8, btnH * 0.38, 6)
          .fill({ color: 0xffffff, alpha: 0.35 });
      } else {
        btnBg.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 12).fill(0x1e293b).stroke({ color: 0x475569, width: 1.5 });
      }
      btnContent.addChild(btnBg);

      const btnLabel = new Text({
        text: isMax ? "TỐI ĐA" : `🔩 ${cost}`,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: isMax ? 13 : 15,
          fontWeight: "900",
          fill: isMax ? 0x94a3b8 : canAfford ? 0xffffff : 0x64748b,
          stroke: canAfford ? { color: 0xc2410c, width: 2 } : undefined,
        },
      });
      btnLabel.anchor.set(0.5);
      btnContent.addChild(btnLabel);

      if (canAfford) {
        btn.eventMode = "static";
        btn.cursor = "pointer";
        btn.on("pointerover", () => {
          btn.scale.set(1.06);
        });
        btn.on("pointerout", () => {
          btn.scale.set(1.0);
          btnContent.y = 0;
        });
        btn.on("pointerdown", (e) => {
          e.stopPropagation();
          btnContent.y = 3;
          btn.scale.set(0.94);
        });
        btn.on("pointerup", (e) => {
          e.stopPropagation();
          btnContent.y = 0;
          btn.scale.set(1.0);
          if (SaveManager.buyUpgrade(cfg.id)) {
            AudioMixer.playSFX("sfx_button");
            this.renderUpgradeCards();
          }
        });
      }

      row.addChild(btn);
    }
  }
}
