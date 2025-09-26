<template>
    <div class="file-tree-container">
        <div class="controls">
            <n-button @click="getFileTree" :loading="loading">
                {{ $t("fileTree.addFolder") }}
            </n-button>
        </div>

        <div v-if="error" class="error">
            {{ $t("fileTree.error", { err: error }) }}
        </div>

        <div class="tree-area">
            <div v-if="loading" class="loading">
                <n-spin /> {{ $t("fileTree.loading") }}
            </div>

            <n-tree
                v-else-if="treeData.length"
                block-line
                expand-on-click
                virtual-scroll
                :data="treeData"
                :node-props="nodeProps"
                :on-update:expanded-keys="updatePrefixWithExpanded"
                style="height: 100vh"
            />

            <div v-else class="empty">{{ $t("fileTree.empty") }}</div>
        </div>

        <!-- 上下文菜单 -->
        <n-dropdown
            placement="bottom-start"
            trigger="manual"
            :x="contextMenuX"
            :y="contextMenuY"
            :options="contextMenuOptions"
            :show="showContextMenu"
            :on-clickoutside="closeContextMenu"
            @select="handleContextMenuSelect"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from "vue";
import { NButton, NTree, NSpin, NDropdown, NIcon, useMessage } from "naive-ui";
import type { TreeOption } from "naive-ui";
import {
    AddOutline,
    TrashOutline,
    CreateOutline,
    DocumentOutline,
    FolderOutline,
} from "@vicons/ionicons5";
import { updatePrefixWithExpanded, NaiveNode } from "../utils/fileTreeUtils";
import { useFileTree } from "../utils/useFileTree";
import { invoke } from "@tauri-apps/api/core";
import { useI18n } from "vue-i18n";

const emit = defineEmits(["fileSelected"]);
const { t } = useI18n();

const { treeData, loading, error, getFileTree, handleNodeClick } =
    useFileTree(emit);
const message = useMessage();

// 上下文菜单状态
const showContextMenu = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuNode = ref<NaiveNode | null>(null);

// 统一：把路径分隔符规范成 '/'
function normalizePath(p: string) {
    return p.replace(/\\\\/g, "/").replace(/\\/g, "/");
}

// 上下文菜单选项
const contextMenuOptions = computed(() => {
    if (!contextMenuNode.value) return [];

    const isDir = contextMenuNode.value.isDir;
    const options: any[] = [];

    if (isDir) {
        // 文件夹菜单选项
        options.push(
            {
                label: t("contextMenu.newFile"),
                key: "newFile",
                icon: () =>
                    h(NIcon, null, { default: () => h(DocumentOutline) }),
            },
            {
                label: t("contextMenu.newFolder"),
                key: "newFolder",
                icon: () => h(NIcon, null, { default: () => h(AddOutline) }),
            },
            {
                type: "divider",
            },
            {
                label: t("contextMenu.setAsWorkingDirectory"),
                key: "setAsWorkingDirectory",
                icon: () => h(NIcon, null, { default: () => h(FolderOutline) }),
            },
            {
                type: "divider",
            },
            {
                label: t("contextMenu.rename"),
                key: "rename",
                icon: () => h(NIcon, null, { default: () => h(CreateOutline) }),
            },
            {
                label: t("contextMenu.delete"),
                key: "delete",
                icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
            },
        );
    } else {
        // 文件菜单选项
        options.push(
            {
                label: t("contextMenu.rename"),
                key: "rename",
                icon: () => h(NIcon, null, { default: () => h(CreateOutline) }),
            },
            {
                label: t("contextMenu.delete"),
                key: "delete",
                icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
            },
        );
    }

    return options;
});

// 关闭上下文菜单
const closeContextMenu = () => {
    showContextMenu.value = false;
    contextMenuNode.value = null;
};

// 处理上下文菜单选择
const handleContextMenuSelect = async (key: string) => {
    if (!contextMenuNode.value) return;

    try {
        switch (key) {
            case "newFile":
                await createNewFile();
                break;
            case "newFolder":
                await createNewFolder();
                break;
            case "setAsWorkingDirectory":
                await setAsWorkingDirectory();
                break;
            case "rename":
                await renameItem();
                break;
            case "delete":
                await deleteItem();
                break;
        }
    } catch (error) {
        message.error(t("errors.unknown"));
        console.error("Context menu action failed:", error);
    }

    closeContextMenu();
};

// 创建新文件
const createNewFile = async () => {
    if (!contextMenuNode.value) return;

    const fileName = prompt(t("contextMenu.enterFileName"));
    if (!fileName) return;

    const key = normalizePath(contextMenuNode.value.key);
    const filePath = contextMenuNode.value.isDir
        ? `${key}/${fileName}`
        : `${key.substring(0, key.lastIndexOf("/"))}/${fileName}`;

    console.log("Creating file at path:", filePath);
    try {
        await invoke("create_file", { request: { path: filePath } });
        message.success(t("contextMenu.fileCreated"));
        await getFileTree(); // 刷新文件树
    } catch (error) {
        console.error("File creation failed:", error);
        message.error(t("contextMenu.createFailed") + ": " + String(error));
    }
};

// 创建新文件夹
const createNewFolder = async () => {
    if (!contextMenuNode.value) return;

    const folderName = prompt(t("contextMenu.enterFolderName"));
    if (!folderName) return;

    const key = normalizePath(contextMenuNode.value.key);
    const folderPath = contextMenuNode.value.isDir
        ? `${key}/${folderName}`
        : `${key.substring(0, key.lastIndexOf("/"))}/${folderName}`;

    console.log("Creating folder at path:", folderPath);
    try {
        await invoke("create_folder", { request: { path: folderPath } });
        message.success(t("contextMenu.folderCreated"));
        await getFileTree(); // 刷新文件树
    } catch (error) {
        console.error("Folder creation failed:", error);
        message.error(t("contextMenu.createFailed") + ": " + String(error));
    }
};

// 重命名项目
const renameItem = async () => {
    if (!contextMenuNode.value) return;

    const newName = prompt(
        t("contextMenu.enterNewName"),
        contextMenuNode.value.label,
    );
    if (!newName) return;

    try {
        await invoke("rename_item", {
            request: {
                old_path: contextMenuNode.value.key,
                new_name: newName,
            },
        });
        message.success(t("contextMenu.renameSuccess"));
        await getFileTree(); // 刷新文件树
    } catch (error) {
        console.error("Rename failed:", error);
        message.error(t("contextMenu.renameFailed") + ": " + String(error));
    }
};

// 设为工作目录
const setAsWorkingDirectory = async () => {
    if (!contextMenuNode.value || !contextMenuNode.value.isDir) return;

    try {
        await invoke("set_working_directory", {
            request: { path: contextMenuNode.value.key },
        });
        message.success(t("contextMenu.setWorkingDirectorySuccess"));
        // 刷新文件树显示新的工作目录
        await getFileTree();
    } catch (error) {
        console.error("Set working directory failed:", error);
        message.error(
            t("contextMenu.setWorkingDirectoryFailed") + ": " + String(error),
        );
    }
};

// 删除项目
const deleteItem = async () => {
    if (!contextMenuNode.value) return;

    const confirmMessage = contextMenuNode.value.isDir
        ? t("contextMenu.confirmDeleteFolder")
        : t("contextMenu.confirmDeleteFile");

    if (!confirm(confirmMessage)) return;

    try {
        await invoke("delete_item", {
            request: { path: contextMenuNode.value.key },
        });
        message.success(t("contextMenu.deleteSuccess"));
        await getFileTree(); // 刷新文件树
    } catch (error) {
        console.error("Delete failed:", error);
        message.error(t("contextMenu.deleteFailed") + ": " + String(error));
    }
};

// nodeProps: attach per-node handlers so right-click always has correct node
function nodeProps({ option }: { option: TreeOption }) {
    // The original option object is the same object we created in treeData (NaiveNode)
    const node = option as unknown as NaiveNode;

    return {
        onClick() {
            // delegate to existing click handler
            handleNodeClick(node);
        },
        onContextmenu(evt: MouseEvent) {
            // prevent the browser default context menu and stop propagation
            evt.preventDefault();
            evt.stopPropagation();

            // set menu position and node
            contextMenuX.value = evt.clientX;
            contextMenuY.value = evt.clientY;
            contextMenuNode.value = node;
            showContextMenu.value = true;
        },
        // expose title attribute so the DOM contains full path on hover (useful for long paths)
        title: node.key,
    };
}
</script>

<style src="../css/FileTree.css"></style>
