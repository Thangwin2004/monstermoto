import { Container, Graphics, Text } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { UpgradeDefinition } from "../data/upgrades";
import { AudioMixer } from "../utils/AudioMixer";

const RARITY_THEMES: Record<
  string,
  {
    bg: number;
    cardFace: number;
    border: number;
    shadow: number;
    label: string;
    textCol: number;
  }
> = {
  common: {
    bg: 0x0284c7,
    cardFace: 0xf0f9ff,
    border: 0x38bdf8,
    shadow: 0x0369a1,
    label: "THƯỜNG",
    textCol: 0x0369a1,
  },
  rare: {
    bg: 0x2563eb,
    cardFace: 0xeff6ff,
    border: 0x60a5fa,
    shadow: 0x1d4ed8,
    label: "HIẾM",
    textCol: 0x1d4ed8,
  },
  epic: {
    bg: 0x9333ea,
    cardFace: 0xfaf5ff,
    border: 0xc084fc,
    shadow: 0x7e22ce,
    label: "SỬ THI",
    textCol: 0x7e22ce,
  },
  legendary: {
    bg: 0xd97706,
    cardFace: 0xfffbeb,
    border: 0xfbbf24,
    shadow: 0xb45309,
    label: "HUYỀN THOẠI",
    textCol: 0xb45309,
  },
  corrupted: {
    bg: 0xdc2626,
    cardFace: 0xfef2f2,
    border: 0xf87171,
    shadow: 0x991b1b,
    label: "BỊ NGUYỀN",
    textCol: 0x991b1b,
  },
};

const ACTION_LABELS: Record<
  string,
  { text: string; color: number; bg: number }
> = {
  upgrade_module: { text: "⭐ LÊN SAO", color: 0xb45309, bg: 0xfef3c7 },
  stat_boost: { text: "✨ NÂNG CẤP", color: 0x0369a1, bg: 0xe0f2fe },
  new_module: { text: "🆕 VŨ KHÍ MỚI", color: 0x15803d, bg: 0xdcfce7 },
};

export class UpgradePanel extends Container {
  private bg: Graphics;
  private modalContainer: Container;
  private optionsContainer: Container;

  public onSelect: (upgrade: UpgradeDefinition) => void = () => {};

  constructor() {
    super();
    this.visible = false;

    // Soft translucent dark backdrop
    // Dark Blur Backdrop (covers full viewport)
    this.bg = new Graphics();
    this.bg.rect(-100, -100, GAME_WIDTH + 200, GAME_HEIGHT + 200);
    this.bg.fill({ color: 0x000000, alpha: 0.85 });
    this.bg.eventMode = "static";
    this.addChild(this.bg);

    this.modalContainer = new Container();
    this.modalContainer.x = GAME_WIDTH / 2;
    this.modalContainer.y = GAME_HEIGHT / 2;
    this.addChild(this.modalContainer);

    // ── Bright 3D Dialog Card Base ──
    const cardW = 630;
    const cardH = 920;

    // 1. Soft Card Shadow
    const cardShadow = new Graphics();
    cardShadow
      .roundRect(-cardW / 2 + 6, -cardH / 2 + 16, cardW, cardH, 28)
      .fill({ color: 0x000000, alpha: 0.45 });
    this.modalContainer.addChild(cardShadow);

    // 2. Thick 3D Cyan/Blue Border Base
    const borderBg = new Graphics();
    borderBg
      .roundRect(-cardW / 2, -cardH / 2 + 8, cardW, cardH, 28)
      .fill(0x0284c7);
    borderBg
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 28)
      .fill(0x38bdf8)
      .stroke({ color: 0xffffff, width: 4.5 });
    this.modalContainer.addChild(borderBg);

    // 3. Bright Clean White Card Face
    const cardFace = new Graphics();
    cardFace
      .roundRect(-cardW / 2 + 14, -cardH / 2 + 14, cardW - 28, cardH - 28, 20)
      .fill(0xffffff);
    this.modalContainer.addChild(cardFace);

    // 4. Floating 3D Title Ribbon
    const ribbonW = 420;
    const ribbonH = 72;
    const ribbonY = -cardH / 2 - 16;

    const ribbon = new Graphics();
    ribbon
      .roundRect(-ribbonW / 2, ribbonY + 6, ribbonW, ribbonH, ribbonH / 2)
      .fill(0xb45309);
    ribbon
      .roundRect(-ribbonW / 2, ribbonY, ribbonW, ribbonH, ribbonH / 2)
      .fill(0xf59e0b)
      .stroke({ color: 0xffffff, width: 4.5 });
    ribbon
      .roundRect(
        -ribbonW / 2 + 16,
        ribbonY + 4,
        ribbonW - 32,
        ribbonH * 0.4,
        12,
      )
      .fill({ color: 0xffffff, alpha: 0.35 });
    this.modalContainer.addChild(ribbon);

    const titleText = new Text({
      text: "LÊN CẤP ĐOÀN XE!",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 26,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x78350f, width: 4.5 },
        letterSpacing: 2,
      },
    });
    titleText.anchor.set(0.5);
    titleText.y = ribbonY + ribbonH / 2 - 2;
    this.modalContainer.addChild(titleText);

    // Subtitle
    const subText = new Text({
      text: "Chạm vào thẻ bài để gia tăng hỏa lực chiến xa",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 17,
        fontWeight: "700",
        fill: 0x64748b,
      },
    });
    subText.anchor.set(0.5);
    subText.y = -cardH / 2 + 76;
    this.modalContainer.addChild(subText);

    // 5. Options Container
    this.optionsContainer = new Container();
    this.modalContainer.addChild(this.optionsContainer);
  }

  show(upgrades: UpgradeDefinition[]) {
    this.optionsContainer.removeChildren();

    const cardW = 580;
    const cardH = 190;
    const startY = -215;
    const gap = 215;

    for (let i = 0; i < upgrades.length; i++) {
      const upgrade = upgrades[i];
      const theme = RARITY_THEMES[upgrade.rarity] || RARITY_THEMES.common;
      const actionInfo =
        ACTION_LABELS[upgrade.actionType] || ACTION_LABELS.stat_boost;

      const optBtn = new Container();
      optBtn.y = startY + i * gap;

      const content = new Container();
      optBtn.addChild(content);

      // 1. 3D Card Shadow Base
      const shadow = new Graphics();
      shadow
        .roundRect(-cardW / 2, -cardH / 2 + 6, cardW, cardH, 20)
        .fill(theme.shadow);
      optBtn.addChildAt(shadow, 0);

      // 2. Bright Card Body (Vibrant Tinted Face)
      const body = new Graphics();
      body
        .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 20)
        .fill(theme.cardFace)
        .stroke({ color: theme.border, width: 3.5 });

      // Gloss sheen on top
      body
        .roundRect(-cardW / 2 + 8, -cardH / 2 + 6, cardW - 16, 44, 14)
        .fill({ color: 0xffffff, alpha: 0.65 });
      content.addChild(body);

      // 3. Top Badges Row: Rarity Badge + Action Type Badge
      const rarityBadge = new Graphics();
      rarityBadge
        .roundRect(-cardW / 2 + 16, -cardH / 2 + 14, 105, 28, 14)
        .fill(theme.bg)
        .stroke({ color: 0xffffff, width: 1.5 });
      content.addChild(rarityBadge);

      const rarityText = new Text({
        text: theme.label,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 13,
          fontWeight: "900",
          fill: 0xffffff,
        },
      });
      rarityText.anchor.set(0.5);
      rarityText.x = -cardW / 2 + 68;
      rarityText.y = -cardH / 2 + 28;
      content.addChild(rarityText);

      // Action Badge (Lên Sao / Nâng Chỉ Số / Thêm Mới)
      const actionBadge = new Graphics();
      actionBadge
        .roundRect(-cardW / 2 + 130, -cardH / 2 + 14, 150, 28, 14)
        .fill(actionInfo.bg)
        .stroke({ color: theme.border, width: 1.5 });
      content.addChild(actionBadge);

      const actionText = new Text({
        text: actionInfo.text,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 13,
          fontWeight: "900",
          fill: actionInfo.color,
        },
      });
      actionText.anchor.set(0.5);
      actionText.x = -cardW / 2 + 205;
      actionText.y = -cardH / 2 + 28;
      content.addChild(actionText);

      // 4. Target Module Scope Badge (Right-aligned)
      const scopeText = new Text({
        text: `ÁP DỤNG: ${upgrade.targetLabel}`,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 14.5,
          fontWeight: "900",
          fill: theme.textCol,
        },
      });
      scopeText.anchor.set(1, 0.5);
      scopeText.x = cardW / 2 - 18;
      scopeText.y = -cardH / 2 + 28;
      content.addChild(scopeText);

      // 5. Upgrade Name
      const nameText = new Text({
        text: upgrade.name,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 26,
          fontWeight: "900",
          fill: 0x0f172a,
        },
      });
      nameText.anchor.set(0, 0.5);
      nameText.x = -cardW / 2 + 18;
      nameText.y = -cardH / 2 + 68;
      content.addChild(nameText);

      // 6. Description Text (Full card width with spacious layout)
      const descText = new Text({
        text: upgrade.description,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 18,
          fontWeight: "600",
          fill: 0x334155,
          wordWrap: true,
          wordWrapWidth: cardW - 36,
          lineHeight: 25,
        },
      });
      descText.anchor.set(0, 0);
      descText.x = -cardW / 2 + 18;
      descText.y = -cardH / 2 + 96;
      content.addChild(descText);

      // 7. Interactive Hover & Touch (The entire card acts as a juicy button)
      optBtn.eventMode = "static";
      optBtn.cursor = "pointer";

      optBtn.on("pointerover", () => {
        optBtn.scale.set(1.03);
      });
      optBtn.on("pointerout", () => {
        optBtn.scale.set(1);
        content.y = 0;
      });
      optBtn.on("pointerdown", () => {
        content.y = 4;
        AudioMixer.playSFX("sfx_button");
      });
      optBtn.on("pointerup", () => {
        content.y = 0;
        this.hide();
        this.onSelect(upgrade);
      });

      this.optionsContainer.addChild(optBtn);
    }

    this.visible = true;
  }

  hide() {
    this.visible = false;
  }
}
