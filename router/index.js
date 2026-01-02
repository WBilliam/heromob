import { createRouter, createWebHashHistory } from "../lib/vue-router.js";
import MenuScreen from "../components/screens/MenuScreen.js";
import GameScreen from "../components/screens/GameScreen.js";
import DevScreen from "../components/screens/DevScreen.js";

const routes = [
  { path: "/", name: "menu", component: MenuScreen },
  { path: "/game", name: "game", component: GameScreen },
  { path: "/dev", name: "dev", component: DevScreen },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
