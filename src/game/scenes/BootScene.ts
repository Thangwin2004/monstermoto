import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { Scene, SceneManager } from './SceneManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { AudioMixer } from '../utils/AudioMixer';

export class BootScene extends Container implements Scene {
    private loadingText: Text;
    private progressBg: Graphics;
    private progressFill: Graphics;

    constructor() {
        super();

        const bg = new Graphics();
        bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        bg.fill(0x111111);
        this.addChild(bg);

        const titleStyle = new TextStyle({
            fontFamily: 'Be Vietnam Pro, sans-serif',
            fontSize: 42,
            fontWeight: '900',
            fill: 0xffaa00,
        });
        const title = new Text({ text: 'QUÁI VẬT HỘ TỐNG', style: titleStyle });
        title.anchor.set(0.5);
        title.x = GAME_WIDTH / 2;
        title.y = GAME_HEIGHT / 2 - 80;
        this.addChild(title);

        this.loadingText = new Text({
            text: 'Đang tải...',
            style: {
                fontFamily: 'Be Vietnam Pro, sans-serif',
                fontSize: 24,
                fill: 0xaaaaaa,
            },
        });
        this.loadingText.anchor.set(0.5);
        this.loadingText.x = GAME_WIDTH / 2;
        this.loadingText.y = GAME_HEIGHT / 2 + 20;
        this.addChild(this.loadingText);

        this.progressBg = new Graphics();
        this.progressBg.roundRect(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 + 60, 300, 12, 6);
        this.progressBg.fill(0x222222);
        this.addChild(this.progressBg);

        this.progressFill = new Graphics();
        this.addChild(this.progressFill);
    }

    async init() {
        await this.loadAssets();
    }

    private async loadAssets() {
        const audioFiles: [string, string][] = [
            ['bgm_menu', '/music/BGMM_Dance.mp3'],
            ['bgm_game', '/music/BGIG_Disco1.mp3'],
            ['sfx_button', '/music/Button1.mp3'],
            ['sfx_shoot', '/music/Throw.mp3'],
            ['sfx_hit', '/music/CharHit.mp3'],
            ['sfx_kill', '/music/CharKnockDown.mp3'],
            ['sfx_levelup', '/music/LevelUp.mp3'],
            ['sfx_scrap', '/music/LabelCollect.mp3'],
            ['sfx_explosion', '/music/Chest_Impact.mp3'],
            ['sfx_shake', '/music/Shake1.mp3'],
            ['sfx_boss_spawn', '/music/LORD.mp3'],
        ];

        await AudioMixer.init();

        for (let i = 0; i < audioFiles.length; i++) {
            const [key, url] = audioFiles[i];
            try {
                await AudioMixer.load(key, url);
            } catch {
                console.warn(`Không tải được âm thanh: ${url}`);
            }
            this.updateProgress((i + 1) / audioFiles.length);
        }

        this.loadingText.text = 'Sẵn sàng!';

        await new Promise(r => setTimeout(r, 400));
        queueMicrotask(() => {
            SceneManager.switchScene('MenuScene');
        });
    }

    private updateProgress(ratio: number) {
        this.progressFill.clear();
        this.progressFill.roundRect(
            GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 + 60,
            300 * ratio, 12, 6
        );
        this.progressFill.fill(0xffaa00);
    }

    resize(width: number, height: number) {}
}
