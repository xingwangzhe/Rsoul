import { createApp } from "vue";
import { createHead } from "@unhead/vue/client";
import App from "./App.vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { listen } from "@tauri-apps/api/event";
import Home from "./pages/Home.vue";
import About from "./pages/About.vue";
import Settings from "./pages/Settings.vue";

import i18next from "i18next";
import en from "../i18n/en.json";
import zhCN from "../i18n/zh-cn.json";
import zhHK from "../i18n/zh-hk.json";

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

// Initialize i18next with JSON resources from /i18n
i18next.init({
  resources: {
    en: { translation: en },
    "zh-cn": { translation: zhCN },
    "zh-hk": { translation: zhHK },
  },
  lng: (() => {
    try {
      const nav = (navigator.language || "en").toLowerCase();
      if (nav.startsWith("zh")) {
        if (nav.includes("hk") || nav.includes("tw") || nav.includes("mo"))
          return "zh-hk";
        return "zh-cn";
      }
      return "en";
    } catch {
      return "en";
    }
  })(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});
const head = createHead();
const app = createApp(App);
app.use(router);
app.use(head);

// expose $t to templates for convenience
app.config.globalProperties.$t = (key: string, opts?: any) =>
  i18next.t(key, opts);
// provide the i18next instance for advanced usage
app.provide("i18n", i18next);

app.mount("#app");
