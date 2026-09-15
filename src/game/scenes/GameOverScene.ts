import { Container, Text, Graphics, BlurFilter } from "pixi.js";
import { Scene, SceneManager } from "./SceneManager";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { AudioMixer } from "../utils/AudioMixer";
import { RunState } from "../utils/RunState";
import { SaveManager } from "../utils/SaveManager";
import { GarageModal } from "../ui/GarageModal";
import { SettingsModal } from "../ui/SettingsModal";
import { HyperButton, HyperCircleButton } from "../ui/HyperButton";
import { VectorIcons, type VectorIconType } from "../ui/VectorIcons";
import { I18n } from "../utils/I18n";
import { EventBus } from "../utils/EventBus";

export class GameOverScene extends Container implements Scene {
  private contentLayer: Container;
  private modalContainer: Container;
  private playAgainBtn: HyperButton;
  private garageBtn: HyperButton;
  private menuBtn: HyperButton;
  private titleText!: Text;
  private bg!: Graphics;
  private currentHeight: number = GAME_HEIGHT;
  private activeModal:
    (Container & { resize?(w: number, h: number): void }) | null = null;

  private readonly cardW = 636;
  private readonly cardH = 750;

  constructor() {
    super();

    const initialH = SceneManager.getVirtualSize?.()?.height ?? GAME_HEIGHT;
    this.currentHeight = Math.max(GAME_HEIGHT, initialH);

    // Group background and gameover card in contentLayer for blur effects
    this.contentLayer = new Container();
    this.addChild(this.contentLayer);

    // 1. Dark Backdrop (Oversized to guarantee zero gaps at bottom)
    this.bg = new Graphics();
    this.bg.rect(
      -100,
      -100,
      GAME_WIDTH + 200,
      Math.max(3000, this.currentHeight + 400),
    );
    this.bg.fill({ color: 0x090a0f, alpha: 0.92 });
    this.contentLayer.addChild(this.bg);

    // Top-Right Settings Button (HyperCircleButton with crisp vector gear)
    const settingsBtn = new HyperCircleButton({
      vectorIcon: "gear",
      radius: 26,
      color: 0x0ea5e9,
      shadowColor: 0x0369a1,
      strokeWidth: 3.5,
      onClick: () => {
        this.contentLayer.filters = [
          new BlurFilter({ strength: 8, quality: 3 }),
        ];
        const modal = new SettingsModal(
          () => {
            this.activeModal = null;
            this.contentLayer.filters = [];
          },
          false,
          this.currentHeight,
        );
        this.activeModal = modal;
        this.addChild(modal);
      },
    });
    settingsBtn.x = GAME_WIDTH - 44;
    settingsBtn.y = 40;
    this.contentLayer.addChild(settingsBtn);

    // 2. Modal Container for Card
    this.modalContainer = new Container();
    this.modalContainer.x = GAME_WIDTH / 2;
    this.contentLayer.addChild(this.modalContainer);

    const isVictory = RunState.current.victory;

    // Soft Card Shadow
    const cardShadow = new Graphics();
    cardShadow
      .roundRect(
        -this.cardW / 2 + 8,
        -this.cardH / 2 + 16,
        this.cardW,
        this.cardH,
        28,
      )
      .fill({ color: 0x000000, alpha: 0.5 });
    this.modalContainer.addChild(cardShadow);

    // Thick 3D Border (Green for Victory, Crimson for Defeat)
    const borderColor = isVictory ? 0x15803d : 0x991b1b;
    const borderShadow = isVictory ? 0x14532d : 0x450a0a;

    const borderBg = new Graphics();
    borderBg
      .roundRect(
        -this.cardW / 2,
        -this.cardH / 2 + 8,
        this.cardW,
        this.cardH,
        28,
      )
      .fill(borderShadow);
    borderBg
      .roundRect(-this.cardW / 2, -this.cardH / 2, this.cardW, this.cardH, 28)
      .fill(borderColor)
      .stroke({ color: 0xffffff, width: 4.5 });
    this.modalContainer.addChild(borderBg);

    // Bright Cream Card Face
    const cardFace = new Graphics();
    cardFace
      .roundRect(
        -this.cardW / 2 + 12,
        -this.cardH / 2 + 12,
        this.cardW - 24,
        this.cardH - 24,
        20,
      )
      .fill(0xf8fafc);
    this.modalContainer.addChild(cardFace);

    // Subtle Gloss Rim (top highlight that never cuts into text)
    const glossRim = new Graphics();
    glossRim
      .roundRect(
        -this.cardW / 2 + 14,
        -this.cardH / 2 + 14,
        this.cardW - 28,
        22,
        11,
      )
      .fill({ color: 0xffffff, alpha: 0.22 });
    this.modalContainer.addChild(glossRim);

    // Floating 3D Title Ribbon (Stretched out, majestic)
    const ribbonW = 460;
    const ribbonH = 86;
    const ribbonY = -this.cardH / 2 - 12;
    const ribbonColor = isVictory ? 0x22c55e : 0xef4444;
    const ribbonShadow = isVictory ? 0x15803d : 0x991b1b;

    const ribbon = new Graphics();
    ribbon
      .roundRect(-ribbonW / 2, ribbonY + 6, ribbonW, ribbonH, ribbonH / 2)
      .fill(ribbonShadow);
    ribbon
      .roundRect(-ribbonW / 2, ribbonY, ribbonW, ribbonH, ribbonH / 2)
      .fill(ribbonColor)
      .stroke({ color: 0xffffff, width: 4.5 });
    ribbon
      .roundRect(
        -ribbonW / 2 + 16,
        ribbonY + 4,
        ribbonW - 32,
        ribbonH * 0.38,
        14,
      )
      .fill({ color: 0xffffff, alpha: 0.3 });
    this.modalContainer.addChild(ribbon);

    this.titleText = new Text({
      text: isVictory ? I18n.t("gameover.victory") : I18n.t("gameover.defeat"),
      resolution: 2,
      roundPixels: true,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 36,
        fontWeight: "900",
        fill: 0xffffff,
        dropShadow: {
          color: ribbonShadow,
          blur: 0,
          distance: 3,
          angle: Math.PI / 2,
        },
        stroke: { color: ribbonShadow, width: 2 },
        letterSpacing: 2,
      },
    });
    this.titleText.anchor.set(0.5);
    this.titleText.y = ribbonY + ribbonH / 2 - 2;
    this.modalContainer.addChild(this.titleText);

    // Build the deluxe score banner and enlarged stats list
    this.buildStatsList();

    // 3. Action Buttons (Clean 2-tier layout: primary wide CTA + 2 side-by-side secondary)
    this.playAgainBtn = new HyperButton({
      label: I18n.t("gameover.replay"),
      vectorIcon: "play",
      width: 480,
      height: 86,
      fontSize: 28,
      color: 0xf59e0b,
      shadowColor: 0xb45309,
      pulse: true,
      onClick: () => {
        SceneManager.switchScene("RunScene");
      },
    });
    this.contentLayer.addChild(this.playAgainBtn);

    this.garageBtn = new HyperButton({
      label: I18n.t("gameover.upgrade"),
      vectorIcon: "wrench",
      width: 236,
      height: 72,
      fontSize: 20,
      color: 0x10b981,
      shadowColor: 0x047857,
      onClick: () => {
        this.contentLayer.filters = [
          new BlurFilter({ strength: 8, quality: 3 }),
        ];
        const modal = new GarageModal(() => {
          this.activeModal = null;
          this.contentLayer.filters = [];
          this.buildStatsList();
        }, this.currentHeight);
        this.activeModal = modal;
        this.addChild(modal);
      },
    });
    this.contentLayer.addChild(this.garageBtn);

    this.menuBtn = new HyperButton({
      label: I18n.t("gameover.home"),
      vectorIcon: "home",
      width: 236,
      height: 72,
      fontSize: 20,
      color: 0x0ea5e9,
      shadowColor: 0x0369a1,
      onClick: () => {
        SceneManager.switchScene("MenuScene");
      },
    });
    this.contentLayer.addChild(this.menuBtn);

    // Initial positioning calculation
    this.applyLayout(this.currentHeight);

    EventBus.on("language:changed", () => {
      this.playAgainBtn.setLabel(I18n.t("gameover.replay"));
      this.garageBtn.setLabel(I18n.t("gameover.upgrade"));
      this.menuBtn.setLabel(I18n.t("gameover.home"));
      const win = RunState.current.victory;
      this.titleText.text = win
        ? I18n.t("gameover.victory")
        : I18n.t("gameover.defeat");
      this.buildStatsList();
    });
  }

  private buildStatsList() {
    const rs = RunState.current;
    const bestScore = RunState.getBestScore();
    const curScrap = SaveManager.getScrap();
    const scoreVal = rs.getScore();
    const isNewRecord = scoreVal >= bestScore && scoreVal > 0;

    const statTag = "__stat_item__";
    for (let i = this.modalContainer.children.length - 1; i >= 0; i--) {
      if (this.modalContainer.children[i].label === statTag) {
        this.modalContainer.removeChildAt(i);
      }
    }

    // ─── Deluxe Hero Score Showcase (Spacious, prominent 118px box) ───
    const scoreBoxY = -211;
    const scoreBoxW = 580;
    const scoreBoxH = 118;

    const scoreBoxBg = new Graphics();
    scoreBoxBg.label = statTag;
    scoreBoxBg
      .roundRect(
        -scoreBoxW / 2,
        scoreBoxY - scoreBoxH / 2,
        scoreBoxW,
        scoreBoxH,
        18,
      )
      .fill(0x0f172a)
      .stroke({
        color: isNewRecord ? 0xf59e0b : 0x38bdf8,
        width: 2.5,
      });
    this.modalContainer.addChild(scoreBoxBg);

    // Score Header Row (Icon + Label on left, Record Badge on right)
    const scoreHeaderY = scoreBoxY - 26;

    const trophyIcon = VectorIcons.createIcon("trophy", 18, 0xfacc15);
    trophyIcon.label = statTag;
    trophyIcon.x = -scoreBoxW / 2 + 24;
    trophyIcon.y = scoreHeaderY;
    this.modalContainer.addChild(trophyIcon);

    const scoreTitleText = new Text({
      text: I18n.t("stats.scoreTitle"),
      resolution: 2,
      roundPixels: true,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 16,
        fontWeight: "800",
        fill: 0x94a3b8,
        letterSpacing: 1.2,
      },
    });
    scoreTitleText.label = statTag;
    scoreTitleText.anchor.set(0, 0.5);
    scoreTitleText.x = -scoreBoxW / 2 + 46;
    scoreTitleText.y = scoreHeaderY;
    this.modalContainer.addChild(scoreTitleText);

    if (isNewRecord) {
      const recordPill = new Graphics();
      recordPill.label = statTag;
      recordPill
        .roundRect(scoreBoxW / 2 - 170, scoreHeaderY - 14, 154, 28, 14)
        .fill(0xfef08a)
        .stroke({ color: 0xf59e0b, width: 1.5 });
      this.modalContainer.addChild(recordPill);

      const recordText = new Text({
        text: `⭐ ${I18n.t("stats.newRecord")}`,
        resolution: 2,
        roundPixels: true,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 14,
          fontWeight: "900",
          fill: 0xb45309,
        },
      });
      recordText.label = statTag;
      recordText.anchor.set(0.5);
      recordText.x = scoreBoxW / 2 - 93;
      recordText.y = scoreHeaderY;
      this.modalContainer.addChild(recordText);
    } else {
      const bestText = new Text({
        text: `👑 ${I18n.t("stats.best")}: ${bestScore.toLocaleString()}`,
        resolution: 2,
        roundPixels: true,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 15,
          fontWeight: "800",
          fill: 0x38bdf8,
        },
      });
      bestText.label = statTag;
      bestText.anchor.set(1, 0.5);
      bestText.x = scoreBoxW / 2 - 18;
      bestText.y = scoreHeaderY;
      this.modalContainer.addChild(bestText);
    }

    // Giant Hero Score Value with Crisp Drop Shadow
    const scoreValText = new Text({
      text: scoreVal.toLocaleString(),
      resolution: 2,
      roundPixels: true,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 54,
        fontWeight: "900",
        fill: 0xfacc15,
        dropShadow: {
          color: 0x78350f,
          blur: 0,
          distance: 3.5,
          angle: Math.PI / 2,
        },
        stroke: { color: 0x78350f, width: 2 },
        letterSpacing: 2,
      },
    });
    scoreValText.label = statTag;
    scoreValText.anchor.set(0.5);
    scoreValText.x = 0;
    scoreValText.y = scoreBoxY + 20;
    this.modalContainer.addChild(scoreValText);

    // ─── 6 Enlarged Stats Rows with Crisp Vector Icon Pills ───
    const stats: Array<{
      label: string;
      value: string;
      vectorIcon: VectorIconType;
      pillColor: number;
      isHighlight?: boolean;
    }> = [
      {
        label: I18n.t("stats.distance"),
        value: `${Math.floor(rs.distance)} m`,
        vectorIcon: "road",
        pillColor: 0x0284c7, // Sky Blue
      },
      {
        label: I18n.t("stats.kills"),
        value: `${rs.kills}`,
        vectorIcon: "crosshair",
        pillColor: 0xe11d48, // Rose Red
      },
      {
        label: I18n.t("stats.level"),
        value: `${rs.level}`,
        vectorIcon: "star",
        pillColor: 0xd97706, // Amber Gold
      },
      {
        label: I18n.t("stats.scrapRun"),
        value: `+${rs.scrap}`,
        vectorIcon: "bolt",
        pillColor: 0x059669, // Emerald Green
        isHighlight: true,
      },
      {
        label: I18n.t("stats.scrapTotal"),
        value: `${curScrap}`,
        vectorIcon: "coin",
        pillColor: 0xb45309, // Bronze Amber
        isHighlight: true,
      },
      {
        label: I18n.t("stats.time"),
        value: `${Math.floor(rs.runTime / 60)}:${String(Math.floor(rs.runTime % 60)).padStart(2, "0")}`,
        vectorIcon: "clock",
        pillColor: 0x6366f1, // Indigo Purple
      },
    ];

    // Starts at -96 with spacious 74px row steps
    const startY = -96;
    const rowStep = 74;
    const rowW = 580;
    const rowH = 60;

    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      const y = startY + i * rowStep;

      // Row background pill
      const rowBg = new Graphics();
      rowBg.label = statTag;
      rowBg
        .roundRect(-rowW / 2, y - rowH / 2, rowW, rowH, 16)
        .fill(s.isHighlight ? 0xfef9c3 : i % 2 === 0 ? 0xffffff : 0xf1f5f9)
        .stroke({
          color: s.isHighlight ? 0xfacc15 : 0xe2e8f0,
          width: s.isHighlight ? 2 : 1.5,
        });
      this.modalContainer.addChild(rowBg);

      // Left Vector Icon Pill
      const iconPill = new Graphics();
      iconPill.label = statTag;
      iconPill
        .roundRect(-rowW / 2 + 10, y - 19, 38, 38, 11)
        .fill(s.pillColor);
      this.modalContainer.addChild(iconPill);

      const icon = VectorIcons.createIcon(s.vectorIcon, 22, 0xffffff);
      icon.label = statTag;
      icon.x = -rowW / 2 + 29;
      icon.y = y;
      this.modalContainer.addChild(icon);

      // Stat Label (Razor sharp with resolution: 2)
      const labelText = new Text({
        text: s.label,
        resolution: 2,
        roundPixels: true,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 21,
          fontWeight: "800",
          fill: s.isHighlight ? 0x78350f : 0x334155,
        },
      });
      labelText.label = statTag;
      labelText.anchor.set(0, 0.5);
      labelText.x = -rowW / 2 + 60;
      labelText.y = y;
      this.modalContainer.addChild(labelText);

      // Stat Value (Razor sharp with resolution: 2)
      const valText = new Text({
        text: s.value,
        resolution: 2,
        roundPixels: true,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 25,
          fontWeight: "900",
          fill: s.isHighlight ? 0xb45309 : 0x0f172a,
        },
      });
      valText.label = statTag;
      valText.anchor.set(1, 0.5);
      valText.x = rowW / 2 - 20;
      valText.y = y;
      this.modalContainer.addChild(valText);
    }
  }

  private applyLayout(height: number) {
    this.currentHeight = height;

    // Fixed 1.0 scale: 100% native vector crispness
    this.modalContainer.scale.set(1.0);
    this.playAgainBtn.scale.set(1.0);
    this.garageBtn.scale.set(1.0);
    this.menuBtn.scale.set(1.0);

    const playAgainH = 86;
    const secondaryH = 72;

    // Dynamically stretch gaps when screen is tall to utilize generous screen area
    const extraH = Math.max(0, height - 1280);
    const gap1 = Math.round(44 + Math.min(26, extraH * 0.12)); // 44px -> 70px
    const gap2 = Math.round(32 + Math.min(20, extraH * 0.08)); // 32px -> 52px

    const totalBlockH = this.cardH + gap1 + playAgainH + gap2 + secondaryH;
    const topSafe = 76;
    const startGroupY = Math.max(topSafe + 16, Math.round((height - totalBlockH) / 2));

    // Card center Y
    this.modalContainer.y = startGroupY + Math.round(this.cardH / 2);

    // Button Row 1 (Play Again): gap1 below card bottom
    this.playAgainBtn.x = GAME_WIDTH / 2;
    this.playAgainBtn.y =
      this.modalContainer.y + Math.round(this.cardH / 2 + gap1 + playAgainH / 2);

    // Button Row 2 (Garage & Home side-by-side): gap2 below Play Again
    const secondaryY =
      this.playAgainBtn.y + Math.round(playAgainH / 2 + gap2 + secondaryH / 2);
    this.garageBtn.x = GAME_WIDTH / 2 - 132;
    this.garageBtn.y = secondaryY;

    this.menuBtn.x = GAME_WIDTH / 2 + 132;
    this.menuBtn.y = secondaryY;
  }

  start() {
    const isVictory = RunState.current.victory;
    AudioMixer.playBGM(isVictory ? "bgm_victory" : "bgm_gameover");
  }

  update(dt: number) {
    const dtSec = dt * (1 / 60);
    this.playAgainBtn.updatePulse(dtSec);
  }

  resize(_width: number, height: number) {
    this.bg.clear();
    this.bg.rect(-100, -100, GAME_WIDTH + 200, Math.max(3000, height + 400));
    this.bg.fill({ color: 0x090a0f, alpha: 0.92 });

    this.applyLayout(height);

    if (this.activeModal?.resize) {
      this.activeModal.resize(_width, height);
    }
  }
}
