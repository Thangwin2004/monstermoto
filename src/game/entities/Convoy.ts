import { Container, Graphics } from 'pixi.js';
import { Module, ModuleData } from './Module';
import { MAX_MODULES, MODULE_SPACING } from '../constants';
import { EventBus } from '../utils/EventBus';

export class Convoy extends Container {
    public modules: Module[] = [];

    constructor() {
        super();
    }

    /** Add a new module or merge/mount as side attachments onto the war vehicle */
    addOrUpgradeModule(data: ModuleData): { module: Module; isNew: boolean } | null {
        // 1. Engine
        if (data.type === 'engine') {
            const existingEngine = this.modules.find(m => m.data.type === 'engine');
            if (existingEngine) {
                existingEngine.heal(80);
                return { module: existingEngine, isNew: false };
            }
            const engineMod = new Module(data);
            engineMod.slotIndex = this.modules.length;
            this.modules.push(engineMod);
            this.addChild(engineMod);
            this.arrangeModules();
            return { module: engineMod, isNew: true };
        }

        // 2. Shield -> Mounts directly onto Engine cab to protect the engine!
        if (data.id === 'shield') {
            const engine = this.getEngine();
            if (engine) {
                engine.upgradeWeapon('shield');
                return { module: engine, isNew: false };
            }
        }

        // 3. Main Battle Vehicle
        const mainWeapon = this.modules.find(m => !m.isDead && m.data.type === 'weapon');
        if (!mainWeapon) {
            const module = new Module(data);
            module.slotIndex = this.modules.length;
            this.modules.push(module);
            this.addChild(module);
            this.arrangeModules();
            EventBus.emit('module:added', { moduleId: data.id, slotIndex: module.slotIndex });
            return { module, isNew: true };
        }

        // 4. Mount only the chosen weapon independently without upgrading other weapons!
        mainWeapon.upgradeWeapon(data.id);
        return { module: mainWeapon, isNew: false };
    }

    addModule(data: ModuleData): Module | null {
        const res = this.addOrUpgradeModule(data);
        return res ? res.module : null;
    }

    removeModule(index: number): Module | null {
        if (index < 0 || index >= this.modules.length) return null;

        const module = this.modules.splice(index, 1)[0];
        this.removeChild(module);

        // Re-index remaining modules
        for (let i = 0; i < this.modules.length; i++) {
            this.modules[i].slotIndex = i;
        }
        this.arrangeModules();
        return module;
    }

    /** Remove dead modules from the formation */
    removeDeadModules(): Module[] {
        const removed: Module[] = [];
        for (let i = this.modules.length - 1; i >= 0; i--) {
            const m = this.modules[i];
            if (m.isDead) {
                EventBus.emit('module:destroyed', {
                    moduleIndex: i,
                    moduleId: m.data.id,
                    x: this.x + m.x,
                    y: this.y + m.y,
                });
                this.removeChild(m);
                this.modules.splice(i, 1);
                removed.push(m);
            }
        }
        if (removed.length > 0) {
            // Re-index
            for (let i = 0; i < this.modules.length; i++) {
                this.modules[i].slotIndex = i;
            }
            this.arrangeModules();
        }
        return removed;
    }

    /** Get indices of alive modules */
    getAliveIndices(): number[] {
        return this.modules
            .map((m, i) => (!m.isDead ? i : -1))
            .filter((i) => i !== -1);
    }

    /** Swap two modules in the formation */
    swapModules(indexA: number, indexB: number) {
        if (indexA < 0 || indexA >= this.modules.length) return;
        if (indexB < 0 || indexB >= this.modules.length) return;
        if (indexA === indexB) return;

        [this.modules[indexA], this.modules[indexB]] = [this.modules[indexB], this.modules[indexA]];

        // Re-index
        for (let i = 0; i < this.modules.length; i++) {
            this.modules[i].slotIndex = i;
        }
        this.arrangeModules();
        EventBus.emit('convoy:rearranged', {});
    }

    /** Get modules adjacent to the given index */
    getAdjacentModules(index: number): { front: Module | null; behind: Module | null } {
        return {
            front: index > 0 ? this.modules[index - 1] : null,
            behind: index < this.modules.length - 1 ? this.modules[index + 1] : null,
        };
    }

    /** Get module at the front of the convoy (index 0) */
    getFrontModule(): Module | null {
        return this.modules.length > 0 ? this.modules[0] : null;
    }

    /** Get module at the back of the convoy */
    getBackModule(): Module | null {
        return this.modules.length > 0 ? this.modules[this.modules.length - 1] : null;
    }

    /** Find engine module */
    getEngine(): Module | null {
        return this.modules.find(m => m.data.type === 'engine') ?? null;
    }

    /** Check if engine is dead — means game over */
    isEngineDead(): boolean {
        const engine = this.getEngine();
        return !engine || engine.isDead;
    }

    /** Check if convoy has a module or attachment with the given tag */
    hasTag(tag: string): boolean {
        return this.getAllTags().has(tag);
    }

    /** Get all tags present in the convoy including mounted attachments */
    getAllTags(): Set<string> {
        const tags = new Set<string>();
        for (const m of this.modules) {
            if (m.isDead) continue;
            for (const tag of m.data.tags) {
                tags.add(tag);
            }
            if (m.getWeaponLevel('flamethrower') > 0) tags.add('fire');
            if (m.getWeaponLevel('tesla') > 0) tags.add('electric');
            if (m.getWeaponLevel('shield') > 0) tags.add('defense');
            if (m.getWeaponLevel('machine_gun') > 0) {
                tags.add('physical');
                tags.add('projectile');
            }
        }
        return tags;
    }

    /** Arrange modules vertically (front at top) */
    arrangeModules() {
        const totalHeight = (this.modules.length - 1) * MODULE_SPACING;
        const startY = -totalHeight / 2;

        for (let i = 0; i < this.modules.length; i++) {
            this.modules[i].x = 0;
            this.modules[i].y = startY + i * MODULE_SPACING;
        }
    }

    /** Get the Y position of the front-most module in world space */
    getFrontY(): number {
        if (this.modules.length === 0) return this.y;
        return this.y + this.modules[0].y;
    }

    /** Update all modules */
    update(dt: number) {
        for (const m of this.modules) {
            m.update(dt);
        }
    }
}
