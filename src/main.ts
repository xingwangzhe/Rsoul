import { createApp } from "vue";
import App from "./App.vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { listen } from "@tauri-apps/api/event";
import Home from "./pages/Home.vue";
import About from "./pages/About.vue";
import Settings from "./pages/Settings.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/about", component: About },
  { path: "/settings", component: Settings },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});
listen<string>("change_router", (event) => {
  console.log(event.payload);
  router.push({ path: event.payload });
});
createApp(App).use(router).mount("#app");
