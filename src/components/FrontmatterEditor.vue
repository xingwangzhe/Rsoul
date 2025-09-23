<template>
    <NormalToolbar
        v-if="hasFrontmatter"
        title="FrontMatter"
        @onClick="openModal"
    >
        <BookMarked class="md-editor-icon" />
        FrontMatter
    </NormalToolbar>

    <n-modal
        v-model:show="showModal"
        preset="card"
        title="编辑 Frontmatter"
        :width="500"
    >
        <n-spin
            v-if="loading"
            size="large"
            style="display: flex; justify-content: center; padding: 24px"
        />

        <n-form v-else :model="formData" label-placement="left">
            <n-form-item
                v-for="field in schema"
                :key="field.key"
                :label="field.title"
                :path="field.title"
            >
                <n-select
                    v-if="field.field_type === 'string'"
                    v-model:value="formData[field.title]"
                    :options="getFieldOptions(field.title, suggestions)"
                    placeholder="选择或输入值"
                    filterable
                    clearable
                    allow-create
                />
                <n-select
                    v-else-if="field.field_type === 'string[]'"
                    v-model:value="formData[field.title]"
                    :options="getFieldOptions(field.title, suggestions)"
                    placeholder="选择或输入标签"
                    filterable
                    multiple
                    clearable
                    allow-create
                    tag
                />
                <n-date-picker
                    v-else-if="field.field_type === 'date'"
                    v-model:value="formData[field.title]"
                    type="date"
                />
                <n-time-picker
                    v-else-if="field.field_type === 'time'"
                    v-model:value="formData[field.title]"
                />
                <n-date-picker
                    v-else-if="field.field_type === 'dateandtime'"
                    v-model:value="formData[field.title]"
                    type="datetime"
                />
            </n-form-item>
        </n-form>

        <template #action>
            <n-button @click="saveFrontmatter" type="primary">保存</n-button>
            <n-button @click="showModal = false">取消</n-button>
        </template>
    </n-modal>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { NormalToolbar } from "md-editor-v3";
import {
    NModal,
    NForm,
    NFormItem,
    NDatePicker,
    NTimePicker,
    NSelect,
    NButton,
    NSpin,
} from "naive-ui";
import { BookMarked } from "lucide-vue-next";
import {
    loadFrontmatterSchema,
    loadFrontmatterSuggestions,
    collectFrontmatterSuggestions,
    initializeFormData,
    saveFormDataToFrontmatter,
    getFieldOptions,
} from "../utils/frontmatterUtils";

// 接收父组件传入的已解析 frontmatter 对象
const props = defineProps<{
    currentFrontmatter?: Record<string, any>;
}>();

// 向父组件回传编辑后的 frontmatter
const emit = defineEmits<{
    (e: "updateFrontmatter", payload: Record<string, any>): void;
}>();

// Only allow opening when frontmatter data is available (i.e., a markdown file is selected)
const hasFrontmatter = computed(
    () =>
        !!props.currentFrontmatter &&
        Object.keys(props.currentFrontmatter).length > 0,
);

// 模态框可见状态
const showModal = ref(false);
// 加载 schema 指示
const loading = ref(false);
// 后端定义的前端键/类型 schema
const schema = ref<Array<{ key: number; title: string; field_type: string }>>(
    [],
);
// 表单数据
const formData = ref<Record<string, any>>({});
// Frontmatter suggestions from backend
const suggestions = ref<
    Record<string, Array<{ value: string; count: number }>>
>({});

/**
 * 打开弹窗时：
 * 1. 拉取后端持久化的 frontmatter schema 和 suggestions
 * 2. 用当前 markdown 已解析的 frontmatter 初始化表单
 * 3. 确保即使出错也能正常退出
 */
async function openModal() {
    showModal.value = true;
    loading.value = true;
    try {
        // Load schema
        if (schema.value.length === 0) {
            schema.value = await loadFrontmatterSchema();
        }
        // Load or collect suggestions
        let loadedSuggestions = await loadFrontmatterSuggestions();
        if (Object.keys(loadedSuggestions).length === 0) {
            // No suggestions, collect them
            await collectFrontmatterSuggestions();
            loadedSuggestions = await loadFrontmatterSuggestions();
        }
        suggestions.value = loadedSuggestions;
    } catch (e) {
        console.error("加载 schema 或 suggestions 失败:", e);
        // 即使加载失败，也继续初始化表单，确保面板能打开
    }

    // 初始化 formData
    formData.value = initializeFormData(schema.value, props.currentFrontmatter);

    loading.value = false;
}

/**
 * 保存时：
 * 1. 将字符串值、数组和数字等转换到正确类型
 * 2. 发出 updateFrontmatter 事件
 */
function saveFrontmatter() {
    // 如果 schema 为空，直接保存空对象，确保面板能正常关闭
    if (schema.value.length === 0) {
        emit("updateFrontmatter", {});
        showModal.value = false;
        return;
    }

    const output = saveFormDataToFrontmatter(schema.value, formData.value);
    emit("updateFrontmatter", output);
    showModal.value = false;
}
</script>

<style scoped>
.n-form {
    margin-top: 12px;
}
.n-form-item {
    margin-bottom: 12px;
}
.n-button {
    margin-right: 8px;
}
</style>
