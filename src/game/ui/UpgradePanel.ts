import { Container, Graphics, Text } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { UpgradeDefinition } from "../data/upgrades";
import { AudioMixer } from "../utils/AudioMixer";
import { I18n } from "../utils/I18n";
import { SceneManager } from "../scenes/SceneManager";

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
  private cardShadow!: Graphics;
  private borderBg!: Graphics;
  private cardFace!: Graphics;
  private ribbon!: Graphics;
  private optionsContainer: Container;
  private titleText!: Text;
  private subText!: Text;
  private currentHeight: number = GAME_HEIGHT;

  public onSelect: (upgrade: UpgradeDefinition) => void = () => {};

  constructor() {
    super();
    this.visible = false;

    const initialH = SceneManager.getVirtualSize?.()?.height ?? GAME_HEIGHT;
    this.currentHeight = Math.max(GAME_HEIGHT, initialH);

    // Fullscreen Dark Backdrop (oversized to guarantee zero gaps at bottom)
    this.bg = new Graphics();
    this.bg.eventMode = "static";
    this.addChild(this.bg);

    this.modalContainer = new Container();
    this.addChild(this.modalContainer);

    this.initDialogBase();

    this.optionsContainer = new Container();
    this.modalContainer.addChild(this.optionsContainer);

    this.updateLayout();
  }

  private initDialogBase() {
    const cardW = 630;
    const cardH = 880; // Compact, perfectly proportioned to eliminate bottom dead space

    // 1. Soft Card Shadow
    this.cardShadow = new Graphics();
    this.cardShadow
      .roundRect(-cardW / 2 + 6, -cardH / 2 + 16, cardW, cardH, 28)
      .fill({ color: 0x000000, alpha: 0.45 });
    this.modalContainer.addChild(this.cardShadow);

    // 2. Thick 3D Cyan/Blue Border Base
    this.borderBg = new Graphics();
    this.borderBg
      .roundRect(-cardW / 2, -cardH / 2 + 8, cardW, cardH, 28)
      .fill(0x0284c7);
    this.borderBg
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 28)
      .fill(0x38bdf8)
      .stroke({ color: 0xffffff, width: 4.5 });
    this.modalContainer.addChild(this.borderBg);

    // 3. Bright Clean White Card Face
    this.cardFace = new Graphics();
    this.cardFace
      .roundRect(-cardW / 2 + 14, -cardH / 2 + 14, cardW - 28, cardH - 28, 20)
      .fill(0xffffff);
    this.modalContainer.addChild(this.cardFace);

    // 4. Floating 3D Title Ribbon
    const ribbonW = 420;
    const ribbonH = 72;
    const ribbonY = -cardH / 2 - 16;

    this.ribbon = new Graphics();
    this.ribbon
      .roundRect(-ribbonW / 2, ribbonY + 6, ribbonW, ribbonH, ribbonH / 2)
      .fill(0xb45309);
    this.ribbon
      .roundRect(-ribbonW / 2, ribbonY, ribbonW, ribbonH, ribbonH / 2)
      .fill(0xf59e0b)
      .stroke({ color: 0xffffff, width: 4.5 });
    this.ribbon
      .roundRect(
        -ribbonW / 2 + 16,
        ribbonY + 4,
        ribbonW - 32,
        ribbonH * 0.4,
        12,
      )
      .fill({ color: 0xffffff, alpha: 0.35 });
    this.modalContainer.addChild(this.ribbon);

    this.titleText = new Text({
      text: I18n.t("upgrade.title"),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 28,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x78350f, width: 4.5 },
        letterSpacing: 2,
      },
    });
    this.titleText.anchor.set(0.5);
    this.titleText.y = ribbonY + ribbonH / 2 - 2;
    this.modalContainer.addChild(this.titleText);

    // Subtitle
    this.subText = new Text({
      text: I18n.t("upgrade.subtitle"),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 18,
        fontWeight: "700",
        fill: 0x64748b,
      },
    });
    this.subText.anchor.set(0.5);
    this.subText.y = -cardH / 2 + 64;
    this.modalContainer.addChild(this.subText);
  }

  public resize(_width: number, height: number) {
    this.currentHeight = Math.max(GAME_HEIGHT, height);
    this.updateLayout();
  }

  private updateLayout() {
    this.bg.clear();
    this.bg
      .rect(-200, -200, GAME_WIDTH + 400, Math.max(3500, this.currentHeight + 600))
      .fill({ color: 0x000000, alpha: 0.88 });

    this.modalContainer.x = GAME_WIDTH / 2;
    // Perfectly centered vertically in viewport (no shoving to top!)
    this.modalContainer.y = this.currentHeight / 2;
  }

  show(upgrades: UpgradeDefinition[]) {
    this.optionsContainer.removeChildren();
    this.titleText.text = I18n.t("upgrade.title");
    this.subText.text = I18n.t("upgrade.subtitle");

    this.updateLayout();

    const cardW = 580;
    const cardH = 224;
    const startY = -240;
    const gap = 240;

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

      // 3. Row 1: Rarity Badge + Action Type Badge side-by-side
      const rarityStr = I18n.rarity(upgrade.rarity, theme.label);
      const rarityText = new Text({
        text: rarityStr,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 13,
          fontWeight: "900",
          fill: 0xffffff,
        },
      });
      const rarityW = Math.max(88, rarityText.width + 24);
      const badgeH = 28;
      const row1Y = -cardH / 2 + 14;

      const rarityBadge = new Graphics();
      rarityBadge
        .roundRect(-cardW / 2 + 16, row1Y, rarityW, badgeH, 14)
        .fill(theme.bg)
        .stroke({ color: 0xffffff, width: 1.5 });
      content.addChild(rarityBadge);

      rarityText.anchor.set(0.5);
      rarityText.x = -cardW / 2 + 16 + rarityW / 2;
      rarityText.y = row1Y + badgeH / 2;
      content.addChild(rarityText);

      // Action Badge (Lên Sao / Nâng Chỉ Số / Vũ Khí Mới)
      const actionStr = I18n.action(upgrade.actionType, actionInfo.text);
      const actionText = new Text({
        text: actionStr,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 13,
          fontWeight: "900",
          fill: actionInfo.color,
        },
      });
      const actionW = Math.max(120, actionText.width + 24);
      const actionX = -cardW / 2 + 16 + rarityW + 10;

      const actionBadge = new Graphics();
      actionBadge
        .roundRect(actionX, row1Y, actionW, badgeH, 14)
        .fill(actionInfo.bg)
        .stroke({ color: theme.border, width: 1.5 });
      content.addChild(actionBadge);

      actionText.anchor.set(0.5);
      actionText.x = actionX + actionW / 2;
      actionText.y = row1Y + badgeH / 2;
      content.addChild(actionText);

      // 4. Row 2: Target Scope on its OWN independent line (No overlap possible!)
      const targetStr = I18n.upgradeTarget(upgrade.targetLabel);
      const scopeText = new Text({
        text: I18n.t("upgrade.scope", { value: targetStr }),
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 15,
          fontWeight: "900",
          fill: theme.textCol,
          wordWrap: true,
          wordWrapWidth: cardW - 36,
        },
      });
      scopeText.anchor.set(0, 0.5);
      scopeText.x = -cardW / 2 + 18;
      scopeText.y = -cardH / 2 + 58;
      content.addChild(scopeText);

      // 5. Row 3: Upgrade Name
      const nameText = new Text({
        text: I18n.upgradeName(upgrade.id, upgrade.name),
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 25,
          fontWeight: "900",
          fill: 0x0f172a,
          wordWrap: true,
          wordWrapWidth: cardW - 36,
        },
      });
      nameText.anchor.set(0, 0.5);
      nameText.x = -cardW / 2 + 18;
      nameText.y = -cardH / 2 + 96;
      content.addChild(nameText);

      // 6. Row 4: Description Text
      const descText = new Text({
        text: I18n.upgradeDesc(upgrade.id, upgrade.description),
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 17,
          fontWeight: "600",
          fill: 0x334155,
          wordWrap: true,
          wordWrapWidth: cardW - 36,
          lineHeight: 24,
        },
      });
      descText.anchor.set(0, 0);
      descText.x = -cardW / 2 + 18;
      descText.y = -cardH / 2 + 130;
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
