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
import { NSelect } from "naive-ui";
import { useLanguage } from "../utils/useLanguage";

const { selectedLanguage, languageOptions, changeLanguage } = useLanguage();
</script>

<style scoped>
.language-switcher {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
}
</style>
