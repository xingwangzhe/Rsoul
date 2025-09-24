<template>
    <MdEditor
        id="editor-area"
        v-model="text"
        :showToolbarName="true"
        @onSave="onSave"
        :toolbars="toolbars as any"
        :theme="theme"
        :language="currentLanguage"
    >
        <template #defToolbars>
            <FrontmatterEditor
                :currentFrontmatter="frontmatter"
                @updateFrontmatter="updateFrontmatter"
            />
        </template>
    </MdEditor>
</template>

<script setup lang="ts">
import { MdEditor } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import { useEditor } from "../utils/useEditor";
import FrontmatterEditor from "./FrontmatterEditor.vue";

const props = defineProps({
    content: String,
    path: String, // 接收文件保存路径
});

const {
    currentLanguage,
    theme,
    toolbars,
    text,
    frontmatter,
    updateFrontmatter,
    onSave,
} = useEditor(props);
</script>

<style src="../css/Editor.css"></style>
