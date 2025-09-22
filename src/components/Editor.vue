<template>
    <MdEditor
        id="editor-area"
        v-model="text"
        :showToolbarName="true"
        @onSave="onSave"
    />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { MdEditor } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import { useMessage } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import i18next from "i18next";
import fm from "front-matter";
const props = defineProps({
    content: String,
    path: String, // 接收文件保存路径
});

const text = ref("Hello Editor!");

watch(
    () => props.content,
    (newContent) => {
        if (newContent !== undefined) {
            text.value = fm(newContent).body;
        }
    },
);

// 获取 message 实例（需要页面包裹 <n-message-provider />）
const message = useMessage();

/**
 * saveMarkdown:
 * - Uses the provided `props.path` as the destination file path.
 * - Calls the Tauri backend `save_markdown` command with parameters matching the Rust function signature.
 * - Throws on error so callers can show error messages.
 */
async function saveMarkdown(content: string) {
    if (!props.path) {
        throw new Error(i18next.t("editor.noPath") as string);
    }
    try {
        // Invoke with keys that match the Rust command signature: file_path and content
        await invoke("save_markdown", { filePath: props.path, content });
    } catch (e) {
        throw e;
    }
}

/**
 * onSave 回调：
 * - v: 原始 markdown 内容
 * - h: Promise，解析后会返回 HTML（根据 md-editor-v3 文档）
 *
 * 流程：
 * 1. （可选）等待 h（HTML 生成），但不依赖于它来决定是否保存 markdown
 * 2. 调用后端保存 markdown（save_markdown）
 * 3. 根据结果显示 success / error 提示
 */
const onSave = async (v: any, h: any) => {
    console.debug("onSave triggered, md length:", v ? v.length : 0);

    if (!props.path) {
        message.error(i18next.t("editor.noPath") as string, { duration: 3.5 });
        return;
    }

    try {
        // Optionally try to resolve HTML generation to log or detect issues (non-fatal)
        if (h && typeof h.then === "function") {
            try {
                const html = await h;
                console.debug("generated html length:", html ? html.length : 0);
            } catch (htmlErr) {
                console.warn(
                    "HTML generation failed (will still attempt to save markdown):",
                    htmlErr,
                );
            }
        }

        // Save markdown content to backend
        await saveMarkdown(v);

        // Notify user of success
        message.success(i18next.t("editor.saveSuccess") as string, {
            duration: 3.5,
        });
    } catch (err) {
        console.error("save_markdown invoke error:", err);
        message.error(
            i18next.t("editor.saveFailed", { err: String(err) }) as string,
            { duration: 3.5 },
        );
    }
};
</script>
<style scope>
#editor-area {
    height: 100vh;
}
</style>
