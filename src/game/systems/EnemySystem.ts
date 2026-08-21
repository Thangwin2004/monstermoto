import { Container } from 'pixi.js';
import { Enemy } from '../entities/Enemy';
import { Pool } from '../utils/Pool';
import { GAME_WIDTH, GAME_HEIGHT, ROAD_LEFT, ROAD_RIGHT } from '../constants';
import { ConvoySystem } from './ConvoySystem';
import { EnemyDefinitions, EnemyArchetype } from '../data/enemies';
import { WaveEntry, getEncountersForDifficulty } from '../data/encounters';
import { gameRng } from '../utils/RNG';
import { distance } from '../utils/MathUtils';

interface ActiveWave {
    entry: WaveEntry;
    spawned: number;
    totalCount: number;
    timer: number;
    delayTimer: number;
}

export class EnemySystem {
    public container: Container;
    public enemies: Enemy[] = [];

    private pool: Pool<Enemy>;
    private convoySystem: ConvoySystem;

    // Encounter state
    private activeWaves: ActiveWave[] = [];
    private encounterTimer: number = 0;
    private encounterCooldown: number = 2; // seconds between encounters
    private currentDifficulty: number = 1;
    private hpScale: number = 1;
    private speedScale: number = 1;
    private densityMultiplier: number = 1;
    private eliteChance: number = 0.05;

    constructor(parent: Container, convoySystem: ConvoySystem) {
        this.container = new Container();
        parent.addChild(this.container);
        this.convoySystem = convoySystem;

        // Expanded pool for large horde waves
        this.pool = new Pool<Enemy>(() => {
            const e = new Enemy();
            this.container.addChild(e);
            return e;
        }, 150);
    }

    /** Set dynamic scaling based on distance travelled */
    setDifficulty(
        difficulty: number,
        hpScale: number,
        speedScale: number = 1,
        densityMultiplier: number = 1,
        eliteChance: number = 0.05
    ) {
        this.currentDifficulty = difficulty;
        this.hpScale = hpScale;
        this.speedScale = speedScale;
        this.densityMultiplier = densityMultiplier;
        this.eliteChance = eliteChance;
    }

    update(dt: number) {
        const dtSec = dt * (1 / 60);

        // Manage encounters
        this.encounterTimer -= dtSec;
        if (this.encounterTimer <= 0 && this.activeWaves.length === 0) {
            this.startEncounter();
        }

        // Process active waves
        this.processWaves(dtSec);

        // Update enemies
        const convoy = this.convoySystem.convoy;
        const targetX = convoy.x;
        const frontModule = convoy.getFrontModule();
        const targetY = frontModule
            ? convoy.y + frontModule.y
            : convoy.y;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];

            if (!e.active) {
                e.visible = false;
                this.pool.release(e);
                this.enemies.splice(i, 1);
                continue;
            }

            e.update(dt);

            // Behavior-specific movement
            switch (e.behavior) {
                case 'rush':
                case 'swarm':
                    this.moveTowards(e, targetX, targetY, dtSec);
                    break;

                case 'ranged':
                    this.moveRanged(e, targetX, targetY, dtSec);
                    break;

                case 'leap':
                    this.moveLeap(e, targetX, targetY, dtSec);
                    break;
            }

            // Off screen bottom — deactivate
            if (e.y > GAME_HEIGHT + 120) {
                e.active = false;
            }
        }
    }

    private moveTowards(e: Enemy, tx: number, ty: number, dtSec: number) {
        const dx = tx - e.x;
        const dy = ty - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            const spd = e.getEffectiveSpeed() * dtSec;
            e.x += (dx / dist) * spd;
            e.y += (dy / dist) * spd;
        }
    }

    private moveRanged(e: Enemy, tx: number, ty: number, dtSec: number) {
        const dist = distance(e.x, e.y, tx, ty);

        if (dist > e.attackRange) {
            const dx = tx - e.x;
            const dy = ty - e.y;
            const spd = e.getEffectiveSpeed() * dtSec;
            e.x += (dx / dist) * spd;
            e.y += (dy / dist) * spd;
        } else {
            e.attackTimer -= dtSec;
            e.x += Math.sin(Date.now() * 0.003 + e.x) * 35 * dtSec;
        }
    }

    private moveLeap(e: Enemy, tx: number, ty: number, dtSec: number) {
        if (e.state === 'approaching') {
            const dist = distance(e.x, e.y, tx, ty);
            if (dist < e.leapRange) {
                e.state = 'leaping';
                e.leapStartX = e.x;
                e.leapStartY = e.y;
                e.leapTargetX = tx + (Math.random() - 0.5) * 40;
                e.leapTargetY = ty + (Math.random() - 0.5) * 40;
                e.leapProgress = 0;
            } else {
                this.moveTowards(e, tx, ty, dtSec);
            }
        } else if (e.state === 'leaping') {
            e.leapProgress += dtSec * 2.2;
            if (e.leapProgress >= 1) {
                e.leapProgress = 1;
                e.state = 'approaching';
            }
            const t = e.leapProgress;
            e.x = e.leapStartX + (e.leapTargetX - e.leapStartX) * t;
            e.y = e.leapStartY + (e.leapTargetY - e.leapStartY) * t - Math.sin(t * Math.PI) * 160;
            e.scale.set(1 + Math.sin(t * Math.PI) * 0.35);
        }
    }

    private startEncounter() {
        const available = getEncountersForDifficulty(this.currentDifficulty);
        if (available.length === 0) return;

        const encounter = gameRng.pick(available);
        this.activeWaves = encounter.waves.map(w => {
            const scaledCount = Math.max(1, Math.round(w.count * this.densityMultiplier));
            return {
                entry: w,
                spawned: 0,
                totalCount: scaledCount,
                timer: 0,
                delayTimer: w.delay ?? 0,
            };
        });

        this.encounterCooldown = encounter.duration + Math.max(1, 3 - this.currentDifficulty * 0.2);
        this.encounterTimer = this.encounterCooldown;
    }

    private processWaves(dtSec: number) {
        for (let i = this.activeWaves.length - 1; i >= 0; i--) {
            const wave = this.activeWaves[i];

            if (wave.delayTimer > 0) {
                wave.delayTimer -= dtSec;
                continue;
            }

            wave.timer -= dtSec;
            if (wave.timer <= 0 && wave.spawned < wave.totalCount) {
                this.spawnEnemy(wave.entry.type);
                wave.spawned++;
                wave.timer = Math.max(0.08, (wave.entry.interval ?? 0.5) / Math.min(2.0, this.densityMultiplier));
            }

            if (wave.spawned >= wave.totalCount) {
                this.activeWaves.splice(i, 1);
            }
        }
    }

    spawnEnemy(type: EnemyArchetype) {
        const def = EnemyDefinitions[type];
        if (!def) return;

        const e = this.pool.get();
        const isElite = Math.random() < this.eliteChance;
        const totalHpScale = this.hpScale * (isElite ? 2.4 : 1.0);

        e.reset(def, totalHpScale);
        e.speed = def.speed * this.speedScale * (isElite ? 1.15 : 1.0);
        e.damage = Math.round(def.damage * (isElite ? 1.6 : 1.0));

        if (isElite) {
            e.scale.set(1.3);
            e.xpReward = Math.round(def.xpReward * 2.5);
            e.scrapReward = Math.round(def.scrapReward * 2 + 1);
        }

        // Spawn position: across the roadway width
        e.x = gameRng.float(ROAD_LEFT + 20, ROAD_RIGHT - 20);
        e.y = gameRng.float(-90, -30);

        this.enemies.push(e);
    }

    spawnSwarm(count: number) {
        for (let i = 0; i < count; i++) {
            this.spawnEnemy('swarm');
        }
    }
}
