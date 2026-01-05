export const WALL_CONFIG = {
  id: "wall",
  name: "Wall",
  description: "High HP barrier that delays enemies.",
  maxHp: 70,
  width: 120,
  height: 40,
  placingLoadMs: 40000,
};

export const WALL_DEFINITION = {
  id: WALL_CONFIG.id,
  name: WALL_CONFIG.name,
  description: WALL_CONFIG.description,
  width: WALL_CONFIG.width,
  height: WALL_CONFIG.height,
  placingLoadMs: WALL_CONFIG.placingLoadMs,
};

export function createWallState({ id, team, x, y }) {
  return {
    id,
    type: WALL_CONFIG.id,
    team,
    x,
    y,
    hp: WALL_CONFIG.maxHp,
    maxHp: WALL_CONFIG.maxHp,
  };
}

export function applyWallDamage(wall, damage) {
  if (!wall) return;
  wall.hp = Math.max(0, wall.hp - damage);
}
