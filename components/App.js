import { defineComponent, provide } from "../lib/vue.js";
import { useBattleState } from "../game/useBattleState.js";

export default defineComponent({
  name: "App",
  setup() {
    const battle = useBattleState();
    provide("battle", battle);
    return {};
  },
  template: `
    <div class="app">
      <router-view />
    </div>
  `,
});
