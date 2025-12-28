import { defineComponent, provide } from "../lib/vue.js";
import { useBattleState } from "../game/useBattleState.js";
import Hud from "./Hud.js";
import BuildPanel from "./BuildPanel.js";
import Battlefield from "./Battlefield.js";
import GameOverlay from "./GameOverlay.js";

export default defineComponent({
  name: "App",
  components: { Hud, BuildPanel, Battlefield, GameOverlay },
  setup() {
    const battle = useBattleState();
    provide("battle", battle);
  },
  template: `
    <div class="app">
      <Hud />
      <main class="battlefield-area">
        <BuildPanel />
        <Battlefield />
      </main>
      <GameOverlay />
    </div>
  `,
});
