<template>
    设置Frontmatter格式
    <n-form
        :model="formData"
        label-placement="left"
        style="margin-bottom: 16px"
    >
        <n-form-item label="键" path="key">
            <n-input v-model:value="formData.key" placeholder="输入键名" />
        </n-form-item>
        <n-form-item label="类型" path="type">
            <n-select
                v-model:value="formData.type"
                :options="typeOptions"
                placeholder="选择类型"
            />
        </n-form-item>
        <n-button @click="addField" type="primary">添加</n-button>
    </n-form>
    <n-data-table :columns="columns" :data="data" />

    <n-modal
        v-model:show="showEditModal"
        preset="card"
        title="编辑字段"
        :width="400"
    >
        <n-form :model="editFormData" label-placement="left">
            <n-form-item label="键" path="key">
                <n-input
                    v-model:value="editFormData.key"
                    placeholder="输入键名"
                />
            </n-form-item>
            <n-form-item label="类型" path="type">
                <n-select
                    v-model:value="editFormData.type"
                    :options="typeOptions"
                    placeholder="选择类型"
                />
            </n-form-item>
        </n-form>
        <template #action>
            <n-button @click="saveEdit">保存</n-button>
            <n-button @click="showEditModal = false">取消</n-button>
        </template>
    </n-modal>
</template>
<script setup lang="ts">
import { ref, h, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import {
    useMessage,
    NForm,
    NFormItem,
    NInput,
    NSelect,
    NButton,
    NModal,
} from "naive-ui";

interface RowData {
    key: number;
    title: string;
    type: string;
}

interface FrontmatterField {
    key: number;
    title: string;
    field_type: string;
}

const message = useMessage();

const formData = ref({
    key: "",
    type: "",
});

const showEditModal = ref(false);
const editingIndex = ref(-1);
const editFormData = ref({
    key: "",
    type: "",
});

const typeOptions = [
    { label: "string", value: "string" },
    { label: "number", value: "number" },
    { label: "string[]", value: "string[]" },
    { label: "date", value: "date" },
    { label: "time", value: "time" },
    { label: "dateandtime", value: "dateandtime" },
];

const data = ref<RowData[]>([]);

const columns = [
    {
        title: "Key",
        key: "title",
    },
    {
        title: "Type",
        key: "type",
    },
    {
        title: "操作",
        key: "actions",
        render(row: RowData) {
            return [
                h(
                    NButton,
                    {
                        size: "small",
                        type: "primary",
                        onClick: () => editField(row.key),
                    },
                    { default: () => "编辑" },
                ),
                h(
                    NButton,
                    {
                        size: "small",
                        type: "error",
                        onClick: () => deleteField(row.key),
                        style: "margin-left: 8px",
                    },
                    { default: () => "删除" },
                ),
            ];
        },
    },
];

const saveData = async () => {
    try {
        const fields: FrontmatterField[] = data.value.map((item) => ({
            key: item.key,
            title: item.title,
            field_type: item.type,
        }));
        await invoke("save_frontmatter", { fields });
    } catch (e) {
        message.error(`保存失败: ${e}`, { closable: true });
    }
};

const loadData = async () => {
    try {
        const fields: FrontmatterField[] = await invoke("load_frontmatter");
        data.value = fields.map((item) => ({
            key: item.key,
            title: item.title,
            type: item.field_type,
        }));
    } catch (e) {
        message.error(`加载失败: ${e}`, { closable: true });
    }
};

onMounted(() => {
    loadData();
});

const addField = async () => {
    if (!formData.value.key || !formData.value.type) {
        message.warning("请填写键和类型", { closable: true });
        return;
    }
    const newKey = data.value.length;
    data.value.push({
        key: newKey,
        title: formData.value.key,
        type: formData.value.type,
    });
    formData.value.key = "";
    formData.value.type = "";
    message.success("字段添加成功", { closable: true });
    await saveData();
};

const editField = (index: number) => {
    const row = data.value.find((item) => item.key === index);
    if (row) {
        editingIndex.value = index;
        editFormData.value = { key: row.title, type: row.type };
        showEditModal.value = true;
    }
};

const saveEdit = async () => {
    if (!editFormData.value.key || !editFormData.value.type) {
        message.warning("请填写键和类型", { closable: true });
        return;
    }
    const index = data.value.findIndex(
        (item) => item.key === editingIndex.value,
    );
    if (index !== -1) {
        data.value[index].title = editFormData.value.key;
        data.value[index].type = editFormData.value.type;
        message.success("字段编辑成功", { closable: true });
        await saveData();
    }
    showEditModal.value = false;
};

const deleteField = async (index: number) => {
    const idx = data.value.findIndex((item) => item.key === index);
    if (idx !== -1) {
        data.value.splice(idx, 1);
        message.success("字段删除成功", { closable: true });
        await saveData();
    }
};
</script>
