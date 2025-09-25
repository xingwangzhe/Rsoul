import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  NaiveNode,
  loadFileTree,
  getFileTree as getFileTreeFromBackend,
  getStoredPath,
  getFileContent,
} from "../utils/fileTreeUtils";
import { collectFrontmatterSuggestions } from "../utils/frontmatterUtils";

export function useFileTree(emit: any) {
  const { t } = useI18n();

  const treeData = ref<NaiveNode[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selectedPath = ref<string | null>(null);

  const loadFileTreeWrapper = async (path: string) => {
    loading.value = true;
    error.value = null;
    treeData.value = [];
    selectedPath.value = path;

    const result = await loadFileTree(path);
    treeData.value = result.treeData;
    error.value = result.error;
    selectedPath.value = result.selectedPath;
    loading.value = false;
  };

  const getFileTree = async () => {
    loading.value = true;
    error.value = null;
    treeData.value = [];
    selectedPath.value = null;

    const result = await getFileTreeFromBackend();
    treeData.value = result.treeData;
    error.value = result.error;
    selectedPath.value = result.selectedPath;
    loading.value = false;

    if (result.treeData.length > 0) {
      try {
        await collectFrontmatterSuggestions();
      } catch (e) {
        console.warn("收集frontmatter字段值建议失败:", e);
      }
    }
  };

  onMounted(async () => {
    const path = await getStoredPath();
    if (path) {
      await loadFileTreeWrapper(path);
      try {
        await collectFrontmatterSuggestions();
      } catch (e) {
        console.warn("收集frontmatter字段值建议失败:", e);
      }
    }
  });

  const handleNodeClick = async (node: NaiveNode) => {
    console.log("handleNodeClick called", node);
    if (!node.isDir) {
      try {
        const content = await getFileContent(node.key);
        emit("fileSelected", { content, path: node.key });
        console.log("content:", content, " path:", node.key);
      } catch (e) {
        const errorMessage = t("fileTree.readFileFailed", {
          err: String(e),
        });
        console.error(errorMessage, e);
        error.value = errorMessage;
      }
    }
  };

  return {
    treeData,
    loading,
    error,
    selectedPath,
    loadFileTreeWrapper,
    getFileTree,
    handleNodeClick,
  };
}
