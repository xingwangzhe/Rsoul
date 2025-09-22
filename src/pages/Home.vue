<template>
    <div id="main-container">
        <div id="left-dir">
            <div><n-button @click="getFileTree">添加文件夹📂</n-button></div>
        </div>
        <div id="right-editor"></div>
    </div>
</template>

<script setup>
import { invoke } from "@tauri-apps/api/core";
function getFileTree() {
    invoke("get_file_tree");
}
</script>

<style scoped>
#main-container {
    display: flex;

    & #left-dir {
        width: 100vh;
        height: 100vh;
        border: solid crimson;
        flex: 1;
    }

    & #right-editor {
        width: 100vh;
        height: 100vh;
        border: solid crimson;
        flex: 8;
    }
}
</style>
