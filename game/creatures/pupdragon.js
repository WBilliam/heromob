import {
  CREATURE_SPAWN_JITTER,
  CREATURE_SPEED_JITTER,
} from "../constants.js";
import { applySpawnVariation } from "./variation.js";

export const PUP_DRAGON_CONFIG = {
  id: "pupdragon",
  name: "Pup Dragon",
  description: "Baby fire dragon.",
  icon: "assets/images/icons/pupdragon-icon.png",
  level: "unit",
  attackType: "ranged",
  element: "fire",
  playerMaxHp: 3,
  enemyMaxHp: 3,
  damage: 1,
  speed: 80,
  radius: 8,
  spriteWidth: 32,
  spriteHeight: 32,
  pop: 4,
  attackRange: 120,
  projectileSpeed: 200,
  projectileRadius: 6,
  projectileRenderSize: 26,
  spawnJitter: CREATURE_SPAWN_JITTER,
  speedJitter: CREATURE_SPEED_JITTER,
};

export const PUP_DRAGON_DEFINITION = {
  id: PUP_DRAGON_CONFIG.id,
  name: PUP_DRAGON_CONFIG.name,
  description: PUP_DRAGON_CONFIG.description,
  icon: PUP_DRAGON_CONFIG.icon,
  level: PUP_DRAGON_CONFIG.level,
};

export function createPupDragonState({ id, team, x, y }) {
  const maxHp =
    team === "player"
      ? PUP_DRAGON_CONFIG.playerMaxHp
      : PUP_DRAGON_CONFIG.enemyMaxHp;
  const variation = applySpawnVariation({
    x,
    speed: PUP_DRAGON_CONFIG.speed,
    spawnJitter: PUP_DRAGON_CONFIG.spawnJitter,
    speedJitter: PUP_DRAGON_CONFIG.speedJitter,
  });
  return {
    id,
    type: PUP_DRAGON_CONFIG.id,
    team,
    attackType: PUP_DRAGON_CONFIG.attackType,
    element: PUP_DRAGON_CONFIG.element,
    x: variation.x,
    y,
    speed: variation.speed,
    radius: PUP_DRAGON_CONFIG.radius,
    spriteWidth: PUP_DRAGON_CONFIG.spriteWidth,
    spriteHeight: PUP_DRAGON_CONFIG.spriteHeight,
    damage: PUP_DRAGON_CONFIG.damage,
    attackRange: PUP_DRAGON_CONFIG.attackRange,
    projectileSpeed: PUP_DRAGON_CONFIG.projectileSpeed,
    projectileRadius: PUP_DRAGON_CONFIG.projectileRadius,
    projectileRenderSize: PUP_DRAGON_CONFIG.projectileRenderSize,
    hp: maxHp,
    maxHp,
    attackCooldown: 0,
    attackWindup: 0,
    isDead: false,
    deathTimer: 0,
  };
}
