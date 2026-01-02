import { createApp } from "../lib/vue.js";
import App from "../components/App.js";
import router from "../router/index.js";

createApp(App).use(router).mount("#app");
