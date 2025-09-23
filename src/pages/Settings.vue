<template>
    <div class="settings-container">
        <LanguageSwitcher />
        <br />
        <SwitchDark />
        <br />
        <SetFrontmatter />
    </div>
</template>
<script setup lang="ts">
import LanguageSwitcher from "../components/LanguageSwitcher.vue";
import SwitchDark from "../components/SwitchDark.vue";
import SetFrontmatter from "../components/SetFrontmatter.vue";
</script>

<style src="../css/Settings.css" scoped></style>
