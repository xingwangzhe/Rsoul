import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const isDark = ref(false);

async function loadTheme() {
  try {
    const theme = await invoke<boolean>("get_theme");
    console.log("正在加载主题:", theme);
    isDark.value = theme;
  } catch (err) {
    console.error("加载主题失败:", err);
    isDark.value = false;
  }
}

listen<boolean>("theme_changed", (event) => {
  console.log("主题已更改为:", event.payload);
  isDark.value = event.payload;
});

export function useTheme() {
  return {
    isDark,
    toggleTheme: (newVal: boolean) => {
      invoke("if_change_dark", { theme: newVal });
    },
    loadTheme,
  };
}
