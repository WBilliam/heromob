const CONFIG = window.GAME_CONFIG || {};

export const BASE_MAX_HP = CONFIG.baseMaxHp ?? 200;
export const NEST_MAX_HP = CONFIG.nestMaxHp ?? 50;
export const CREATURE_DAMAGE = CONFIG.creatureDamage ?? 1;
export const PLAYER_CREATURE_MAX_HP = CONFIG.playerCreatureMaxHp ?? 3;
export const ENEMY_CREATURE_MAX_HP = CONFIG.enemyCreatureMaxHp ?? 1;
export const CREATURE_SPEED = CONFIG.creatureSpeed ?? 80;
export const CREATURE_RADIUS = CONFIG.creatureRadius ?? 9;
export const PLAYER_BASE_WIDTH = CONFIG.playerBaseWidth ?? 92;
export const PLAYER_BASE_HEIGHT = CONFIG.playerBaseHeight ?? 92;
export const ENEMY_BASE_WIDTH = CONFIG.enemyBaseWidth ?? 170;
export const ENEMY_BASE_HEIGHT = CONFIG.enemyBaseHeight ?? 90;
export const NEST_WIDTH = CONFIG.nestWidth ?? 96;
export const NEST_HEIGHT = CONFIG.nestHeight ?? 64;
export const CREATURE_ATTACK_RANGE_PADDING = CONFIG.creatureAttackRangePadding ?? 4;
export const BUILDING_ATTACK_RANGE_PADDING =
  CONFIG.buildingAttackRangePadding ?? 0;
export const BUILDING_COLLISION_PADDING = CONFIG.buildingCollisionPadding ?? 0;
export const BUILDING_PLACEMENT_PADDING =
  CONFIG.buildingPlacementPadding ?? 8;
export const DEATH_DELAY_MS = CONFIG.deathDelayMs ?? 200;
export const DEATH_DELAY_SECONDS = DEATH_DELAY_MS / 1000;
export const ATTACK_WINDUP = CONFIG.attackWindup ?? 0.1;
export const ATTACK_COOLDOWN = CONFIG.attackCooldown ?? 0.8;
export const CREATURE_SPACING = CONFIG.creatureSpacing ?? 6;
export const OPPONENT_SPACING = CONFIG.opponentSpacing ?? 0;
export const SEPARATION_STRENGTH = CONFIG.separationStrength ?? 0.5;
export const CREATURES_CAN_FIGHT = CONFIG.creaturesCanFight ?? true;
export const SPAWN_INTERVAL_MS = CONFIG.spawnIntervalMs ?? 3000;
export const BUILDING_ZONE_START_RATIO = CONFIG.buildingZoneStartRatio ?? 2 / 3;
