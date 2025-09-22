<template>
    切换亮暗主题
    <n-switch v-model:value="isDark" size="large">
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
import { ref } from "vue";

const isDark = ref(false);
</script>
