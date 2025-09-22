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

            <n-tree v-else-if="treeData.length" :data="treeData" />

            <div v-else class="empty">尚未选择文件夹或文件夹为空。</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { NButton, NTree, NSpin } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";

/**
 * 后端 TreeNode 类型（与 Rust 后端保持一致）
 */
interface BackendNode {
    name: string;
    path: string;
    is_dir: boolean;
    children?: BackendNode[] | null;
    size?: number | null;
}

/**
 * Naive UI n-tree 需要的节点格式
 */
interface NaiveNode {
    label: string;
    key: string;
    children?: NaiveNode[];
}

const treeData = ref<NaiveNode[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedPath = ref<string | null>(null);

/**
 * 将后端节点映射为 Naive UI 节点
 */
function mapNode(b: BackendNode): NaiveNode {
    let label = b.name;
    if (!b.is_dir && b.size != null) {
        label += ` (${formatSize(b.size)})`;
    }
    const node: NaiveNode = {
        label,
        key: b.path,
    };
    if (b.is_dir && b.children && Array.isArray(b.children)) {
        node.children = b.children.map(mapNode);
    }
    return node;
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

function formatSize(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
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
