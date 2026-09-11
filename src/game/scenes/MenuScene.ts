import { Container, Text, Graphics, Sprite, Assets, BlurFilter } from "pixi.js";
import { Scene, SceneManager } from "./SceneManager";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { AudioMixer } from "../utils/AudioMixer";
import { SaveManager } from "../utils/SaveManager";
import { GarageModal } from "../ui/GarageModal";
import { SettingsModal } from "../ui/SettingsModal";
import { HyperButton, HyperCircleButton } from "../ui/HyperButton";
import { I18n } from "../utils/I18n";
import { EventBus } from "../utils/EventBus";

export class MenuScene extends Container implements Scene {
  private contentLayer: Container;
  private titleContainer: Container;
  private titleText!: Text;
  private playBtn: HyperButton;
  private garageBtn: HyperButton;
  private bgSprite: Sprite;
  private vignette: Graphics;
  private infoText: Text;
  private scrapText!: Text;
  private animTime: number = 0;
  private currentHeight: number = GAME_HEIGHT;
  private activeModal: (Container & { resize?(w: number, h: number): void }) | null = null;

  constructor() {
    super();

    const initialH = SceneManager.getVirtualSize?.()?.height ?? GAME_HEIGHT;
    this.currentHeight = Math.max(GAME_HEIGHT, initialH);

    // Group all background and menu elements into contentLayer for blur effects
    this.contentLayer = new Container();
    this.addChild(this.contentLayer);

    // 1. Full-Screen Custom 9:16 Monster Convoy Artwork
    this.bgSprite = new Sprite();
    this.bgSprite.width = GAME_WIDTH;
    this.bgSprite.height = this.currentHeight;
    this.contentLayer.addChild(this.bgSprite);

    // 2. Subtle Dark Vignette on Top & Bottom for Ultimate Text Contrast
    this.vignette = new Graphics();
    this.redrawVignette(this.currentHeight);
    this.contentLayer.addChild(this.vignette);

    // 3. Top Header Bar: Scrap Wallet Pill (Left) & Settings Button (Right)
    const scrapPill = new Graphics();
    scrapPill.roundRect(16, 20, 185, 50, 25).fill(0xb45309);
    scrapPill
      .roundRect(16, 16, 185, 50, 25)
      .fill(0xf59e0b)
      .stroke({ color: 0xffffff, width: 3.5 });
    scrapPill
      .roundRect(24, 19, 169, 16, 8)
      .fill({ color: 0xffffff, alpha: 0.4 });
    this.contentLayer.addChild(scrapPill);

    this.scrapText = new Text({
      text: `🔩 ${SaveManager.getScrap()}`,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 22,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x78350f, width: 3.5 },
      },
    });
    this.scrapText.anchor.set(0, 0.5);
    this.scrapText.x = 36;
    this.scrapText.y = 41;
    this.contentLayer.addChild(this.scrapText);

    // Settings Button (Top Right - Crisp Vector Gear Icon, radius 28)
    const settingsBtn = new HyperCircleButton({
      vectorIcon: "gear",
      radius: 28,
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
    settingsBtn.y = 41;
    this.contentLayer.addChild(settingsBtn);

    // 4. Floating 3D Title Group (Top)
    this.titleContainer = new Container();
    this.titleContainer.x = GAME_WIDTH / 2;
    this.titleContainer.y = GAME_HEIGHT * 0.17;
    this.contentLayer.addChild(this.titleContainer);

    // 3D Title Card / Ribbon
    const titleBadge = new Graphics();
    titleBadge.roundRect(-250, -74, 500, 148, 30).fill(0xb45309);
    titleBadge
      .roundRect(-250, -80, 500, 148, 30)
      .fill(0xf59e0b)
      .stroke({ color: 0xffffff, width: 6.5 });
    titleBadge
      .roundRect(-230, -74, 460, 42, 16)
      .fill({ color: 0xffffff, alpha: 0.35 });
    this.titleContainer.addChild(titleBadge);

    this.titleText = new Text({
      text: I18n.t("menu.title"),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 52,
        fontWeight: "900",
        fill: 0xffffff,
        align: "center",
        stroke: { color: 0x78350f, width: 7 },
        lineHeight: 58,
      },
    });
    this.titleText.anchor.set(0.5);
    this.titleText.y = -6;
    this.titleContainer.addChild(this.titleText);

    // Subtitle badge
    const subBadge = new Graphics();
    subBadge
      .roundRect(-145, 52, 290, 42, 21)
      .fill(0x1e293b)
      .stroke({ color: 0xffffff, width: 3.5 });
    this.titleContainer.addChild(subBadge);

    const subtitle = new Text({
      text: "ROGUELITE BATTLE",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 17,
        fontWeight: "900",
        fill: 0xfacc15,
        letterSpacing: 2,
      },
    });
    subtitle.anchor.set(0.5);
    subtitle.y = 73;
    this.titleContainer.addChild(subtitle);

    // 5. Hyper-Casual 3D Primary Button (CHƠI NGAY with crisp Vector Play Icon)
    this.playBtn = new HyperButton({
      label: I18n.t("menu.play"),
      vectorIcon: "play",
      width: 390,
      height: 92,
      fontSize: 34,
      color: 0xf97316,
      shadowColor: 0xc2410c,
      pulse: true,
      onClick: () => {
        SceneManager.switchScene("RunScene");
      },
    });
    this.playBtn.x = GAME_WIDTH / 2;
    this.playBtn.y = GAME_HEIGHT - 260;
    this.contentLayer.addChild(this.playBtn);

    // 6. Hyper-Casual 3D Garage Button (XƯỞNG XE with crisp Vector Wrench Icon)
    this.garageBtn = new HyperButton({
      label: I18n.t("menu.garage"),
      vectorIcon: "wrench",
      width: 340,
      height: 78,
      fontSize: 26,
      color: 0x10b981,
      shadowColor: 0x047857,
      onClick: () => {
        this.contentLayer.filters = [
          new BlurFilter({ strength: 8, quality: 3 }),
        ];
        const modal = new GarageModal(() => {
          this.activeModal = null;
          this.contentLayer.filters = [];
          this.scrapText.text = `🔩 ${SaveManager.getScrap()}`;
        }, this.currentHeight);
        this.activeModal = modal;
        this.addChild(modal);
      },
    });
    this.garageBtn.x = GAME_WIDTH / 2;
    this.garageBtn.y = this.currentHeight - 160;
    this.contentLayer.addChild(this.garageBtn);

    // Tagline
    this.infoText = new Text({
      text: I18n.t("menu.tagline"),
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 16,
        fontWeight: "700",
        fill: 0xe2e8f0,
        stroke: { color: 0x000000, width: 3.5 },
        align: "center",
      },
    });
    this.infoText.anchor.set(0.5);
    this.infoText.x = GAME_WIDTH / 2;
    this.infoText.y = this.currentHeight - 64;
    this.contentLayer.addChild(this.infoText);

    // Language change listener
    EventBus.on("language:changed", () => {
      this.titleText.text = I18n.t("menu.title");
      this.playBtn.setLabel(I18n.t("menu.play"));
      this.garageBtn.setLabel(I18n.t("menu.garage"));
      this.infoText.text = I18n.t("menu.tagline");
      this.scrapText.text = `🔩 ${SaveManager.getScrap()}`;
    });

    this.loadBackground();
  }

  private redrawVignette(h: number) {
    this.vignette.clear();
    this.vignette
      .rect(0, 0, GAME_WIDTH, 220)
      .fill({ color: 0x000000, alpha: 0.35 });
    this.vignette
      .rect(0, h * 0.62, GAME_WIDTH, h * 0.38 + 200)
      .fill({ color: 0x000000, alpha: 0.68 });
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
    const baseY = Math.max(160, this.currentHeight * 0.17);
    this.titleContainer.y = baseY + Math.sin(this.animTime * 2.5) * 5;

    // Pulse primary CTA
    this.playBtn.updatePulse(dtSec);
  }

  resize(_width: number, height: number) {
    this.currentHeight = height;
    this.bgSprite.width = GAME_WIDTH;
    this.bgSprite.height = height;
    this.redrawVignette(height);

    this.playBtn.y = height - 260;
    this.garageBtn.y = height - 160;
    this.infoText.y = height - 64;
    this.titleContainer.y = Math.max(160, height * 0.17);

    if (this.activeModal?.resize) {
      this.activeModal.resize(_width, height);
    }
  }
}

