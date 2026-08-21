// ─── Virtual Resolution ───
export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

// ─── Road ───
export const ROAD_SPEED = 400; // px/s at normal speed
export const ROAD_NITRO_SPEED = 700;
export const ROAD_WIDTH = 560; // playable road width
export const ROAD_LEFT = (GAME_WIDTH - ROAD_WIDTH) / 2;
export const ROAD_RIGHT = ROAD_LEFT + ROAD_WIDTH;
export const LANE_COUNT = 5;
export const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;

// ─── Convoy ───
export const CONVOY_Y = GAME_HEIGHT * 0.824; // convoy center Y (pulled down for enhanced distance and reaction time)
export const CONVOY_MOVE_SPEED = 600; // px/s horizontal
export const CONVOY_CLAMP_MARGIN = 80; // px from edge
export const MODULE_SIZE = 80; // module visual size (square)
export const MODULE_SPACING = 118; // vertical distance between modules with room for HP bars and badges
export const MAX_MODULES = 4; // Compact convoy: Engine + 3 modules

// ─── Nitro / Heat ───
export const HEAT_PER_SECOND = 20;
export const MAX_HEAT = 100;
export const OVERHEAT_PENALTY_DURATION = 3; // seconds
export const NITRO_COOLDOWN = 1; // seconds after overheat before heat drops

// ─── Combat ───
export const ENEMY_DAMAGE_ON_CRASH = 15;
export const MODULE_COLLISION_RADIUS = 40;
export const DEFAULT_PROJECTILE_RADIUS = 8;

// ─── Difficulty Scaling ───
export const BASE_SPAWN_INTERVAL = 2.0; // seconds
export const MIN_SPAWN_INTERVAL = 0.4;
export const DIFFICULTY_RAMP_RATE = 0.02; // interval reduction per second of play
export const HP_SCALE_PER_MINUTE = 0.15; // +15% enemy HP per minute

// ─── XP / Level ───
export const XP_PER_KILL = 10;
export const XP_PER_LEVEL_BASE = 80;
export const XP_PER_LEVEL_GROWTH = 20; // each level needs +20 more XP
export const UPGRADE_CHOICES = 3;

// ─── Scrap ───
export const SCRAP_PER_KILL = 1;
export const SCRAP_MAGNET_RANGE = 150;
export const SCRAP_COLLECT_RANGE = 50;
export const SCRAP_SPEED = 300;

// ─── Route ───
export const ROUTE_FORK_INTERVAL = 90; // seconds between route forks
export const GARAGE_REPAIR_COST = 30; // scrap per repair

// ─── Run ───
export const RUN_FIRST_UPGRADE_TIME = 30; // seconds
export const RUN_BOSS_TIME = 360; // 6 minutes for MVP (shorter run)
export const RUN_TARGET_DURATION = 480; // 8 minutes

// ─── Boss ───
export const BOSS_HP = 1200;
export const BOSS_HOOK_INTERVAL = 8; // seconds between hooks
export const BOSS_HOOK_DURATION = 4; // seconds to break hook
export const BOSS_APPROACH_SPEED = 100;

// ─── UI Layout ───
export const HUD_TOP_Y = 20;
export const HUD_BOTTOM_Y = GAME_HEIGHT - 60;
export const HP_BAR_WIDTH = 60;
export const HP_BAR_HEIGHT = 8;
export const BOSS_HP_BAR_WIDTH = 500;
export const BOSS_HP_BAR_HEIGHT = 20;
export const BOSS_HP_BAR_Y = 40;

// ─── Colors ───
export const COLORS = {
  // Module type colors
  engine: 0x3366cc,
  weapon: 0xcc3333,
  defense: 0x888899,
  support: 0x33aa66,
  fire: 0xff6600,
  electric: 0x00ccff,

  // Rarity
  common: 0xaaaaaa,
  rare: 0x4488ff,
  epic: 0xaa44ff,
  legendary: 0xffaa00,
  corrupted: 0xff0044,

  // UI
  hpGreen: 0x44cc44,
  hpYellow: 0xcccc00,
  hpRed: 0xcc2222,
  xpBar: 0x44aaff,
  scrap: 0xffffbb,
  road: 0x333333,
  roadLine: 0xffffff,
  roadEdge: 0xaaaaaa,

  // Effects
  burn: 0xff4400,
  shock: 0x00eeff,
  poison: 0x44ff00,
  shield: 0x88bbff,
} as const;

// ─── Audio Keys ───
export const AUDIO = {
  bgmMenu: "bgm_menu",
  bgmGame: "bgm_game",
  sfxButton: "sfx_button",
  sfxHit: "sfx_hit",
  sfxKill: "sfx_kill",
  sfxLevelUp: "sfx_levelup",
  sfxModuleDestroy: "sfx_module_destroy",
  sfxBossSpawn: "sfx_boss_spawn",
  sfxScrapCollect: "sfx_scrap",
  sfxShoot: "sfx_shoot",
  sfxExplosion: "sfx_explosion",
  sfxShake: "sfx_shake",
} as const;
