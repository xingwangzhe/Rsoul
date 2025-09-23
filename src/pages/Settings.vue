<template>
    <div class="settings-container">
        <SwitchDark />
        <br />
        <SetFrontmatter />
    </div>
</template>
<script setup lang="ts">
import SwitchDark from "../components/SwitchDark.vue";
import SetFrontmatter from "../components/SetFrontmatter.vue";
</script>

<style scoped>
.settings-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}
</style>
