import {
  ref,
  reactive,
  computed,
  onMounted,
  onBeforeUnmount,
} from "../lib/vue.js";
import {
  CREATURE_ATTACK_RANGE_PADDING,
  BUILDING_ATTACK_RANGE_PADDING,
  BUILDING_COLLISION_PADDING,
  BUILDING_PLACEMENT_PADDING,
  TARGET_AGGRO_RADIUS,
  DEATH_DELAY_SECONDS,
  ATTACK_WINDUP,
  ATTACK_COOLDOWN,
  CREATURE_SPACING,
  OPPONENT_SPACING,
  SEPARATION_STRENGTH,
  CREATURES_CAN_FIGHT,
  BUILDING_ZONE_START_RATIO,
} from "./constants.js";
import {
  BASE_CONFIG,
  BUILDING_CATALOG,
  NEST_CONFIG,
  TOWER_CONFIG,
  WALL_CONFIG,
  applyBaseDamage as applyBaseDamageToState,
  applyNestDamage,
  applyTowerDamage,
  applyWallDamage,
  createBaseState,
  createEnemyNestState,
  createNestState,
  createTowerState,
  createWallState,
  getBuildingDefinition,
} from "./buildings/index.js";
import { createGoblinState } from "./creatures/index.js";

const BASE_MAX_HP = BASE_CONFIG.maxHp;
const PLAYER_BASE_WIDTH = BASE_CONFIG.playerSize.width;
const PLAYER_BASE_HEIGHT = BASE_CONFIG.playerSize.height;
const ENEMY_BASE_WIDTH = BASE_CONFIG.enemySize.width;
const ENEMY_BASE_HEIGHT = BASE_CONFIG.enemySize.height;
const NEST_WIDTH = NEST_CONFIG.width;
const NEST_HEIGHT = NEST_CONFIG.height;
const TOWER_WIDTH = TOWER_CONFIG.width;
const TOWER_HEIGHT = TOWER_CONFIG.height;
const TOWER_RANGE = TOWER_CONFIG.range;
const TOWER_FIRE_COOLDOWN = TOWER_CONFIG.fireCooldownMs / 1000;
const TOWER_PROJECTILE_SPEED = TOWER_CONFIG.projectileSpeed;
const TOWER_PROJECTILE_DAMAGE = TOWER_CONFIG.projectileDamage;
const TOWER_PROJECTILE_RADIUS = TOWER_CONFIG.projectileRadius;
const WALL_WIDTH = WALL_CONFIG.width;
const WALL_HEIGHT = WALL_CONFIG.height;
const SPAWN_INTERVAL_MS = NEST_CONFIG.spawnIntervalMs;

export function useBattleState() {
  const battlefieldShellRef = ref(null);
  const battlefieldRef = ref(null);
  const field = reactive({ width: 0, height: 0 });
  const viewport = reactive({ width: 0, height: 0 });

  const enemyBase = reactive(createBaseState());
  const playerBase = reactive(createBaseState());
  const enemyNest = reactive(createEnemyNestState());
  const playerNests = ref([]);
  const playerWalls = ref([]);
  const playerTowers = ref([]);
  const creatures = ref([]);
  const projectiles = ref([]);
  const buildingCatalog = BUILDING_CATALOG;
  const dragState = reactive({
    active: false,
    buildingId: null,
    x: 0,
    y: 0,
    isValid: false,
  });

  const isBattleActive = ref(false);
  const isDevMode = ref(false);
  const isGameOver = ref(false);
  const resultMessage = ref("");

  let nextId = 1;
  let nextBuildingId = 1;
  let nextProjectileId = 1;
  let animationId = 0;
  let lastTime = 0;

  const basePositions = computed(() => {
    const centerX = field.width / 2;
    const padding = 90;
    return {
      enemy: { x: centerX, y: padding },
      player: { x: centerX, y: field.height - padding },
    };
  });

  const nestPositions = computed(() => {
    const offset = 140;
    return {
      enemy: {
        x: basePositions.value.enemy.x,
        y: basePositions.value.enemy.y + offset,
      },
      player: {
        x: basePositions.value.player.x,
        y: basePositions.value.player.y - offset,
      },
    };
  });

  const buildingZoneTop = computed(() =>
    Math.max(0, field.height * BUILDING_ZONE_START_RATIO)
  );

  const enemyHpPercent = computed(() =>
    Math.max(0, Math.round((enemyBase.hp / BASE_MAX_HP) * 100))
  );
  const playerHpPercent = computed(() =>
    Math.max(0, Math.round((playerBase.hp / BASE_MAX_HP) * 100))
  );

  function measureField() {
    if (!battlefieldRef.value || !battlefieldShellRef.value) return;
    const rect = battlefieldRef.value.getBoundingClientRect();
    const shellRect = battlefieldShellRef.value.getBoundingClientRect();
    field.width = rect.width;
    field.height = rect.height;
    viewport.width = shellRect.width;
    viewport.height = shellRect.height;
  }

  function spawnCreature(team, source) {
    if (isGameOver.value || !field.width || !field.height) return;
    if (!source) return;
    creatures.value.push(
      createGoblinState({
        id: nextId++,
        team,
        x: source.x,
        y: source.y,
      })
    );
  }

  function getEnemyBuildings(targetTeam) {
    const buildings = [];
    if (targetTeam === "enemy") {
      if (enemyNest.hp > 0) {
        const pos = nestPositions.value.enemy;
        buildings.push({
          type: "nest",
          ref: enemyNest,
          x: pos.x,
          y: pos.y,
          width: NEST_WIDTH,
          height: NEST_HEIGHT,
        });
      }
      return buildings;
    }

    for (const nest of playerNests.value) {
      if (nest.hp <= 0) continue;
      buildings.push({
        type: "nest",
        ref: nest,
        x: nest.x,
        y: nest.y,
        width: NEST_WIDTH,
        height: NEST_HEIGHT,
      });
    }

    for (const wall of playerWalls.value) {
      if (wall.hp <= 0) continue;
      buildings.push({
        type: "wall",
        ref: wall,
        x: wall.x,
        y: wall.y,
        width: WALL_WIDTH,
        height: WALL_HEIGHT,
      });
    }

    for (const tower of playerTowers.value) {
      if (tower.hp <= 0) continue;
      buildings.push({
        type: "tower",
        ref: tower,
        x: tower.x,
        y: tower.y,
        width: TOWER_WIDTH,
        height: TOWER_HEIGHT,
      });
    }

    return buildings;
  }

  function getTargetInRadius(creature, targetTeam) {
    let best = null;
    let bestDist = Infinity;
    const maxDist = TARGET_AGGRO_RADIUS;

    if (CREATURES_CAN_FIGHT) {
      for (const other of creatures.value) {
        if (other.isDead) continue;
        if (other.team !== targetTeam) continue;
        const dist = Math.hypot(other.x - creature.x, other.y - creature.y);
        if (dist <= maxDist && dist < bestDist) {
          best = { type: "enemy", ref: other, x: other.x, y: other.y };
          bestDist = dist;
        }
      }
    }

    const buildings = getEnemyBuildings(targetTeam);
    for (const building of buildings) {
      const dist = Math.hypot(building.x - creature.x, building.y - creature.y);
      if (dist <= maxDist && dist < bestDist) {
        best = {
          type: building.type,
          ref: building.ref,
          x: building.x,
          y: building.y,
          width: building.width,
          height: building.height,
        };
        bestDist = dist;
      }
    }

    return best;
  }

  function closestPointOnRect(
    pointX,
    pointY,
    rectCenterX,
    rectCenterY,
    rectWidth,
    rectHeight
  ) {
    const halfW = rectWidth / 2;
    const halfH = rectHeight / 2;
    const left = rectCenterX - halfW;
    const right = rectCenterX + halfW;
    const top = rectCenterY - halfH;
    const bottom = rectCenterY + halfH;
    const clampedX = Math.max(left, Math.min(pointX, right));
    const clampedY = Math.max(top, Math.min(pointY, bottom));

    if (pointX >= left && pointX <= right && pointY >= top && pointY <= bottom) {
      const distLeft = pointX - left;
      const distRight = right - pointX;
      const distTop = pointY - top;
      const distBottom = bottom - pointY;
      const minDist = Math.min(distLeft, distRight, distTop, distBottom);

      if (minDist === distLeft) return { x: left, y: pointY };
      if (minDist === distRight) return { x: right, y: pointY };
      if (minDist === distTop) return { x: pointX, y: top };
      return { x: pointX, y: bottom };
    }

    return { x: clampedX, y: clampedY };
  }

  function pushCircleOutsideRect(
    creature,
    rectCenterX,
    rectCenterY,
    rectWidth,
    rectHeight
  ) {
    const halfW = rectWidth / 2;
    const halfH = rectHeight / 2;
    const left = rectCenterX - halfW;
    const right = rectCenterX + halfW;
    const top = rectCenterY - halfH;
    const bottom = rectCenterY + halfH;

    if (
      creature.x < left ||
      creature.x > right ||
      creature.y < top ||
      creature.y > bottom
    ) {
      return null;
    }

    const distLeft = creature.x - left;
    const distRight = right - creature.x;
    const distTop = creature.y - top;
    const distBottom = bottom - creature.y;
    const minDist = Math.min(distLeft, distRight, distTop, distBottom);
    const padding = creature.radius + BUILDING_COLLISION_PADDING;

    if (minDist === distLeft) {
      creature.x = left - padding;
      return "left";
    }
    if (minDist === distRight) {
      creature.x = right + padding;
      return "right";
    }
    if (minDist === distTop) {
      creature.y = top - padding;
      return "top";
    }
    creature.y = bottom + padding;
    return "bottom";
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getBattlefieldCoords(event) {
    if (!battlefieldRef.value) return null;
    const rect = battlefieldRef.value.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function isPointInBuildingZone(point) {
    if (!point) return false;
    return (
      point.x >= 0 &&
      point.x <= field.width &&
      point.y >= buildingZoneTop.value &&
      point.y <= field.height
    );
  }

  function clampToField(point, building) {
    const halfW = building.width / 2;
    const halfH = building.height / 2;
    return {
      x: clamp(point.x, halfW, field.width - halfW),
      y: clamp(point.y, halfH, field.height - halfH),
    };
  }

  function clampToZone(point, building) {
    const halfW = building.width / 2;
    const halfH = building.height / 2;
    return {
      x: clamp(point.x, halfW, field.width - halfW),
      y: clamp(
        point.y,
        buildingZoneTop.value + halfH,
        field.height - halfH
      ),
    };
  }

  function rectFromCenter(x, y, width, height) {
    const halfW = width / 2;
    const halfH = height / 2;
    return {
      left: x - halfW,
      right: x + halfW,
      top: y - halfH,
      bottom: y + halfH,
    };
  }

  function rectsOverlap(a, b, padding = 0) {
    return (
      a.left - padding < b.right &&
      a.right + padding > b.left &&
      a.top - padding < b.bottom &&
      a.bottom + padding > b.top
    );
  }

  function getPlacementObstacles() {
    const baseEnemy = basePositions.value.enemy;
    const basePlayer = basePositions.value.player;
    const nestEnemy = nestPositions.value.enemy;
    const obstacles = [
      {
        x: baseEnemy.x,
        y: baseEnemy.y,
        width: ENEMY_BASE_WIDTH,
        height: ENEMY_BASE_HEIGHT,
      },
      {
        x: basePlayer.x,
        y: basePlayer.y,
        width: PLAYER_BASE_WIDTH,
        height: PLAYER_BASE_HEIGHT,
      },
      {
        x: nestEnemy.x,
        y: nestEnemy.y,
        width: NEST_WIDTH,
        height: NEST_HEIGHT,
      },
    ];

    for (const nest of playerNests.value) {
      if (nest.hp <= 0) continue;
      obstacles.push({
        x: nest.x,
        y: nest.y,
        width: NEST_WIDTH,
        height: NEST_HEIGHT,
      });
    }

    for (const wall of playerWalls.value) {
      if (wall.hp <= 0) continue;
      obstacles.push({
        x: wall.x,
        y: wall.y,
        width: WALL_WIDTH,
        height: WALL_HEIGHT,
      });
    }

    for (const tower of playerTowers.value) {
      if (tower.hp <= 0) continue;
      obstacles.push({
        x: tower.x,
        y: tower.y,
        width: TOWER_WIDTH,
        height: TOWER_HEIGHT,
      });
    }

    return obstacles;
  }

  function isPlacementClear(point, building) {
    const candidate = rectFromCenter(
      point.x,
      point.y,
      building.width,
      building.height
    );
    const obstacles = getPlacementObstacles();
    for (const obstacle of obstacles) {
      const rect = rectFromCenter(
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height
      );
      if (rectsOverlap(candidate, rect, BUILDING_PLACEMENT_PADDING)) {
        return false;
      }
    }
    return true;
  }

  function findValidPlacement(point, building) {
    const candidate = clampToZone(point, building);
    if (isPlacementClear(candidate, building)) return candidate;
    const step = 8;
    const maxRadius = Math.max(building.width, building.height) * 3;
    for (let radius = step; radius <= maxRadius; radius += step) {
      for (let dx = -radius; dx <= radius; dx += step) {
        for (let dy = -radius; dy <= radius; dy += step) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          const testPoint = clampToZone(
            { x: point.x + dx, y: point.y + dy },
            building
          );
          if (isPlacementClear(testPoint, building)) return testPoint;
        }
      }
    }
    return null;
  }

  function updateDragPosition(event) {
    const building = getBuildingDefinition(dragState.buildingId);
    if (!building) return;
    const point = getBattlefieldCoords(event);
    if (!point) return;
    const clamped = clampToField(point, building);
    let preview = clamped;
    let isValid = false;
    if (isPointInBuildingZone(point)) {
      const zonePoint = clampToZone(point, building);
      preview = zonePoint;
      isValid = isPlacementClear(zonePoint, building);
    }
    dragState.x = preview.x;
    dragState.y = preview.y;
    dragState.isValid = isValid;
  }

  function placeBuilding(buildingId, point) {
    const building = getBuildingDefinition(buildingId);
    if (!building || !point) return;
    if (buildingId === "nest") {
      playerNests.value.push(
        createNestState({
          id: nextBuildingId++,
          team: "player",
          x: point.x,
          y: point.y,
        })
      );
      return;
    }

    if (buildingId === "wall") {
      playerWalls.value.push(
        createWallState({
          id: nextBuildingId++,
          team: "player",
          x: point.x,
          y: point.y,
        })
      );
      return;
    }

    if (buildingId === "tower") {
      playerTowers.value.push(
        createTowerState({
          id: nextBuildingId++,
          team: "player",
          x: point.x,
          y: point.y,
        })
      );
    }
  }

  function cancelBuildingDrag() {
    dragState.active = false;
    dragState.buildingId = null;
    dragState.isValid = false;
    window.removeEventListener("pointermove", handleBuildingDragMove);
    window.removeEventListener("pointerup", handleBuildingDragEnd);
  }

  function startBuildingDrag(buildingId, event) {
    if (isGameOver.value) return;
    if (!field.width || !field.height) return;
    event.preventDefault();
    dragState.active = true;
    dragState.buildingId = buildingId;
    updateDragPosition(event);
    window.addEventListener("pointermove", handleBuildingDragMove);
    window.addEventListener("pointerup", handleBuildingDragEnd);
  }

  function handleBuildingDragMove(event) {
    if (!dragState.active) return;
    updateDragPosition(event);
  }

  function handleBuildingDragEnd(event) {
    if (!dragState.active) return;
    if (!field.width || !field.height) {
      cancelBuildingDrag();
      return;
    }
    const building = getBuildingDefinition(dragState.buildingId);
    const point = getBattlefieldCoords(event);
    if (building && point && isPointInBuildingZone(point)) {
      const placement = findValidPlacement(point, building);
      if (placement) {
        placeBuilding(dragState.buildingId, placement);
      }
    }
    cancelBuildingDrag();
  }

  function applyBaseDamage(targetTeam, damage) {
    const base = targetTeam === "enemy" ? enemyBase : playerBase;
    applyBaseDamageToState(base, damage);

    if (playerBase.hp <= 0) {
      endGame("enemy");
      return;
    }

    if (enemyBase.hp <= 0 && playerBase.hp > 0) {
      endGame("player");
    }
  }

  function applyCreatureDamage(creature, damage) {
    if (!creature || creature.isDead) return;
    creature.hp = Math.max(0, creature.hp - damage);
    if (creature.hp <= 0) {
      creature.isDead = true;
      creature.deathTimer = DEATH_DELAY_SECONDS;
    }
  }

  function endGame(winner) {
    isGameOver.value = true;
    resultMessage.value = winner === "player" ? "Victory" : "Defeat";
  }

  function updateSpawns(dt) {
    if (isGameOver.value) return;
    if (enemyNest.hp > 0) {
      enemyNest.spawnProgress += dt * 1000;
      while (enemyNest.spawnProgress >= SPAWN_INTERVAL_MS) {
        enemyNest.spawnProgress -= SPAWN_INTERVAL_MS;
        spawnCreature("enemy", nestPositions.value.enemy);
      }
    }

    for (const nest of playerNests.value) {
      if (nest.hp <= 0) continue;
      nest.spawnProgress += dt * 1000;
      while (nest.spawnProgress >= SPAWN_INTERVAL_MS) {
        nest.spawnProgress -= SPAWN_INTERVAL_MS;
        spawnCreature("player", nest);
      }
    }
  }

  function findClosestEnemyCreature(tower) {
    const targetTeam = tower.team === "player" ? "enemy" : "player";
    let best = null;
    let bestDist = TOWER_RANGE;

    for (const creature of creatures.value) {
      if (creature.isDead) continue;
      if (creature.team !== targetTeam) continue;
      const dist = Math.hypot(creature.x - tower.x, creature.y - tower.y);
      if (dist <= TOWER_RANGE && dist < bestDist) {
        best = creature;
        bestDist = dist;
      }
    }

    return best;
  }

  function spawnProjectile(tower, target) {
    const dx = target.x - tower.x;
    const dy = target.y - tower.y;
    const angle = Math.atan2(dy, dx);
    const renderSize = Math.max(TOWER_PROJECTILE_RADIUS * 6, 18);
    projectiles.value.push({
      id: nextProjectileId++,
      team: tower.team,
      targetId: target.id,
      x: tower.x,
      y: tower.y,
      speed: TOWER_PROJECTILE_SPEED,
      damage: TOWER_PROJECTILE_DAMAGE,
      radius: TOWER_PROJECTILE_RADIUS,
      renderSize,
      angle,
    });
  }

  function updateTowers(dt) {
    if (isGameOver.value) return;
    for (const tower of playerTowers.value) {
      if (tower.hp <= 0) continue;
      tower.fireCooldown = Math.max(0, tower.fireCooldown - dt);
      if (tower.fireCooldown > 0) continue;
      const target = findClosestEnemyCreature(tower);
      if (!target) continue;
      spawnProjectile(tower, target);
      tower.fireCooldown = TOWER_FIRE_COOLDOWN;
    }
  }

  function updateProjectiles(dt) {
    if (!projectiles.value.length) return;
    const nextProjectiles = [];

    for (const projectile of projectiles.value) {
      const target = creatures.value.find(
        (creature) => creature.id === projectile.targetId
      );
      if (!target || target.isDead) continue;
      const dx = target.x - projectile.x;
      const dy = target.y - projectile.y;
      const dist = Math.hypot(dx, dy);
      const step = projectile.speed * dt;
      const hitDist = projectile.radius + target.radius;
      projectile.angle = Math.atan2(dy, dx);

      if (dist <= hitDist + step) {
        applyCreatureDamage(target, projectile.damage);
        continue;
      }

      if (dist > 0.001) {
        projectile.x += (dx / dist) * step;
        projectile.y += (dy / dist) * step;
      }

      nextProjectiles.push(projectile);
    }

    projectiles.value = nextProjectiles;
  }

  function separateCreatures() {
    for (let i = 0; i < creatures.value.length; i += 1) {
      const a = creatures.value[i];
      if (a.isDead) continue;
      for (let j = i + 1; j < creatures.value.length; j += 1) {
        const b = creatures.value[j];
        if (b.isDead) continue;
        const spacing = a.team === b.team ? CREATURE_SPACING : OPPONENT_SPACING;
        const minDist = a.radius + b.radius + spacing;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < minDist) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * overlap * SEPARATION_STRENGTH;
          a.y -= ny * overlap * SEPARATION_STRENGTH;
          b.x += nx * overlap * SEPARATION_STRENGTH;
          b.y += ny * overlap * SEPARATION_STRENGTH;
        }
      }
    }
  }

  function resolveBuildingCollisions() {
    const baseEnemy = basePositions.value.enemy;
    const basePlayer = basePositions.value.player;
    const nestEnemy = nestPositions.value.enemy;
    const buildings = [
      {
        x: baseEnemy.x,
        y: baseEnemy.y,
        width: ENEMY_BASE_WIDTH,
        height: ENEMY_BASE_HEIGHT,
        isActive: enemyBase.hp > 0,
        team: "enemy",
        kind: "base",
      },
      {
        x: basePlayer.x,
        y: basePlayer.y,
        width: PLAYER_BASE_WIDTH,
        height: PLAYER_BASE_HEIGHT,
        isActive: playerBase.hp > 0,
        team: "player",
        kind: "base",
      },
      {
        x: nestEnemy.x,
        y: nestEnemy.y,
        width: NEST_WIDTH,
        height: NEST_HEIGHT,
        isActive: enemyNest.hp > 0,
        team: "enemy",
        kind: "nest",
      },
    ];

    for (const nest of playerNests.value) {
      buildings.push({
        x: nest.x,
        y: nest.y,
        width: NEST_WIDTH,
        height: NEST_HEIGHT,
        isActive: nest.hp > 0,
        team: "player",
        kind: "nest",
      });
    }

    for (const wall of playerWalls.value) {
      buildings.push({
        x: wall.x,
        y: wall.y,
        width: WALL_WIDTH,
        height: WALL_HEIGHT,
        isActive: wall.hp > 0,
        team: "player",
        kind: "wall",
      });
    }

    for (const tower of playerTowers.value) {
      buildings.push({
        x: tower.x,
        y: tower.y,
        width: TOWER_WIDTH,
        height: TOWER_HEIGHT,
        isActive: tower.hp > 0,
        team: "player",
        kind: "tower",
      });
    }

    for (const creature of creatures.value) {
      if (creature.isDead) continue;
      for (const building of buildings) {
        if (!building.isActive) continue;
        const pushedSide = pushCircleOutsideRect(
          creature,
          building.x,
          building.y,
          building.width,
          building.height
        );
        if (
          pushedSide &&
          creature.team === "player" &&
          building.team === "player" &&
          (building.kind === "nest" ||
            building.kind === "wall" ||
            building.kind === "tower")
        ) {
          const nudgeDirection = creature.x >= building.x ? 1 : -1;
          creature.x = clamp(
            creature.x + nudgeDirection * (creature.radius * 0.7 + 2),
            creature.radius,
            field.width - creature.radius
          );
        }
      }
    }
  }

  function updateCreatures(dt) {
    if (isGameOver.value) return;
    const removed = new Set();

    for (const creature of creatures.value) {
      if (removed.has(creature.id)) continue;
      if (creature.isDead) {
        creature.deathTimer = Math.max(0, creature.deathTimer - dt);
        continue;
      }
      creature.attackCooldown = Math.max(0, creature.attackCooldown - dt);
      const windupWasActive = creature.attackWindup > 0;
      creature.attackWindup = Math.max(0, creature.attackWindup - dt);

      let targetX;
      let targetY;
      let targetRadius = 0;
      let targetWidth = 0;
      let targetHeight = 0;
      let targetType = "base";
      let targetTeam = creature.team === "player" ? "enemy" : "player";
      let targetNestRef = null;
      let targetWallRef = null;
      let targetTowerRef = null;
      let targetEnemyRef = null;

      const nearbyTarget = getTargetInRadius(creature, targetTeam);

      if (nearbyTarget && nearbyTarget.type === "enemy") {
        targetEnemyRef = nearbyTarget.ref;
        targetX = targetEnemyRef.x;
        targetY = targetEnemyRef.y;
        targetRadius = targetEnemyRef.radius;
        targetType = "enemy";
      } else if (nearbyTarget && nearbyTarget.type === "wall") {
        targetX = nearbyTarget.x;
        targetY = nearbyTarget.y;
        targetWidth = WALL_WIDTH;
        targetHeight = WALL_HEIGHT;
        targetType = "wall";
        targetWallRef = nearbyTarget.ref;
      } else if (nearbyTarget && nearbyTarget.type === "tower") {
        targetX = nearbyTarget.x;
        targetY = nearbyTarget.y;
        targetWidth = TOWER_WIDTH;
        targetHeight = TOWER_HEIGHT;
        targetType = "tower";
        targetTowerRef = nearbyTarget.ref;
      } else if (nearbyTarget && nearbyTarget.type === "nest") {
        targetX = nearbyTarget.x;
        targetY = nearbyTarget.y;
        targetWidth = NEST_WIDTH;
        targetHeight = NEST_HEIGHT;
        targetType = "nest";
        targetNestRef = nearbyTarget.ref;
      } else {
        const basePos = basePositions.value[targetTeam];
        targetX = basePos.x;
        targetY = basePos.y;
        if (targetTeam === "enemy") {
          targetWidth = ENEMY_BASE_WIDTH;
          targetHeight = ENEMY_BASE_HEIGHT;
        } else {
          targetWidth = PLAYER_BASE_WIDTH;
          targetHeight = PLAYER_BASE_HEIGHT;
        }
        targetType = "base";
      }

      let dx = 0;
      let dy = 0;
      let dist = 0;
      let isInRange = false;
      if (targetType === "enemy") {
        dx = targetX - creature.x;
        dy = targetY - creature.y;
        dist = Math.hypot(dx, dy);
        const contactDist =
          creature.radius + targetRadius + CREATURE_ATTACK_RANGE_PADDING;
        isInRange = dist <= contactDist;
      } else {
        const contactPoint = closestPointOnRect(
          creature.x,
          creature.y,
          targetX,
          targetY,
          targetWidth,
          targetHeight
        );
        targetX = contactPoint.x;
        targetY = contactPoint.y;
        dx = targetX - creature.x;
        dy = targetY - creature.y;
        dist = Math.hypot(dx, dy);
        isInRange = dist <= creature.radius + BUILDING_ATTACK_RANGE_PADDING;
      }

      if (isInRange) {
        if (
          windupWasActive &&
          creature.attackWindup === 0 &&
          creature.attackCooldown <= 0
        ) {
          if (targetType === "enemy") {
            applyCreatureDamage(targetEnemyRef, creature.damage);
          } else if (targetType === "wall") {
            applyWallDamage(targetWallRef, creature.damage);
          } else if (targetType === "tower") {
            applyTowerDamage(targetTowerRef, creature.damage);
          } else if (targetType === "nest") {
            applyNestDamage(targetNestRef, creature.damage);
          } else if (targetType === "base") {
            applyBaseDamage(targetTeam, creature.damage);
            if (isGameOver.value) break;
          }
          creature.attackCooldown = ATTACK_COOLDOWN;
        } else if (
          creature.attackCooldown <= 0 &&
          creature.attackWindup <= 0
        ) {
          creature.attackWindup = ATTACK_WINDUP;
        }
        continue;
      }

      if (dist > 0.001) {
        const move = creature.speed * dt;
        creature.x += (dx / dist) * move;
        creature.y += (dy / dist) * move;
      }
    }

    if (removed.size) {
      creatures.value = creatures.value.filter(
        (creature) => !removed.has(creature.id)
      );
    }
    creatures.value = creatures.value.filter(
      (creature) => !(creature.isDead && creature.deathTimer <= 0)
    );

    if (creatures.value.length > 1) {
      separateCreatures();
    }
    resolveBuildingCollisions();
  }

  function animationLoop(now) {
    if (!lastTime) lastTime = now;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    if (isBattleActive.value && !isGameOver.value) {
      updateSpawns(dt);
      updateCreatures(dt);
      updateTowers(dt);
      updateProjectiles(dt);
    }
    animationId = requestAnimationFrame(animationLoop);
  }

  function startBattle() {
    if (isGameOver.value) return;
    isBattleActive.value = true;
  }

  function enterDevMode() {
    isDevMode.value = true;
    isBattleActive.value = false;
  }

  function stopBattle() {
    isBattleActive.value = false;
  }

  function resetBattle() {
    const baseState = createBaseState();
    const enemyNestState = createEnemyNestState();
    enemyBase.hp = baseState.hp;
    playerBase.hp = baseState.hp;
    enemyNest.hp = enemyNestState.hp;
    enemyNest.maxHp = enemyNestState.maxHp;
    enemyNest.spawnProgress = enemyNestState.spawnProgress;
    playerNests.value = [];
    playerWalls.value = [];
    playerTowers.value = [];
    creatures.value = [];
    projectiles.value = [];
    isGameOver.value = false;
    resultMessage.value = "";
    isBattleActive.value = false;
    isDevMode.value = false;
    nextId = 1;
    nextBuildingId = 1;
    nextProjectileId = 1;
    cancelBuildingDrag();
    scheduleFocusOnPlayerBase();
  }

  function baseStyle(team) {
    const pos = basePositions.value[team];
    const size =
      team === "enemy"
        ? { width: ENEMY_BASE_WIDTH, height: ENEMY_BASE_HEIGHT }
        : { width: PLAYER_BASE_WIDTH, height: PLAYER_BASE_HEIGHT };
    return {
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
    };
  }

  function enemyNestStyle() {
    const pos = nestPositions.value.enemy;
    return {
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      width: `${NEST_WIDTH}px`,
      height: `${NEST_HEIGHT}px`,
    };
  }

  function playerNestStyle(nest) {
    return {
      left: `${nest.x}px`,
      top: `${nest.y}px`,
      width: `${NEST_WIDTH}px`,
      height: `${NEST_HEIGHT}px`,
    };
  }

  function wallStyle(wall) {
    return {
      left: `${wall.x}px`,
      top: `${wall.y}px`,
      width: `${WALL_WIDTH}px`,
      height: `${WALL_HEIGHT}px`,
    };
  }

  function towerStyle(tower) {
    return {
      left: `${tower.x}px`,
      top: `${tower.y}px`,
      width: `${TOWER_WIDTH}px`,
      height: `${TOWER_HEIGHT}px`,
    };
  }

  function projectileStyle(projectile) {
    const size = projectile.renderSize ?? projectile.radius * 2;
    const angle = projectile.angle ?? 0;
    const angleDeg = (angle * 180) / Math.PI;
    return {
      left: `${projectile.x}px`,
      top: `${projectile.y}px`,
      width: `${size}px`,
      height: `${size}px`,
      "--projectile-rotation": `${angleDeg}deg`,
    };
  }

  function creatureStyle(creature) {
    const width = creature.spriteWidth ?? creature.radius * 2;
    const height = creature.spriteHeight ?? creature.radius * 2;
    return {
      left: `${creature.x}px`,
      top: `${creature.y}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  }

  function creatureHpPercent(creature) {
    if (!creature.maxHp) return 0;
    return Math.max(0, Math.round((creature.hp / creature.maxHp) * 100));
  }

  function nestHpPercent(nest) {
    if (!nest || !nest.maxHp) return 0;
    return Math.max(0, Math.round((nest.hp / nest.maxHp) * 100));
  }

  function spawnPercent(nest) {
    const progress = nest?.spawnProgress || 0;
    return Math.min(100, Math.round((progress / SPAWN_INTERVAL_MS) * 100));
  }

  const buildingZoneStyle = computed(() => ({
    top: `${buildingZoneTop.value}px`,
  }));

  const dragBuilding = computed(() =>
    buildingCatalog.find((building) => building.id === dragState.buildingId) ||
    null
  );

  const dragGhostStyle = computed(() => {
    const style = {
      left: `${dragState.x}px`,
      top: `${dragState.y}px`,
    };
    if (dragBuilding.value) {
      style.width = `${dragBuilding.value.width}px`;
      style.height = `${dragBuilding.value.height}px`;
    }
    return style;
  });

  function focusOnPlayerBase() {
    if (!battlefieldShellRef.value || !viewport.height) return;
    const maxScroll = field.height - viewport.height;
    battlefieldShellRef.value.scrollTop = Math.max(0, maxScroll);
  }

  function scheduleFocusOnPlayerBase() {
    requestAnimationFrame(() => {
      measureField();
      focusOnPlayerBase();
    });
  }

  function handleKeyScroll(event) {
    if (!battlefieldShellRef.value) return;
    const scrollStep = 70;
    if (event.key === "ArrowUp") {
      battlefieldShellRef.value.scrollBy({ top: -scrollStep, behavior: "smooth" });
      event.preventDefault();
    } else if (event.key === "ArrowDown") {
      battlefieldShellRef.value.scrollBy({ top: scrollStep, behavior: "smooth" });
      event.preventDefault();
    }
  }

  onMounted(() => {
    measureField();
    window.addEventListener("resize", measureField);
    window.addEventListener("keydown", handleKeyScroll);
    resetBattle();
    scheduleFocusOnPlayerBase();
    animationId = requestAnimationFrame(animationLoop);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    window.removeEventListener("resize", measureField);
    window.removeEventListener("keydown", handleKeyScroll);
    cancelBuildingDrag();
  });

  return {
    battlefieldShellRef,
    battlefieldRef,
    baseMaxHp: BASE_MAX_HP,
    enemyBase,
    playerBase,
    enemyNest,
    playerNests,
    playerWalls,
    playerTowers,
    buildingCatalog,
    dragState,
    dragBuilding,
    creatures,
    projectiles,
    isBattleActive,
    isDevMode,
    enemyHpPercent,
    playerHpPercent,
    isGameOver,
    resultMessage,
    baseStyle,
    enemyNestStyle,
    playerNestStyle,
    wallStyle,
    towerStyle,
    projectileStyle,
    creatureStyle,
    creatureHpPercent,
    nestHpPercent,
    spawnPercent,
    buildingZoneStyle,
    dragGhostStyle,
    startBuildingDrag,
    startBattle,
    stopBattle,
    enterDevMode,
    resetBattle,
  };
}
