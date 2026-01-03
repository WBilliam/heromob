import { defineComponent, inject, computed, unref } from "../lib/vue.js";

const CreatureCard = defineComponent({
  name: "CreatureCard",
  props: {
    creature: { type: Object, required: true },
  },
  emits: ["dragstart"],
  template: `
    <div
      class="creature-card"
      @pointerdown="$emit('dragstart', creature.id, $event)"
    >
      <div
        class="creature-icon"
        :style="{
          backgroundImage: creature.icon ? 'url(' + creature.icon + ')' : ''
        }"
      ></div>
      <div class="creature-info">
        <div class="creature-name">{{ creature.name }}</div>
        <div class="creature-pop">{{ creature.popUsed }} / {{ creature.popMax }}</div>
      </div>
    </div>
  `,
});

export default defineComponent({
  name: "CreaturePanel",
  components: { CreatureCard },
  props: {
    title: { type: String, default: "Creatures" },
    subtitle: { type: String, default: "Drag onto a nest to spawn." },
    creatures: { type: Array, default: null },
    dragHandler: { type: Function, default: null },
  },
  setup(props) {
    const battle = inject("battle");
    const creatureList = computed(() => {
      if (props.creatures !== null && props.creatures !== undefined) {
        return unref(props.creatures);
      }
      return unref(battle.creaturePopStats);
    });
    const handleDragStart = (creatureId, event) => {
      const handler = props.dragHandler || battle.startCreatureDrag;
      handler(creatureId, event);
    };
    return { creatureList, handleDragStart };
  },
  template: `
    <aside class="creature-panel">
      <div class="panel-title">{{ title }}</div>
      <div class="panel-subtitle">{{ subtitle }}</div>
      <div class="creature-list">
        <CreatureCard
          v-for="creature in creatureList"
          :key="creature.id"
          :creature="creature"
          @dragstart="handleDragStart"
        />
      </div>
    </aside>
  `,
});
