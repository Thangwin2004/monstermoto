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

    // 1. Dark Backdrop (covers whole screen with dark blur effect)
    const backdrop = new Graphics();
    backdrop.rect(-100, -100, GAME_WIDTH + 200, GAME_HEIGHT + 200);
    backdrop.fill({ color: 0x000000, alpha: 0.85 });
    backdrop.eventMode = "static";
    backdrop.on("pointerdown", (e) => e.stopPropagation());
    this.addChild(backdrop);

    // 2. Central 3D Modal Window
    this.modalContainer = new Container();
    this.modalContainer.x = GAME_WIDTH / 2;
    this.modalContainer.y = GAME_HEIGHT / 2;
    this.addChild(this.modalContainer);

    const cardW = 640;
    const cardH = 1080;

    // Soft Shadow base
    const cardShadow = new Graphics();
    cardShadow
      .roundRect(-cardW / 2 + 6, -cardH / 2 + 14, cardW, cardH, 28)
      .fill({ color: 0x000000, alpha: 0.55 });
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
      .fill(0x0b1120);
    this.modalContainer.addChild(cardFace);

    // 3. 3D Golden Title Ribbon (Floating cleanly above card with 18px clearance from Scrap Pill)
    const ribbonW = 440;
    const ribbonH = 60;
    const ribbonY = -cardH / 2 - 20;

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
    wrenchIcon.x = -135;
    titleRow.addChild(wrenchIcon);

    const titleText = new Text({
      text: "XƯỞNG XE CHIẾN ĐẤU",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 24,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x78350f, width: 4 },
        letterSpacing: 1.5,
      },
    });
    titleText.anchor.set(0, 0.5);
    titleText.x = -110;
    titleRow.addChild(titleText);
    this.modalContainer.addChild(titleRow);

    // 4. Top-Right Close Button (HyperCircleButton with crisp vector cross)
    const closeCornerBtn = new HyperCircleButton({
      vectorIcon: "cross",
      radius: 24,
      color: 0xef4444,
      shadowColor: 0x991b1b,
      strokeWidth: 3.5,
      onClick: () => {
        this.destroy();
        this.onCloseCallback();
      },
    });
    closeCornerBtn.x = cardW / 2 - 14;
    closeCornerBtn.y = -cardH / 2 + 14;
    this.modalContainer.addChild(closeCornerBtn);

    // 5. Scrap Balance Pill (Placed with 18px clear air below Ribbon)
    const scrapPillY = -cardH / 2 + 76;
    const scrapPill = new Graphics();
    scrapPill
      .roundRect(-150, scrapPillY - 18, 300, 36, 18)
      .fill(0x1e293b)
      .stroke({ color: 0xfacc15, width: 2 });
    this.modalContainer.addChild(scrapPill);

    this.scrapText = new Text({
      text: `🔩 PHẾ LIỆU: ${SaveManager.getScrap()}`,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 16.5,
        fontWeight: "900",
        fill: 0xfacc15,
        letterSpacing: 1,
      },
    });
    this.scrapText.anchor.set(0.5);
    this.scrapText.y = scrapPillY;
    this.modalContainer.addChild(this.scrapText);

    // 6. Upgrade Cards List Container (Starts with 22px clear air at y = -cardH / 2 + 116)
    this.cardsContainer = new Container();
    this.cardsContainer.y = -cardH / 2 + 116;
    this.modalContainer.addChild(this.cardsContainer);

    this.renderUpgradeCards();

    // 7. Bottom Close Button (HyperButton with crisp vector check)
    const closeBtn = new HyperButton({
      label: "TIẾP TỤC",
      vectorIcon: "check",
      width: 290,
      height: 62,
      fontSize: 22,
      color: 0x0ea5e9,
      shadowColor: 0x0369a1,
      onClick: () => {
        this.destroy();
        this.onCloseCallback();
      },
    });
    closeBtn.y = cardH / 2 - 46;
    this.modalContainer.addChild(closeBtn);
  }

  private renderUpgradeCards() {
    this.cardsContainer.removeChildren();
    this.scrapText.text = `🔩 PHẾ LIỆU: ${SaveManager.getScrap()}`;

    const configs = Object.values(GARAGE_UPGRADE_CONFIGS);
    const rowH = 94;
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

      // Row background (580 x 86)
      const rowBg = new Graphics();
      rowBg
        .roundRect(-290, 0, 580, 86, 14)
        .fill(0x1e293b)
        .stroke({ color: canAfford ? 0x475569 : 0x334155, width: 1.5 });
      row.addChild(rowBg);

      // Icon badge (68 x 68)
      const iconBg = new Graphics();
      iconBg
        .roundRect(-278, 9, 68, 68, 12)
        .fill(cfg.color);
      row.addChild(iconBg);

      const iconText = new Text({
        text: cfg.icon,
        style: { fontSize: 28 },
      });
      iconText.anchor.set(0.5);
      iconText.x = -244;
      iconText.y = 43;
      row.addChild(iconText);

      // Title & Level text
      const title = new Text({
        text: `${cfg.name}  `,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 16.5,
          fontWeight: "900",
          fill: 0xffffff,
        },
      });
      title.x = -196;
      title.y = 10;
      row.addChild(title);

      const lvlBadge = new Text({
        text: isMax ? "TỐI ĐA" : `Cấp ${curLvl}/${cfg.maxLevel}`,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 13,
          fontWeight: "900",
          fill: isMax ? 0x22c55e : 0xfacc15,
        },
      });
      lvlBadge.x = -196 + title.width + 6;
      lvlBadge.y = 12.5;
      row.addChild(lvlBadge);

      // Star Pips (10 pips, clean horizontal line)
      const pipsGfx = new Graphics();
      const pipW = 13;
      const pipH = 5;
      const pipGap = 3;
      for (let p = 0; p < cfg.maxLevel; p++) {
        const px = -196 + p * (pipW + pipGap);
        const py = 34;
        pipsGfx
          .roundRect(px, py, pipW, pipH, 2)
          .fill(p < curLvl ? 0xfacc15 : 0x334155);
      }
      row.addChild(pipsGfx);

      // Stat Description (Single-line, concise, never wraps or clips)
      const curBonus = curLvl * cfg.valuePerLevel;
      const nextBonus = (curLvl + 1) * cfg.valuePerLevel;
      const curValStr = cfg.isMultiplier
        ? `+${Math.round(curBonus * 100)}%`
        : `+${curBonus} ${cfg.unit}`;
      const nextValStr = cfg.isMultiplier
        ? `+${Math.round(nextBonus * 100)}%`
        : `+${nextBonus} ${cfg.unit}`;

      const descStr = isMax
        ? `Đã đạt tối đa: ${curValStr}`
        : `${curValStr} ➔ ${nextValStr} (${cfg.shortDesc})`;

      const desc = new Text({
        text: descStr,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 13,
          fontWeight: "700",
          fill: 0x94a3b8,
        },
      });
      desc.x = -196;
      desc.y = 48;
      row.addChild(desc);

      // Upgrade Action Button (Hyper-Casual Bouncy 3D Capsule)
      const btnW = 120;
      const btnH = 50;
      const btnX = 212;
      const btnY = 42;

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
          fontSize: isMax ? 13 : 16,
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
