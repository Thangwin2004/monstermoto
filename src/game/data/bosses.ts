/**
 * Boss data definitions.
 * MVP: The Collector — hooks and steals modules from the convoy.
 */

export interface BossPhase {
  name: string;
  hpThreshold: number; // phase starts when HP drops below this %
  hookInterval: number; // seconds between hook attempts
  hookDuration: number; // seconds player has to break the hook
  moveSpeed: number; // how fast boss tracks convoy X
  spawnSwarm: boolean; // whether boss spawns minions in this phase
  swarmInterval?: number;
}

export interface BossDefinition {
  id: string;
  name: string;
  maxHp: number;
  radius: number;
  color: number;
  approachSpeed: number;
  phases: BossPhase[];
}

export const BossDefinitions: Record<string, BossDefinition> = {
  collector: {
    id: "collector",
    name: "The Collector",
    maxHp: 2000,
    radius: 80,
    color: 0x880000,
    approachSpeed: 100,
    phases: [
      {
        name: "Phase 1",
        hpThreshold: 1.0,
        hookInterval: 7,
        hookDuration: 4,
        moveSpeed: 0.02,
        spawnSwarm: false,
      },
      {
        name: "Phase 2 — Aggressive",
        hpThreshold: 0.6,
        hookInterval: 5,
        hookDuration: 3.5,
        moveSpeed: 0.04,
        spawnSwarm: true,
        swarmInterval: 8,
      },
      {
        name: "Phase 3 — Desperate",
        hpThreshold: 0.3,
        hookInterval: 3.5,
        hookDuration: 3,
        moveSpeed: 0.06,
        spawnSwarm: true,
        swarmInterval: 5,
      },
    ],
  },
};
