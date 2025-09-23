<template>
    {{ $t("settings.themeToggle") }}
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
import { NSwitch, NIcon } from "naive-ui";
import { SunnySharp, MoonSharp } from "@vicons/ionicons5";
import { useTheme } from "../utils/useTheme.ts";

const { isDark, toggleTheme } = useTheme();
</script>
