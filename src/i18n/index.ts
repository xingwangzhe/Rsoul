import { createI18n } from "vue-i18n";

// Import language files
import en from "../../i18n/en.json";
import zhCN from "../../i18n/zh-cn.json";
import zhHK from "../../i18n/zh-hk.json";

// Language detection function
const detectLanguage = (): string => {
  try {
    const nav = (navigator.language || "en").toLowerCase();
    if (nav.startsWith("zh")) {
      if (nav.includes("hk") || nav.includes("tw") || nav.includes("mo")) {
        return "zh-hk";
      }
      return "zh-cn";
    }
    return "en";
  } catch {
    return "en";
  }
};

const detectedLang = detectLanguage();

// Set HTML lang attribute
const langMap: { [key: string]: string } = {
  "zh-cn": "zh-CN",
  "zh-hk": "zh-HK",
  en: "en",
};
document.documentElement.lang = langMap[detectedLang] || detectedLang;

// Create i18n instance
export const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: detectedLang,
  fallbackLocale: "en",
  messages: {
    en,
    "zh-cn": zhCN,
    "zh-hk": zhHK,
  },
  // Global properties for template usage
  globalInjection: true,
});

// Export for use in main.ts
export default i18n;
