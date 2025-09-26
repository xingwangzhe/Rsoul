<template>
    <n-message-provider>
        <n-flex
            id="main-container"
            :vertical="false"
            style="flex-direction: row"
        >
            <div id="left-dir">
                <Suspense>
                    <FileTree @file-selected="handleFileSelected" />
                    <template #fallback>
                        <n-spin size="large" />
                    </template>
                </Suspense>
            </div>
            <div id="right-editor">
                <Suspense>
                    <Editor :content="selectedContent" :path="selectedPath" />
                    <template #fallback>
                        <n-spin size="large" />
                    </template>
                </Suspense>
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
import { defineAsyncComponent, Suspense } from "vue";
import { NMessageProvider, NButton, NFlex, NSpin, useMessage } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import { getStoredPath } from "../utils/fileTreeUtils";
import { useFileSelection } from "../utils/useFileSelection";

const FileTree = defineAsyncComponent(() =>
  import("../components/FileTree.vue")
);
const Editor = defineAsyncComponent(() =>
  import("../components/Editor.vue")
);

// Preload Editor component as it's likely to be used immediately
const preloadEditor = () => import("../components/Editor.vue");
preloadEditor();

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
