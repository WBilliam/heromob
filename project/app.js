const CONFIG = window.GAME_CONFIG || {};
const BASE_MAX_HP = CONFIG.baseMaxHp ?? 200;
const NEST_MAX_HP = CONFIG.nestMaxHp ?? 50;
const CREATURE_DAMAGE = CONFIG.creatureDamage ?? 1;
const PLAYER_CREATURE_MAX_HP = CONFIG.playerCreatureMaxHp ?? 3;
const ENEMY_CREATURE_MAX_HP = CONFIG.enemyCreatureMaxHp ?? 1;
const CREATURE_SPEED = CONFIG.creatureSpeed ?? 80;
const CREATURE_RADIUS = CONFIG.creatureRadius ?? 9;
const PLAYER_BASE_WIDTH = CONFIG.playerBaseWidth ?? 92;
const PLAYER_BASE_HEIGHT = CONFIG.playerBaseHeight ?? 92;
const ENEMY_BASE_WIDTH = CONFIG.enemyBaseWidth ?? 170;
const ENEMY_BASE_HEIGHT = CONFIG.enemyBaseHeight ?? 90;
const NEST_WIDTH = CONFIG.nestWidth ?? 96;
const NEST_HEIGHT = CONFIG.nestHeight ?? 64;
const CREATURE_ATTACK_RANGE_PADDING = CONFIG.creatureAttackRangePadding ?? 4;
const BUILDING_ATTACK_RANGE_PADDING = CONFIG.buildingAttackRangePadding ?? 0;
const BUILDING_COLLISION_PADDING = CONFIG.buildingCollisionPadding ?? 0;
const DEATH_DELAY_MS = CONFIG.deathDelayMs ?? 200;
const DEATH_DELAY_SECONDS = DEATH_DELAY_MS / 1000;
const ATTACK_WINDUP = CONFIG.attackWindup ?? 0.1;
const ATTACK_COOLDOWN = CONFIG.attackCooldown ?? 0.8;
const CREATURE_SPACING = CONFIG.creatureSpacing ?? 6;
const OPPONENT_SPACING = CONFIG.opponentSpacing ?? 0;
const SEPARATION_STRENGTH = CONFIG.separationStrength ?? 0.5;
const CREATURES_CAN_FIGHT = CONFIG.creaturesCanFight ?? true;
const SPAWN_INTERVAL_MS = CONFIG.spawnIntervalMs ?? 3000;

const { createApp, ref, reactive, computed, onMounted, onBeforeUnmount } = Vue;

createApp({
  setup() {
    const battlefieldShellRef = ref(null);
    const battlefieldRef = ref(null);
    const field = reactive({ width: 0, height: 0 });
    const viewport = reactive({ width: 0, height: 0 });

    const enemyBase = reactive({ hp: BASE_MAX_HP });
    const playerBase = reactive({ hp: BASE_MAX_HP });
    const nests = reactive({
      enemy: { hp: NEST_MAX_HP, maxHp: NEST_MAX_HP },
      player: { hp: NEST_MAX_HP, maxHp: NEST_MAX_HP },
    });
    const spawnProgress = reactive({ enemy: 0, player: 0 });
    const creatures = ref([]);

    const isGameOver = ref(false);
    const resultMessage = ref("");

    let nextId = 1;
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

    function spawnCreature(team) {
      if (isGameOver.value || !field.width || !field.height) return;
      if (nests[team].hp <= 0) return;
      const nest = nestPositions.value[team];
      const maxHp =
        team === "player" ? PLAYER_CREATURE_MAX_HP : ENEMY_CREATURE_MAX_HP;
      const jitter = (Math.random() - 0.5) * 24;
      creatures.value.push({
        id: nextId++,
        team,
        x: nest.x + jitter,
        y: nest.y,
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

    function applyNestDamage(targetTeam, damage) {
      const nest = nests[targetTeam];
      nest.hp = Math.max(0, nest.hp - damage);
      if (nest.hp <= 0) {
        spawnProgress[targetTeam] = 0;
      }
    }

    function endGame(winner) {
      isGameOver.value = true;
      resultMessage.value = winner === "player" ? "Victory" : "Defeat";
    }

    function updateSpawns(dt) {
      if (isGameOver.value) return;
      ["player", "enemy"].forEach((team) => {
        if (nests[team].hp <= 0) return;
        spawnProgress[team] += dt * 1000;
        while (spawnProgress[team] >= SPAWN_INTERVAL_MS) {
          spawnProgress[team] -= SPAWN_INTERVAL_MS;
          spawnCreature(team);
        }
      });
    }

    function separateCreatures() {
      for (let i = 0; i < creatures.value.length; i += 1) {
        const a = creatures.value[i];
        if (a.isDead) continue;
        for (let j = i + 1; j < creatures.value.length; j += 1) {
          const b = creatures.value[j];
          if (b.isDead) continue;
          const spacing =
            a.team === b.team ? CREATURE_SPACING : OPPONENT_SPACING;
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
      const nestPlayer = nestPositions.value.player;
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
          isActive: nests.enemy.hp > 0,
        },
        {
          x: nestPlayer.x,
          y: nestPlayer.y,
          width: NEST_WIDTH,
          height: NEST_HEIGHT,
          isActive: nests.player.hp > 0,
        },
      ];

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

        if (enemy) {
          targetX = enemy.x;
          targetY = enemy.y;
          targetRadius = enemy.radius;
          targetType = "enemy";
        } else if (nests[targetTeam].hp > 0) {
          const nestPos = nestPositions.value[targetTeam];
          targetX = nestPos.x;
          targetY = nestPos.y;
          targetWidth = NEST_WIDTH;
          targetHeight = NEST_HEIGHT;
          targetType = "nest";
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
              applyNestDamage(targetTeam, creature.damage);
            } else if (targetType === "base") {
              applyBaseDamage(targetTeam, creature.damage);
              if (isGameOver.value) break;
            }
            creature.attackCooldown = ATTACK_COOLDOWN;
          } else if (creature.attackCooldown <= 0 && creature.attackWindup <= 0) {
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
      nests.enemy.hp = NEST_MAX_HP;
      nests.player.hp = NEST_MAX_HP;
      spawnProgress.enemy = 0;
      spawnProgress.player = 0;
      creatures.value = [];
      isGameOver.value = false;
      resultMessage.value = "";
      nextId = 1;
      focusOnPlayerBase();
    }

    function baseStyle(team) {
      const pos = basePositions.value[team];
      return { left: `${pos.x}px`, top: `${pos.y}px` };
    }

    function nestStyle(team) {
      const pos = nestPositions.value[team];
      return { left: `${pos.x}px`, top: `${pos.y}px` };
    }

    function creatureStyle(creature) {
      return { left: `${creature.x}px`, top: `${creature.y}px` };
    }

    function creatureHpPercent(creature) {
      if (!creature.maxHp) return 0;
      return Math.max(0, Math.round((creature.hp / creature.maxHp) * 100));
    }

    function nestHpPercent(team) {
      const nest = nests[team];
      if (!nest.maxHp) return 0;
      return Math.max(0, Math.round((nest.hp / nest.maxHp) * 100));
    }

    function spawnPercent(team) {
      const progress = spawnProgress[team] || 0;
      return Math.min(100, Math.round((progress / SPAWN_INTERVAL_MS) * 100));
    }

    function focusOnPlayerBase() {
      if (!battlefieldShellRef.value || !viewport.height) return;
      const maxScroll = field.height - viewport.height;
      battlefieldShellRef.value.scrollTop = Math.max(0, maxScroll);
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
      animationId = requestAnimationFrame(animationLoop);
    });

    onBeforeUnmount(() => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", measureField);
      window.removeEventListener("keydown", handleKeyScroll);
    });

    return {
      battlefieldShellRef,
      battlefieldRef,
      baseMaxHp: BASE_MAX_HP,
      enemyBase,
      playerBase,
      creatures,
      enemyHpPercent,
      playerHpPercent,
      isGameOver,
      resultMessage,
      baseStyle,
      nestStyle,
      creatureStyle,
      creatureHpPercent,
      nestHpPercent,
      spawnPercent,
      resetBattle,
    };
  },
}).mount("#app");
