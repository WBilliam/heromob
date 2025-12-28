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

const CreatureUnit = defineComponent({
  name: "CreatureUnit",
  props: {
    creature: { type: Object, required: true },
    style: { type: Object, required: true },
    hpPercent: { type: Number, required: true },
  },
  template: `
    <div class="creature" :class="[creature.team, { dead: creature.isDead }]" :style="style">
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
  },
  template: `
    <div class="nest ghost" :class="{ invalid: !isValid }" :style="style">
      <div class="nest-label">Placing Nest</div>
    </div>
  `,
});

export default defineComponent({
  name: "Battlefield",
  components: {
    BaseBlock,
    NestBlock,
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
        <BaseBlock team="enemy" :style="baseStyle('enemy')" />
        <BaseBlock team="player" :style="baseStyle('player')" />

        <NestBlock
          team="enemy"
          label="Enemy Nest"
          :nest="enemyNest"
          :style="enemyNestStyle()"
          :hp-percent="nestHpPercent(enemyNest)"
          :spawn-percent="spawnPercent(enemyNest)"
        />

        <NestBlock
          v-for="nest in playerNests"
          :key="nest.id"
          team="player"
          label="Player Nest"
          :nest="nest"
          :style="playerNestStyle(nest)"
          :hp-percent="nestHpPercent(nest)"
          :spawn-percent="spawnPercent(nest)"
        />

        <DragGhost
          v-if="dragState.active"
          :style="dragGhostStyle"
          :is-valid="dragState.isValid"
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
