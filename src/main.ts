import { createApp } from "vue";
import { createHead } from "@unhead/vue/client";
import App from "./App.vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { listen } from "@tauri-apps/api/event";
import Home from "./pages/Home.vue";
import About from "./pages/About.vue";
import Settings from "./pages/Settings.vue";

import { i18n } from "./i18n/index";
import "./css/global.css";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/about", name: "About", component: About },
  { path: "/settings", name: "Settings", component: Settings },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});
listen<string>("change_router", (event) => {
  console.log(event.payload);
  router.push({ path: event.payload });
});

const head = createHead();
const app = createApp(App);
app.use(router);
app.use(head);
app.use(i18n);

app.mount("#app");
