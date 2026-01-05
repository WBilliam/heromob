import { defineComponent, inject, computed } from "../lib/vue.js";

const BaseBlock = defineComponent({
  name: "BaseBlock",
  props: {
    team: { type: String, required: true },
    style: { type: Object, required: true },
    spawnIcon: { type: String, default: "" },
  },
  setup(props) {
    const label = computed(() =>
      props.team === "enemy" ? "Enemy Base" : "Player Base"
    );
    return { label };
  },
  template: `
    <div class="base" :class="team" :style="style">
      <span class="base-label">{{ label }}</span>
      <div v-if="spawnIcon" class="spawn-bubble">
        <div
          class="spawn-bubble-icon"
          :style="{ backgroundImage: 'url(' + spawnIcon + ')' }"
        ></div>
      </div>
    </div>
  `,
});

const NestBlock = defineComponent({
  name: "NestBlock",
  props: {
    team: { type: String, required: true },
    label: { type: String, required: true },
    nest: { type: Object, required: true },
    style: { type: Object, required: true },
    hpPercent: { type: Number, required: true },
    spawnPercent: { type: Number, required: true },
    isTarget: { type: Boolean, default: false },
    isValidTarget: { type: Boolean, default: false },
    assignedLabel: { type: String, default: "" },
    spawnIcon: { type: String, default: "" },
  },
  template: `
    <div
      class="nest"
      :class="[
        team,
        {
          destroyed: nest.hp <= 0,
          'assign-target': isTarget,
          'assign-invalid': isTarget && !isValidTarget,
        }
      ]"
      :style="style"
    >
      <div v-if="spawnIcon" class="spawn-bubble">
        <div
          class="spawn-bubble-icon"
          :style="{ backgroundImage: 'url(' + spawnIcon + ')' }"
        ></div>
      </div>
      <div class="nest-label">{{ label }}</div>
      <div v-if="assignedLabel" class="nest-assigned">{{ assignedLabel }}</div>
      <div class="nest-hp">
        <span :style="{ width: hpPercent + '%' }"></span>
      </div>
      <div class="spawn-bar">
        <span :style="{ width: spawnPercent + '%' }"></span>
      </div>
    </div>
  `,
});

const WallBlock = defineComponent({
  name: "WallBlock",
  props: {
    wall: { type: Object, required: true },
    style: { type: Object, required: true },
    hpPercent: { type: Number, required: true },
  },
  template: `
    <div class="wall" :class="[wall.team, { destroyed: wall.hp <= 0 }]" :style="style">
      <div class="wall-hp">
        <span :style="{ width: hpPercent + '%' }"></span>
      </div>
    </div>
  `,
});

const TowerBlock = defineComponent({
  name: "TowerBlock",
  props: {
    tower: { type: Object, required: true },
    style: { type: Object, required: true },
    hpPercent: { type: Number, required: true },
  },
  template: `
    <div class="tower" :class="[tower.team, { destroyed: tower.hp <= 0 }]" :style="style">
      <div class="tower-core"></div>
      <div class="tower-hp">
        <span :style="{ width: hpPercent + '%' }"></span>
      </div>
    </div>
  `,
});

const ProjectileBolt = defineComponent({
  name: "ProjectileBolt",
  props: {
    projectile: { type: Object, required: true },
    style: { type: Object, required: true },
  },
  template: `
    <div class="projectile" :class="[projectile.team, projectile.kind]" :style="style"></div>
  `,
});

const CreatureUnit = defineComponent({
  name: "CreatureUnit",
  props: {
    creature: { type: Object, required: true },
    style: { type: Object, required: true },
    hpPercent: { type: Number, required: true },
  },
  template: `
    <div class="creature" :class="[creature.team, creature.type, { dead: creature.isDead }]" :style="style">
      <div class="hp-bar">
        <span :style="{ width: hpPercent + '%' }"></span>
      </div>
      <div class="creature-body"></div>
    </div>
  `,
});

const BuildingZoneLine = defineComponent({
  name: "BuildingZoneLine",
  props: {
    style: { type: Object, required: true },
    label: { type: String, default: "Building Zone" },
    tone: { type: String, default: "player" },
  },
  template: `
    <div class="building-zone-line" :class="tone" :style="style">
      <span>{{ label }}</span>
    </div>
  `,
});

const DragGhost = defineComponent({
  name: "DragGhost",
  props: {
    style: { type: Object, required: true },
    isValid: { type: Boolean, required: true },
    type: { type: String, required: true },
    label: { type: String, required: true },
  },
  template: `
    <div
      class="ghost"
      :class="[type, { invalid: !isValid }]"
      :style="style"
    >
      <div class="nest-label">Placing {{ label }}</div>
    </div>
  `,
});

const CreatureGhost = defineComponent({
  name: "CreatureGhost",
  props: {
    style: { type: Object, required: true },
    isValid: { type: Boolean, required: true },
    creature: { type: Object, required: true },
  },
  template: `
    <div class="creature-ghost" :class="{ invalid: !isValid }" :style="style">
      <div
        class="creature-ghost-icon"
        :style="{
          backgroundImage: creature.icon ? 'url(' + creature.icon + ')' : ''
        }"
      ></div>
      <div class="creature-ghost-label">Assign {{ creature.name }}</div>
    </div>
  `,
});

export default defineComponent({
  name: "Battlefield",
  components: {
    BaseBlock,
    NestBlock,
    WallBlock,
    TowerBlock,
    ProjectileBolt,
    CreatureUnit,
    BuildingZoneLine,
    DragGhost,
    CreatureGhost,
  },
  setup() {
    const battle = inject("battle");
    return { ...battle };
  },
  template: `
    <div class="battlefield-shell" ref="battlefieldShellRef">
      <div class="battlefield" ref="battlefieldRef">
        <BuildingZoneLine
          :style="buildingZoneStyle"
          label="Player Zone"
          tone="player"
        />
        <BuildingZoneLine
          v-if="isDevMode"
          :style="enemyBuildingZoneStyle"
          label="Enemy Zone"
          tone="enemy"
        />
        <BaseBlock
          v-if="enemyBase.hp > 0"
          team="enemy"
          :style="baseStyle('enemy')"
          :spawn-icon="creatureIcon(baseSpawnCreatureId)"
        />
        <BaseBlock
          v-if="playerBase.hp > 0"
          team="player"
          :style="baseStyle('player')"
          :spawn-icon="creatureIcon(baseSpawnCreatureId)"
        />

        <template v-for="nest in enemyNests" :key="nest.id">
          <NestBlock
            v-if="nest.hp > 0"
            team="enemy"
            label="Enemy Nest"
            :nest="nest"
            :style="playerNestStyle(nest)"
            :hp-percent="nestHpPercent(nest)"
            :spawn-percent="spawnPercent(nest)"
            :is-target="enemyCreatureDragState.active && enemyCreatureDragState.targetNestId === nest.id"
            :is-valid-target="enemyCreatureDragState.isValid"
            :assigned-label="nest.spawnCreatureId ? creatureLabel(nest.spawnCreatureId) : ''"
            :spawn-icon="creatureIcon(nest.spawnCreatureId)"
          />
        </template>

        <template v-for="wall in enemyWalls" :key="wall.id">
          <WallBlock
            v-if="wall.hp > 0"
            :wall="wall"
            :style="wallStyle(wall)"
            :hp-percent="nestHpPercent(wall)"
          />
        </template>

        <template v-for="tower in enemyTowers" :key="tower.id">
          <TowerBlock
            v-if="tower.hp > 0"
            :tower="tower"
            :style="towerStyle(tower)"
            :hp-percent="nestHpPercent(tower)"
          />
        </template>

        <template v-for="nest in playerNests" :key="nest.id">
          <NestBlock
            v-if="nest.hp > 0"
            team="player"
            label="Player Nest"
            :nest="nest"
            :style="playerNestStyle(nest)"
            :hp-percent="nestHpPercent(nest)"
            :spawn-percent="spawnPercent(nest)"
            :is-target="creatureDragState.active && creatureDragState.targetNestId === nest.id"
            :is-valid-target="creatureDragState.isValid"
            :assigned-label="nest.spawnCreatureId ? creatureLabel(nest.spawnCreatureId) : ''"
            :spawn-icon="creatureIcon(nest.spawnCreatureId)"
          />
        </template>

        <template v-for="wall in playerWalls" :key="wall.id">
          <WallBlock
            v-if="wall.hp > 0"
            :wall="wall"
            :style="wallStyle(wall)"
            :hp-percent="nestHpPercent(wall)"
          />
        </template>

        <template v-for="tower in playerTowers" :key="tower.id">
          <TowerBlock
            v-if="tower.hp > 0"
            :tower="tower"
            :style="towerStyle(tower)"
            :hp-percent="nestHpPercent(tower)"
          />
        </template>

        <DragGhost
          v-if="dragState.active && dragBuilding"
          :style="dragGhostStyle"
          :is-valid="dragState.isValid"
          :type="dragBuilding.id"
          :label="dragBuilding.name"
        />

        <DragGhost
          v-if="enemyDragState.active && enemyDragBuilding"
          :style="enemyDragGhostStyle"
          :is-valid="enemyDragState.isValid"
          :type="enemyDragBuilding.id"
          :label="enemyDragBuilding.name"
        />

        <CreatureGhost
          v-if="creatureDragState.active && dragCreature"
          :style="creatureDragGhostStyle"
          :is-valid="creatureDragState.isValid"
          :creature="dragCreature"
        />

        <CreatureGhost
          v-if="enemyCreatureDragState.active && enemyDragCreature"
          :style="enemyCreatureDragGhostStyle"
          :is-valid="enemyCreatureDragState.isValid"
          :creature="enemyDragCreature"
        />

        <ProjectileBolt
          v-for="projectile in projectiles"
          :key="projectile.id"
          :projectile="projectile"
          :style="projectileStyle(projectile)"
        />

        <CreatureUnit
          v-for="creature in creatures"
          :key="creature.id"
          :creature="creature"
          :style="creatureStyle(creature)"
          :hp-percent="creatureHpPercent(creature)"
        />
      </div>

    </div>
  `,
});
