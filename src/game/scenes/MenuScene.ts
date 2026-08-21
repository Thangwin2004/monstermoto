import { Container, Text, Graphics, Sprite, Assets } from "pixi.js";
import { Scene, SceneManager } from "./SceneManager";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { AudioMixer } from "../utils/AudioMixer";

export class MenuScene extends Container implements Scene {
  private titleContainer: Container;
  private playBtn: Container;
  private bgSprite: Sprite;
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
    // Top shadow for Title Ribbon
    vignette.rect(0, 0, GAME_WIDTH, 220).fill({ color: 0x000000, alpha: 0.35 });
    // Bottom shadow for Play Button
    vignette
      .rect(0, GAME_HEIGHT * 0.72, GAME_WIDTH, GAME_HEIGHT * 0.28)
      .fill({ color: 0x000000, alpha: 0.55 });
    this.addChild(vignette);

    // 3. Floating 3D Title Group (Top)
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
      .fill({ color: 0xffffff, alpha: 0.28 });
    this.titleContainer.addChild(titleBadge);

    const title = new Text({
      text: "QUÁI VẬT\nHỘ TỐNG",
      style: {
        fontFamily: "Baloo 2, Be Vietnam Pro, sans-serif",
        fontSize: 48,
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
      .roundRect(-120, 48, 240, 36, 18)
      .fill(0x1e293b)
      .stroke({ color: 0xffffff, width: 3 });
    this.titleContainer.addChild(subBadge);

    const subtitle = new Text({
      text: "⚡ ROGUELITE BATTLE ⚡",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 15,
        fontWeight: "900",
        fill: 0xfacc15,
        letterSpacing: 2,
      },
    });
    subtitle.anchor.set(0.5);
    subtitle.y = 66;
    this.titleContainer.addChild(subtitle);

    // 4. Marth3 3D Primary Button (Bottom)
    this.playBtn = this.createMarth3Button("CHƠI NGAY");
    this.playBtn.x = GAME_WIDTH / 2;
    this.playBtn.y = GAME_HEIGHT * 0.83;
    this.addChild(this.playBtn);

    // Tagline
    const infoText = new Text({
      text: "Xây chiến xa bọc thép • Gắn vũ khí • Tiêu diệt trùm",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 18,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 4 },
        align: "center",
      },
    });
    infoText.anchor.set(0.5);
    infoText.x = GAME_WIDTH / 2;
    infoText.y = GAME_HEIGHT * 0.92;
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

  private createMarth3Button(label: string): Container {
    const btn = new Container();
    const content = new Container();
    btn.addChild(content);

    const w = 320;
    const h = 86;
    const radius = 43;

    // 1. 3D Dark Shadow Base (offset down)
    const shadow = new Graphics();
    shadow.roundRect(-w / 2, -h / 2 + 10, w, h, radius).fill(0xc2410c);
    btn.addChildAt(shadow, 0);

    // 2. Main Vibrant Orange Body with Thick White Border
    const body = new Graphics();
    body
      .roundRect(-w / 2, -h / 2, w, h, radius)
      .fill(0xf97316)
      .stroke({ color: 0xffffff, width: 5.5 });

    // 3. Top Glossy Highlight Sheen
    body
      .roundRect(-w / 2 + 16, -h / 2 + 6, w - 32, h * 0.38, 18)
      .fill({ color: 0xffffff, alpha: 0.32 });
    content.addChild(body);

    // 4. Text
    const text = new Text({
      text: label,
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 36,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x9a3412, width: 4 },
        letterSpacing: 2,
      },
    });
    text.anchor.set(0.5);
    text.y = -2;
    content.addChild(text);

    // 5. Tactile Press Interactivity
    btn.eventMode = "static";
    btn.cursor = "pointer";

    btn.on("pointerover", () => {
      btn.scale.set(1.05);
    });
    btn.on("pointerout", () => {
      btn.scale.set(1);
      content.y = 0;
    });
    btn.on("pointerdown", () => {
      content.y = 6;
      AudioMixer.playButton();
    });
    btn.on("pointerup", () => {
      content.y = 0;
      SceneManager.switchScene("RunScene");
    });

    return btn;
  }

  start() {
    AudioMixer.playBGM("bgm_menu");
  }

  update(dt: number) {
    const dtSec = dt * (1 / 60);
    this.animTime += dtSec;

    // Gentle floating title bounce
    this.titleContainer.y =
      GAME_HEIGHT * 0.16 + Math.sin(this.animTime * 3) * 6;

    // Subtle play button pulse
    const pulse = 1 + Math.sin(this.animTime * 4) * 0.025;
    this.playBtn.scale.set(pulse);
  }

  resize() {}
}
