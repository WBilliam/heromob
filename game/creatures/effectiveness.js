export const TYPE_EFFECTIVENESS = {
  melee: { melee: 0, ranged: -0.2, area: 0, cavalry: 0, flying: 0.2 },
  ranged: { melee: 0.2, ranged: 0, area: 0, cavalry: -0.2, flying: 0 },
  area: { melee: 0, ranged: 0, area: 0, cavalry: 0.2, flying: -0.2 },
  cavalry: { melee: 0, ranged: 0.2, area: -0.2, cavalry: 0, flying: 0 },
  flying: { melee: -0.2, ranged: 0, area: 0.2, cavalry: 0, flying: 0 },
};

export const ELEMENT_EFFECTIVENESS = {
  fire: { fire: 0, water: -0.4, earth: 0.4, wind: 0, thunder: 0, dark: 0, light: 0 },
  water: { fire: 0.4, water: 0, earth: 0, wind: 0, thunder: -0.4, dark: 0, light: 0 },
  earth: { fire: -0.4, water: 0, earth: 0, wind: 0.4, thunder: 0, dark: 0, light: 0 },
  wind: { fire: 0, water: 0, earth: -0.4, wind: 0, thunder: 0.4, dark: 0, light: 0 },
  thunder: { fire: 0, water: 0.4, earth: 0, wind: -0.4, thunder: 0, dark: 0, light: 0 },
  dark: { fire: 0, water: 0, earth: 0, wind: 0, thunder: 0, dark: -0.4, light: 0.4 },
  light: { fire: 0, water: 0, earth: 0, wind: 0, thunder: 0, dark: 0.4, light: -0.4 },
};

export function getEffectiveness(table, attackerKey, defenderKey) {
  if (!attackerKey || !defenderKey) return 0;
  return table[attackerKey]?.[defenderKey] ?? 0;
}
