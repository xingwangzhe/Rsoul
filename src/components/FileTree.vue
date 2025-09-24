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
import { NButton, NTree, NSpin } from "naive-ui";
import type { TreeOption } from "naive-ui";
import { updatePrefixWithExpanded, NaiveNode } from "../utils/fileTreeUtils";
import { useFileTree } from "../utils/useFileTree";

const emit = defineEmits(["fileSelected"]);

const { treeData, loading, error, getFileTree, handleNodeClick } =
    useFileTree(emit);

function nodeProps({ option }: { option: TreeOption }) {
    return {
        onClick() {
            handleNodeClick(option as unknown as NaiveNode);
        },
    };
}
</script>

<style src="../css/FileTree.css"></style>
