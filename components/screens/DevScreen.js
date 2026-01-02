import { defineComponent, inject, onMounted, onBeforeUnmount } from "../../lib/vue.js";

export default defineComponent({
  name: "DevScreen",
  setup() {
    const battle = inject("battle");

    onMounted(() => {
      if (!battle) return;
      battle.resetBattle();
      battle.enterDevMode();
    });

    onBeforeUnmount(() => {
      if (!battle) return;
      battle.stopBattle();
    });

    return {};
  },
  template: `
    <section class="dev-screen">
      <div class="dev-card">
        <div class="dev-title">Enemy Config Mode</div>
        <div class="dev-subtitle">Build the enemy placement tools here.</div>
        <div class="dev-note">UI coming soon.</div>
      </div>
    </section>
  `,
});
