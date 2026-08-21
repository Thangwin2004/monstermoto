/**
 * Seeded pseudo-random number generator (Mulberry32).
 * Produces the same sequence for the same seed — perfect for Daily Runs,
 * debug reproduction, and replay.
 */
export class RNG {
    private state: number;

    constructor(seed?: number) {
        this.state = seed ?? (Date.now() ^ (Math.random() * 0xffffffff));
    }

    /** Returns a float in [0, 1) */
    next(): number {
        this.state |= 0;
        this.state = (this.state + 0x6d2b79f5) | 0;
        let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /** Returns an integer in [min, max] (inclusive) */
    int(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /** Returns a float in [min, max) */
    float(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }

    /** Returns true with the given probability [0, 1] */
    chance(probability: number): boolean {
        return this.next() < probability;
    }

    /** Pick a random element from an array */
    pick<T>(arr: T[]): T {
        return arr[this.int(0, arr.length - 1)];
    }

    /** Shuffle an array in place (Fisher-Yates) */
    shuffle<T>(arr: T[]): T[] {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this.int(0, i);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /** Weighted random pick: items is [{item, weight}, ...] */
    weightedPick<T>(items: { item: T; weight: number }[]): T {
        let total = 0;
        for (const entry of items) total += entry.weight;
        let roll = this.next() * total;
        for (const entry of items) {
            roll -= entry.weight;
            if (roll <= 0) return entry.item;
        }
        return items[items.length - 1].item;
    }

    /** Get current seed state (for save/restore) */
    getSeed(): number {
        return this.state;
    }
}

/** Global RNG instance — reset per run */
export let gameRng = new RNG();

export function resetRng(seed?: number): void {
    gameRng = new RNG(seed);
}
