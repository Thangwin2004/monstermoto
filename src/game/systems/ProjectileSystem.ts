import { Container } from 'pixi.js';
import { Projectile, ProjectileType, ProjectileSpawnOptions } from '../entities/Projectile';
import { Pool } from '../utils/Pool';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export class ProjectileSystem {
    public container: Container;
    public projectiles: Projectile[] = [];
    private pool: Pool<Projectile>;

    constructor(parent: Container) {
        this.container = new Container();
        parent.addChild(this.container);

        this.pool = new Pool<Projectile>(() => {
            const p = new Projectile();
            this.container.addChild(p);
            return p;
        }, 200);
    }

    spawn(
        x: number, y: number,
        vx: number, vy: number,
        damage: number,
        type: ProjectileType = 'bullet',
        opts?: ProjectileSpawnOptions
    ): Projectile {
        const p = this.pool.get();
        p.reset(x, y, vx, vy, damage, type, opts);
        this.projectiles.push(p);
        return p;
    }

    update(dt: number) {
        const dtSec = dt * (1 / 60);

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            if (!p.active) {
                this.pool.release(p);
                this.projectiles.splice(i, 1);
                continue;
            }

            p.x += p.vx * dtSec;
            p.y += p.vy * dtSec;

            // Off screen check
            if (p.x < -50 || p.x > GAME_WIDTH + 50 || p.y < -100 || p.y > GAME_HEIGHT + 100) {
                p.deactivate();
            }
        }
    }

    /** Clear all projectiles (scene transition) */
    clear() {
        for (const p of this.projectiles) {
            p.deactivate();
            this.pool.release(p);
        }
        this.projectiles.length = 0;
    }
}
