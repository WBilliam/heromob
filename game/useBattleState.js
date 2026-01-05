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
  ELEMENT_EFFECTIVENESS,
  TYPE_EFFECTIVENESS,
  getEffectiveness,
} from "./creatures/effectiveness.js";
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
  createNestState,
  createTowerState,
  createWallState,
  getBuildingDefinition,
} from "./buildings/index.js";
import {
  CREATURE_CATALOG,
  createGoblinState,
  createPupDragonState,
  getCreatureConfig,
} from "./creatures/index.js";

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
const BASE_SPAWN_CREATURE_ID = "goblin";

export function useBattleState() {
  const battlefieldShellRef = ref(null);
  const battlefieldRef = ref(null);
  const field = reactive({ width: 0, height: 0 });
  const viewport = reactive({ width: 0, height: 0 });

  const enemyBase = reactive(createBaseState());
  const playerBase = reactive(createBaseState());
  const enemyNests = ref([]);
  const enemyWalls = ref([]);
  const enemyTowers = ref([]);
  const playerNests = ref([]);
  const playerWalls = ref([]);
  const playerTowers = ref([]);
  const creatures = ref([]);
  const projectiles = ref([]);
  const creatureCatalog = CREATURE_CATALOG;
  const baseSpawnProgress = reactive({ enemy: 0, player: 0 });
  const buildingCatalog = BUILDING_CATALOG;
  const buildingPlacement = reactive({});
  const dragState = reactive({
    active: false,
    buildingId: null,
    x: 0,
    y: 0,
    isValid: false,
  });
  const enemyDragState = reactive({
    active: false,
    buildingId: null,
    x: 0,
    y: 0,
    isValid: false,
  });
  const creatureDragState = reactive({
    active: false,
    creatureId: null,
    x: 0,
    y: 0,
    isValid: false,
    targetNestId: null,
  });
  const enemyCreatureDragState = reactive({
    active: false,
    creatureId: null,
    x: 0,
    y: 0,
    isValid: false,
    targetNestId: null,
  });

  const isBattleActive = ref(false);
  const isDevMode = ref(false);
  const isGameOver = ref(false);
  const resultMessage = ref("");
  const isBossBattle = ref(false);
  const stageConfigs = ref([]);
  const devStageIndex = ref(0);
  const activeStageIndex = ref(0);

  let nextId = 1;
  let nextBuildingId = 1;
  let nextEnemyBuildingId = 1;
  let nextProjectileId = 1;
  let animationId = 0;
  let lastTime = 0;
  let seededStageDefaults = false;

  const basePositions = computed(() => {
    const centerX = field.width / 2;
    const padding = 90;
    return {
      enemy: { x: centerX, y: padding },
      player: { x: centerX, y: field.height - padding },
    };
  });

  const defaultEnemyTowerPosition = computed(() => {
    const offset = 140;
    return {
      x: basePositions.value.enemy.x,
      y: basePositions.value.enemy.y + offset,
    };
  });

  const buildingZoneTop = computed(() =>
    Math.max(0, field.height * BUILDING_ZONE_START_RATIO)
  );
  const enemyZoneBottom = computed(() =>
    Math.max(0, field.height * (1 - BUILDING_ZONE_START_RATIO))
  );
  const stageCount = computed(() => (isBossBattle.value ? 5 : 3));

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
    seedStageDefaults();
  }

  function createStageConfig(index) {
    return {
      id: index + 1,
      enemyBuildings: [],
      advanceAtEnemyHpPercent: 0,
    };
  }

  function enforceFinalStageAdvancePercent() {
    if (!stageConfigs.value.length) return;
    const lastStage = stageConfigs.value[stageConfigs.value.length - 1];
    if (lastStage) {
      lastStage.advanceAtEnemyHpPercent = 0;
    }
  }

  function ensureStageConfigs() {
    const desired = stageCount.value;
    while (stageConfigs.value.length < desired) {
      stageConfigs.value.push(createStageConfig(stageConfigs.value.length));
    }
    if (stageConfigs.value.length > desired) {
      stageConfigs.value.splice(desired);
    }
    if (devStageIndex.value >= desired) {
      devStageIndex.value = Math.max(0, desired - 1);
    }
    if (activeStageIndex.value >= desired) {
      activeStageIndex.value = Math.max(0, desired - 1);
    }
    enforceFinalStageAdvancePercent();
  }

  function seedStageDefaults() {
    if (seededStageDefaults) return;
    if (!field.width || !field.height) return;
    ensureStageConfigs();
    const stage = stageConfigs.value[0];
    if (stage && stage.enemyBuildings.length === 0) {
      const pos = defaultEnemyTowerPosition.value;
      stage.enemyBuildings.push({
        id: nextEnemyBuildingId++,
        type: "tower",
        x: pos.x,
        y: pos.y,
        spawnCreatureId: null,
      });
    }
    seededStageDefaults = true;
    const stageIndex = isDevMode.value ? devStageIndex.value : activeStageIndex.value;
    applyStageConfig(stageIndex);
  }

  function hasPopSpace(team, creatureId) {
    const config = getCreatureConfig(creatureId);
    if (!config || typeof config.pop !== "number") return true;
    const aliveCount = creatures.value.filter(
      (creature) =>
        !creature.isDead && creature.team === team && creature.type === creatureId
    ).length;
    return aliveCount < config.pop;
  }

  function createCreatureState(creatureId, data) {
    if (creatureId === "pupdragon") {
      return createPupDragonState(data);
    }
    return createGoblinState(data);
  }

  function spawnCreature(team, source, creatureId = "goblin") {
    if (isGameOver.value || !field.width || !field.height) return;
    if (!source) return;
    if (!hasPopSpace(team, creatureId)) return;
    creatures.value.push(
      createCreatureState(creatureId, {
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
      for (const nest of enemyNests.value) {
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

      for (const wall of enemyWalls.value) {
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

      for (const tower of enemyTowers.value) {
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

  function getCreatureAttackRange(creature) {
    if (creature && typeof creature.attackRange === "number") {
      return creature.attackRange;
    }
    return creature.radius;
  }

  function getGangUpTarget() {
    for (const creature of creatures.value) {
      if (creature.isDead) continue;
      if (creature.team !== "player") continue;
      if (creature.type !== "goblin") continue;
      const candidate = getTargetInRadius(creature, "enemy");
      if (!candidate || candidate.type !== "enemy") continue;
      const dist = Math.hypot(
        candidate.ref.x - creature.x,
        candidate.ref.y - creature.y
      );
      const contactDist =
        getCreatureAttackRange(creature) +
        candidate.ref.radius +
        CREATURE_ATTACK_RANGE_PADDING;
      if (dist <= contactDist) {
        return candidate.ref;
      }
    }
    return null;
  }

  function getPupdragonPackTarget(team) {
    for (const creature of creatures.value) {
      if (creature.isDead) continue;
      if (creature.team !== team) continue;
      if (creature.type !== "pupdragon") continue;
      const targetTeam = team === "player" ? "enemy" : "player";
      const candidate = getTargetInRadius(creature, targetTeam);
      if (candidate) return candidate;
    }
    return null;
  }

  function getPupdragonPackCenter(team) {
    let count = 0;
    let sumX = 0;
    let sumY = 0;
    for (const creature of creatures.value) {
      if (creature.isDead) continue;
      if (creature.team !== team) continue;
      if (creature.type !== "pupdragon") continue;
      sumX += creature.x;
      sumY += creature.y;
      count += 1;
    }
    if (count < 2) return null;
    return { x: sumX / count, y: sumY / count };
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

  function normalizeAdvancePercent(value) {
    if (typeof value !== "number" || Number.isNaN(value)) return 0;
    return clamp(Math.round(value), 0, 100);
  }

  function getBattlefieldCoords(event) {
    if (!battlefieldRef.value) return null;
    const rect = battlefieldRef.value.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function isPointInZone(point, zoneTop, zoneBottom) {
    if (!point) return false;
    return (
      point.x >= 0 &&
      point.x <= field.width &&
      point.y >= zoneTop &&
      point.y <= zoneBottom
    );
  }

  function getBuildingLoadDuration(buildingId) {
    const building = getBuildingDefinition(buildingId);
    if (!building) return 0;
    const duration = Number(building.placingLoadMs);
    return Number.isFinite(duration) ? Math.max(0, duration) : 0;
  }

  function initBuildingPlacementTimers() {
    for (const building of buildingCatalog) {
      buildingPlacement[building.id] = getBuildingLoadDuration(building.id);
    }
  }

  function resetBuildingPlacementTimer(buildingId) {
    if (!buildingId) return;
    buildingPlacement[buildingId] = getBuildingLoadDuration(buildingId);
  }

  function updateBuildingPlacementTimers(dt) {
    if (isDevMode.value) return;
    const elapsedMs = dt * 1000;
    for (const building of buildingCatalog) {
      const duration = getBuildingLoadDuration(building.id);
      if (!duration) {
        buildingPlacement[building.id] = 0;
        continue;
      }
      const remaining = buildingPlacement[building.id];
      if (!Number.isFinite(remaining)) {
        buildingPlacement[building.id] = duration;
        continue;
      }
      if (remaining <= 0) continue;
      buildingPlacement[building.id] = Math.max(0, remaining - elapsedMs);
    }
  }

  function getBuildingPlacement(buildingId) {
    const durationMs = getBuildingLoadDuration(buildingId);
    if (isDevMode.value) {
      return {
        durationMs,
        remainingMs: 0,
        progress: 1,
        isReady: true,
      };
    }
    const remainingMs = Number.isFinite(buildingPlacement[buildingId])
      ? Math.max(0, buildingPlacement[buildingId])
      : durationMs;
    const progress =
      durationMs > 0 ? (durationMs - remainingMs) / durationMs : 1;
    return {
      durationMs,
      remainingMs,
      progress: Math.min(1, Math.max(0, progress)),
      isReady: remainingMs <= 0,
    };
  }

  function canPlaceBuilding(buildingId) {
    if (!buildingId) return false;
    if (isDevMode.value) return true;
    const placement = getBuildingPlacement(buildingId);
    return placement?.isReady ?? false;
  }

  function canAssignCreatureToNest(creatureId) {
    const config = getCreatureConfig(creatureId);
    return config?.level === "unit";
  }

  function getNestAtPoint(point, team = "player") {
    if (!point) return null;
    const nests = team === "enemy" ? enemyNests.value : playerNests.value;
    for (const nest of nests) {
      if (nest.hp <= 0) continue;
      const halfW = NEST_WIDTH / 2;
      const halfH = NEST_HEIGHT / 2;
      if (
        point.x >= nest.x - halfW &&
        point.x <= nest.x + halfW &&
        point.y >= nest.y - halfH &&
        point.y <= nest.y + halfH
      ) {
        return nest;
      }
    }
    return null;
  }

  function clampToField(point, building) {
    const halfW = building.width / 2;
    const halfH = building.height / 2;
    return {
      x: clamp(point.x, halfW, field.width - halfW),
      y: clamp(point.y, halfH, field.height - halfH),
    };
  }

  function clampToZone(point, building, zoneTop, zoneBottom) {
    const halfW = building.width / 2;
    const halfH = building.height / 2;
    return {
      x: clamp(point.x, halfW, field.width - halfW),
      y: clamp(point.y, zoneTop + halfH, zoneBottom - halfH),
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
    ];

    for (const nest of enemyNests.value) {
      if (nest.hp <= 0) continue;
      obstacles.push({
        x: nest.x,
        y: nest.y,
        width: NEST_WIDTH,
        height: NEST_HEIGHT,
      });
    }

    for (const wall of enemyWalls.value) {
      if (wall.hp <= 0) continue;
      obstacles.push({
        x: wall.x,
        y: wall.y,
        width: WALL_WIDTH,
        height: WALL_HEIGHT,
      });
    }

    for (const tower of enemyTowers.value) {
      if (tower.hp <= 0) continue;
      obstacles.push({
        x: tower.x,
        y: tower.y,
        width: TOWER_WIDTH,
        height: TOWER_HEIGHT,
      });
    }

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

  function findValidPlacement(point, building, zoneTop, zoneBottom) {
    const candidate = clampToZone(point, building, zoneTop, zoneBottom);
    if (isPlacementClear(candidate, building)) return candidate;
    const step = 8;
    const maxRadius = Math.max(building.width, building.height) * 3;
    for (let radius = step; radius <= maxRadius; radius += step) {
      for (let dx = -radius; dx <= radius; dx += step) {
        for (let dy = -radius; dy <= radius; dy += step) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          const testPoint = clampToZone(
            { x: point.x + dx, y: point.y + dy },
            building,
            zoneTop,
            zoneBottom
          );
          if (isPlacementClear(testPoint, building)) return testPoint;
        }
      }
    }
    return null;
  }

  function updateBuildingDragPosition(state, event, zoneTop, zoneBottom) {
    const building = getBuildingDefinition(state.buildingId);
    if (!building) return;
    const point = getBattlefieldCoords(event);
    if (!point) return;
    const clamped = clampToField(point, building);
    let preview = clamped;
    let isValid = false;
    if (isPointInZone(point, zoneTop, zoneBottom)) {
      const zonePoint = clampToZone(point, building, zoneTop, zoneBottom);
      preview = zonePoint;
      isValid = isPlacementClear(zonePoint, building);
    }
    state.x = preview.x;
    state.y = preview.y;
    state.isValid = isValid;
  }

  function updateDragPosition(event) {
    updateBuildingDragPosition(
      dragState,
      event,
      buildingZoneTop.value,
      field.height
    );
  }

  function updateEnemyDragPosition(event) {
    updateBuildingDragPosition(
      enemyDragState,
      event,
      0,
      enemyZoneBottom.value
    );
  }

  function updateCreatureDragPosition(event, team) {
    const point = getBattlefieldCoords(event);
    if (!point) return;
    const nest = getNestAtPoint(point, team);
    const state = team === "enemy" ? enemyCreatureDragState : creatureDragState;
    state.x = point.x;
    state.y = point.y;
    state.targetNestId = nest ? nest.id : null;
    state.isValid = !!nest && canAssignCreatureToNest(state.creatureId);
  }

  function placeBuilding(buildingId, point) {
    const building = getBuildingDefinition(buildingId);
    if (!building || !point) return false;
    if (buildingId === "nest") {
      playerNests.value.push(
        createNestState({
          id: nextBuildingId++,
          team: "player",
          x: point.x,
          y: point.y,
        })
      );
      return true;
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
      return true;
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
      return true;
    }
    return false;
  }

  function cancelBuildingDrag() {
    dragState.active = false;
    dragState.buildingId = null;
    dragState.isValid = false;
    window.removeEventListener("pointermove", handleBuildingDragMove);
    window.removeEventListener("pointerup", handleBuildingDragEnd);
  }

  function cancelEnemyBuildingDrag() {
    enemyDragState.active = false;
    enemyDragState.buildingId = null;
    enemyDragState.isValid = false;
    window.removeEventListener("pointermove", handleEnemyBuildingDragMove);
    window.removeEventListener("pointerup", handleEnemyBuildingDragEnd);
  }

  function cancelCreatureDrag() {
    creatureDragState.active = false;
    creatureDragState.creatureId = null;
    creatureDragState.isValid = false;
    creatureDragState.targetNestId = null;
    window.removeEventListener("pointermove", handleCreatureDragMove);
    window.removeEventListener("pointerup", handleCreatureDragEnd);
  }

  function cancelEnemyCreatureDrag() {
    enemyCreatureDragState.active = false;
    enemyCreatureDragState.creatureId = null;
    enemyCreatureDragState.isValid = false;
    enemyCreatureDragState.targetNestId = null;
    window.removeEventListener("pointermove", handleEnemyCreatureDragMove);
    window.removeEventListener("pointerup", handleEnemyCreatureDragEnd);
  }

  function startBuildingDrag(buildingId, event) {
    if (isGameOver.value) return;
    if (!field.width || !field.height) return;
    if (!canPlaceBuilding(buildingId)) return;
    event.preventDefault();
    dragState.active = true;
    dragState.buildingId = buildingId;
    updateDragPosition(event);
    window.addEventListener("pointermove", handleBuildingDragMove);
    window.addEventListener("pointerup", handleBuildingDragEnd);
  }

  function startEnemyBuildingDrag(buildingId, event) {
    if (!field.width || !field.height) return;
    event.preventDefault();
    enemyDragState.active = true;
    enemyDragState.buildingId = buildingId;
    updateEnemyDragPosition(event);
    window.addEventListener("pointermove", handleEnemyBuildingDragMove);
    window.addEventListener("pointerup", handleEnemyBuildingDragEnd);
  }

  function startCreatureDrag(creatureId, event) {
    if (isGameOver.value) return;
    if (!field.width || !field.height) return;
    event.preventDefault();
    creatureDragState.active = true;
    creatureDragState.creatureId = creatureId;
    updateCreatureDragPosition(event, "player");
    window.addEventListener("pointermove", handleCreatureDragMove);
    window.addEventListener("pointerup", handleCreatureDragEnd);
  }

  function startEnemyCreatureDrag(creatureId, event) {
    if (!field.width || !field.height) return;
    event.preventDefault();
    enemyCreatureDragState.active = true;
    enemyCreatureDragState.creatureId = creatureId;
    updateCreatureDragPosition(event, "enemy");
    window.addEventListener("pointermove", handleEnemyCreatureDragMove);
    window.addEventListener("pointerup", handleEnemyCreatureDragEnd);
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
    if (
      building &&
      point &&
      isPointInZone(point, buildingZoneTop.value, field.height)
    ) {
      const placement = findValidPlacement(
        point,
        building,
        buildingZoneTop.value,
        field.height
      );
      if (placement) {
        if (placeBuilding(dragState.buildingId, placement)) {
          resetBuildingPlacementTimer(dragState.buildingId);
        }
      }
    }
    cancelBuildingDrag();
  }

  function handleEnemyBuildingDragMove(event) {
    if (!enemyDragState.active) return;
    updateEnemyDragPosition(event);
  }

  function handleEnemyBuildingDragEnd(event) {
    if (!enemyDragState.active) return;
    if (!field.width || !field.height) {
      cancelEnemyBuildingDrag();
      return;
    }
    const building = getBuildingDefinition(enemyDragState.buildingId);
    const point = getBattlefieldCoords(event);
    if (building && point && isPointInZone(point, 0, enemyZoneBottom.value)) {
      const placement = findValidPlacement(
        point,
        building,
        0,
        enemyZoneBottom.value
      );
      if (placement) {
        addEnemyBuildingToStage(enemyDragState.buildingId, placement);
      }
    }
    cancelEnemyBuildingDrag();
  }

  function handleCreatureDragMove(event) {
    if (!creatureDragState.active) return;
    updateCreatureDragPosition(event, "player");
  }

  function assignCreatureToNest(nestId, creatureId) {
    const nest = playerNests.value.find((entry) => entry.id === nestId);
    if (!nest) return;
    nest.spawnCreatureId = creatureId;
    nest.spawnProgress = 0;
  }

  function assignEnemyCreatureToNest(nestId, creatureId) {
    ensureStageConfigs();
    const stage = stageConfigs.value[devStageIndex.value];
    if (!stage) return;
    const entry = stage.enemyBuildings.find(
      (building) => building.id === nestId && building.type === "nest"
    );
    if (!entry) return;
    entry.spawnCreatureId = creatureId;
    applyStageConfig(devStageIndex.value);
  }

  function addEnemyBuildingToStage(buildingId, point) {
    ensureStageConfigs();
    const stage = stageConfigs.value[devStageIndex.value];
    if (!stage || !point) return;
    stage.enemyBuildings.push({
      id: nextEnemyBuildingId++,
      type: buildingId,
      x: point.x,
      y: point.y,
      spawnCreatureId: null,
    });
    applyStageConfig(devStageIndex.value);
  }

  function applyStageConfig(stageIndex) {
    ensureStageConfigs();
    const stage = stageConfigs.value[stageIndex];
    if (!stage) return;
    const nests = [];
    const walls = [];
    const towers = [];

    for (const entry of stage.enemyBuildings) {
      if (entry.type === "nest") {
        const nest = createNestState({
          id: entry.id,
          team: "enemy",
          x: entry.x,
          y: entry.y,
        });
        nest.spawnCreatureId = entry.spawnCreatureId || null;
        nests.push(nest);
      } else if (entry.type === "wall") {
        walls.push(
          createWallState({
            id: entry.id,
            team: "enemy",
            x: entry.x,
            y: entry.y,
          })
        );
      } else if (entry.type === "tower") {
        towers.push(
          createTowerState({
            id: entry.id,
            team: "enemy",
            x: entry.x,
            y: entry.y,
          })
        );
      }
    }

    enemyNests.value = nests;
    enemyWalls.value = walls;
    enemyTowers.value = towers;
  }

  function clearDevStage() {
    ensureStageConfigs();
    const stage = stageConfigs.value[devStageIndex.value];
    if (!stage) return;
    stage.enemyBuildings = [];
    applyStageConfig(devStageIndex.value);
  }

  function setDevStage(index) {
    ensureStageConfigs();
    if (index < 0 || index >= stageConfigs.value.length) return;
    devStageIndex.value = index;
    if (isDevMode.value) {
      applyStageConfig(devStageIndex.value);
    }
  }

  function toggleBossBattle() {
    isBossBattle.value = !isBossBattle.value;
    ensureStageConfigs();
    if (isDevMode.value) {
      applyStageConfig(devStageIndex.value);
      return;
    }
    applyStageConfig(activeStageIndex.value);
  }

  function resetEnemyForStage() {
    resetEnemyForStageIndex(activeStageIndex.value, { keepEnemyHp: false });
  }

  function resetEnemyForStageIndex(stageIndex, options = {}) {
    const baseState = createBaseState();
    if (options.keepEnemyHp) {
      enemyBase.hp = clamp(enemyBase.hp, 0, baseState.hp);
    } else {
      enemyBase.hp = baseState.hp;
    }
    baseSpawnProgress.enemy = SPAWN_INTERVAL_MS;
    creatures.value = creatures.value.filter(
      (creature) => creature.team !== "enemy"
    );
    projectiles.value = projectiles.value.filter(
      (projectile) => projectile.team !== "enemy"
    );
    applyStageConfig(stageIndex);
  }

  function advanceStage() {
    ensureStageConfigs();
    const lastStage = stageConfigs.value.length - 1;
    if (activeStageIndex.value >= lastStage) {
      endGame("player");
      return;
    }
    activeStageIndex.value += 1;
    resetEnemyForStageIndex(activeStageIndex.value, { keepEnemyHp: true });
  }

  function advanceDevStage() {
    ensureStageConfigs();
    const lastStage = stageConfigs.value.length - 1;
    if (devStageIndex.value >= lastStage) return;
    devStageIndex.value += 1;
    resetEnemyForStageIndex(devStageIndex.value, { keepEnemyHp: true });
  }

  function exportStageConfigData() {
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      isBossBattle: isBossBattle.value,
      stages: stageConfigs.value.map((stage, index) => ({
        id: index + 1,
        advanceAtEnemyHpPercent:
          index === stageConfigs.value.length - 1
            ? 0
            : normalizeAdvancePercent(stage.advanceAtEnemyHpPercent),
        enemyBuildings: stage.enemyBuildings.map((building) => ({
          type: building.type,
          x: Math.round(building.x),
          y: Math.round(building.y),
          spawnCreatureId: building.spawnCreatureId || null,
        })),
      })),
    };
  }

  function exportStageConfigJson() {
    return JSON.stringify(exportStageConfigData(), null, 2);
  }

  function importStageConfigData(data) {
    if (!data || typeof data !== "object") {
      return { ok: false, error: "Invalid stage data." };
    }
    const rawStages = Array.isArray(data.stages)
      ? data.stages
      : Array.isArray(data.stageConfigs)
      ? data.stageConfigs
      : null;
    if (!rawStages) {
      return { ok: false, error: "Stage data is missing a stages array." };
    }

    const bossFlag =
      typeof data.isBossBattle === "boolean" ? data.isBossBattle : rawStages.length >= 5;
    isBossBattle.value = bossFlag;
    const desiredCount = bossFlag ? 5 : 3;
    const validTypes = new Set(buildingCatalog.map((building) => building.id));
    const normalizedStages = [];
    let nextId = 1;

      for (let i = 0; i < desiredCount; i += 1) {
        const stage = rawStages[i] || {};
        const rawBuildings = Array.isArray(stage.enemyBuildings)
          ? stage.enemyBuildings
          : Array.isArray(stage.buildings)
          ? stage.buildings
          : [];
        const advanceAtEnemyHpPercent =
          i === desiredCount - 1
            ? 0
            : normalizeAdvancePercent(stage.advanceAtEnemyHpPercent);
        const enemyBuildings = [];

      for (const entry of rawBuildings) {
        if (!entry || !validTypes.has(entry.type)) continue;
        const x = Number(entry.x);
        const y = Number(entry.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        enemyBuildings.push({
          id: nextId++,
          type: entry.type,
          x,
          y,
          spawnCreatureId: entry.spawnCreatureId || null,
        });
      }

        normalizedStages.push({
          id: i + 1,
          enemyBuildings,
          advanceAtEnemyHpPercent,
        });
      }

      stageConfigs.value = normalizedStages;
      enforceFinalStageAdvancePercent();
      nextEnemyBuildingId = nextId;
      seededStageDefaults = true;
    devStageIndex.value = 0;
    activeStageIndex.value = 0;
    if (isDevMode.value) {
      applyStageConfig(devStageIndex.value);
    } else {
      resetEnemyForStage();
    }
    return { ok: true };
  }

  function importStageConfigJson(json) {
    if (typeof json !== "string") {
      return { ok: false, error: "Stage import expects JSON text." };
    }
    let data;
    try {
      data = JSON.parse(json);
    } catch (error) {
      return { ok: false, error: "Invalid JSON file." };
    }
    return importStageConfigData(data);
  }

  async function loadStageConfigFromUrl(url) {
    if (!url) return { ok: false, error: "Missing stage config url." };
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        return { ok: false, error: "Stage config not found." };
      }
      const data = await response.json();
      return importStageConfigData(data);
    } catch (error) {
      return { ok: false, error: "Failed to load stage config." };
    }
  }

  function handleCreatureDragEnd() {
    if (!creatureDragState.active) return;
    if (creatureDragState.isValid && creatureDragState.targetNestId) {
      assignCreatureToNest(
        creatureDragState.targetNestId,
        creatureDragState.creatureId
      );
    }
    cancelCreatureDrag();
  }

  function handleEnemyCreatureDragMove(event) {
    if (!enemyCreatureDragState.active) return;
    updateCreatureDragPosition(event, "enemy");
  }

  function handleEnemyCreatureDragEnd() {
    if (!enemyCreatureDragState.active) return;
    if (enemyCreatureDragState.isValid && enemyCreatureDragState.targetNestId) {
      assignEnemyCreatureToNest(
        enemyCreatureDragState.targetNestId,
        enemyCreatureDragState.creatureId
      );
    }
    cancelEnemyCreatureDrag();
  }

  function applyBaseDamage(targetTeam, damage) {
    const base = targetTeam === "enemy" ? enemyBase : playerBase;
    applyBaseDamageToState(base, damage);

    if (playerBase.hp <= 0) {
      endGame("enemy");
      return;
    }

    if (targetTeam !== "enemy") return;

    const stageIndex = isDevMode.value ? devStageIndex.value : activeStageIndex.value;
    const stage = stageConfigs.value[stageIndex];
    const threshold = normalizeAdvancePercent(
      stage?.advanceAtEnemyHpPercent ?? 0
    );

    if (threshold > 0) {
      if (enemyHpPercent.value <= threshold) {
        if (isDevMode.value) {
          advanceDevStage();
        } else {
          advanceStage();
        }
      }
      return;
    }

    if (!isDevMode.value && enemyBase.hp <= 0) {
      advanceStage();
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

  function getCreatureDamage(attacker, target) {
    const baseDamage = attacker?.damage ?? 0;
    if (!attacker || !target) return baseDamage;
    const typeMod = getEffectiveness(
      TYPE_EFFECTIVENESS,
      attacker.attackType,
      target.attackType
    );
    const elementMod = getEffectiveness(
      ELEMENT_EFFECTIVENESS,
      attacker.element,
      target.element
    );
    return baseDamage * (1 + typeMod + elementMod);
  }

  function updateSpawns(dt) {
    if (isGameOver.value) return;
    if (enemyBase.hp > 0) {
      baseSpawnProgress.enemy += dt * 1000;
      while (baseSpawnProgress.enemy >= SPAWN_INTERVAL_MS) {
        baseSpawnProgress.enemy -= SPAWN_INTERVAL_MS;
        spawnCreature("enemy", basePositions.value.enemy);
      }
    }

      for (const nest of enemyNests.value) {
        if (nest.hp <= 0) continue;
        const spawnId = nest.spawnCreatureId;
        if (!spawnId) continue;
        if (hasPopSpace("enemy", spawnId)) {
          nest.spawnProgress += dt * 1000;
        }
        while (nest.spawnProgress >= SPAWN_INTERVAL_MS) {
          if (!hasPopSpace("enemy", spawnId)) {
            nest.spawnProgress = SPAWN_INTERVAL_MS;
            break;
          }
          nest.spawnProgress -= SPAWN_INTERVAL_MS;
          spawnCreature("enemy", nest, spawnId);
        }
      }

    if (playerBase.hp > 0) {
      baseSpawnProgress.player += dt * 1000;
      while (baseSpawnProgress.player >= SPAWN_INTERVAL_MS) {
        baseSpawnProgress.player -= SPAWN_INTERVAL_MS;
        spawnCreature("player", basePositions.value.player);
      }
    }

      for (const nest of playerNests.value) {
        if (nest.hp <= 0) continue;
        const spawnId = nest.spawnCreatureId;
        if (!spawnId) continue;
        if (hasPopSpace("player", spawnId)) {
          nest.spawnProgress += dt * 1000;
        }
        while (nest.spawnProgress >= SPAWN_INTERVAL_MS) {
          if (!hasPopSpace("player", spawnId)) {
            nest.spawnProgress = SPAWN_INTERVAL_MS;
            break;
          }
          nest.spawnProgress -= SPAWN_INTERVAL_MS;
          spawnCreature("player", nest, spawnId);
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
      kind: "tower",
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

  function spawnCreatureProjectile(attacker, target, targetType, targetTeam) {
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const angle = Math.atan2(dy, dx);
    const radius = attacker.projectileRadius ?? 4;
    const renderSize =
      attacker.projectileRenderSize ?? Math.max(radius * 6, 18);
    projectiles.value.push({
      id: nextProjectileId++,
      kind: attacker.type,
      team: attacker.team,
      targetId: targetType === "creature" ? target.id : null,
      targetType,
      targetTeam,
      targetRef: targetType === "creature" ? null : target,
      x: attacker.x,
      y: attacker.y,
      speed: attacker.projectileSpeed ?? 200,
      damage: attacker.damage,
      attackType: attacker.attackType,
      element: attacker.element,
      radius,
      renderSize,
      angle,
    });
  }

  function updateTowers(dt) {
    if (isGameOver.value) return;
    const towers = [...playerTowers.value, ...enemyTowers.value];
    for (const tower of towers) {
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
      const step = projectile.speed * dt;
      const targetType = projectile.targetType || "creature";

      if (targetType === "creature") {
        const target = creatures.value.find(
          (creature) => creature.id === projectile.targetId
        );
        if (!target || target.isDead) continue;
        const dx = target.x - projectile.x;
        const dy = target.y - projectile.y;
        const dist = Math.hypot(dx, dy);
        const hitDist = projectile.radius + target.radius;
        projectile.angle = Math.atan2(dy, dx);

        if (dist <= hitDist + step) {
          const damage =
            projectile.attackType || projectile.element
              ? getCreatureDamage(
                  {
                    damage: projectile.damage,
                    attackType: projectile.attackType,
                    element: projectile.element,
                  },
                  target
                )
              : projectile.damage;
          applyCreatureDamage(target, damage);
          continue;
        }

        if (dist > 0.001) {
          projectile.x += (dx / dist) * step;
          projectile.y += (dy / dist) * step;
        }

        nextProjectiles.push(projectile);
        continue;
      }

      let targetX;
      let targetY;
      let targetW;
      let targetH;
      let targetRef = projectile.targetRef;

      if (targetType === "base") {
        const basePos = basePositions.value[projectile.targetTeam];
        if (!basePos) continue;
        targetX = basePos.x;
        targetY = basePos.y;
        if (projectile.targetTeam === "enemy") {
          targetW = ENEMY_BASE_WIDTH;
          targetH = ENEMY_BASE_HEIGHT;
        } else {
          targetW = PLAYER_BASE_WIDTH;
          targetH = PLAYER_BASE_HEIGHT;
        }
      } else {
        if (!targetRef || targetRef.hp <= 0) continue;
        targetX = targetRef.x;
        targetY = targetRef.y;
        if (targetType === "wall") {
          targetW = WALL_WIDTH;
          targetH = WALL_HEIGHT;
        } else if (targetType === "tower") {
          targetW = TOWER_WIDTH;
          targetH = TOWER_HEIGHT;
        } else if (targetType === "nest") {
          targetW = NEST_WIDTH;
          targetH = NEST_HEIGHT;
        } else {
          continue;
        }
      }

      const dx = targetX - projectile.x;
      const dy = targetY - projectile.y;
      const dist = Math.hypot(dx, dy);
      projectile.angle = Math.atan2(dy, dx);

      const contactPoint = closestPointOnRect(
        projectile.x,
        projectile.y,
        targetX,
        targetY,
        targetW,
        targetH
      );
      const hitDist = projectile.radius;
      const distToRect = Math.hypot(
        contactPoint.x - projectile.x,
        contactPoint.y - projectile.y
      );

      if (distToRect <= hitDist + step) {
        if (targetType === "wall") {
          applyWallDamage(targetRef, projectile.damage);
        } else if (targetType === "tower") {
          applyTowerDamage(targetRef, projectile.damage);
        } else if (targetType === "nest") {
          applyNestDamage(targetRef, projectile.damage);
        } else if (targetType === "base") {
          applyBaseDamage(projectile.targetTeam, projectile.damage);
        }
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
    ];

    for (const nest of enemyNests.value) {
      buildings.push({
        x: nest.x,
        y: nest.y,
        width: NEST_WIDTH,
        height: NEST_HEIGHT,
        isActive: nest.hp > 0,
        team: "enemy",
        kind: "nest",
      });
    }

    for (const wall of enemyWalls.value) {
      buildings.push({
        x: wall.x,
        y: wall.y,
        width: WALL_WIDTH,
        height: WALL_HEIGHT,
        isActive: wall.hp > 0,
        team: "enemy",
        kind: "wall",
      });
    }

    for (const tower of enemyTowers.value) {
      buildings.push({
        x: tower.x,
        y: tower.y,
        width: TOWER_WIDTH,
        height: TOWER_HEIGHT,
        isActive: tower.hp > 0,
        team: "enemy",
        kind: "tower",
      });
    }

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
    const gangUpTarget = getGangUpTarget();
    const pupdragonPackTargets = {
      player: getPupdragonPackTarget("player"),
      enemy: getPupdragonPackTarget("enemy"),
    };
    const pupdragonPackCenters = {
      player: getPupdragonPackCenter("player"),
      enemy: getPupdragonPackCenter("enemy"),
    };

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

      const gangUpForced =
        gangUpTarget &&
        creature.team === "player" &&
        creature.type === "goblin" &&
        !gangUpTarget.isDead
          ? { type: "enemy", ref: gangUpTarget, x: gangUpTarget.x, y: gangUpTarget.y }
          : null;
      const packTarget = pupdragonPackTargets[creature.team];
      const packForced =
        creature.type === "pupdragon" && packTarget && packTarget.ref
          ? packTarget
          : null;
      const nearbyTarget = gangUpForced || packForced || getTargetInRadius(creature, targetTeam);

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
          getCreatureAttackRange(creature) +
          targetRadius +
          CREATURE_ATTACK_RANGE_PADDING;
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
        isInRange =
          dist <= getCreatureAttackRange(creature) + BUILDING_ATTACK_RANGE_PADDING;
      }

      if (isInRange) {
        const isRanged = creature.attackType === "ranged";
        if (
          windupWasActive &&
          creature.attackWindup === 0 &&
          creature.attackCooldown <= 0
        ) {
          if (targetType === "enemy") {
            if (isRanged) {
              spawnCreatureProjectile(
                creature,
                targetEnemyRef,
                "creature",
                targetTeam
              );
            } else {
              applyCreatureDamage(
                targetEnemyRef,
                getCreatureDamage(creature, targetEnemyRef)
              );
            }
          } else if (targetType === "wall") {
            if (isRanged) {
              spawnCreatureProjectile(creature, targetWallRef, "wall", targetTeam);
            } else {
              applyWallDamage(targetWallRef, creature.damage);
            }
          } else if (targetType === "tower") {
            if (isRanged) {
              spawnCreatureProjectile(
                creature,
                targetTowerRef,
                "tower",
                targetTeam
              );
            } else {
              applyTowerDamage(targetTowerRef, creature.damage);
            }
          } else if (targetType === "nest") {
            if (isRanged) {
              spawnCreatureProjectile(creature, targetNestRef, "nest", targetTeam);
            } else {
              applyNestDamage(targetNestRef, creature.damage);
            }
          } else if (targetType === "base") {
            if (isRanged) {
              spawnCreatureProjectile(
                creature,
                { x: targetX, y: targetY },
                "base",
                targetTeam
              );
            } else {
              applyBaseDamage(targetTeam, creature.damage);
            }
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

      if (creature.type === "pupdragon" && !isInRange) {
        const packCenter = pupdragonPackCenters[creature.team];
        if (packCenter) {
          const cohesion = 0.25;
          dx = dx * (1 - cohesion) + (packCenter.x - creature.x) * cohesion;
          dy = dy * (1 - cohesion) + (packCenter.y - creature.y) * cohesion;
          dist = Math.hypot(dx, dy);
        }
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
    if (!isGameOver.value) {
      updateBuildingPlacementTimers(dt);
    }
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

  function restartBattle() {
    resetBattle();
    startBattle();
  }

  function enterDevMode() {
    isDevMode.value = true;
    isBattleActive.value = false;
    ensureStageConfigs();
    applyStageConfig(devStageIndex.value);
  }

  function stopBattle() {
    isBattleActive.value = false;
  }

  function resetBattle() {
    const baseState = createBaseState();
    enemyBase.hp = baseState.hp;
    playerBase.hp = baseState.hp;
    baseSpawnProgress.enemy = SPAWN_INTERVAL_MS;
    baseSpawnProgress.player = SPAWN_INTERVAL_MS;
    playerNests.value = [];
    playerWalls.value = [];
    playerTowers.value = [];
    enemyNests.value = [];
    enemyWalls.value = [];
    enemyTowers.value = [];
    creatures.value = [];
    projectiles.value = [];
    isGameOver.value = false;
    resultMessage.value = "";
    isBattleActive.value = false;
    isDevMode.value = false;
    nextId = 1;
    nextBuildingId = 1;
    nextProjectileId = 1;
    initBuildingPlacementTimers();
    activeStageIndex.value = 0;
    ensureStageConfigs();
    applyStageConfig(activeStageIndex.value);
    cancelBuildingDrag();
    cancelCreatureDrag();
    cancelEnemyBuildingDrag();
    cancelEnemyCreatureDrag();
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
    if (!nest?.spawnCreatureId) return 0;
    const progress = nest?.spawnProgress || 0;
    return Math.min(100, Math.round((progress / SPAWN_INTERVAL_MS) * 100));
  }

  const buildingZoneStyle = computed(() => ({
    top: `${buildingZoneTop.value}px`,
  }));
  const enemyBuildingZoneStyle = computed(() => ({
    top: `${enemyZoneBottom.value}px`,
  }));

  const dragBuilding = computed(() =>
    buildingCatalog.find((building) => building.id === dragState.buildingId) ||
    null
  );
  const enemyDragBuilding = computed(() =>
    buildingCatalog.find(
      (building) => building.id === enemyDragState.buildingId
    ) || null
  );

  const dragCreature = computed(
    () =>
      creatureCatalog.find(
        (creature) => creature.id === creatureDragState.creatureId
      ) || null
  );
  const enemyDragCreature = computed(
    () =>
      creatureCatalog.find(
        (creature) => creature.id === enemyCreatureDragState.creatureId
      ) || null
  );

  const creaturePopStats = computed(() =>
    creatureCatalog.map((creature) => {
      const config = getCreatureConfig(creature.id);
      const popMax =
        config && typeof config.pop === "number" ? config.pop : 0;
      const popUsed = creatures.value.filter(
        (unit) =>
          !unit.isDead && unit.team === "player" && unit.type === creature.id
      ).length;
      return {
        ...creature,
        icon: config?.icon || creature.icon || "",
        popUsed,
        popMax,
      };
    })
  );
  const devCreatureOptions = computed(() =>
    creatureCatalog.map((creature) => {
      const config = getCreatureConfig(creature.id);
      return {
        ...creature,
        icon: config?.icon || creature.icon || "",
        popUsed: 0,
        popMax: config && typeof config.pop === "number" ? config.pop : 0,
      };
    })
  );

  const stageLabel = computed(
    () => `Stage ${activeStageIndex.value + 1} / ${stageCount.value}`
  );
  const devStageLabel = computed(
    () => `Stage ${devStageIndex.value + 1} / ${stageCount.value}`
  );
  const devStageAdvancePercent = computed(() => {
    const stage = stageConfigs.value[devStageIndex.value];
    return normalizeAdvancePercent(stage?.advanceAtEnemyHpPercent ?? 0);
  });

  function setDevStageAdvancePercent(value) {
    ensureStageConfigs();
    const stage = stageConfigs.value[devStageIndex.value];
    if (!stage) return;
    if (devStageIndex.value >= stageConfigs.value.length - 1) {
      stage.advanceAtEnemyHpPercent = 0;
      return;
    }
    stage.advanceAtEnemyHpPercent = normalizeAdvancePercent(value);
  }

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
  const enemyDragGhostStyle = computed(() => {
    const style = {
      left: `${enemyDragState.x}px`,
      top: `${enemyDragState.y}px`,
    };
    if (enemyDragBuilding.value) {
      style.width = `${enemyDragBuilding.value.width}px`;
      style.height = `${enemyDragBuilding.value.height}px`;
    }
    return style;
  });

  const creatureDragGhostStyle = computed(() => ({
    left: `${creatureDragState.x}px`,
    top: `${creatureDragState.y}px`,
    width: "52px",
    height: "52px",
  }));
  const enemyCreatureDragGhostStyle = computed(() => ({
    left: `${enemyCreatureDragState.x}px`,
    top: `${enemyCreatureDragState.y}px`,
    width: "52px",
    height: "52px",
  }));

  function creatureLabel(creatureId) {
    const creature = creatureCatalog.find((entry) => entry.id === creatureId);
    return creature?.name || "Assigned";
  }

  function creatureIcon(creatureId) {
    if (!creatureId) return "";
    const config = getCreatureConfig(creatureId);
    if (config?.icon) return config.icon;
    const creature = creatureCatalog.find((entry) => entry.id === creatureId);
    return creature?.icon || "";
  }

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
    loadStageConfigFromUrl("/stages/stage-config.json");
    resetBattle();
    scheduleFocusOnPlayerBase();
    animationId = requestAnimationFrame(animationLoop);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    window.removeEventListener("resize", measureField);
    window.removeEventListener("keydown", handleKeyScroll);
    cancelBuildingDrag();
    cancelCreatureDrag();
    cancelEnemyBuildingDrag();
    cancelEnemyCreatureDrag();
  });

  return {
    battlefieldShellRef,
    battlefieldRef,
    baseMaxHp: BASE_MAX_HP,
    enemyBase,
    playerBase,
    enemyNests,
    enemyWalls,
    enemyTowers,
    playerNests,
    playerWalls,
    playerTowers,
    buildingCatalog,
    getBuildingPlacement,
    canPlaceBuilding,
    dragState,
    dragBuilding,
    creatureDragState,
    dragCreature,
    enemyDragState,
    enemyDragBuilding,
    enemyCreatureDragState,
    enemyDragCreature,
    creatures,
    projectiles,
    creaturePopStats,
    devCreatureOptions,
    isBattleActive,
    isDevMode,
    isBossBattle,
    stageCount,
    stageLabel,
    devStageLabel,
    devStageIndex,
    devStageAdvancePercent,
    enemyHpPercent,
    playerHpPercent,
    isGameOver,
    resultMessage,
    baseStyle,
    playerNestStyle,
    wallStyle,
    towerStyle,
    projectileStyle,
    creatureStyle,
    creatureHpPercent,
    nestHpPercent,
    spawnPercent,
    creatureLabel,
    creatureIcon,
    baseSpawnCreatureId: BASE_SPAWN_CREATURE_ID,
    buildingZoneStyle,
    enemyBuildingZoneStyle,
    dragGhostStyle,
    creatureDragGhostStyle,
    enemyDragGhostStyle,
    enemyCreatureDragGhostStyle,
    startBuildingDrag,
    startCreatureDrag,
    startEnemyBuildingDrag,
    startEnemyCreatureDrag,
    startBattle,
    restartBattle,
    stopBattle,
    enterDevMode,
    resetBattle,
    setDevStage,
    clearDevStage,
    toggleBossBattle,
    setDevStageAdvancePercent,
    exportStageConfigJson,
    importStageConfigJson,
    loadStageConfigFromUrl,
  };
}
