<template>
    <MdEditor id="editor-area" v-model="text" />
</template>

<script setup>
import { ref } from "vue";
import { MdEditor } from "md-editor-v3";
import "md-editor-v3/lib/style.css";

const text = ref("Hello Editor!");
</script>
<style scope>
#editor-area {
    height: 100vh;
}
</style>
