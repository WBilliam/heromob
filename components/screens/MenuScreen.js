import { defineComponent } from "../../lib/vue.js";
import { useRouter } from "../../lib/vue-router.js";

export default defineComponent({
  name: "MenuScreen",
  setup() {
    const router = useRouter();
    const goToGame = () => router.push({ name: "game" });
    const goToDev = () => router.push({ name: "dev" });
    return { goToGame, goToDev };
  },
  template: `
    <section class="menu-screen">
      <div class="menu-card">
        <div class="menu-brand">Hero Mob</div>
        <div class="menu-title">Stage 2 Battle</div>
        <div class="menu-subtitle">Choose your next destination.</div>
        <div class="menu-actions">
          <button class="btn" type="button" @click="goToGame">Play</button>
          <button class="btn btn-secondary" type="button" @click="goToDev">
            Dev Mode
          </button>
        </div>
        <div class="menu-note">Dev mode opens the enemy config screen.</div>
      </div>
    </section>
  `,
});
