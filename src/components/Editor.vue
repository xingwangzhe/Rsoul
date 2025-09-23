<template>
    <MdEditor
        id="editor-area"
        v-model="text"
        :showToolbarName="true"
        @onSave="onSave"
        :toolbars="toolbars as any"
        :theme="theme"
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
import { ref, watch, onMounted } from "vue";
import { MdEditor } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import { useMessage } from "naive-ui";
import { useI18n } from "vue-i18n";
import fm from "front-matter";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

import { handleSave } from "../utils/editorUtils";
import FrontmatterEditor from "./FrontmatterEditor.vue";

const { t } = useI18n();

const theme = ref<"light" | "dark">("light");

// 初始化主题
async function loadTheme() {
    try {
        const isDark = await invoke<boolean>("get_theme");
        theme.value = isDark ? "dark" : "light";
    } catch (err) {
        console.error("Failed to load theme:", err);
        theme.value = "light";
    }
}

// 监听主题变化事件
listen<boolean>("theme_changed", (event) => {
    theme.value = event.payload ? "dark" : "light";
});

onMounted(() => {
    loadTheme();
});

const toolbars = [
    0, // 自定义 FrontmatterEditor 工具栏
    "bold",
    "underline",
    "italic",
    "-",
    "title",
    "strikeThrough",
    "sub",
    "sup",
    "quote",
    "unorderedList",
    "orderedList",
    "task",
    "-",
    "codeRow",
    "code",
    "link",
    "image",
    "table",
    "mermaid",
    "katex",
    "-",
    "revoke",
    "next",
    "save",
    "=",
    "pageFullscreen",
    "fullscreen",
    "preview",
    "previewOnly",
    // "htmlPreview",
    "catalog",
];
const props = defineProps({
    content: String,
    path: String, // 接收文件保存路径
});

const text = ref("Hello Editor!");
const frontmatter = ref<Record<string, any>>({});

const updateFrontmatter = (newFrontmatter: Record<string, any>) => {
    frontmatter.value = newFrontmatter;
};

watch(
    () => props.content,
    (newContent) => {
        if (newContent !== undefined) {
            const parsed = fm(newContent);
            text.value = parsed.body;
            frontmatter.value = parsed.attributes as Record<string, any>;
        }
    },
);

// 获取 message 实例（需要页面包裹 <n-message-provider />）
const message = useMessage();

/**
 * onSave 回调：
 * - v: 原始 markdown 内容
 * - h: Promise，解析后会返回 HTML（根据 md-editor-v3 文档）
 *
 * 流程：
 * 1. （可选）等待 h（HTML 生成），但不依赖于它来决定是否保存 markdown
 * 2. 调用后端保存 markdown（handleSave）
 * 3. 根据结果显示 success / error 提示
 */
const onSave = async (v: any, h: any) => {
    console.debug("onSave triggered, md length:", v ? v.length : 0);

    if (!props.path) {
        message.error(t("editor.noPath"), { closable: true });
        return;
    }

    try {
        // 可选：尝试解析 HTML 生成以记录或检测问题（非致命）
        if (h && typeof h.then === "function") {
            try {
                const html = await h;
                console.debug("generated html length:", html ? html.length : 0);
            } catch (htmlErr) {
                console.warn(
                    "HTML 生成失败（仍将尝试保存 markdown）：",
                    htmlErr,
                );
            }
        }

        // 使用提取的 handleSave 函数
        await handleSave(v, frontmatter.value, props.path);

        // 通知用户成功
        message.success(t("editor.saveSuccess"), {
            closable: true,
        });
    } catch (err) {
        console.error("save_markdown invoke error:", err);
        message.error(t("editor.saveFailed", { err: String(err) }), {
            closable: true,
        });
    }
};
</script>
<style src="../css/Editor.css"></style>
