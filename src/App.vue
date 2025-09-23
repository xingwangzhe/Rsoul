<template>
    <n-message-provider>
        <n-config-provider :theme="isDark ? darkTheme : undefined">
            <n-global-style />
            <router-view v-slot="{ Component }">
                <keep-alive>
                    <component :is="Component" />
                </keep-alive>
            </router-view>
        </n-config-provider>
    </n-message-provider>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { NConfigProvider, NMessageProvider, darkTheme } from "naive-ui";
import { useTheme } from "./utils/useTheme";


const { isDark, loadTheme } = useTheme();

onMounted(async () => {
    await loadTheme();
});

</script>

<style></style>
