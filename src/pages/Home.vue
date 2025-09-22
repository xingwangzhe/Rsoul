<template>
    <div id="main-container">
        <div id="left-dir">
            <FileTree @file-selected="handleFileSelected" />
        </div>
        <div id="right-editor">
            <Editor :content="selectedContent" />
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import FileTree from "../components/FileTree.vue";
import Editor from "../components/Editor.vue";

const selectedContent = ref("");

function handleFileSelected(content) {
    selectedContent.value = content;
}
</script>

<style scoped>
#main-container {
    display: flex;

    & #left-dir {
        width: 300px;
        height: 100vh;

        flex: none;
        display: flex;
        flex-direction: column;
    }

    & #right-editor {
        width: 100vh;
        height: 100vh;
        flex: 8;
    }
}
</style>
