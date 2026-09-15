import { Application, Container } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "./game/constants";
import { SceneManager } from "./game/scenes/SceneManager";
import { BootScene } from "./game/scenes/BootScene";
import { MenuScene } from "./game/scenes/MenuScene";
import { RunScene } from "./game/scenes/RunScene";
import { GameOverScene } from "./game/scenes/GameOverScene";
import { AudioMixer } from "./game/utils/AudioMixer";
import { waitForGameFonts } from "./utils/fontLoader";
import { installFocusPause } from "./utils/FocusPauseController";
import { installInteractionGuard } from "./utils/interactionGuard";
import { winkGame } from "./integrations/wink/client";
import { I18n } from "./game/utils/I18n";

installInteractionGuard();

(async () => {
  await waitForGameFonts([
    "400 1em 'Be Vietnam Pro'",
    "500 1em 'Be Vietnam Pro'",
    "600 1em 'Be Vietnam Pro'",
    "700 1em 'Be Vietnam Pro'",
    "800 1em 'Be Vietnam Pro'",
    "900 1em 'Be Vietnam Pro'",
    "700 1em 'Baloo 2'",
    "800 1em 'Baloo 2'",
  ]);

  const app = new Application();

  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

  // Resolution policy:
  // Desktop: minimum 2x supersampling, up to 2.5x
  // Mobile: maximum 2x (never 3x, to prevent massive 40MB framebuffers that trigger mobile browser watchdog kills)
  const appResolution = isMobileDevice
    ? Math.min(window.devicePixelRatio || 1, 2)
    : Math.min(Math.max(window.devicePixelRatio || 1, 2), 2.5);

  await app.init({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#111111",
    resolution: appResolution,
    autoDensity: true,
    antialias: true,
    roundPixels: true,
    gcActive: true,
    gcFrequency: 5000,
    gcMaxUnusedTime: 10000,
  });

  const container = document.getElementById("pixi-container")!;
  container.appendChild(app.canvas);

  // ── Responsive scaling ──
  const gameContainer = new Container();
  app.stage.addChild(gameContainer);

  function resize() {
    const screenW = container.clientWidth || window.innerWidth;
    const screenH = container.clientHeight || window.innerHeight;
    const gameAspect = GAME_WIDTH / GAME_HEIGHT;
    const screenAspect = screenW / screenH;

    let scale: number;
    let offsetX: number;
    let offsetY: number;
    let virtualWidth: number;
    let virtualHeight: number;

    if (screenAspect <= gameAspect) {
      // Mobile portrait mode (including tall phones like iPhone 12/13/14 Pro 390x844):
      // Scale by width so game spans 100% of viewport width with 0px horizontal margin.
      // Game height extends vertically to fill entire viewport with 0px vertical black bars!
      scale = screenW / GAME_WIDTH;
      offsetX = 0;
      offsetY = 0;
      virtualWidth = GAME_WIDTH;
      virtualHeight = screenH / scale;
    } else {
      // Wide screens / desktop previews / tablets:
      // Fit height 100%, center game horizontally.
      scale = screenH / GAME_HEIGHT;
      offsetX = (screenW - GAME_WIDTH * scale) / 2;
      offsetY = 0;
      virtualWidth = GAME_WIDTH;
      virtualHeight = GAME_HEIGHT;
    }

    app.renderer.resize(screenW, screenH);
    gameContainer.scale.set(scale);
    gameContainer.x = offsetX;
    gameContainer.y = offsetY;

    SceneManager.resize(virtualWidth, virtualHeight);
  }

  window.addEventListener("resize", resize);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  // ── Resume audio on first interaction ──
  const resumeAudio = () => {
    AudioMixer.resume();
    window.removeEventListener("pointerdown", resumeAudio);
    window.removeEventListener("keydown", resumeAudio);
  };
  window.addEventListener("pointerdown", resumeAudio);
  window.addEventListener("keydown", resumeAudio);

  // ── Scene setup ──
  SceneManager.initialize(app, gameContainer);

  const focusPause = installFocusPause({
    isRunning: () => app.ticker.started,
    pause: () => app.ticker.stop(),
    resume: () => app.ticker.start(),
    pauseAudio: () => AudioMixer.pauseForFocus(),
    resumeAudio: () => AudioMixer.resumeFromFocus(),
  });

  winkGame.bindLifecycle({
    onPause: focusPause.pauseFromHost,
    onResume: focusPause.resumeFromHost,
    onMute: () => AudioMixer.setHostMuted(true),
    onUnmute: () => AudioMixer.setHostMuted(false),
    onLocale: (locale) => I18n.setLanguage(locale === "en" ? "en" : "vi"),
  });

  // Register scene factories (create fresh instance each switch)
  SceneManager.registerFactory("BootScene", () => new BootScene());
  SceneManager.registerFactory("MenuScene", () => new MenuScene());
  SceneManager.registerFactory("RunScene", () => new RunScene());
  SceneManager.registerFactory("GameOverScene", () => new GameOverScene());

  SceneManager.switchScene("BootScene");
})();
