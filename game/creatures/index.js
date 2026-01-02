import { GOBLIN_DEFINITION } from "./goblin.js";

export { GOBLIN_CONFIG, GOBLIN_DEFINITION, createGoblinState } from "./goblin.js";

export const CREATURE_CATALOG = [GOBLIN_DEFINITION];

export function getCreatureDefinition(creatureId) {
  return (
    CREATURE_CATALOG.find((creature) => creature.id === creatureId) || null
  );
}
