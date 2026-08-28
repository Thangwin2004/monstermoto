/**
 * Typed Event Bus for decoupled game systems.
 * Events: enemy:killed, enemy:hit, module:damaged, module:destroyed,
 * upgrade:chosen, boss:spawned, boss:defeated, scrap:collected,
 * run:ended, level:up, route:chosen, module:added, nitro:toggle,
 * heat:overheat, convoy:rearranged
 */

export type GameEventMap = {
  "enemy:killed": {
    x: number;
    y: number;
    enemyType: string;
    hasBurn?: boolean;
    hasShock?: boolean;
  };
  "enemy:hit": { enemyId: number; damage: number; weaponType: string };
  "module:damaged": {
    moduleIndex: number;
    damage: number;
    currentHp: number;
    maxHp: number;
  };
  "module:destroyed": {
    moduleIndex: number;
    moduleId: string;
    x: number;
    y: number;
  };
  "module:added": { moduleId: string; slotIndex: number };
  "upgrade:chosen": { upgradeId: string; rarity: string };
  "boss:spawned": { bossId: string };
  "boss:defeated": { bossId: string; x: number; y: number };
  "scrap:collected": {
    amount: number;
    totalScrap: number;
    x?: number;
    y?: number;
  };
  "run:ended": {
    victory: boolean;
    distance: number;
    kills: number;
    score: number;
  };
  "level:up": { level: number };
  "route:chosen": { routeType: string };
  "nitro:toggle": { active: boolean };
  "heat:overheat": {};
  "convoy:rearranged": {};
  "camera:shake": { intensity: number; duration: number };
  "pickup:toast": {
    text: string;
    color: number;
    icon: string;
  };
  "damage:number": {
    x: number;
    y: number;
    amount: number;
    crit?: boolean;
    heal?: boolean;
    status?: "burn" | "shock" | "crit";
  };
  "settings:changed": {
    lowParticles?: boolean;
    screenShake?: boolean;
    sfxMuted?: boolean;
    bgmMuted?: boolean;
  };
};

export type GameEvent = keyof GameEventMap;

type Handler<T> = (data: T) => void;

class EventBusClass {
  private handlers: Map<string, Set<Handler<unknown>>> = new Map();

  on<K extends GameEvent>(event: K, handler: Handler<GameEventMap[K]>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as Handler<unknown>);
  }

  off<K extends GameEvent>(event: K, handler: Handler<GameEventMap[K]>): void {
    const set = this.handlers.get(event);
    if (set) {
      set.delete(handler as Handler<unknown>);
    }
  }

  emit<K extends GameEvent>(event: K, data: GameEventMap[K]): void {
    const set = this.handlers.get(event);
    if (set) {
      for (const handler of set) {
        handler(data);
      }
    }
  }

  /** Remove all handlers — call between runs */
  clear(): void {
    this.handlers.clear();
  }
}

/** Singleton event bus shared across all systems */
export const EventBus = new EventBusClass();
