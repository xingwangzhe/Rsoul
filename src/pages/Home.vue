<template>
    <div id="main-container">
        <div id="left-dir">
            <FileTree />
        </div>
        <Editor />
    </div>
</template>

<script setup>
import FileTree from "../components/FileTree.vue";
import Editor from "../components/Editor.vue";
</script>

<style scoped>
#main-container {
    display: flex;

    & #left-dir {
        width: 300px;
        height: 100vh;
        border: solid crimson;
        flex: none;
        display: flex;
        flex-direction: column;
    }

    & #right-editor {
        width: 100vh;
        height: 100vh;
        border: solid crimson;
        flex: 8;
    }
}
</style>
