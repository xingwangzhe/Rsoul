import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const isDark = ref(false);

async function loadTheme() {
  try {
    const theme = await invoke<boolean>("get_theme");
    console.log("Loading theme:", theme);
    isDark.value = theme;
  } catch (err) {
    console.error("Failed to load theme:", err);
    isDark.value = false;
  }
}

listen<boolean>("theme_changed", (event) => {
  console.log("Theme changed to:", event.payload);
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
