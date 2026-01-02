import {
  CREATURE_SPAWN_JITTER,
  CREATURE_SPEED_JITTER,
} from "../constants.js";

export function applySpawnVariation({
  x,
  speed,
  spawnJitter = CREATURE_SPAWN_JITTER,
  speedJitter = CREATURE_SPEED_JITTER,
}) {
  const jitter = (Math.random() - 0.5) * spawnJitter;
  const speedOffset = (Math.random() - 0.5) * speedJitter;
  return {
    x: x + jitter,
    speed: speed + speedOffset,
  };
}
