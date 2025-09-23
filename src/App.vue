<template>
    <n-config-provider>
        <n-message-provider>
            <router-view v-slot="{ Component }">
                <keep-alive>
                    <component :is="Component" />
                </keep-alive>
            </router-view>
        </n-message-provider>
    </n-config-provider>
</template>

<script lang="ts" setup>
import { NMessageProvider } from "naive-ui";
import i18next from "i18next";
console.log(i18next.t("app.greeting"));
</script>

<style></style>
