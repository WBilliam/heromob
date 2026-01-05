import { defineComponent, inject, computed, unref } from "../lib/vue.js";

const BuildingCard = defineComponent({
  name: "BuildingCard",
  props: {
    building: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
    placement: { type: Object, default: null },
  },
  emits: ["dragstart"],
  template: `
    <div
      class="building-card"
      :class="{ disabled, loading: placement && !placement.isReady }"
      @pointerdown="$emit('dragstart', building.id, $event)"
    >
      <div class="building-icon" :class="building.id"></div>
      <div v-if="placement && !placement.isReady" class="building-load">
        <div
          class="building-load-bar"
          :style="{ width: placement.progressPercent + '%' }"
        ></div>
        <div class="building-load-text">{{ placement.label }}</div>
      </div>
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
    const buildingEntries = computed(() => {
      const list = buildingList.value || [];
      return list.map((building) => {
        const placement = battle?.getBuildingPlacement
          ? battle.getBuildingPlacement(building.id)
          : null;
        if (!placement) {
          return { building, placement: null, isLocked: false };
        }
        const durationMs = Number.isFinite(placement.durationMs)
          ? Math.max(0, placement.durationMs)
          : 0;
        const remainingMs = Number.isFinite(placement.remainingMs)
          ? Math.max(0, placement.remainingMs)
          : 0;
        const isReady = placement.isReady || durationMs === 0;
        const progress = Number.isFinite(placement.progress)
          ? Math.min(1, Math.max(0, placement.progress))
          : durationMs > 0
          ? (durationMs - remainingMs) / durationMs
          : 1;
        const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
        return {
          building,
          placement: {
            ...placement,
            durationMs,
            remainingMs,
            isReady,
            progressPercent: Math.round(progress * 100),
            label: isReady ? "Ready" : `${seconds}s`,
          },
          isLocked: !isReady,
        };
      });
    });
    const canStartDrag = (buildingId) => {
      if (unref(isDisabled)) return false;
      if (!battle?.canPlaceBuilding) return true;
      return battle.canPlaceBuilding(buildingId);
    };
    const handleDragStart = (buildingId, event) => {
      if (!canStartDrag(buildingId)) return;
      const handler = props.dragHandler || battle.startBuildingDrag;
      handler(buildingId, event);
    };
    return { buildingEntries, isDisabled, handleDragStart };
  },
  template: `
    <aside class="build-panel">
      <div class="panel-title">{{ title }}</div>
      <div class="panel-subtitle">{{ subtitle }}</div>
      <div class="building-list">
        <BuildingCard
          v-for="entry in buildingEntries"
          :key="entry.building.id"
          :building="entry.building"
          :placement="entry.placement"
          :disabled="isDisabled || entry.isLocked"
          @dragstart="handleDragStart"
        />
      </div>
    </aside>
  `,
});
