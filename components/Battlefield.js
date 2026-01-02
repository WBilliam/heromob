import { defineComponent, inject, computed } from "../lib/vue.js";

const BaseBlock = defineComponent({
  name: "BaseBlock",
  props: {
    team: { type: String, required: true },
    style: { type: Object, required: true },
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
  },
  template: `
    <div class="nest" :class="[team, { destroyed: nest.hp <= 0 }]" :style="style">
      <div class="nest-label">{{ label }}</div>
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
    <div class="wall" :class="{ destroyed: wall.hp <= 0 }" :style="style">
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
    <div class="tower" :class="{ destroyed: tower.hp <= 0 }" :style="style">
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
    <div class="projectile" :class="projectile.team" :style="style"></div>
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
  },
  template: `
    <div class="building-zone-line" :style="style">
      <span>Building Zone</span>
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
  },
  setup() {
    const battle = inject("battle");
    return { ...battle };
  },
  template: `
    <div class="battlefield-shell" ref="battlefieldShellRef">
      <div class="battlefield" ref="battlefieldRef">
        <BuildingZoneLine :style="buildingZoneStyle" />
        <BaseBlock
          v-if="enemyBase.hp > 0"
          team="enemy"
          :style="baseStyle('enemy')"
        />
        <BaseBlock
          v-if="playerBase.hp > 0"
          team="player"
          :style="baseStyle('player')"
        />

        <NestBlock
          v-if="enemyNest.hp > 0"
          team="enemy"
          label="Enemy Nest"
          :nest="enemyNest"
          :style="enemyNestStyle()"
          :hp-percent="nestHpPercent(enemyNest)"
          :spawn-percent="spawnPercent(enemyNest)"
        />

        <template v-for="nest in playerNests" :key="nest.id">
          <NestBlock
            v-if="nest.hp > 0"
            team="player"
            label="Player Nest"
            :nest="nest"
            :style="playerNestStyle(nest)"
            :hp-percent="nestHpPercent(nest)"
            :spawn-percent="spawnPercent(nest)"
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
