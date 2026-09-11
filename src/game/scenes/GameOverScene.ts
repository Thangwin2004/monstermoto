import { Container, Text, Graphics, BlurFilter } from "pixi.js";
import { Scene, SceneManager } from "./SceneManager";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { AudioMixer } from "../utils/AudioMixer";
import { RunState } from "../utils/RunState";
import { SaveManager } from "../utils/SaveManager";
import { GarageModal } from "../ui/GarageModal";
import { SettingsModal } from "../ui/SettingsModal";
import { HyperButton, HyperCircleButton } from "../ui/HyperButton";
import { I18n } from "../utils/I18n";
import { EventBus } from "../utils/EventBus";

export class GameOverScene extends Container implements Scene {
  private contentLayer: Container;
  private modalContainer: Container;
  private playAgainBtn: HyperButton;
  private garageBtn!: HyperButton;
  private menuBtn!: HyperButton;
  private titleText!: Text;
  private bg!: Graphics;
  private currentHeight: number = GAME_HEIGHT;
  private animTime: number = 0;
  private activeModal: (Container & { resize?(w: number, h: number): void }) | null = null;

  constructor() {
    super();

    const initialH = SceneManager.getVirtualSize?.()?.height ?? GAME_HEIGHT;
    this.currentHeight = Math.max(GAME_HEIGHT, initialH);

    // Group background and gameover card in contentLayer for blur effects
    this.contentLayer = new Container();
    this.addChild(this.contentLayer);

    // 1. Dark Backdrop (Oversized to guarantee zero gaps at bottom)
    this.bg = new Graphics();
    this.bg.rect(-100, -100, GAME_WIDTH + 200, Math.max(3000, this.currentHeight + 400));
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

    // 2. Modal Container - Perfectly centered in the available vertical span
    const topSafe = 80;
    const bottomButtonsTop = this.currentHeight - 280;
    this.modalContainer = new Container();
    this.modalContainer.x = GAME_WIDTH / 2;
    this.modalContainer.y = Math.max(380, (topSafe + bottomButtonsTop) / 2);
    this.contentLayer.addChild(this.modalContainer);

    const isVictory = RunState.current.victory;
    const cardW = 600;
    const cardH = 580;

    // Soft Card Shadow
    const cardShadow = new Graphics();
    cardShadow
      .roundRect(-cardW / 2 + 8, -cardH / 2 + 16, cardW, cardH, 28)
      .fill({ color: 0x000000, alpha: 0.5 });
    this.modalContainer.addChild(cardShadow);

    // Thick 3D Border (Green for Victory, Crimson for Defeat)
    const borderColor = isVictory ? 0x15803d : 0x991b1b;
    const borderShadow = isVictory ? 0x14532d : 0x450a0a;

    const borderBg = new Graphics();
    borderBg
      .roundRect(-cardW / 2, -cardH / 2 + 8, cardW, cardH, 28)
      .fill(borderShadow);
    borderBg
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 28)
      .fill(borderColor)
      .stroke({ color: 0xffffff, width: 4.5 });
    this.modalContainer.addChild(borderBg);

    // Bright Cream Card Face
    const cardFace = new Graphics();
    cardFace
      .roundRect(-cardW / 2 + 14, -cardH / 2 + 14, cardW - 28, cardH - 28, 20)
      .fill(0xf8fafc);
    this.modalContainer.addChild(cardFace);

    // Floating 3D Title Ribbon
    const ribbonW = 400;
    const ribbonH = 76;
    const ribbonY = -cardH / 2;
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
        12,
      )
      .fill({ color: 0xffffff, alpha: 0.3 });
    this.modalContainer.addChild(ribbon);

    this.titleText = new Text({
      text: isVictory ? I18n.t("gameover.victory") : I18n.t("gameover.defeat"),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 32,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: ribbonShadow, width: 4.5 },
        letterSpacing: 2,
      },
    });
    this.titleText.anchor.set(0.5);
    this.titleText.y = ribbonY + ribbonH / 2 - 2;
    this.modalContainer.addChild(this.titleText);

    this.buildStatsList();

    // 3. Hyper-Casual Action Buttons with Crisp Vector Icons
    this.playAgainBtn = new HyperButton({
      label: I18n.t("gameover.replay"),
      vectorIcon: "play",
      width: 360,
      height: 84,
      fontSize: 30,
      color: 0xf59e0b,
      shadowColor: 0xb45309,
      pulse: true,
      onClick: () => {
        SceneManager.switchScene("RunScene");
      },
    });
    this.playAgainBtn.x = GAME_WIDTH / 2;
    this.playAgainBtn.y = this.currentHeight - 250;
    this.contentLayer.addChild(this.playAgainBtn);

    this.garageBtn = new HyperButton({
      label: I18n.t("gameover.upgrade"),
      vectorIcon: "wrench",
      width: 320,
      height: 72,
      fontSize: 25,
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
    this.garageBtn.x = GAME_WIDTH / 2;
    this.garageBtn.y = this.currentHeight - 160;
    this.contentLayer.addChild(this.garageBtn);

    this.menuBtn = new HyperButton({
      label: I18n.t("gameover.home"),
      vectorIcon: "home",
      width: 280,
      height: 62,
      fontSize: 22,
      color: 0x0ea5e9,
      shadowColor: 0x0369a1,
      onClick: () => {
        SceneManager.switchScene("MenuScene");
      },
    });
    this.menuBtn.x = GAME_WIDTH / 2;
    this.menuBtn.y = this.currentHeight - 76;
    this.contentLayer.addChild(this.menuBtn);

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

    const statTag = "__stat_item__";
    for (let i = this.modalContainer.children.length - 1; i >= 0; i--) {
      if ((this.modalContainer.children[i] as any)[statTag]) {
        this.modalContainer.removeChildAt(i);
      }
    }

    const stats = [
      {
        label: I18n.t("stats.distance"),
        value: `${Math.floor(rs.distance)} m`,
        icon: "📏",
      },
      { label: I18n.t("stats.kills"), value: `${rs.kills}`, icon: "💀" },
      { label: I18n.t("stats.level"), value: `${rs.level}`, icon: "⭐" },
      { label: I18n.t("stats.scrapRun"), value: `+${rs.scrap} 🔩`, icon: "🎁" },
      {
        label: I18n.t("stats.scrapTotal"),
        value: `${curScrap} 🔩`,
        icon: "💰",
      },
      {
        label: I18n.t("stats.time"),
        value: `${Math.floor(rs.runTime / 60)}:${String(Math.floor(rs.runTime % 60)).padStart(2, "0")}`,
        icon: "⏱",
      },
    ];

    const startY = -195;
    const rowH = 48;

    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      const y = startY + i * rowH;

      // Row background pill
      const rowBg = new Graphics();
      (rowBg as any)[statTag] = true;
      rowBg
        .roundRect(-260, y - 20, 520, 40, 12)
        .fill(i === 3 || i === 4 ? 0xfef9c3 : i % 2 === 0 ? 0xe2e8f0 : 0xf1f5f9)
        .stroke({
          color: i === 3 || i === 4 ? 0xfacc15 : 0xcbd5e1,
          width: 1.5,
        });
      this.modalContainer.addChild(rowBg);

      const labelText = new Text({
        text: `${s.icon}  ${s.label}`,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 17,
          fontWeight: "700",
          fill: i === 3 || i === 4 ? 0x854d0e : 0x475569,
        },
      });
      (labelText as any)[statTag] = true;
      labelText.anchor.set(0, 0.5);
      labelText.x = -240;
      labelText.y = y;
      this.modalContainer.addChild(labelText);

      const valText = new Text({
        text: s.value,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 19,
          fontWeight: "900",
          fill: i === 3 || i === 4 ? 0xb45309 : 0x0f172a,
        },
      });
      (valText as any)[statTag] = true;
      valText.anchor.set(1, 0.5);
      valText.x = 240;
      valText.y = y;
      this.modalContainer.addChild(valText);
    }

    // High score banner at bottom of card
    const scoreY = startY + stats.length * rowH + 18;
    const scoreBg = new Graphics();
    (scoreBg as any)[statTag] = true;
    scoreBg
      .roundRect(-260, scoreY - 22, 520, 44, 14)
      .fill(0x0f172a)
      .stroke({ color: 0xfacc15, width: 2.5 });
    this.modalContainer.addChild(scoreBg);

    const scoreText = new Text({
      text: `${I18n.t("stats.score")}: ${rs.getScore()}  |  ${I18n.t("stats.best")}: ${bestScore}`,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 18,
        fontWeight: "900",
        fill: 0xfacc15,
        letterSpacing: 1,
      },
    });
    (scoreText as any)[statTag] = true;
    scoreText.anchor.set(0.5);
    scoreText.y = scoreY;
    this.modalContainer.addChild(scoreText);
  }

  start() {
    const isVictory = RunState.current.victory;
    AudioMixer.playBGM(isVictory ? "bgm_victory" : "bgm_gameover");
  }

  update(dt: number) {
    const dtSec = dt * (1 / 60);
    this.animTime += dtSec;
    this.playAgainBtn.updatePulse(dtSec);
  }

  resize(_width: number, height: number) {
    this.currentHeight = height;
    this.bg.clear();
    this.bg.rect(-100, -100, GAME_WIDTH + 200, Math.max(3000, height + 400));
    this.bg.fill({ color: 0x090a0f, alpha: 0.92 });

    const topSafe = 80;
    const bottomButtonsTop = height - 280;
    this.modalContainer.y = Math.max(380, (topSafe + bottomButtonsTop) / 2);

    this.playAgainBtn.y = height - 250;
    this.garageBtn.y = height - 160;
    this.menuBtn.y = height - 76;

    if (this.activeModal?.resize) {
      this.activeModal.resize(_width, height);
    }
  }
}
