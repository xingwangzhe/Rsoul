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
import { defineAsyncComponent } from "vue";
import { NMessageProvider, NButton, useMessage } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import { getStoredPath } from "../utils/fileTreeUtils";
import { useFileSelection } from "../utils/useFileSelection";

const FileTree = defineAsyncComponent(
    () => import("../components/FileTree.vue"),
);
const Editor = defineAsyncComponent(() => import("../components/Editor.vue"));

const { selectedContent, selectedPath, handleFileSelected } =
    useFileSelection();
const msg = useMessage();

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
