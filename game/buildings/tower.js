export const TOWER_CONFIG = {
  id: "tower",
  name: "Tower",
  description: "Fires projectiles at enemy creatures in range.",
  maxHp: 20,
  width: 60,
  height: 90,
  range: 190,
  placingLoadMs: 15000,
  fireCooldownMs: 500,
  projectileSpeed: 240,
  projectileDamage: 1,
  projectileRadius: 4,
};

export const TOWER_DEFINITION = {
  id: TOWER_CONFIG.id,
  name: TOWER_CONFIG.name,
  description: TOWER_CONFIG.description,
  width: TOWER_CONFIG.width,
  height: TOWER_CONFIG.height,
  placingLoadMs: TOWER_CONFIG.placingLoadMs,
};

export function createTowerState({ id, team, x, y }) {
  return {
    id,
    type: TOWER_CONFIG.id,
    team,
    x,
    y,
    hp: TOWER_CONFIG.maxHp,
    maxHp: TOWER_CONFIG.maxHp,
    fireCooldown: 0,
  };
}

export function applyTowerDamage(tower, damage) {
  if (!tower) return;
  tower.hp = Math.max(0, tower.hp - damage);
}
