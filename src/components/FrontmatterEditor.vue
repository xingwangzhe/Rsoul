<template>
    <NormalToolbar title="FrontMatter" @onClick="openModal">
        <BookMarked class="md-editor-icon" />
        FrontMatter
    </NormalToolbar>

    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
        <n-card class="modal-card" @click.stop>
            <template #header>
                <div>编辑 Frontmatter</div>
            </template>

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
                    <n-input
                        v-if="field.field_type === 'string'"
                        v-model:value="formData[field.title]"
                    />
                    <n-input-number
                        v-else-if="field.field_type === 'number'"
                        v-model:value="formData[field.title]"
                    />
                    <n-dynamic-tags
                        v-else-if="field.field_type === 'string[]'"
                        v-model:value="formData[field.title]"
                        placeholder="请添加标签"
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

            <template #footer>
                <n-button @click="saveFrontmatter" type="primary"
                    >保存</n-button
                >
                <n-button @click="showModal = false">取消</n-button>
            </template>
        </n-card>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { NormalToolbar } from "md-editor-v3";
import {
    NCard,
    NForm,
    NFormItem,
    NInput,
    NInputNumber,
    NDatePicker,
    NTimePicker,
    NDynamicTags,
    NButton,
    NSpin,
} from "naive-ui";
import { BookMarked } from "lucide-vue-next";

// 接收父组件传入的已解析 frontmatter 对象
const props = defineProps<{
    currentFrontmatter?: Record<string, any>;
}>();

// 向父组件回传编辑后的 frontmatter
const emit = defineEmits<{
    (e: "updateFrontmatter", payload: Record<string, any>): void;
}>();

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

/**
 * 打开弹窗时：
 * 1. 拉取后端持久化的 frontmatter schema
 * 2. 用当前 markdown 已解析的 frontmatter 初始化表单
 */
async function openModal() {
    showModal.value = true;
    if (schema.value.length === 0) {
        loading.value = true;
        try {
            const loaded = (await invoke("load_frontmatter")) as Array<{
                key: number;
                title: string;
                field_type?: string;
                type?: string;
            }>;
            schema.value = loaded.map((f) => ({
                key: f.key,
                title: f.title,
                field_type: f.field_type ?? f.type ?? "string",
            }));
        } catch (e) {
            console.error("加载字段 schema 失败:", e);
        } finally {
            loading.value = false;
        }
    }
    // 初始化 formData
    const src = props.currentFrontmatter || {};
    formData.value = {};
    schema.value.forEach((f) => {
        formData.value[f.title] =
            src[f.title] != null ? src[f.title] : defaultForType(f.field_type);
    });
}

/**
 * 根据字段类型提供默认值
 */
function defaultForType(type: string): any {
    switch (type) {
        case "number":
            return 0;
        case "string[]":
            return [];
        case "date":
        case "time":
        case "dateandtime":
            return "";
        default:
            return "";
    }
}

/**
 * 保存时：
 * 1. 将字符串值、数组和数字等转换到正确类型
 * 2. 发出 updateFrontmatter 事件
 */
function saveFrontmatter() {
    const output: Record<string, any> = {};
    schema.value.forEach((f) => {
        const raw = formData.value[f.title];
        switch (f.field_type) {
            case "number":
                output[f.title] = Number(raw);
                break;
            case "string[]":
                if (Array.isArray(raw)) {
                    output[f.title] = raw as any[];
                } else {
                    const str = raw != null ? String(raw) : "";
                    output[f.title] = str
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s);
                }
                break;
            default:
                output[f.title] = raw;
        }
    });
    emit("updateFrontmatter", output);
    showModal.value = false;
}
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
    width: 480px;
    max-width: 90vw;
    padding: 16px;
    border-radius: 8px;
}
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
