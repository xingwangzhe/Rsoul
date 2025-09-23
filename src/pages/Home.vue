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
 * FileTree 现在发出一个对象：{ content, path }
 * 当选择文件时，同时更新 selectedContent 和 selectedPath。
 */
function handleFileSelected(payload) {
    if (!payload) return;
    // payload 可能是内容字符串（遗留）或对象 { content, path }
    if (typeof payload === "string") {
        selectedContent.value = payload;
        // 在此遗留情况下保持 selectedPath 不变
    } else {
        selectedContent.value = payload.content ?? "";
        selectedPath.value = payload.path ?? "";
    }
}
</script>

<style src="./css/Home.css" scoped></style>
