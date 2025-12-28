import {
  ref,
  reactive,
  computed,
  onMounted,
  onBeforeUnmount,
} from "../lib/vue.js";
import {
  BASE_MAX_HP,
  NEST_MAX_HP,
  CREATURE_DAMAGE,
  PLAYER_CREATURE_MAX_HP,
  ENEMY_CREATURE_MAX_HP,
  CREATURE_SPEED,
  CREATURE_RADIUS,
  PLAYER_BASE_WIDTH,
  PLAYER_BASE_HEIGHT,
  ENEMY_BASE_WIDTH,
  ENEMY_BASE_HEIGHT,
  NEST_WIDTH,
  NEST_HEIGHT,
  CREATURE_ATTACK_RANGE_PADDING,
  BUILDING_ATTACK_RANGE_PADDING,
  BUILDING_COLLISION_PADDING,
  BUILDING_PLACEMENT_PADDING,
  DEATH_DELAY_SECONDS,
  ATTACK_WINDUP,
  ATTACK_COOLDOWN,
  CREATURE_SPACING,
  OPPONENT_SPACING,
  SEPARATION_STRENGTH,
  CREATURES_CAN_FIGHT,
  SPAWN_INTERVAL_MS,
  BUILDING_ZONE_START_RATIO,
} from "./constants.js";

export function useBattleState() {
  const battlefieldShellRef = ref(null);
  const battlefieldRef = ref(null);
  const field = reactive({ width: 0, height: 0 });
  const viewport = reactive({ width: 0, height: 0 });

  const enemyBase = reactive({ hp: BASE_MAX_HP });
  const playerBase = reactive({ hp: BASE_MAX_HP });
  const enemyNest = reactive({
    hp: NEST_MAX_HP,
    maxHp: NEST_MAX_HP,
    spawnProgress: 0,
  });
  const playerNests = ref([]);
  const creatures = ref([]);
  const buildingCatalog = [
    {
      id: "nest",
      name: "Nest",
      description: "Spawns allied creatures.",
      width: NEST_WIDTH,
      height: NEST_HEIGHT,
    },
  ];
  const dragState = reactive({
    active: false,
    buildingId: null,
    x: 0,
    y: 0,
    isValid: false,
  });

  const isGameOver = ref(false);
  const resultMessage = ref("");

  let nextId = 1;
  let nextBuildingId = 1;
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
    const maxHp =
      team === "player" ? PLAYER_CREATURE_MAX_HP : ENEMY_CREATURE_MAX_HP;
    const jitter = (Math.random() - 0.5) * 24;
    creatures.value.push({
      id: nextId++,
      team,
      x: source.x + jitter,
      y: source.y,
      speed: CREATURE_SPEED + (Math.random() * 10 - 5),
      radius: CREATURE_RADIUS,
      damage: CREATURE_DAMAGE,
      hp: maxHp,
      maxHp,
      attackCooldown: 0,
      attackWindup: 0,
      isDead: false,
      deathTimer: 0,
    });
  }

  function getNearestEnemy(creature, removed) {
    let nearest = null;
    let shortest = Infinity;
    for (const other of creatures.value) {
      if (other.isDead) continue;
      if (other.team === creature.team) continue;
      if (removed && removed.has(other.id)) continue;
      const dist = Math.hypot(other.x - creature.x, other.y - creature.y);
      if (dist < shortest) {
        shortest = dist;
        nearest = other;
      }
    }
    return nearest;
  }

  function getNearestNest(creature, team) {
    if (team === "enemy") {
      if (enemyNest.hp <= 0) return null;
      const pos = nestPositions.value.enemy;
      return { nest: enemyNest, x: pos.x, y: pos.y };
    }

    let nearest = null;
    let shortest = Infinity;
    for (const nest of playerNests.value) {
      if (nest.hp <= 0) continue;
      const dist = Math.hypot(nest.x - creature.x, nest.y - creature.y);
      if (dist < shortest) {
        shortest = dist;
        nearest = { nest, x: nest.x, y: nest.y };
      }
    }
    return nearest;
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
      return;
    }

    const distLeft = creature.x - left;
    const distRight = right - creature.x;
    const distTop = creature.y - top;
    const distBottom = bottom - creature.y;
    const minDist = Math.min(distLeft, distRight, distTop, distBottom);
    const padding = creature.radius + BUILDING_COLLISION_PADDING;

    if (minDist === distLeft) {
      creature.x = left - padding;
    } else if (minDist === distRight) {
      creature.x = right + padding;
    } else if (minDist === distTop) {
      creature.y = top - padding;
    } else {
      creature.y = bottom + padding;
    }
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
      obstacles.push({
        x: nest.x,
        y: nest.y,
        width: NEST_WIDTH,
        height: NEST_HEIGHT,
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

  function getBuildingDefinition(buildingId) {
    return buildingCatalog.find((building) => building.id === buildingId);
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
    playerNests.value.push({
      id: nextBuildingId++,
      type: buildingId,
      team: "player",
      x: point.x,
      y: point.y,
      hp: NEST_MAX_HP,
      maxHp: NEST_MAX_HP,
      spawnProgress: 0,
    });
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
    if (targetTeam === "enemy") {
      enemyBase.hp = Math.max(0, enemyBase.hp - damage);
    } else {
      playerBase.hp = Math.max(0, playerBase.hp - damage);
    }

    if (playerBase.hp <= 0) {
      endGame("enemy");
      return;
    }

    if (enemyBase.hp <= 0 && playerBase.hp > 0) {
      endGame("player");
    }
  }

  function applyNestDamage(nest, damage) {
    if (!nest) return;
    nest.hp = Math.max(0, nest.hp - damage);
    if (nest.hp <= 0) {
      nest.spawnProgress = 0;
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

  function separateCreatures() {
    for (let i = 0; i < creatures.value.length; i += 1) {
      const a = creatures.value[i];
      if (a.isDead) continue;
      for (let j = i + 1; j < creatures.value.length; j += 1) {
        const b = creatures.value[j];
        if (b.isDead) continue;
        const spacing = a.team === b.team ? CREATURE_SPACING : OPPONENT_SPACING;
        const minDist = CREATURE_RADIUS * 2 + spacing;
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
      },
      {
        x: basePlayer.x,
        y: basePlayer.y,
        width: PLAYER_BASE_WIDTH,
        height: PLAYER_BASE_HEIGHT,
        isActive: playerBase.hp > 0,
      },
      {
        x: nestEnemy.x,
        y: nestEnemy.y,
        width: NEST_WIDTH,
        height: NEST_HEIGHT,
        isActive: enemyNest.hp > 0,
      },
    ];

    for (const nest of playerNests.value) {
      buildings.push({
        x: nest.x,
        y: nest.y,
        width: NEST_WIDTH,
        height: NEST_HEIGHT,
        isActive: nest.hp > 0,
      });
    }

    for (const creature of creatures.value) {
      if (creature.isDead) continue;
      for (const building of buildings) {
        if (!building.isActive) continue;
        pushCircleOutsideRect(
          creature,
          building.x,
          building.y,
          building.width,
          building.height
        );
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

      const enemy = CREATURES_CAN_FIGHT
        ? getNearestEnemy(creature, removed)
        : null;
      let targetX;
      let targetY;
      let targetRadius = 0;
      let targetWidth = 0;
      let targetHeight = 0;
      let targetType = "enemy";
      let targetTeam = creature.team === "player" ? "enemy" : "player";
      let targetNestRef = null;

      const targetNest = enemy ? null : getNearestNest(creature, targetTeam);

      if (enemy) {
        targetX = enemy.x;
        targetY = enemy.y;
        targetRadius = enemy.radius;
        targetType = "enemy";
      } else if (targetNest) {
        targetX = targetNest.x;
        targetY = targetNest.y;
        targetWidth = NEST_WIDTH;
        targetHeight = NEST_HEIGHT;
        targetType = "nest";
        targetNestRef = targetNest.nest;
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
          if (targetType === "enemy" && enemy && !removed.has(enemy.id)) {
            enemy.hp = Math.max(0, enemy.hp - creature.damage);
            if (enemy.hp <= 0) {
              enemy.isDead = true;
              enemy.deathTimer = DEATH_DELAY_SECONDS;
            }
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
    updateSpawns(dt);
    updateCreatures(dt);
    animationId = requestAnimationFrame(animationLoop);
  }

  function resetBattle() {
    enemyBase.hp = BASE_MAX_HP;
    playerBase.hp = BASE_MAX_HP;
    enemyNest.hp = NEST_MAX_HP;
    enemyNest.spawnProgress = 0;
    playerNests.value = [];
    creatures.value = [];
    isGameOver.value = false;
    resultMessage.value = "";
    nextId = 1;
    nextBuildingId = 1;
    cancelBuildingDrag();
    scheduleFocusOnPlayerBase();
  }

  function baseStyle(team) {
    const pos = basePositions.value[team];
    return { left: `${pos.x}px`, top: `${pos.y}px` };
  }

  function enemyNestStyle() {
    const pos = nestPositions.value.enemy;
    return { left: `${pos.x}px`, top: `${pos.y}px` };
  }

  function playerNestStyle(nest) {
    return { left: `${nest.x}px`, top: `${nest.y}px` };
  }

  function creatureStyle(creature) {
    return { left: `${creature.x}px`, top: `${creature.y}px` };
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

  const dragGhostStyle = computed(() => ({
    left: `${dragState.x}px`,
    top: `${dragState.y}px`,
  }));

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
    buildingCatalog,
    dragState,
    creatures,
    enemyHpPercent,
    playerHpPercent,
    isGameOver,
    resultMessage,
    baseStyle,
    enemyNestStyle,
    playerNestStyle,
    creatureStyle,
    creatureHpPercent,
    nestHpPercent,
    spawnPercent,
    buildingZoneStyle,
    dragGhostStyle,
    startBuildingDrag,
    resetBattle,
  };
}
