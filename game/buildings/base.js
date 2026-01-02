export const BASE_CONFIG = {
  id: "base",
  name: "Base",
  maxHp: 200,
  playerSize: {
    width: 170,
    height: 170,
  },
  enemySize: {
    width: 170,
    height: 170,
  },
};

export function createBaseState() {
  return { hp: BASE_CONFIG.maxHp };
}

export function applyBaseDamage(base, damage) {
  if (!base) return 0;
  const nextHp = Math.max(0, base.hp - damage);
  base.hp = nextHp;
  return nextHp;
}
