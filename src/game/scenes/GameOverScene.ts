import { Container, Text, Graphics } from "pixi.js";
import { Scene, SceneManager } from "./SceneManager";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { AudioMixer } from "../utils/AudioMixer";
import { RunState } from "../utils/RunState";

export class GameOverScene extends Container implements Scene {
  private modalContainer: Container;
  private playAgainBtn: Container;
  private animTime: number = 0;

  constructor() {
    super();

    // 1. Dark Backdrop
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x090a0f, alpha: 0.9 });
    this.addChild(bg);

    this.modalContainer = new Container();
    this.modalContainer.x = GAME_WIDTH / 2;
    this.modalContainer.y = GAME_HEIGHT * 0.45;
    this.addChild(this.modalContainer);

    const isVictory = RunState.current.victory;
    const cardW = 580;
    const cardH = 680;

    // 2. Soft Card Shadow
    const cardShadow = new Graphics();
    cardShadow
      .roundRect(-cardW / 2 + 8, -cardH / 2 + 16, cardW, cardH, 28)
      .fill({ color: 0x000000, alpha: 0.45 });
    this.modalContainer.addChild(cardShadow);

    // 3. Thick 3D Border (Green for Victory, Crimson for Defeat)
    const borderColor = isVictory ? 0x15803d : 0x991b1b;
    const borderShadow = isVictory ? 0x14532d : 0x450a0a;

    const borderBg = new Graphics();
    borderBg
      .roundRect(-cardW / 2, -cardH / 2 + 8, cardW, cardH, 28)
      .fill(borderShadow);
    borderBg
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 28)
      .fill(borderColor)
      .stroke({ color: 0xffffff, width: 4 });
    this.modalContainer.addChild(borderBg);

    // 4. Bright Cream Card Face
    const cardFace = new Graphics();
    cardFace
      .roundRect(-cardW / 2 + 14, -cardH / 2 + 14, cardW - 28, cardH - 28, 20)
      .fill(0xf8fafc);
    this.modalContainer.addChild(cardFace);

    // 5. Floating 3D Title Ribbon
    const ribbonW = 380;
    const ribbonH = 68;
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
      text: isVictory ? "🏆 CHIẾN THẮNG!" : "💀 HẾT LƯỢT",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 30,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: ribbonShadow, width: 4 },
        letterSpacing: 2,
      },
    });
    titleText.anchor.set(0.5);
    titleText.y = ribbonY + ribbonH / 2 - 2;
    this.modalContainer.addChild(titleText);

    this.buildStatsList();

    // 6. 3D Marth3 Buttons
    this.playAgainBtn = this.createMarth3Button(
      "CHƠI LẠI",
      0xf59e0b,
      0xb45309,
      0,
      () => {
        SceneManager.switchScene("RunScene");
      },
    );
    this.playAgainBtn.y = GAME_HEIGHT * 0.82;
    this.addChild(this.playAgainBtn);

    const menuBtn = this.createMarth3Button(
      "TRANG CHỦ",
      0x0284c7,
      0x0369a1,
      0,
      () => {
        SceneManager.switchScene("MenuScene");
      },
    );
    menuBtn.y = GAME_HEIGHT * 0.91;
    menuBtn.scale.set(0.88);
    this.addChild(menuBtn);
  }

  private buildStatsList() {
    const rs = RunState.current;
    const bestScore = RunState.getBestScore();

    const stats = [
      {
        label: "Quãng đường",
        value: `${Math.floor(rs.distance)} m`,
        icon: "📏",
      },
      { label: "Quái tiêu diệt", value: `${rs.kills}`, icon: "💀" },
      { label: "Cấp độ đạt được", value: `${rs.level}`, icon: "⭐" },
      { label: "Phế liệu thu thập", value: `${rs.scrap}`, icon: "🔩" },
      {
        label: "Thời gian sinh tồn",
        value: `${Math.floor(rs.runTime / 60)}:${String(Math.floor(rs.runTime % 60)).padStart(2, "0")}`,
        icon: "⏱",
      },
    ];

    const startY = -180;
    const rowH = 50;

    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      const y = startY + i * rowH;

      // Row background pill
      const rowBg = new Graphics();
      rowBg
        .roundRect(-240, y - 20, 480, 42, 10)
        .fill(i % 2 === 0 ? 0xe2e8f0 : 0xf1f5f9);
      this.modalContainer.addChild(rowBg);

      const labelText = new Text({
        text: `${s.icon}  ${s.label}`,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 18,
          fontWeight: "700",
          fill: 0x475569,
        },
      });
      labelText.anchor.set(0, 0.5);
      labelText.x = -220;
      labelText.y = y + 1;
      this.modalContainer.addChild(labelText);

      const valText = new Text({
        text: s.value,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 20,
          fontWeight: "900",
          fill: 0x0f172a,
        },
      });
      valText.anchor.set(1, 0.5);
      valText.x = 220;
      valText.y = y + 1;
      this.modalContainer.addChild(valText);
    }

    // Score Card Box
    const scoreBoxY = startY + stats.length * rowH + 20;
    const scoreBox = new Graphics();
    scoreBox
      .roundRect(-240, scoreBoxY - 24, 480, 72, 14)
      .fill(0xfef3c7)
      .stroke({ color: 0xf59e0b, width: 3 });
    this.modalContainer.addChild(scoreBox);

    const scoreTitle = new Text({
      text: "TỔNG ĐIỂM",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 16,
        fontWeight: "900",
        fill: 0xb45309,
      },
    });
    scoreTitle.anchor.set(0, 0.5);
    scoreTitle.x = -215;
    scoreTitle.y = scoreBoxY + 12;
    this.modalContainer.addChild(scoreTitle);

    const scoreNum = new Text({
      text: `${rs.getScore()}`,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 34,
        fontWeight: "900",
        fill: 0xb45309,
      },
    });
    scoreNum.anchor.set(1, 0.5);
    scoreNum.x = 215;
    scoreNum.y = scoreBoxY + 12;
    this.modalContainer.addChild(scoreNum);

    if (bestScore > 0) {
      const bestText = new Text({
        text: `Kỷ lục cao nhất: ${bestScore}`,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 16,
          fontWeight: "700",
          fill: 0x94a3b8,
        },
      });
      bestText.anchor.set(0.5);
      bestText.y = scoreBoxY + 70;
      this.modalContainer.addChild(bestText);
    }
  }

  private createMarth3Button(
    label: string,
    colorTop: number,
    colorShadow: number,
    y: number,
    onClick: () => void,
  ): Container {
    const btn = new Container();
    btn.x = GAME_WIDTH / 2;
    btn.y = y;

    const content = new Container();
    btn.addChild(content);

    const w = 300;
    const h = 68;
    const radius = 34;

    // Shadow base
    const shadow = new Graphics();
    shadow.roundRect(-w / 2, -h / 2 + 8, w, h, radius).fill(colorShadow);
    btn.addChildAt(shadow, 0);

    // Body
    const body = new Graphics();
    body
      .roundRect(-w / 2, -h / 2, w, h, radius)
      .fill(colorTop)
      .stroke({ color: 0xffffff, width: 4 });
    body
      .roundRect(-w / 2 + 12, -h / 2 + 4, w - 24, h * 0.38, 14)
      .fill({ color: 0xffffff, alpha: 0.3 });
    content.addChild(body);

    const text = new Text({
      text: label,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 26,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: colorShadow, width: 4 },
        letterSpacing: 2,
      },
    });
    text.anchor.set(0.5);
    text.y = -2;
    content.addChild(text);

    btn.eventMode = "static";
    btn.cursor = "pointer";

    btn.on("pointerover", () => {
      btn.scale.set(1.04);
    });
    btn.on("pointerout", () => {
      btn.scale.set(1);
      content.y = 0;
    });
    btn.on("pointerdown", () => {
      content.y = 5;
      AudioMixer.playSFX("sfx_button");
    });
    btn.on("pointerup", () => {
      content.y = 0;
      onClick();
    });

    return btn;
  }

  start() {
    AudioMixer.playBGM("bgm_menu");
  }

  update(dt: number) {
    const dtSec = dt * (1 / 60);
    this.animTime += dtSec;
    const pulse = 1 + Math.sin(this.animTime * 4) * 0.02;
    this.playAgainBtn.scale.set(pulse);
  }

  resize() {}
}
