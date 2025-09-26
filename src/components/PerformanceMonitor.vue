<template>
    <n-card title="Performance Monitor" size="small">
        <n-space vertical size="small">
            <n-alert type="info" :show-icon="false">
                Monitor your app's performance metrics and loading times.
            </n-alert>

            <n-descriptions :column="2" size="small" bordered>
                <n-descriptions-item label="App Version">
                    {{ appVersion }}
                </n-descriptions-item>
                <n-descriptions-item label="Vue Version">
                    {{ vueVersion }}
                </n-descriptions-item>
                <n-descriptions-item label="Load Time">
                    {{ loadTime }}ms
                </n-descriptions-item>
                <n-descriptions-item label="Memory Usage">
                    {{ memoryUsage }}
                </n-descriptions-item>
                <n-descriptions-item label="Bundle Size">
                    {{ bundleSize }}
                </n-descriptions-item>
                <n-descriptions-item label="Chunks Loaded">
                    {{ chunksLoaded }}
                </n-descriptions-item>
            </n-descriptions>

            <n-divider title-placement="left">Core Web Vitals</n-divider>

            <n-space vertical size="small">
                <n-progress
                    type="line"
                    :percentage="lcpScore"
                    :color="getScoreColor(lcpScore)"
                    :show-indicator="false"
                >
                    <template #default>
                        <n-text strong>LCP (Largest Contentful Paint)</n-text>
                        <n-text type="info">{{ lcpTime }}ms</n-text>
                    </template>
                </n-progress>

                <n-progress
                    type="line"
                    :percentage="fidScore"
                    :color="getScoreColor(fidScore)"
                    :show-indicator="false"
                >
                    <template #default>
                        <n-text strong>FID (First Input Delay)</n-text>
                        <n-text type="info">{{ fidTime }}ms</n-text>
                    </template>
                </n-progress>

                <n-progress
                    type="line"
                    :percentage="clsScore"
                    :color="getScoreColor(clsScore)"
                    :show-indicator="false"
                >
                    <template #default>
                        <n-text strong>CLS (Cumulative Layout Shift)</n-text>
                        <n-text type="info">{{ clsValue }}</n-text>
                    </template>
                </n-progress>
            </n-space>

            <n-button @click="refreshMetrics" size="small" type="primary">
                Refresh Metrics
            </n-button>
        </n-space>
    </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NCard, NSpace, NAlert, NDescriptions, NDescriptionsItem, NDivider, NProgress, NText, NButton } from 'naive-ui';

const appVersion = ref('1.0.0');
const vueVersion = ref('3.5.21');
const loadTime = ref(0);
const memoryUsage = ref('N/A');
const bundleSize = ref('N/A');
const chunksLoaded = ref(0);
const lcpTime = ref(0);
const fidTime = ref(0);
const clsValue = ref('0.000');
const lcpScore = ref(0);
const fidScore = ref(0);
const clsScore = ref(0);

const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a'; // Good
    if (score >= 50) return '#faad14'; // Needs improvement
    return '#ff4d4f'; // Poor
};

const calculateScore = (metric: number, good: number, poor: number) => {
    if (metric <= good) return 100;
    if (metric <= poor) return 50;
    return 0;
};

const refreshMetrics = () => {
    // Get load time from performance API
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
        loadTime.value = Math.round(navigation.loadEventEnd - navigation.fetchStart);
    }

    // Get memory usage
    if ('memory' in performance) {
        const mem = (performance as any).memory;
        memoryUsage.value = `${(mem.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB`;
    }

    // Count loaded chunks
    const resources = performance.getEntriesByType('resource');
    chunksLoaded.value = resources.filter(r => r.name.includes('.js')).length;

    // Get Core Web Vitals
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
        lcpTime.value = Math.round(lcpEntries[lcpEntries.length - 1].startTime);
        lcpScore.value = calculateScore(lcpTime.value, 2500, 4000);
    }

    const fidEntries = performance.getEntriesByType('first-input');
    if (fidEntries.length > 0) {
        const fidEntry = fidEntries[0] as any;
        fidTime.value = Math.round(fidEntry.processingStart - fidEntry.startTime);
        fidScore.value = calculateScore(fidTime.value, 100, 300);
    }

    // Calculate CLS
    const clsEntries = performance.getEntriesByType('layout-shift');
    let clsSum = 0;
    clsEntries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
            clsSum += entry.value;
        }
    });
    clsValue.value = clsSum.toFixed(3);
    clsScore.value = calculateScore(clsSum * 1000, 100, 250); // Convert to 0-1000 scale

    // Estimate bundle size (rough approximation)
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const totalSize = jsResources.reduce((sum, r) => sum + (r as any).transferSize || 0, 0);
    if (totalSize > 0) {
        bundleSize.value = `${(totalSize / 1024 / 1024).toFixed(2)} MB`;
    }
};

onMounted(() => {
    refreshMetrics();
});
</script>

<style scoped>
.n-card {
    margin: 16px 0;
}

.n-progress {
    margin-bottom: 8px;
}

.n-descriptions {
    margin-bottom: 16px;
}
</style>
