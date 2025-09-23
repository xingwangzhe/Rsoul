<template>
    <div class="language-switcher">
        <span>{{ $t("settings.language") }}</span>
        <n-select
            v-model:value="selectedLanguage"
            :options="languageOptions"
            @update:value="changeLanguage"
            style="margin-left: 10px"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { NSelect } from "naive-ui";
import { useI18n } from "vue-i18n";

const { locale } = useI18n();

const selectedLanguage = ref("en");

const languageOptions = [
    { label: "English", value: "en" },
    { label: "简体中文", value: "zh-cn" },
    { label: "繁體中文", value: "zh-hk" },
];

const changeLanguage = (lang: string) => {
    console.log("Changing language to:", lang);
    selectedLanguage.value = lang;
    locale.value = lang;
    console.log("Current locale after change:", locale.value);
    localStorage.setItem("language", lang);

    // Update HTML lang attribute
    const langMap: { [key: string]: string } = {
        "zh-cn": "zh-CN",
        "zh-hk": "zh-HK",
        en: "en",
    };
    document.documentElement.lang = langMap[lang] || lang;
    console.log("HTML lang attribute set to:", document.documentElement.lang);
};

onMounted(() => {
    const savedLang = localStorage.getItem("language");
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
});
</script>

<style scoped>
.language-switcher {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
}
</style>
