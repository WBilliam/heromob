import { defineComponent, inject } from "../lib/vue.js";

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
  setup() {
    const battle = inject("battle");
    return { ...battle };
  },
  template: `
    <aside class="creature-panel">
      <div class="panel-title">Creatures</div>
      <div class="panel-subtitle">Drag onto a nest to spawn.</div>
      <div class="creature-list">
        <CreatureCard
          v-for="creature in creaturePopStats"
          :key="creature.id"
          :creature="creature"
          @dragstart="startCreatureDrag"
        />
      </div>
    </aside>
  `,
});
