<template>
    <n-config-provider>
        <router-view v-slot="{ Component }">
            <keep-alive>
                <component :is="Component" />
            </keep-alive>
        </router-view>
    </n-config-provider>
</template>

<script lang="ts" setup>
console.log("你好");
</script>

<style></style>
