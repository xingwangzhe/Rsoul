<template>
    {{ themeToggleText }}
    <n-switch :value="isDark" @update:value="toggleTheme" size="large">
        <template #checked-icon>
            <n-icon :component="MoonSharp" />
        </template>
        <template #unchecked-icon>
            <n-icon :component="SunnySharp" />
        </template>
    </n-switch>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { NSwitch, NIcon } from "naive-ui";
import { SunnySharp, MoonSharp } from "@vicons/ionicons5";
import { useTheme } from "../utils/useTheme.ts";
import { useI18n } from "vue-i18n";

const { isDark, toggleTheme } = useTheme();
const { t } = useI18n();

// Computed property for translation to ensure reactivity
const themeToggleText = computed(() => t("settings.themeToggle"));
</script>
