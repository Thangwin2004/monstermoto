import { Application, Container } from 'pixi.js';
import { EventBus } from '../utils/EventBus';

export interface Scene extends Container {
    init?(): Promise<void> | void;
    start?(): void;
    stop?(): void;
    update?(deltaTime: number): void;
    resize?(width: number, height: number): void;
}

type SceneFactory = () => Scene;

export class SceneManager {
    private static app: Application;
    private static gameContainer: Container;
    private static currentScene: Scene | null = null;
    private static currentSceneName: string = '';
    private static factories: Map<string, SceneFactory> = new Map();

    public static initialize(app: Application, gameContainer: Container) {
        SceneManager.app = app;
        SceneManager.gameContainer = gameContainer;

        app.ticker.add((ticker) => {
            if (this.currentScene?.update) {
                // Clamp deltaTime to avoid huge jumps after tab resume
                const dt = Math.min(ticker.deltaTime, 3);
                this.currentScene.update(dt);
            }
        });
    }

    /** Register a factory function that creates a fresh scene instance */
    public static registerFactory(name: string, factory: SceneFactory) {
        this.factories.set(name, factory);
    }

    public static async switchScene(name: string) {
        const factory = this.factories.get(name);
        if (!factory) {
            console.error(`Scene factory "${name}" not found!`);
            return;
        }

        // Tear down current scene
        if (this.currentScene) {
            if (this.currentScene.stop) this.currentScene.stop();
            this.gameContainer.removeChild(this.currentScene);
            this.currentScene.destroy({ children: true });
        }

        // Clear events between scenes to avoid stale handlers
        EventBus.clear();

        // Create fresh scene
        const nextScene = factory();
        this.currentScene = nextScene;
        this.currentSceneName = name;

        // Add to stage BEFORE init so scene is visible during loading
        this.gameContainer.addChild(nextScene);

        if (nextScene.init) {
            await nextScene.init();
        }

        if (nextScene.start) {
            nextScene.start();
        }

        this.resize(
            this.app.screen.width,
            this.app.screen.height
        );
    }

    public static resize(width: number, height: number) {
        if (this.currentScene?.resize) {
            this.currentScene.resize(width, height);
        }
    }

    public static getApp(): Application {
        return this.app;
    }

    public static getCurrentSceneName(): string {
        return this.currentSceneName;
    }
}
