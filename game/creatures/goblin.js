import {
  CREATURE_SPAWN_JITTER,
  CREATURE_SPEED_JITTER,
} from "../constants.js";
import { applySpawnVariation } from "./variation.js";

export const GOBLIN_CONFIG = {
  id: "goblin",
  name: "Goblin",
  description: "Fast melee minion.",
  icon: "assets/images/icons/goblin-icon.png",
  level: "minion",
  attackType: "melee",
  element: "thunder",
  playerMaxHp: 3,
  enemyMaxHp: 3,
  damage: 1,
  speed: 80,
  radius: 9,
  spriteWidth: 26,
  spriteHeight: 30,
  pop: 8,
  spawnJitter: CREATURE_SPAWN_JITTER,
  speedJitter: CREATURE_SPEED_JITTER,
};

export const GOBLIN_DEFINITION = {
  id: GOBLIN_CONFIG.id,
  name: GOBLIN_CONFIG.name,
  description: GOBLIN_CONFIG.description,
  icon: GOBLIN_CONFIG.icon,
  level: GOBLIN_CONFIG.level,
};

export function createGoblinState({ id, team, x, y }) {
  const maxHp =
    team === "player" ? GOBLIN_CONFIG.playerMaxHp : GOBLIN_CONFIG.enemyMaxHp;
  const variation = applySpawnVariation({
    x,
    speed: GOBLIN_CONFIG.speed,
    spawnJitter: GOBLIN_CONFIG.spawnJitter,
    speedJitter: GOBLIN_CONFIG.speedJitter,
  });
  return {
    id,
    type: GOBLIN_CONFIG.id,
    team,
    attackType: GOBLIN_CONFIG.attackType,
    element: GOBLIN_CONFIG.element,
    x: variation.x,
    y,
    speed: variation.speed,
    radius: GOBLIN_CONFIG.radius,
    spriteWidth: GOBLIN_CONFIG.spriteWidth,
    spriteHeight: GOBLIN_CONFIG.spriteHeight,
    damage: GOBLIN_CONFIG.damage,
    hp: maxHp,
    maxHp,
    attackCooldown: 0,
    attackWindup: 0,
    isDead: false,
    deathTimer: 0,
  };
}

