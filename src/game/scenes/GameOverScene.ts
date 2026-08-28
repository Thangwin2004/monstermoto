import { Container, Text, Graphics, BlurFilter } from "pixi.js";
import { Scene, SceneManager } from "./SceneManager";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { AudioMixer } from "../utils/AudioMixer";
import { RunState } from "../utils/RunState";
import { SaveManager } from "../utils/SaveManager";
import { GarageModal } from "../ui/GarageModal";
import { SettingsModal } from "../ui/SettingsModal";
import { HyperButton, HyperCircleButton } from "../ui/HyperButton";

export class GameOverScene extends Container implements Scene {
  private contentLayer: Container;
  private modalContainer: Container;
  private playAgainBtn: HyperButton;
  private animTime: number = 0;

  constructor() {
    super();

    // Group background and gameover card in contentLayer for blur effects
    this.contentLayer = new Container();
    this.addChild(this.contentLayer);

    // 1. Dark Backdrop
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x090a0f, alpha: 0.92 });
    this.contentLayer.addChild(bg);

    // Top-Right Settings Button (HyperCircleButton with crisp vector gear)
    const settingsBtn = new HyperCircleButton({
      vectorIcon: "gear",
      radius: 26,
      color: 0x0ea5e9,
      shadowColor: 0x0369a1,
      strokeWidth: 3.5,
      onClick: () => {
        this.contentLayer.filters = [new BlurFilter({ strength: 8, quality: 3 })];
        const modal = new SettingsModal(() => {
          this.contentLayer.filters = [];
        });
        this.addChild(modal);
      },
    });
    settingsBtn.x = GAME_WIDTH - 44;
    settingsBtn.y = 40;
    this.contentLayer.addChild(settingsBtn);

    // 2. Modal Container
    this.modalContainer = new Container();
    this.modalContainer.x = GAME_WIDTH / 2;
    this.modalContainer.y = GAME_HEIGHT * 0.34;
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

    const titleText = new Text({
      text: isVictory ? "CHIẾN THẮNG!" : "HẾT LƯỢT",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 32,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: ribbonShadow, width: 4.5 },
        letterSpacing: 2,
      },
    });
    titleText.anchor.set(0.5);
    titleText.y = ribbonY + ribbonH / 2 - 2;
    this.modalContainer.addChild(titleText);

    this.buildStatsList();

    // 3. Hyper-Casual Action Buttons with Crisp Vector Icons
    this.playAgainBtn = new HyperButton({
      label: "CHƠI LẠI",
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
    this.playAgainBtn.y = GAME_HEIGHT * 0.725;
    this.contentLayer.addChild(this.playAgainBtn);

    const garageBtn = new HyperButton({
      label: "NÂNG CẤP XE",
      vectorIcon: "wrench",
      width: 320,
      height: 72,
      fontSize: 25,
      color: 0x10b981,
      shadowColor: 0x047857,
      onClick: () => {
        this.contentLayer.filters = [new BlurFilter({ strength: 8, quality: 3 })];
        const modal = new GarageModal(() => {
          this.contentLayer.filters = [];
          this.buildStatsList();
        });
        this.addChild(modal);
      },
    });
    garageBtn.x = GAME_WIDTH / 2;
    garageBtn.y = GAME_HEIGHT * 0.815;
    this.contentLayer.addChild(garageBtn);

    const menuBtn = new HyperButton({
      label: "TRANG CHỦ",
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
    menuBtn.x = GAME_WIDTH / 2;
    menuBtn.y = GAME_HEIGHT * 0.895;
    this.contentLayer.addChild(menuBtn);
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
        label: "Quãng đường",
        value: `${Math.floor(rs.distance)} m`,
        icon: "📏",
      },
      { label: "Quái tiêu diệt", value: `${rs.kills}`, icon: "💀" },
      { label: "Cấp độ đạt được", value: `${rs.level}`, icon: "⭐" },
      { label: "Phế liệu nhận được", value: `+${rs.scrap} 🔩`, icon: "🎁" },
      { label: "Tổng phế liệu ví", value: `${curScrap} 🔩`, icon: "💰" },
      {
        label: "Thời gian sinh tồn",
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
        .stroke({ color: i === 3 || i === 4 ? 0xfacc15 : 0xcbd5e1, width: 1.5 });
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
      text: `ĐIỂM: ${rs.getScore()}  |  KỶ LỤC: ${bestScore}`,
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

  resize() {}
}
