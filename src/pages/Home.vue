<template>
    <n-message-provider>
        <div id="main-container">
            <div id="left-dir">
                <FileTree @file-selected="handleFileSelected" />
            </div>
            <div id="right-editor">
                <Editor :content="selectedContent" :path="selectedPath" />
            </div>
        </div>
    </n-message-provider>
</template>

<script setup>
import { ref } from "vue";
import { NMessageProvider } from "naive-ui";
import FileTree from "../components/FileTree.vue";
import Editor from "../components/Editor.vue";

const selectedContent = ref("");
const selectedPath = ref("");

/**
 * FileTree now emits an object: { content, path }
 * Update both selectedContent and selectedPath when a file is chosen.
 */
function handleFileSelected(payload) {
    if (!payload) return;
    // payload may be either the content string (legacy) or an object { content, path }
    if (typeof payload === "string") {
        selectedContent.value = payload;
        // keep selectedPath unchanged in this legacy case
    } else {
        selectedContent.value = payload.content ?? "";
        selectedPath.value = payload.path ?? "";
    }
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
