import { defineComponent, inject } from "../lib/vue.js";

export default defineComponent({
  name: "GameOverlay",
  setup() {
    const battle = inject("battle");
    return { ...battle };
  },
  template: `
    <div v-if="isGameOver" class="overlay">
      <div class="result">
        <div class="result-title">{{ resultMessage }}</div>
        <div class="result-subtitle">Battle complete. Restart to try again.</div>
        <button class="btn" type="button" @click="resetBattle">Restart Battle</button>
      </div>
    </div>
  `,
});
