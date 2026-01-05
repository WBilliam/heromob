import { defineComponent, ref, onMounted, onBeforeUnmount } from "../../lib/vue.js";
import { useRouter } from "../../lib/vue-router.js";

const DEV_UNLOCK_KEY = "heroMobDevUnlocked";

export default defineComponent({
  name: "MenuScreen",
  setup() {
    const router = useRouter();
    const devUnlocked = ref(
      typeof localStorage !== "undefined" &&
        localStorage.getItem(DEV_UNLOCK_KEY) === "true"
    );
    let keyBuffer = "";
    const goToGame = () => router.push({ name: "game" });
    const goToDev = () => router.push({ name: "dev" });

    const unlockDev = () => {
      devUnlocked.value = true;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(DEV_UNLOCK_KEY, "true");
      }
    };

    const hideDev = () => {
      devUnlocked.value = false;
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(DEV_UNLOCK_KEY);
      }
    };

    const handleKeydown = (event) => {
      if (!event.key || event.key.length !== 1) return;
      keyBuffer = `${keyBuffer}${event.key.toLowerCase()}`.slice(-7);
      if (keyBuffer === "devmode") {
        unlockDev();
      }
    };

    onMounted(() => {
      window.addEventListener("keydown", handleKeydown);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", handleKeydown);
    });

    return { goToGame, goToDev, devUnlocked, unlockDev, hideDev };
  },
  template: `
    <section class="menu-screen">
      <div class="menu-card">
        <div class="menu-brand" @dblclick="unlockDev">Hero Mob</div>
        <div class="menu-title">Battle Prototype</div>
        <div class="menu-subtitle">Choose your next destination.</div>
        <div class="menu-actions">
          <button class="btn" type="button" @click="goToGame">Play</button>
          <button
            v-if="devUnlocked"
            class="btn btn-secondary"
            type="button"
            @click="goToDev"
          >
            Dev Mode
          </button>
          <button
            v-if="devUnlocked"
            class="btn btn-ghost"
            type="button"
            @click="hideDev"
          >
            Hide Dev Mode
          </button>
        </div>
        <div v-if="devUnlocked" class="menu-note">
          Dev mode opens the enemy config screen.
        </div>
      </div>
    </section>
  `,
});
