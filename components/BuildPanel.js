import { defineComponent, inject, computed, unref } from "../lib/vue.js";

const BuildingCard = defineComponent({
  name: "BuildingCard",
  props: {
    building: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
  },
  emits: ["dragstart"],
  template: `
    <div
      class="building-card"
      :class="{ disabled }"
      @pointerdown="$emit('dragstart', building.id, $event)"
    >
      <div class="building-icon" :class="building.id"></div>
      <div class="building-info">
        <div class="building-name">{{ building.name }}</div>
        <div class="building-desc">{{ building.description }}</div>
      </div>
    </div>
  `,
});

export default defineComponent({
  name: "BuildPanel",
  components: { BuildingCard },
  props: {
    title: { type: String, default: "Buildings" },
    subtitle: { type: String, default: "Drag into the highlighted zone." },
    buildings: { type: Array, default: null },
    disabled: { default: undefined },
    dragHandler: { type: Function, default: null },
  },
  setup(props) {
    const battle = inject("battle");
    const buildingList = computed(() => {
      if (props.buildings !== null && props.buildings !== undefined) {
        return unref(props.buildings);
      }
      return battle.buildingCatalog;
    });
    const isDisabled = computed(() =>
      props.disabled ?? unref(battle.isGameOver)
    );
    const handleDragStart = (buildingId, event) => {
      const handler = props.dragHandler || battle.startBuildingDrag;
      handler(buildingId, event);
    };
    return { buildingList, isDisabled, handleDragStart };
  },
  template: `
    <aside class="build-panel">
      <div class="panel-title">{{ title }}</div>
      <div class="panel-subtitle">{{ subtitle }}</div>
      <div class="building-list">
        <BuildingCard
          v-for="building in buildingList"
          :key="building.id"
          :building="building"
          :disabled="isDisabled"
          @dragstart="handleDragStart"
        />
      </div>
    </aside>
  `,
});
