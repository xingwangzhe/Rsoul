<template>
    <div class="settings-container">
        <SwitchLang />
        <br />
        <SwitchDark />
        <br />
        <SetFrontmatter />
    </div>
</template>
<script setup lang="ts">
import SwitchLang from "../components/SwitchLang.vue";
import SwitchDark from "../components/SwitchDark.vue";
import SetFrontmatter from "../components/SetFrontmatter.vue";
</script>

<style src="../css/Settings.css" scoped></style>
