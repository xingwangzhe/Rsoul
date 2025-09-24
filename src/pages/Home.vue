<template>
    <n-message-provider>
        <n-flex
            id="main-container"
            vertical="false"
            style="flex-direction: row"
        >
            <div id="left-dir">
                <FileTree @file-selected="handleFileSelected" />
            </div>
            <div id="right-editor">
                <Editor :content="selectedContent" :path="selectedPath" />
            </div>
        </n-flex>
        <n-button
            size="small"
            type="primary"
            @click="openTerminal"
            style="position: fixed; left: 20px; bottom: 20px; z-index: 1200"
        >
            Open Terminal
        </n-button>
    </n-message-provider>
</template>

<script setup>
import { ref } from "vue";
import { NMessageProvider, NButton, useMessage } from "naive-ui";
import FileTree from "../components/FileTree.vue";
import Editor from "../components/Editor.vue";
import { invoke } from "@tauri-apps/api/core";
import { getStoredPath } from "../utils/fileTreeUtils";

const selectedContent = ref("");
const selectedPath = ref("");
const msg = useMessage();

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

async function openTerminal() {
    try {
        const path = await getStoredPath();
        if (path) {
            await invoke("open_terminal", { path });
        } else {
            msg.warning("No folder selected");
        }
    } catch (e) {
        msg.error(String(e));
    }
}
</script>

<style src="../css/Home.css" scoped></style>
