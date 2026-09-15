import { Container, Graphics, Text } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { SaveManager } from "../utils/SaveManager";
import { AudioMixer } from "../utils/AudioMixer";
import { EventBus } from "../utils/EventBus";
import { HyperCircleButton } from "./HyperButton";
import { VectorIcons } from "./VectorIcons";
import { I18n, type Language } from "../utils/I18n";
import { SceneManager } from "../scenes/SceneManager";

export class SettingsModal extends Container {
  private modalContainer: Container;
  private contentContainer: Container;
  private titleText!: Text;
  private gearIcon!: Container;
  private onCloseCallback: () => void;
  private isInGame: boolean;
  private resetConfirm?: Container;
  private giveUpConfirm?: Container;
  private onGiveUpCallback?: () => void;
  private modalHeight: number;

  constructor(
    onClose: () => void,
    isInGame = false,
    customHeight?: number,
    onGiveUp?: () => void,
  ) {
    super();
    this.onCloseCallback = onClose;
    this.isInGame = isInGame;
    this.onGiveUpCallback = onGiveUp;
    const virtualH = SceneManager.getVirtualSize?.()?.height ?? GAME_HEIGHT;
    this.modalHeight = Math.max(GAME_HEIGHT, virtualH, customHeight ?? 0);

    // 1. Semi-Transparent Dark Blur Backdrop covering full viewport
    const backdrop = new Graphics();
    backdrop.rect(
      -100,
      -100,
      GAME_WIDTH + 200,
      Math.max(3500, this.modalHeight + 600),
    );
    backdrop.fill({ color: 0x000000, alpha: 0.88 });
    backdrop.eventMode = "static";
    backdrop.on("pointerdown", (e) => e.stopPropagation());
    this.addChild(backdrop);

    // 2. Central 3D Modal Window
    this.modalContainer = new Container();
    this.modalContainer.x = GAME_WIDTH / 2;
    this.modalContainer.y = this.modalHeight / 2;
    this.addChild(this.modalContainer);

    const cardW = 636;
    const cardH = 650;

    // Soft Card Shadow
    const cardShadow = new Graphics();
    cardShadow
      .roundRect(-cardW / 2 + 8, -cardH / 2 + 16, cardW, cardH, 28)
      .fill({ color: 0x000000, alpha: 0.45 });
    this.modalContainer.addChild(cardShadow);

    // Thick 3D Royal Blue Border (Marth3 Design Standard)
    const borderBg = new Graphics();
    borderBg
      .roundRect(-cardW / 2, -cardH / 2 + 8, cardW, cardH, 28)
      .fill(0x0369a1);
    borderBg
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 28)
      .fill(0x0284c7)
      .stroke({ color: 0xffffff, width: 4.5 });
    this.modalContainer.addChild(borderBg);

    // Bright Cream Card Face
    const cardFace = new Graphics();
    cardFace
      .roundRect(-cardW / 2 + 14, -cardH / 2 + 14, cardW - 28, cardH - 28, 20)
      .fill(0xfbfaf5);
    this.modalContainer.addChild(cardFace);

    // 3. Floating 3D Title Ribbon (Cyan / Sky Blue)
    const ribbonW = 350;
    const ribbonH = 70;
    const ribbonY = -cardH / 2 - 14;

    const ribbon = new Graphics();
    ribbon
      .roundRect(-ribbonW / 2, ribbonY + 6, ribbonW, ribbonH, ribbonH / 2)
      .fill(0x0369a1);
    ribbon
      .roundRect(-ribbonW / 2, ribbonY, ribbonW, ribbonH, ribbonH / 2)
      .fill(0x0ea5e9)
      .stroke({ color: 0xffffff, width: 4.5 });
    ribbon
      .roundRect(
        -ribbonW / 2 + 16,
        ribbonY + 4,
        ribbonW - 32,
        ribbonH * 0.38,
        12,
      )
      .fill({ color: 0xffffff, alpha: 0.35 });
    this.modalContainer.addChild(ribbon);

    // Title Row with crisp vector gear icon + Text
    const titleRow = new Container();
    titleRow.y = ribbonY + ribbonH / 2 - 2;

    this.gearIcon = VectorIcons.createIcon("gear", 30, 0xffffff);
    titleRow.addChild(this.gearIcon);

    this.titleText = new Text({
      text: this.isInGame ? I18n.t("settings.run") : I18n.t("settings.game"),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 27,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x0369a1, width: 4.5 },
        letterSpacing: 1.5,
      },
    });
    this.titleText.anchor.set(0, 0.5);
    titleRow.addChild(this.titleText);
    this.modalContainer.addChild(titleRow);

    // 4. Top-Right Circular Close Button (HyperCircleButton ❌ with crisp vector cross)
    const closeCornerBtn = new HyperCircleButton({
      vectorIcon: "cross",
      radius: 26,
      color: 0xef4444,
      shadowColor: 0x991b1b,
      strokeWidth: 3.5,
      onClick: () => {
        this.destroy();
        this.onCloseCallback();
      },
    });
    closeCornerBtn.x = cardW / 2 - 28;
    closeCornerBtn.y = -cardH / 2 + 28;
    this.modalContainer.addChild(closeCornerBtn);

    // 5. Settings Content Rows Container
    this.contentContainer = new Container();
    this.contentContainer.y = -cardH / 2 + 76;
    this.modalContainer.addChild(this.contentContainer);

    this.renderSettings();
  }

  private renderSettings() {
    this.contentContainer.removeChildren();
    this.titleText.text = this.isInGame
      ? I18n.t("settings.run")
      : I18n.t("settings.game");

    // Optical centering for gear icon + title text
    const spacing = 12;
    const totalW = 30 + spacing + this.titleText.width;
    if (this.gearIcon) {
      this.gearIcon.x = -totalW / 2 + 15;
      this.titleText.x = -totalW / 2 + 30 + spacing;
    }

    const settings = SaveManager.getSettings();

    // Clean labels, NO blue subtitle notes
    const allRows: {
      id: string;
      label: string;
      iconType: "speaker" | "music" | "vibration" | "lightning";
      iconColor: number;
      pillColor: number;
      enabled: boolean;
      onToggle: () => void;
    }[] = [
      {
        id: "sfx",
        label: I18n.t("settings.sfx"),
        iconType: "speaker",
        iconColor: 0x0284c7,
        pillColor: 0xe0f2fe,
        enabled: !settings.sfxMuted,
        onToggle: () => {
          SaveManager.updateSettings({ sfxMuted: !settings.sfxMuted });
          AudioMixer.setVolumes({ sfxMuted: !settings.sfxMuted });
          this.renderSettings();
        },
      },
      {
        id: "bgm",
        label: I18n.t("settings.bgm"),
        iconType: "music",
        iconColor: 0x2563eb,
        pillColor: 0xdbeafe,
        enabled: !settings.bgmMuted,
        onToggle: () => {
          SaveManager.updateSettings({ bgmMuted: !settings.bgmMuted });
          AudioMixer.setVolumes({ bgmMuted: !settings.bgmMuted });
          this.renderSettings();
        },
      },
      {
        id: "particles",
        label: I18n.t("settings.particles"),
        iconType: "lightning",
        iconColor: 0xeab308,
        pillColor: 0xfef9c3,
        enabled: !settings.lowParticles,
        onToggle: () => {
          const next = !settings.lowParticles;
          SaveManager.updateSettings({ lowParticles: next });
          EventBus.emit("settings:changed", { lowParticles: next });
          this.renderSettings();
        },
      },
      {
        id: "shake",
        label: I18n.t("settings.shake"),
        iconType: "vibration",
        iconColor: 0xf97316,
        pillColor: 0xffedd5,
        enabled: settings.screenShake,
        onToggle: () => {
          const next = !settings.screenShake;
          SaveManager.updateSettings({ screenShake: next });
          EventBus.emit("settings:changed", { screenShake: next });
          this.renderSettings();
        },
      },
    ];

    // Always show all settings rows (both in menu and in-game)
    const rows = allRows;

    const rowCardW = 560;
    const rowCardH = 74;
    const rowGap = 14;
    const rowH = rowCardH + rowGap;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowY = i * rowH;

      // Pure White Row Card with Soft Border
      const rowBg = new Graphics();
      rowBg
        .roundRect(-rowCardW / 2, rowY, rowCardW, rowCardH, 20)
        .fill(0xffffff)
        .stroke({ color: 0xe2e8f0, width: 2 });
      this.contentContainer.addChild(rowBg);

      // Icon Pill with Vector Icon
      const iconPill = new Graphics();
      iconPill
        .circle(-rowCardW / 2 + 42, rowY + rowCardH / 2, 25)
        .fill(r.enabled ? r.pillColor : 0xf1f5f9);
      this.contentContainer.addChild(iconPill);

      const vectorIcon = VectorIcons.createIcon(
        r.iconType,
        28,
        r.enabled ? r.iconColor : 0x94a3b8,
      );
      vectorIcon.x = -rowCardW / 2 + 42;
      vectorIcon.y = rowY + rowCardH / 2;
      this.contentContainer.addChild(vectorIcon);

      // Main Label Text (Enlarged to 24px, vertically centered, bold & clean)
      const label = new Text({
        text: r.label,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 24,
          fontWeight: "800",
          fill: 0x1e293b,
        },
      });
      label.anchor.set(0, 0.5);
      label.x = -rowCardW / 2 + 82;
      label.y = rowY + rowCardH / 2;
      this.contentContainer.addChild(label);

      // Cute 3D Toggle Switch (Knob + Track)
      const toggleSwitch = this.create3DToggleSwitch(r.enabled, r.onToggle);
      toggleSwitch.x = rowCardW / 2 - 64;
      toggleSwitch.y = rowY + rowCardH / 2;
      this.contentContainer.addChild(toggleSwitch);
    }

    // Language Selector Row (Spaced out matching rowH)
    this.addLanguageSelector(rows.length * rowH, rowCardW, rowCardH);

    // Action Buttons at bottom
    const btnW = 240;
    const btnH = 54;
    const langBottomY = rows.length * rowH + rowCardH;
    const gapAboveButtons = 24;
    const actionY = langBottomY + gapAboveButtons + btnH / 2;

    if (this.isInGame) {
      // In-Game: BỎ CUỘC (Give Up) + QUAY LẠI (Resume)
      const giveUpBtn = this.create3DActionButton(
        `🏳️ ${I18n.t("settings.giveUp")}`,
        -btnW / 2 - 12,
        actionY,
        btnW,
        btnH,
        0xef4444,
        0x991b1b,
        0x991b1b,
        () => {
          AudioMixer.playSFX("sfx_button");
          this.showGiveUpConfirm();
        },
      );
      this.contentContainer.addChild(giveUpBtn);

      const resumeBtn = this.create3DActionButton(
        `▶️ ${I18n.t("settings.resume")}`,
        btnW / 2 + 12,
        actionY,
        btnW,
        btnH,
        0x10b981,
        0x047857,
        0x047857,
        () => {
          AudioMixer.playSFX("sfx_button");
          this.destroy();
          this.onCloseCallback();
        },
      );
      this.contentContainer.addChild(resumeBtn);
    } else {
      // In-Menu: XÓA DỮ LIỆU (Reset) + QUAY LẠI (Back)
      const resetBtn = this.create3DActionButton(
        `🗑️ ${I18n.t("settings.reset")}`,
        -btnW / 2 - 12,
        actionY,
        btnW,
        btnH,
        0xef4444,
        0x991b1b,
        0x991b1b,
        () => {
          AudioMixer.playSFX("sfx_button");
          this.showResetConfirm();
        },
      );
      this.contentContainer.addChild(resetBtn);

      const backBtn = this.create3DActionButton(
        `↩️ ${I18n.t("settings.back")}`,
        btnW / 2 + 12,
        actionY,
        btnW,
        btnH,
        0x0284c7,
        0x0369a1,
        0x0369a1,
        () => {
          AudioMixer.playSFX("sfx_button");
          this.destroy();
          this.onCloseCallback();
        },
      );
      this.contentContainer.addChild(backBtn);
    }
  }

  private addLanguageSelector(
    y: number,
    rowCardW = 560,
    rowCardH = 74,
  ) {
    const row = new Container();
    row.y = y;

    const bg = new Graphics();
    bg.roundRect(-rowCardW / 2, 0, rowCardW, rowCardH, 20)
      .fill(0xffffff)
      .stroke({ color: 0xe2e8f0, width: 2 });
    row.addChild(bg);

    const label = new Text({
      text: `🌐 ${I18n.t("settings.language")}`,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 23,
        fontWeight: "800",
        fill: 0x1e293b,
      },
    });
    label.anchor.set(0, 0.5);
    label.x = -rowCardW / 2 + 25;
    label.y = rowCardH / 2;
    row.addChild(label);

    const makeChoice = (lang: Language, text: string, x: number) => {
      const choice = new Container();
      const active = I18n.language === lang;

      const choiceW = 120;
      const choiceH = 46;

      const choiceBg = new Graphics();
      if (active) {
        // 3D Shadow Base
        const sh = new Graphics();
        sh.roundRect(-choiceW / 2, -choiceH / 2 + 3, choiceW, choiceH, 23).fill(
          0x0369a1,
        );
        choice.addChild(sh);

        choiceBg
          .roundRect(-choiceW / 2, -choiceH / 2, choiceW, choiceH, 23)
          .fill(0x0284c7)
          .stroke({ color: 0xffffff, width: 2.5 });
        choiceBg
          .roundRect(
            -choiceW / 2 + 4,
            -choiceH / 2 + 2,
            choiceW - 8,
            choiceH * 0.38,
            8,
          )
          .fill({ color: 0xffffff, alpha: 0.28 });
      } else {
        choiceBg
          .roundRect(-choiceW / 2, -choiceH / 2, choiceW, choiceH, 23)
          .fill(0xf1f5f9)
          .stroke({ color: 0xcbd5e1, width: 1.8 });
      }
      choice.addChild(choiceBg);

      const choiceText = new Text({
        text,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 17,
          fontWeight: "900",
          fill: active ? 0xffffff : 0x475569,
          stroke: active ? { color: 0x0369a1, width: 2 } : undefined,
        },
      });
      choiceText.anchor.set(0.5);
      choice.addChild(choiceText);
      choice.x = x;
      choice.y = rowCardH / 2;
      choice.eventMode = "static";
      choice.cursor = "pointer";
      choice.on("pointerdown", () => {
        if (I18n.language === lang) return;
        AudioMixer.playSFX("sfx_button");
        I18n.setLanguage(lang);
        this.renderSettings();
      });
      row.addChild(choice);
    };

    makeChoice("vi", "Tiếng Việt", rowCardW / 2 - 192);
    makeChoice("en", "English", rowCardW / 2 - 68);
    this.contentContainer.addChild(row);
  }

  /**
   * Custom in-game confirmation dialog for Reset Progress
   */
  private showResetConfirm() {
    if (this.resetConfirm) return;

    const overlay = new Container();
    overlay.x = 0;
    overlay.y = 0;

    // Dim background
    const shade = new Graphics();
    shade
      .rect(
        -GAME_WIDTH,
        -this.modalHeight,
        GAME_WIDTH * 3,
        this.modalHeight * 3,
      )
      .fill({ color: 0x000000, alpha: 0.72 });
    shade.eventMode = "static";
    shade.on("pointerdown", (event) => event.stopPropagation());
    overlay.addChild(shade);

    // 3D Dialog Card Base
    const cardW = 540;
    const cardH = 320;

    const cardShadow = new Graphics();
    cardShadow
      .roundRect(-cardW / 2 + 6, -cardH / 2 + 12, cardW, cardH, 24)
      .fill({ color: 0x000000, alpha: 0.5 });
    overlay.addChild(cardShadow);

    const card = new Graphics();
    card.roundRect(-cardW / 2, -cardH / 2 + 6, cardW, cardH, 24).fill(0x0369a1);
    card
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 24)
      .fill(0xfbfaf5)
      .stroke({ color: 0x0284c7, width: 5 });
    overlay.addChild(card);

    // Title
    const title = new Text({
      text: I18n.t("settings.resetTitle"),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 26,
        fontWeight: "900",
        fill: 0xdc2626,
        align: "center",
      },
    });
    title.anchor.set(0.5);
    title.y = -95;
    overlay.addChild(title);

    // Body
    const body = new Text({
      text: I18n.t("settings.resetBody"),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 18,
        fontWeight: "700",
        fill: 0x334155,
        align: "center",
        wordWrap: true,
        wordWrapWidth: 460,
        lineHeight: 27,
      },
    });
    body.anchor.set(0.5);
    body.y = -20;
    overlay.addChild(body);

    // 2 Action Buttons
    const makeButton = (
      label: string,
      x: number,
      color: number,
      shadow: number,
      onClick: () => void,
    ) => {
      const button = new Container();
      button.x = x;
      button.y = 85;

      const buttonBg = new Graphics();
      buttonBg.roundRect(-95, -28 + 4, 190, 56, 28).fill(shadow);
      buttonBg
        .roundRect(-95, -28, 190, 56, 28)
        .fill(color)
        .stroke({ color: 0xffffff, width: 3 });
      button.addChild(buttonBg);

      const text = new Text({
        text: label,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 19,
          fontWeight: "900",
          fill: 0xffffff,
        },
      });
      text.anchor.set(0.5);
      button.addChild(text);

      button.eventMode = "static";
      button.cursor = "pointer";
      button.on("pointerdown", onClick);
      overlay.addChild(button);
    };

    makeButton(I18n.t("settings.cancel"), -110, 0x64748b, 0x334155, () =>
      this.closeResetConfirm(),
    );
    makeButton(I18n.t("settings.confirm"), 110, 0xdc2626, 0x991b1b, () => {
      SaveManager.resetProgress();
      this.closeResetConfirm();
      this.renderSettings();
      AudioMixer.playSFX("sfx_button");
    });

    this.resetConfirm = overlay;
    this.modalContainer.addChild(overlay);
  }

  private closeResetConfirm() {
    if (this.resetConfirm) {
      this.modalContainer.removeChild(this.resetConfirm);
      this.resetConfirm.destroy({ children: true });
      this.resetConfirm = undefined;
    }
  }

  /**
   * Custom in-game confirmation dialog for Give Up / Abandon Run
   */
  private showGiveUpConfirm() {
    if (this.giveUpConfirm) return;

    const overlay = new Container();
    overlay.x = 0;
    overlay.y = 0;

    // Dim background
    const shade = new Graphics();
    shade
      .rect(
        -GAME_WIDTH,
        -this.modalHeight,
        GAME_WIDTH * 3,
        this.modalHeight * 3,
      )
      .fill({ color: 0x000000, alpha: 0.72 });
    shade.eventMode = "static";
    shade.on("pointerdown", (event) => event.stopPropagation());
    overlay.addChild(shade);

    // 3D Dialog Card Base
    const cardW = 540;
    const cardH = 320;

    const cardShadow = new Graphics();
    cardShadow
      .roundRect(-cardW / 2 + 6, -cardH / 2 + 12, cardW, cardH, 24)
      .fill({ color: 0x000000, alpha: 0.5 });
    overlay.addChild(cardShadow);

    const card = new Graphics();
    card.roundRect(-cardW / 2, -cardH / 2 + 6, cardW, cardH, 24).fill(0x0369a1);
    card
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 24)
      .fill(0xfbfaf5)
      .stroke({ color: 0x0284c7, width: 5 });
    overlay.addChild(card);

    // Title
    const title = new Text({
      text: I18n.t("settings.giveUpTitle"),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 26,
        fontWeight: "900",
        fill: 0xdc2626,
        align: "center",
      },
    });
    title.anchor.set(0.5);
    title.y = -95;
    overlay.addChild(title);

    // Body
    const body = new Text({
      text: I18n.t("settings.giveUpBody"),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 18,
        fontWeight: "700",
        fill: 0x334155,
        align: "center",
        wordWrap: true,
        wordWrapWidth: 460,
        lineHeight: 27,
      },
    });
    body.anchor.set(0.5);
    body.y = -20;
    overlay.addChild(body);

    // 2 Action Buttons
    const makeButton = (
      label: string,
      x: number,
      color: number,
      shadow: number,
      onClick: () => void,
    ) => {
      const button = new Container();
      button.x = x;
      button.y = 85;

      const buttonBg = new Graphics();
      buttonBg.roundRect(-95, -28 + 4, 190, 56, 28).fill(shadow);
      buttonBg
        .roundRect(-95, -28, 190, 56, 28)
        .fill(color)
        .stroke({ color: 0xffffff, width: 3 });
      button.addChild(buttonBg);

      const text = new Text({
        text: label,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 19,
          fontWeight: "900",
          fill: 0xffffff,
        },
      });
      text.anchor.set(0.5);
      button.addChild(text);

      button.eventMode = "static";
      button.cursor = "pointer";
      button.on("pointerdown", onClick);
      overlay.addChild(button);
    };

    makeButton(I18n.t("settings.cancel"), -110, 0x64748b, 0x334155, () =>
      this.closeGiveUpConfirm(),
    );
    makeButton(I18n.t("settings.confirm"), 110, 0xdc2626, 0x991b1b, () => {
      AudioMixer.playSFX("sfx_button");
      this.closeGiveUpConfirm();
      this.destroy();
      if (this.onGiveUpCallback) {
        this.onGiveUpCallback();
      } else {
        EventBus.emit("run:ended", {
          victory: false,
          distance: 0,
          kills: 0,
          score: 0,
        });
      }
    });

    this.giveUpConfirm = overlay;
    this.modalContainer.addChild(overlay);
  }

  private closeGiveUpConfirm() {
    if (this.giveUpConfirm) {
      this.modalContainer.removeChild(this.giveUpConfirm);
      this.giveUpConfirm.destroy({ children: true });
      this.giveUpConfirm = undefined;
    }
  }

  /**
   * Helper to create juicy 3D tactile action buttons
   */
  private create3DActionButton(
    label: string,
    x: number,
    y: number,
    w: number,
    h: number,
    faceColor: number,
    shadowColor: number,
    strokeColor: number,
    onClick: () => void,
  ): Container {
    const btn = new Container();
    btn.x = x;
    btn.y = y;

    const btnContent = new Container();
    btn.addChild(btnContent);

    // 3D Shadow Base
    const shadow = new Graphics();
    shadow.roundRect(-w / 2, -h / 2 + 4, w, h, 16).fill(shadowColor);
    btn.addChildAt(shadow, 0);

    // Button Face
    const face = new Graphics();
    face
      .roundRect(-w / 2, -h / 2, w, h, 16)
      .fill(faceColor)
      .stroke({ color: 0xffffff, width: 2.5 });
    // Glossy Top Highlight
    face
      .roundRect(-w / 2 + 4, -h / 2 + 2, w - 8, h * 0.38, 8)
      .fill({ color: 0xffffff, alpha: 0.28 });
    btnContent.addChild(face);

    const text = new Text({
      text: label,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 18,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: strokeColor, width: 2 },
        letterSpacing: 0.5,
      },
    });
    text.anchor.set(0.5);
    btnContent.addChild(text);

    btn.eventMode = "static";
    btn.cursor = "pointer";
    btn.on("pointerover", () => btn.scale.set(1.04));
    btn.on("pointerout", () => {
      btn.scale.set(1.0);
      btnContent.y = 0;
    });
    btn.on("pointerdown", () => {
      btnContent.y = 3;
      btn.scale.set(0.96);
    });
    btn.on("pointerup", () => {
      btnContent.y = 0;
      btn.scale.set(1.0);
      onClick();
    });

    return btn;
  }

  /**
   * 3D Toggle Switch Component
   */
  private create3DToggleSwitch(
    enabled: boolean,
    onToggle: () => void,
  ): Container {
    const sw = new Container();
    sw.eventMode = "static";
    sw.cursor = "pointer";

    const width = 88;
    const height = 46;
    const radius = 23;

    const track = new Graphics();
    track
      .roundRect(-width / 2, -height / 2 + 3, width, height, radius)
      .fill(enabled ? 0x15803d : 0x94a3b8);
    track
      .roundRect(-width / 2, -height / 2, width, height, radius)
      .fill(enabled ? 0x22c55e : 0xcbd5e1)
      .stroke({ color: 0xffffff, width: 2.5 });
    sw.addChild(track);

    const knob = new Graphics();
    const knobX = enabled ? width / 2 - 23 : -width / 2 + 23;
    knob.circle(knobX, 2, 18).fill(0x94a3b8);
    knob
      .circle(knobX, 0, 18)
      .fill(0xffffff)
      .stroke({ color: enabled ? 0x16a34a : 0x94a3b8, width: 2 });
    sw.addChild(knob);

    const stateText = new Text({
      text: enabled ? I18n.t("settings.on") : I18n.t("settings.off"),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 15,
        fontWeight: "900",
        fill: enabled ? 0xffffff : 0x64748b,
      },
    });
    stateText.anchor.set(0.5);
    stateText.x = enabled ? -13 : 13;
    stateText.y = 0;
    sw.addChild(stateText);

    sw.on("pointerdown", () => {
      AudioMixer.playSFX("sfx_button");
      onToggle();
    });

    return sw;
  }

  public resize(_width: number, height: number) {
    this.modalHeight = Math.max(GAME_HEIGHT, height);
    this.modalContainer.y = this.modalHeight / 2;
  }
}
