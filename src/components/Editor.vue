<template>
    <MdEditor id="editor-area" v-model="text" :showToolbarName="true" />
</template>

<script setup>
import { ref, watch } from "vue";
import { MdEditor } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
const props = defineProps({
    content: String, // 新增：接收内容 prop
});
const text = ref("Hello Editor!");
watch(
    () => props.content,
    (newContent) => {
        if (newContent !== undefined) {
            text.value = newContent;
            console.log(newContent);
        }
    },
);
</script>
<style scope>
#editor-area {
    height: 100vh;
}
</style>
