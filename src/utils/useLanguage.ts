import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { invoke } from "@tauri-apps/api/core";

export function useLanguage() {
  const { locale } = useI18n();

  const selectedLanguage = ref("en");

  const languageOptions = [
    { label: "English", value: "en" },
    { label: "简体中文", value: "zh-cn" },
    { label: "繁體中文", value: "zh-hk" },
  ];

  const changeLanguage = async (lang: string) => {
    console.log("Changing language to:", lang);
    selectedLanguage.value = lang;
    locale.value = lang;
    console.log("Current locale after change:", locale.value);

    try {
      await invoke("set_lang", { lang });
    } catch (error) {
      console.error("Failed to set language:", error);
    }

    // Update HTML lang attribute
    const langMap: { [key: string]: string } = {
      "zh-cn": "zh-CN",
      "zh-hk": "zh-HK",
      en: "en",
    };
    document.documentElement.lang = langMap[lang] || lang;
    console.log("HTML lang attribute set to:", document.documentElement.lang);
  };

  const loadLanguage = async () => {
    try {
      const savedLang = await invoke<string>("get_lang");
      if (savedLang && ["en", "zh-cn", "zh-hk"].includes(savedLang)) {
        selectedLanguage.value = savedLang;
        locale.value = savedLang;
        // Update HTML lang attribute
        const langMap: { [key: string]: string } = {
          "zh-cn": "zh-CN",
          "zh-hk": "zh-HK",
          en: "en",
        };
        document.documentElement.lang = langMap[savedLang] || savedLang;
      } else {
        selectedLanguage.value = locale.value;
      }
    } catch (error) {
      console.error("获取语言设置失败:", error);
      selectedLanguage.value = locale.value;
    }
  };

  onMounted(() => {
    loadLanguage();
  });

  return {
    selectedLanguage,
    languageOptions,
    changeLanguage,
    loadLanguage,
  };
}
