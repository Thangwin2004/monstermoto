import { Application, Container } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT } from './game/constants';
import { SceneManager } from './game/scenes/SceneManager';
import { BootScene } from './game/scenes/BootScene';
import { MenuScene } from './game/scenes/MenuScene';
import { RunScene } from './game/scenes/RunScene';
import { GameOverScene } from './game/scenes/GameOverScene';
import { AudioMixer } from './game/utils/AudioMixer';
import { waitForGameFonts } from './utils/fontLoader';
import { installFocusPause } from './utils/FocusPauseController';
import { installInteractionGuard } from './utils/interactionGuard';

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

    await app.init({
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        backgroundColor: '#111111',
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        antialias: true,
    });

    const container = document.getElementById('pixi-container')!;
    container.appendChild(app.canvas);

    // ── Responsive letterbox scaling ──
    const gameContainer = new Container();
    app.stage.addChild(gameContainer);

    function resize() {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const gameAspect = GAME_WIDTH / GAME_HEIGHT;
        const screenAspect = screenW / screenH;

        let scale: number;
        let offsetX = 0;
        let offsetY = 0;

        if (screenAspect > gameAspect) {
            // Screen is wider than game → fit by height, letterbox sides
            scale = screenH / GAME_HEIGHT;
            offsetX = (screenW - GAME_WIDTH * scale) / 2;
        } else {
            // Screen is taller than game → fit by width, letterbox top/bottom
            scale = screenW / GAME_WIDTH;
            offsetY = (screenH - GAME_HEIGHT * scale) / 2;
        }

        app.renderer.resize(screenW, screenH);
        gameContainer.scale.set(scale);
        gameContainer.x = offsetX;
        gameContainer.y = offsetY;

        SceneManager.resize(GAME_WIDTH, GAME_HEIGHT);
    }

    window.addEventListener('resize', resize);
    resize();

    // ── Resume audio on first interaction ──
    const resumeAudio = () => {
        AudioMixer.resume();
        window.removeEventListener('pointerdown', resumeAudio);
        window.removeEventListener('keydown', resumeAudio);
    };
    window.addEventListener('pointerdown', resumeAudio);
    window.addEventListener('keydown', resumeAudio);

    // ── Scene setup ──
    SceneManager.initialize(app, gameContainer);

    installFocusPause({
        isRunning: () => app.ticker.started,
        pause: () => app.ticker.stop(),
        resume: () => app.ticker.start(),
        pauseAudio: () => AudioMixer.pauseForFocus(),
        resumeAudio: () => AudioMixer.resumeFromFocus(),
    });

    // Register scene factories (create fresh instance each switch)
    SceneManager.registerFactory('BootScene', () => new BootScene());
    SceneManager.registerFactory('MenuScene', () => new MenuScene());
    SceneManager.registerFactory('RunScene', () => new RunScene());
    SceneManager.registerFactory('GameOverScene', () => new GameOverScene());

    SceneManager.switchScene('BootScene');
})();
