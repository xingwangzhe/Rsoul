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

// 使用 /i18n 中的 JSON 资源初始化 i18next
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

// 为模板提供 $t 以方便使用
app.config.globalProperties.$t = (key: string, opts?: any) =>
  i18next.t(key, opts);
// 提供 i18next 实例以供高级使用
app.provide("i18n", i18next);

app.mount("#app");
