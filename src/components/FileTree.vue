<template>
    <div class="file-tree-container">
        <div class="controls">
            <n-button @click="getFileTree" :loading="loading">
                {{ $t("fileTree.addFolder") }}
            </n-button>
            <!-- <div v-if="selectedPath" class="selected"> -->
            <!-- {{ $t("fileTree.selected", { path: selectedPath }) }} -->
        </div>
        <div v-if="error" class="error">
            {{ $t("fileTree.error", { err: error }) }}
            <!-- </div> -->
        </div>

        <div class="tree-area">
            <div v-if="loading" class="loading">
                <n-spin /> {{ $t("fileTree.loading") }}
            </div>

            <n-tree
                block-line
                expand-on-click
                virtual-scroll
                v-else-if="treeData.length"
                :data="treeData"
                :node-props="nodeProps"
                :on-update:expanded-keys="updatePrefixWithExpanded"
                style="height: 100vh"
            />

            <div v-else class="empty">{{ $t("fileTree.empty") }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { NButton, NTree, NSpin } from "naive-ui";
import type { TreeOption } from "naive-ui";

import i18next from "i18next";

import {
    updatePrefixWithExpanded,
    NaiveNode,
    loadFileTree,
    getFileTree as getFileTreeFromBackend,
    getStoredPath,
    getFileContent,
} from "../utils/fileTreeUtils";
import { collectFrontmatterSuggestions } from "../utils/frontmatterUtils";

const emit = defineEmits(["fileSelected"]);

const treeData = ref<NaiveNode[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedPath = ref<string | null>(null);

/**
 * 从指定路径加载文件树
 */
async function loadFileTreeWrapper(path: string) {
    loading.value = true;
    error.value = null;
    treeData.value = [];
    selectedPath.value = path;

    const result = await loadFileTree(path);
    treeData.value = result.treeData;
    error.value = result.error;
    selectedPath.value = result.selectedPath;
    loading.value = false;
}

/**
 * 从后端拉取文件树
 */
async function getFileTree() {
    loading.value = true;
    error.value = null;
    treeData.value = [];
    selectedPath.value = null;

    const result = await getFileTreeFromBackend();
    treeData.value = result.treeData;
    error.value = result.error;
    selectedPath.value = result.selectedPath;
    loading.value = false;

    // 选择文件夹后收集 frontmatter 建议
    if (result.treeData.length > 0) {
        try {
            await collectFrontmatterSuggestions();
        } catch (e) {
            console.warn("收集 frontmatter 建议失败:", e);
        }
    }
}

// 在组件挂载时自动加载存储的路径
onMounted(async () => {
    const path = await getStoredPath();
    if (path) {
        await loadFileTreeWrapper(path);
        // 加载存储路径后收集 frontmatter 建议
        try {
            await collectFrontmatterSuggestions();
        } catch (e) {
            console.warn("收集 frontmatter 建议失败:", e);
        }
    }
});

function nodeProps({ option }: { option: TreeOption }) {
    return {
        onClick() {
            handleNodeClick(option as unknown as NaiveNode);
        },
    };
}

async function handleNodeClick(node: NaiveNode) {
    console.log("handleNodeClick called", node); // 新增：调试日志
    if (!node.isDir) {
        try {
            const content = await getFileContent(node.key);
            // 同时发出文件内容和文件路径，以便父组件知道保存位置
            emit("fileSelected", { content, path: node.key });
            console.log("content:", content, " path:", node.key);
        } catch (e) {
            console.error(
                i18next.t("fileTree.readFileFailed", { err: String(e) }),
                e,
            );
            error.value = i18next.t("fileTree.readFileFailed", {
                err: String(e),
            }) as string;
        }
    }
}
</script>

<style src="./css/FileTree.css" scoped></style>
