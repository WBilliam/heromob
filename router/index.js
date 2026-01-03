import { createRouter, createWebHashHistory } from "../lib/vue-router.js";
import MenuScreen from "../components/screens/MenuScreen.js";
import GameScreen from "../components/screens/GameScreen.js";
import DevScreen from "../components/screens/DevScreen.js";

const DEV_UNLOCK_KEY = "heroMobDevUnlocked";

const routes = [
  { path: "/", name: "menu", component: MenuScreen },
  { path: "/game", name: "game", component: GameScreen },
  { path: "/dev", name: "dev", component: DevScreen },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.name !== "dev") {
    next();
    return;
  }
  const unlocked =
    typeof localStorage !== "undefined" &&
    localStorage.getItem(DEV_UNLOCK_KEY) === "true";
  if (!unlocked) {
    next({ name: "menu" });
    return;
  }
  next();
});

export default router;
