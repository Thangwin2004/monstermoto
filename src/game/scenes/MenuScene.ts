import { Container, Text, Graphics, Sprite, Assets } from "pixi.js";
import { Scene, SceneManager } from "./SceneManager";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { AudioMixer } from "../utils/AudioMixer";
import { SaveManager } from "../utils/SaveManager";
import { GarageModal } from "../ui/GarageModal";
import { SettingsModal } from "../ui/SettingsModal";
import { HyperButton, HyperCircleButton } from "../ui/HyperButton";

export class MenuScene extends Container implements Scene {
  private titleContainer: Container;
  private playBtn: HyperButton;
  private garageBtn: HyperButton;
  private bgSprite: Sprite;
  private scrapText!: Text;
  private animTime: number = 0;

  constructor() {
    super();

    // 1. Full-Screen Custom 9:16 Monster Convoy Artwork
    this.bgSprite = new Sprite();
    this.bgSprite.width = GAME_WIDTH;
    this.bgSprite.height = GAME_HEIGHT;
    this.addChild(this.bgSprite);

    // 2. Subtle Dark Vignette on Top & Bottom for Ultimate Text Contrast
    const vignette = new Graphics();
    vignette.rect(0, 0, GAME_WIDTH, 220).fill({ color: 0x000000, alpha: 0.35 });
    vignette
      .rect(0, GAME_HEIGHT * 0.65, GAME_WIDTH, GAME_HEIGHT * 0.35)
      .fill({ color: 0x000000, alpha: 0.65 });
    this.addChild(vignette);

    // 3. Top Header Bar: Scrap Wallet Pill (Left) & Settings Button (Right)
    const scrapPill = new Graphics();
    scrapPill.roundRect(16, 20, 160, 42, 21).fill(0xb45309);
    scrapPill
      .roundRect(16, 16, 160, 42, 21)
      .fill(0xf59e0b)
      .stroke({ color: 0xffffff, width: 3 });
    scrapPill
      .roundRect(24, 19, 144, 14, 7)
      .fill({ color: 0xffffff, alpha: 0.4 });
    this.addChild(scrapPill);

    this.scrapText = new Text({
      text: `🔩 ${SaveManager.getScrap()}`,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 18,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x78350f, width: 3 },
      },
    });
    this.scrapText.anchor.set(0, 0.5);
    this.scrapText.x = 34;
    this.scrapText.y = 37;
    this.addChild(this.scrapText);

    // Settings Button (Top Right - Crisp Vector Gear Icon)
    const settingsBtn = new HyperCircleButton({
      vectorIcon: "gear",
      radius: 22,
      color: 0x0ea5e9,
      shadowColor: 0x0369a1,
      strokeWidth: 3,
      onClick: () => {
        const modal = new SettingsModal(() => {});
        this.addChild(modal);
      },
    });
    settingsBtn.x = GAME_WIDTH - 44;
    settingsBtn.y = 37;
    this.addChild(settingsBtn);

    // 4. Floating 3D Title Group (Top)
    this.titleContainer = new Container();
    this.titleContainer.x = GAME_WIDTH / 2;
    this.titleContainer.y = GAME_HEIGHT * 0.16;
    this.addChild(this.titleContainer);

    // 3D Title Card / Ribbon
    const titleBadge = new Graphics();
    titleBadge.roundRect(-240, -68, 480, 136, 28).fill(0xb45309);
    titleBadge
      .roundRect(-240, -74, 480, 136, 28)
      .fill(0xf59e0b)
      .stroke({ color: 0xffffff, width: 6 });
    titleBadge
      .roundRect(-220, -68, 440, 38, 14)
      .fill({ color: 0xffffff, alpha: 0.35 });
    this.titleContainer.addChild(titleBadge);

    const title = new Text({
      text: "QUÁI VẬT\nHỘ TỐNG",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 46,
        fontWeight: "900",
        fill: 0xffffff,
        align: "center",
        stroke: { color: 0x78350f, width: 6 },
        lineHeight: 52,
      },
    });
    title.anchor.set(0.5);
    title.y = -6;
    this.titleContainer.addChild(title);

    // Subtitle badge
    const subBadge = new Graphics();
    subBadge
      .roundRect(-130, 48, 260, 36, 18)
      .fill(0x1e293b)
      .stroke({ color: 0xffffff, width: 3 });
    this.titleContainer.addChild(subBadge);

    const subtitle = new Text({
      text: "ROGUELITE BATTLE",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 14,
        fontWeight: "900",
        fill: 0xfacc15,
        letterSpacing: 2,
      },
    });
    subtitle.anchor.set(0.5);
    subtitle.y = 66;
    this.titleContainer.addChild(subtitle);

    // 5. Hyper-Casual 3D Primary Button (CHƠI NGAY with crisp Vector Play Icon)
    this.playBtn = new HyperButton({
      label: "CHƠI NGAY",
      vectorIcon: "play",
      width: 340,
      height: 80,
      fontSize: 30,
      color: 0xf97316,
      shadowColor: 0xc2410c,
      pulse: true,
      onClick: () => {
        SceneManager.switchScene("RunScene");
      },
    });
    this.playBtn.x = GAME_WIDTH / 2;
    this.playBtn.y = GAME_HEIGHT * 0.75;
    this.addChild(this.playBtn);

    // 6. Hyper-Casual 3D Garage Button (XƯỞNG XE with crisp Vector Wrench Icon)
    this.garageBtn = new HyperButton({
      label: "XƯỞNG XE",
      vectorIcon: "wrench",
      width: 290,
      height: 66,
      fontSize: 22,
      color: 0x10b981,
      shadowColor: 0x047857,
      onClick: () => {
        const modal = new GarageModal(() => {
          this.scrapText.text = `🔩 ${SaveManager.getScrap()}`;
        });
        this.addChild(modal);
      },
    });
    this.garageBtn.x = GAME_WIDTH / 2;
    this.garageBtn.y = GAME_HEIGHT * 0.85;
    this.addChild(this.garageBtn);

    // Tagline
    const infoText = new Text({
      text: "Thu thập phế liệu • Nâng cấp chiến xa • Tiêu diệt trùm",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 14,
        fontWeight: "800",
        fill: 0xe2e8f0,
        stroke: { color: 0x000000, width: 3 },
        align: "center",
      },
    });
    infoText.anchor.set(0.5);
    infoText.x = GAME_WIDTH / 2;
    infoText.y = GAME_HEIGHT * 0.93;
    this.addChild(infoText);

    this.loadBackground();
  }

  private async loadBackground() {
    try {
      const bgTex = await Assets.load("/image/bg_menu_portrait.jpg");
      this.bgSprite.texture = bgTex;
    } catch {
      // Handled
    }
  }

  start() {
    AudioMixer.playBGM("bgm_menu");
    this.scrapText.text = `🔩 ${SaveManager.getScrap()}`;
  }

  update(dt: number) {
    const dtSec = dt * (1 / 60);
    this.animTime += dtSec;

    // Gentle float on title
    this.titleContainer.y = GAME_HEIGHT * 0.16 + Math.sin(this.animTime * 2.5) * 5;

    // Pulse primary CTA
    this.playBtn.updatePulse(dtSec);
  }

  resize() {}
}
