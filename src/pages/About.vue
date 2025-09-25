<template>
    <div class="about-page">
        <n-card class="about-card" bordered>
            <div class="header">
                <n-avatar :size="72" :round="true" :src="avatarSrc" />
                <div class="title-area">
                    <div class="typography">
                        <n-text class="page-title" strong>{{
                            t("about.title")
                        }}</n-text>
                        <n-text type="secondary" class="subtitle">{{
                            t("about.subtitle")
                        }}</n-text>
                    </div>
                </div>

                <div class="lang-actions">
                    <n-space>
                        <n-select
                            v-model:value="currentLocale"
                            :options="langOptions"
                            size="small"
                            clearable
                            @update:value="onLocaleChange"
                        />
                        <n-button size="small" @click="openGithub" secondary>
                            {{ t("about.open_github") }}
                        </n-button>
                        <n-button size="small" @click="copyGithub" tertiary>
                            {{ t("about.copy_link") }}
                        </n-button>
                    </n-space>
                </div>
            </div>

            <n-divider />

            <div class="content">
                <div class="typography">
                    <n-text block>{{ t("about.descriptionLine1") }}</n-text>
                    <n-text block>{{ t("about.descriptionLine2") }}</n-text>

                    <n-space vertical size="small" class="meta">
                        <div class="row">
                            <n-text strong>{{ t("about.author") }}</n-text>
                            <n-text>{{ author }}</n-text>
                        </div>

                        <div class="row">
                            <n-text strong>{{ t("about.github") }}</n-text>
                            <n-text
                                class="link"
                                @click="openGithub"
                                style="cursor: pointer"
                            >
                                {{ githubUrl }}
                            </n-text>
                        </div>

                        <div class="row">
                            <n-text strong>{{ t("about.license") }}</n-text>
                            <n-text>{{ t("about.licenseName") }}</n-text>
                        </div>
                    </n-space>
                </div>
            </div>

            <template #footer>
                <div class="footer">
                    <n-space>
                        <n-text type="secondary">{{
                            t("about.footerNote")
                        }}</n-text>
                    </n-space>
                </div>
            </template>
        </n-card>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
    NCard,
    NAvatar,
    NSpace,
    NSelect,
    NButton,
    NDivider,
    NText,
    useMessage,
} from "naive-ui";
import { openUrl } from "@tauri-apps/plugin-opener";

/**
 * 使用来自 Rsoul/i18n/*.json 的全局 i18n 键
 * 此组件使用 vue-i18n 的全局 composer。
 */
const { t, locale } = useI18n();

// 在本地 ref 中反映 locale 用于 select 绑定
const currentLocale = ref(locale.value || "en");

// 当 select 更改时保持全局 locale 同步
function onLocaleChange(val) {
    locale.value = val || "en";
    currentLocale.value = locale.value;
}

// 如果全局 locale 在其他地方被更改，保持 select 同步
watch(
    () => locale.value,
    (v) => {
        currentLocale.value = v;
    },
);

const langOptions = [
    { label: "English", value: "en" },
    { label: "中文", value: "zh-cn" },
    { label: "繁體中文", value: "zh-hk" },
];

const author = "xingwangzhe";
const githubUrl = "https://github.com/xingwangzhe/Rsoul";
const avatarSrc = "https://github.com/xingwangzhe.png";

const message = useMessage();

async function openGithub() {
    try {
        // 使用 Tauri plugin-opener 的 openUrl 通过操作系统打开 URL
        await openUrl(githubUrl);
    } catch (e) {
        // 不要使用任何 DOM 打开回退。通过 UI 和 console 报告错误。
        message.error(t("errors.unknown") || "打开失败");
        console.error("通过 plugin-opener openUrl 打开 URL 失败:", e);
    }
}

async function copyGithub() {
    try {
        await navigator.clipboard.writeText(githubUrl);
        message.success(t("about.copy_link") + " ✓");
    } catch (e) {
        message.error(t("errors.unknown") || "复制失败");
    }
}
</script>

<style scoped>
.about-page {
    display: flex;
    justify-content: center;
    padding: 24px;
}

.about-card {
    width: 100%;
    max-width: 920px;
    border-radius: 12px;
    box-shadow: 0 6px 20px rgba(25, 41, 60, 0.08);
}

.header {
    display: flex;
    align-items: center;
    gap: 16px;
}

.title-area {
    flex: 1;
}

.subtitle {
    display: block;
    margin-top: 4px;
    color: var(--n-typography-1);
}

.lang-actions {
    margin-left: 12px;
}

.content {
    padding: 8px 4px 4px 4px;
}

.meta {
    margin-top: 12px;
    display: block;
}

.row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 6px;
}

.link {
    color: var(--n-link-text-color);
    text-decoration: underline;
}

.footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
}
</style>
