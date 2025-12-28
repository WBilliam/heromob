import { defineComponent, inject } from "../lib/vue.js";

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
  setup() {
    const battle = inject("battle");
    return { ...battle };
  },
  template: `
    <aside class="build-panel">
      <div class="panel-title">Buildings</div>
      <div class="panel-subtitle">Drag into the highlighted zone.</div>
      <div class="building-list">
        <BuildingCard
          v-for="building in buildingCatalog"
          :key="building.id"
          :building="building"
          :disabled="isGameOver"
          @dragstart="startBuildingDrag"
        />
      </div>
    </aside>
  `,
});
