<template>
    {{ titleText }}
    <n-form
        :model="formData"
        label-placement="left"
        style="margin-bottom: 16px"
    >
        <n-form-item :label="keyLabel" path="key">
            <n-input
                v-model:value="formData.key"
                :placeholder="keyPlaceholder"
            />
        </n-form-item>
        <n-form-item :label="typeLabel" path="type">
            <n-select
                v-model:value="formData.type"
                :options="typeOptions"
                :placeholder="typePlaceholder"
            />
        </n-form-item>
        <n-button @click="addField" type="primary">{{
            addButtonText
        }}</n-button>
    </n-form>
    <n-data-table :columns="columns" :data="data" />

    <n-modal
        v-model:show="showEditModal"
        preset="card"
        :title="editModalTitle"
        :width="400"
    >
        <n-form :model="editFormData" label-placement="left">
            <n-form-item :label="keyLabel" path="key">
                <n-input
                    v-model:value="editFormData.key"
                    :placeholder="keyPlaceholder"
                />
            </n-form-item>
            <n-form-item :label="typeLabel" path="type">
                <n-select
                    v-model:value="editFormData.type"
                    :options="typeOptions"
                    :placeholder="typePlaceholder"
                />
            </n-form-item>
        </n-form>
        <template #action>
            <n-button @click="saveEdit">{{ saveButtonText }}</n-button>
            <n-button @click="showEditModal = false">{{
                cancelButtonText
            }}</n-button>
        </template>
    </n-modal>
</template>
<script setup lang="ts">
import { ref, h, onMounted, computed } from "vue";
import {
    useMessage,
    NForm,
    NFormItem,
    NInput,
    NSelect,
    NButton,
    NModal,
} from "naive-ui";
import { useI18n } from "vue-i18n";
import {
    loadFrontmatterSchema,
    saveFrontmatterFields,
    collectFrontmatterSuggestions,
} from "../utils/frontmatterUtils";

const { t } = useI18n();

// Computed properties for translations
const titleText = computed(() => t("frontmatter.title"));
const keyLabel = computed(() => t("frontmatter.keyLabel"));
const keyPlaceholder = computed(() => t("frontmatter.keyPlaceholder"));
const typeLabel = computed(() => t("frontmatter.typeLabel"));
const typePlaceholder = computed(() => t("frontmatter.typePlaceholder"));
const addButtonText = computed(() => t("frontmatter.addButton"));
const editModalTitle = computed(() => t("frontmatter.editModalTitle"));
const saveButtonText = computed(() => t("frontmatter.saveButton"));
const cancelButtonText = computed(() => t("frontmatter.cancelButton"));
const tableKeyTitle = computed(() => t("frontmatter.tableKey"));
const tableTypeTitle = computed(() => t("frontmatter.tableType"));
const tableActionsTitle = computed(() => t("frontmatter.tableActions"));
const editButtonText = computed(() => t("frontmatter.editButton"));
const deleteButtonText = computed(() => t("frontmatter.deleteButton"));

interface RowData {
    key: number;
    title: string;
    type: string;
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

const columns = computed(() => [
    {
        title: tableKeyTitle.value,
        key: "title",
    },
    {
        title: tableTypeTitle.value,
        key: "type",
    },
    {
        title: tableActionsTitle.value,
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
                    { default: () => editButtonText.value },
                ),
                h(
                    NButton,
                    {
                        size: "small",
                        type: "error",
                        onClick: () => deleteField(row.key),
                        style: "margin-left: 8px",
                    },
                    { default: () => deleteButtonText.value },
                ),
            ];
        },
    },
]);

const saveData = async () => {
    try {
        const fields = data.value.map((item) => ({
            key: item.key,
            title: item.title,
            field_type: item.type,
        }));
        await saveFrontmatterFields(fields);
        // 保存字段配置后重新收集建议
        await collectFrontmatterSuggestions();
    } catch (e) {
        message.error(t("frontmatter.saveFailed", { error: e }), {
            closable: true,
        });
    }
};

const loadData = async () => {
    try {
        const fields = await loadFrontmatterSchema();
        data.value = fields.map((item) => ({
            key: item.key,
            title: item.title,
            type: item.field_type,
        }));
    } catch (e) {
        message.error(t("frontmatter.loadFailed", { error: e }), {
            closable: true,
        });
    }
};

onMounted(() => {
    loadData();
});

const addField = async () => {
    if (!formData.value.key || !formData.value.type) {
        message.warning(t("frontmatter.fillRequired"), { closable: true });
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
    message.success(t("frontmatter.addSuccess"), { closable: true });
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
        message.warning(t("frontmatter.fillRequiredEdit"), { closable: true });
        return;
    }
    const index = data.value.findIndex(
        (item) => item.key === editingIndex.value,
    );
    if (index !== -1) {
        data.value[index].title = editFormData.value.key;
        data.value[index].type = editFormData.value.type;
        message.success(t("frontmatter.editSuccess"), { closable: true });
        await saveData();
    }
    showEditModal.value = false;
};

const deleteField = async (index: number) => {
    const idx = data.value.findIndex((item) => item.key === index);
    if (idx !== -1) {
        data.value.splice(idx, 1);
        message.success(t("frontmatter.deleteSuccess"), { closable: true });
        await saveData();
    }
};
</script>
