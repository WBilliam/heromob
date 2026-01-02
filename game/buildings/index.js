import { NEST_DEFINITION } from "./nest.js";
import { TOWER_DEFINITION } from "./tower.js";
import { WALL_DEFINITION } from "./wall.js";

export { BASE_CONFIG, createBaseState, applyBaseDamage } from "./base.js";
export {
  NEST_CONFIG,
  NEST_DEFINITION,
  createEnemyNestState,
  createNestState,
  applyNestDamage,
} from "./nest.js";
export {
  WALL_CONFIG,
  WALL_DEFINITION,
  createWallState,
  applyWallDamage,
} from "./wall.js";
export {
  TOWER_CONFIG,
  TOWER_DEFINITION,
  createTowerState,
  applyTowerDamage,
} from "./tower.js";

export const BUILDING_CATALOG = [
  NEST_DEFINITION,
  WALL_DEFINITION,
  TOWER_DEFINITION,
];

export function getBuildingDefinition(buildingId) {
  return (
    BUILDING_CATALOG.find((building) => building.id === buildingId) || null
  );
}
