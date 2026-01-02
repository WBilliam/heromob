import { defineComponent, inject, onMounted, onBeforeUnmount } from "../../lib/vue.js";
import Hud from "../Hud.js";
import BuildPanel from "../BuildPanel.js";
import Battlefield from "../Battlefield.js";
import GameOverlay from "../GameOverlay.js";

export default defineComponent({
  name: "GameScreen",
  components: { Hud, BuildPanel, Battlefield, GameOverlay },
  setup() {
    const battle = inject("battle");

    onMounted(() => {
      if (!battle) return;
      battle.resetBattle();
      battle.startBattle();
    });

    onBeforeUnmount(() => {
      if (!battle) return;
      battle.stopBattle();
    });

    return {};
  },
  template: `
    <section class="game-screen">
      <Hud />
      <main class="battlefield-area">
        <BuildPanel />
        <Battlefield />
      </main>
      <GameOverlay />
    </section>
  `,
});
