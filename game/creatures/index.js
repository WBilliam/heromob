import { GOBLIN_CONFIG, GOBLIN_DEFINITION } from "./goblin.js";
import { PUP_DRAGON_CONFIG, PUP_DRAGON_DEFINITION } from "./pupdragon.js";

export { GOBLIN_CONFIG, GOBLIN_DEFINITION, createGoblinState } from "./goblin.js";
export {
  PUP_DRAGON_CONFIG,
  PUP_DRAGON_DEFINITION,
  createPupDragonState,
} from "./pupdragon.js";

export const CREATURE_CATALOG = [GOBLIN_DEFINITION, PUP_DRAGON_DEFINITION];
export const CREATURE_CONFIGS = {
  [GOBLIN_CONFIG.id]: GOBLIN_CONFIG,
  [PUP_DRAGON_CONFIG.id]: PUP_DRAGON_CONFIG,
};

export function getCreatureDefinition(creatureId) {
  return (
    CREATURE_CATALOG.find((creature) => creature.id === creatureId) || null
  );
}

export function getCreatureConfig(creatureId) {
  return CREATURE_CONFIGS[creatureId] || null;
}
