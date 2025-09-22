<template>
    <div class="file-tree-container">
        <div class="controls">
            <n-button @click="getFileTree" :loading="loading">
                添加文件夹📂
            </n-button>
            <div v-if="selectedPath" class="selected">
                已选择: <strong>{{ selectedPath }}</strong>
            </div>
            <div v-if="error" class="error">错误：{{ error }}</div>
        </div>

        <div class="tree-area">
            <div v-if="loading" class="loading">
                <n-spin /> 正在加载文件树...
            </div>

            <n-tree
                block-line
                expand-on-click
                virtual-scroll
                v-else-if="treeData.length"
                :data="treeData"
                :node-props="nodeProps"
                :on-update:expanded-keys="updatePrefixWithExpaned"
                style="height: 100vh"
            />

            <div v-else class="empty">尚未选择文件夹或文件夹为空。</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { NButton, NTree, NSpin, NIcon } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import type { TreeOption } from "naive-ui";
import {
    FileTrayFullOutline,
    Folder,
    FolderOpenOutline,
} from "@vicons/ionicons5";

import {
    mapNode,
    formatSize,
    updatePrefixWithExpaned,
    BackendNode,
    NaiveNode,
} from "../utils/fileTreeUtils";

const emit = defineEmits(["fileSelected"]);

const treeData = ref<NaiveNode[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedPath = ref<string | null>(null);

/**
 * 从指定路径加载文件树（调用 Rust: get_file_tree_from_path）
 */
async function loadFileTree(path: string) {
    loading.value = true;
    error.value = null;
    treeData.value = [];
    selectedPath.value = path;

    try {
        const res = await invoke<BackendNode>("get_file_tree_from_path", {
            path,
        });

        if (!res) {
            error.value = "后端返回空结果";
            return;
        }

        treeData.value = [mapNode(res as BackendNode)];
    } catch (e) {
        console.error("invoke error", e);
        if (e instanceof Error) {
            error.value = e.message;
        } else {
            error.value = String(e);
        }
    } finally {
        loading.value = false;
    }
}

/**
 * 从后端拉取文件树（调用 Rust: get_file_tree）
 */
async function getFileTree() {
    loading.value = true;
    error.value = null;
    treeData.value = [];
    selectedPath.value = null;

    try {
        // 调用后端命令；返回值是后端序列化的 TreeNode（根节点）
        const res = await invoke<BackendNode>("get_file_tree");

        if (!res) {
            error.value = "后端返回空结果";
            return;
        }

        // 记录所选路径并映射为 n-tree 数据
        selectedPath.value = (res as any).path || null;
        treeData.value = [mapNode(res as BackendNode)];
    } catch (e) {
        console.error("invoke error", e);
        // 可能的错误来自后端返回的 Err(String) 或 IPC 问题
        if (e instanceof Error) {
            error.value = e.message;
        } else {
            error.value = String(e);
        }
    } finally {
        loading.value = false;
    }
}

// 在组件挂载时自动加载存储的路径
onMounted(async () => {
    try {
        const path = await invoke<Option<string>>("get_stored_path");
        if (path) {
            await loadFileTree(path);
        }
    } catch (e) {
        console.error("Failed to load stored path:", e);
    }
});

function nodeProps({ option }: { option: TreeOption }) {
    return {
        onClick() {
            handleNodeClick(option as NaiveNode);
        },
    };
}

async function handleNodeClick(node: NaiveNode) {
    console.log("handleNodeClick called", node); // 新增：调试日志
    if (!node.isDir) {
        try {
            const content = await invoke<string>("get_file_content", {
                filePath: node.key,
            });
            emit("fileSelected", content);
            // console.log("内容为：" + content);
        } catch (e) {
            console.error("读取文件失败:", e);
            error.value = "读取文件失败: " + String(e);
        }
    }
}
</script>

<style scoped>
.file-tree-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.controls {
    padding: 8px;
    border-bottom: 1px solid #ddd;
    flex-shrink: 0;
}

.selected {
    margin-top: 4px;
    font-size: 14px;
    color: #333;
}

.error {
    margin-top: 4px;
    font-size: 14px;
    color: #f44336;
}

.tree-area {
    flex: 1;
    overflow: auto;
    padding: 8px;
}

.loading {
    display: flex;
    gap: 8px;
    align-items: center;
    color: #666;
}

.empty {
    color: #666;
}

.n-tree {
    max-height: 100%;
}
</style>
