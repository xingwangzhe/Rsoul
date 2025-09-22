<template>
    <MdEditor
        id="editor-area"
        v-model="text"
        :showToolbarName="true"
        @onSave="onSave"
    />
</template>

<script setup>
import { ref, watch } from "vue";
import { MdEditor } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import { useMessage } from "naive-ui";
const props = defineProps({
    content: String, // 新增：接收内容 prop
});
const text = ref("Hello Editor!");
watch(
    () => props.content,
    (newContent) => {
        if (newContent !== undefined) {
            text.value = newContent;
            // console.log(newContent);
        }
    },
);
// 获取 message 实例（需要页面包裹 <n-message-provider />）
const message = useMessage();

// 通过 emit 将保存的 markdown 与 html 传递出去，便于父组件或其他逻辑处理
const emit = defineEmits(["saveMd"]);

/**
 * onSave 回调：
 * - v: 原始 markdown 内容（或其他）
 * - h: Promise，解析后会返回 HTML（根据 md-editor-v3 文档）
 *
 * 我们在 h resolve 后再显示消息，并且 emit 出保存的内容（markdown + html）。
 */
const onSave = (v, h) => {
    // console.log("onSave:", v);
    try {
        if (h && typeof h.then === "function") {
            // h 是 Promise，等 html 生成完成后再通知和提示
            h.then((html) => {
                // 发出事件，携带 markdown 和生成的 html
                // emit("saveMd", { markdown: v, html });
                // 显示成功消息
                message.success("保存成功", { closable: true });
            }).catch((err) => {
                console.error("onSave html generation error:", err);
                message.error("保存失败", { closable: true });
            });
        } else {
            // 如果没有 html Promise，直接 emit markdown
            emit("saveMd", { markdown: v, html: null });
            message.success("保存成功", { closable: true });
        }
    } catch (err) {
        console.error("onSave handler error:", err);
        message.error("保存失败", { closable: true });
    }
};
</script>
<style scope>
#editor-area {
    height: 100vh;
}
</style>
