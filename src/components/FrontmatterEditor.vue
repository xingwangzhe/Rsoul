<template>
    <NormalToolbar title="mark" @onClick="showModal = true">
        <BookMarked class="md-editor-icon" />
        FrontMatter
    </NormalToolbar>

    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
        <n-card class="modal-card" @click.stop>
            <template #header>
                <div>编辑 Frontmatter</div>
            </template>
            <n-form :model="frontmatterData" label-placement="left">
                <n-form-item label="标题" path="title">
                    <n-input v-model:value="frontmatterData.title" />
                </n-form-item>
                <n-form-item label="标签" path="tags">
                    <n-input v-model:value="frontmatterData.tags" />
                </n-form-item>
                <!-- 可以添加更多字段，如日期等 -->
            </n-form>
            <template #action>
                <n-button @click="saveFrontmatter">保存</n-button>
                <n-button @click="showModal = false">取消</n-button>
            </template>
        </n-card>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { NormalToolbar } from "md-editor-v3";
import { NCard, NForm, NFormItem, NInput, NButton } from "naive-ui";
import { BookMarked } from "lucide-vue-next";

const showModal = ref(false);
const frontmatterData = ref({
    title: "",
    tags: "",
});

const saveFrontmatter = () => {
    // 这里可以添加保存逻辑，比如 emit 事件或调用 API
    console.log("保存 frontmatter:", frontmatterData.value);
    showModal.value = false;
};
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-card {
    width: 500px;
    max-width: 90vw;
    border-radius: 8px;
}

.n-form {
    padding: 16px 0;
}

.n-button {
    margin: 0 8px;
}
</style>
