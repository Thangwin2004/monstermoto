import { Container, Graphics, Assets } from "pixi.js";
import { Scene, SceneManager } from "./SceneManager";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { AudioMixer } from "../utils/AudioMixer";

export class BootScene extends Container implements Scene {
  constructor() {
    super();

    // Clean neutral dark canvas background matching application init
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill(0x111111);
    this.addChild(bg);
  }

  async init() {
    await this.loadAssets();
  }

  private async loadAssets() {
    await AudioMixer.init();

    // 1. Preload critical menu assets in parallel (Fast & smooth startup on all phones)
    try {
      await Promise.all([
        AudioMixer.load("bgm_menu", "/music/BGMM_Dance.mp3"),
        AudioMixer.load("sfx_button", "/music/Button1.mp3"),
        Assets.load("/image/bg_menu_portrait.jpg"),
      ]);
    } catch (err) {
      console.warn("Initial asset preload error:", err);
    }

    // 2. Preload remaining in-game sounds asynchronously in background without blocking menu
    const inGameAudio: [string, string][] = [
      ["bgm_game", "/music/BGIG_Disco1.mp3"],
      ["sfx_shoot", "/music/Throw.mp3"],
      ["sfx_hit", "/music/CharHit.mp3"],
      ["sfx_kill", "/music/CharKnockDown.mp3"],
      ["sfx_levelup", "/music/LevelUp.mp3"],
      ["sfx_scrap", "/music/LabelCollect.mp3"],
      ["sfx_explosion", "/music/Chest_Impact.mp3"],
      ["sfx_shake", "/music/Shake1.mp3"],
      ["sfx_boss_spawn", "/music/LORD.mp3"],
    ];

    (async () => {
      for (const [key, url] of inGameAudio) {
        try {
          await AudioMixer.load(key, url);
        } catch (_) {}
      }
    })();

    // 3. Switch directly to MenuScene and smoothly dismiss the single publisher splash screen
    await SceneManager.switchScene("MenuScene");

    if (typeof (window as any).dismissPapaSplash === "function") {
      (window as any).dismissPapaSplash();
    } else {
      const splash = document.getElementById("papa-studio-splash");
      if (splash) {
        splash.classList.add("is-ready");
        setTimeout(() => {
          splash.classList.add("is-hidden");
          setTimeout(() => {
            try {
              splash.remove();
            } catch (_) {}
          }, 450);
        }, 160);
      }
    }
  }

  resize() {
    // Boot scene uses fixed virtual canvas dimensions.
  }
}
