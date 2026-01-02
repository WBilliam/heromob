export const NEST_CONFIG = {
  id: "nest",
  name: "Nest",
  description: "Spawns allied creatures.",
  maxHp: 50,
  width: 96,
  height: 64,
  spawnIntervalMs: 3000,
};

export const NEST_DEFINITION = {
  id: NEST_CONFIG.id,
  name: NEST_CONFIG.name,
  description: NEST_CONFIG.description,
  width: NEST_CONFIG.width,
  height: NEST_CONFIG.height,
};

export function createEnemyNestState() {
  return {
    hp: NEST_CONFIG.maxHp,
    maxHp: NEST_CONFIG.maxHp,
    spawnProgress: 0,
    spawnCreatureId: null,
  };
}

export function createNestState({ id, team, x, y }) {
  return {
    id,
    type: NEST_CONFIG.id,
    team,
    x,
    y,
    hp: NEST_CONFIG.maxHp,
    maxHp: NEST_CONFIG.maxHp,
    spawnProgress: 0,
    spawnCreatureId: null,
  };
}

export function applyNestDamage(nest, damage) {
  if (!nest) return;
  nest.hp = Math.max(0, nest.hp - damage);
  if (nest.hp <= 0) {
    nest.spawnProgress = 0;
  }
}
