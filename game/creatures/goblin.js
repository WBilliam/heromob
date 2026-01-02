export const GOBLIN_CONFIG = {
  id: "goblin",
  name: "Goblin",
  description: "Fast melee unit.",
  playerMaxHp: 2,
  enemyMaxHp: 5,
  damage: 1,
  speed: 80,
  radius: 9,
  spriteWidth: 26,
  spriteHeight: 30,
  spawnJitter: 24,
  speedJitter: 10,
};

export const GOBLIN_DEFINITION = {
  id: GOBLIN_CONFIG.id,
  name: GOBLIN_CONFIG.name,
  description: GOBLIN_CONFIG.description,
};

export function createGoblinState({ id, team, x, y }) {
  const maxHp =
    team === "player" ? GOBLIN_CONFIG.playerMaxHp : GOBLIN_CONFIG.enemyMaxHp;
  const jitter = (Math.random() - 0.5) * GOBLIN_CONFIG.spawnJitter;
  const speedJitter =
    Math.random() * GOBLIN_CONFIG.speedJitter -
    GOBLIN_CONFIG.speedJitter / 2;
  return {
    id,
    type: GOBLIN_CONFIG.id,
    team,
    x: x + jitter,
    y,
    speed: GOBLIN_CONFIG.speed + speedJitter,
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
