import { ref, onMounted, watch } from "vue";

export function useFileSelection() {
  const selectedContent = ref("");
  const selectedPath = ref("");

  onMounted(() => {
    const cachedContent = localStorage.getItem("editorContent");
    const cachedPath = localStorage.getItem("selectedPath");
    if (cachedContent) {
      selectedContent.value = cachedContent;
    }
    if (cachedPath) {
      selectedPath.value = cachedPath;
    }
  });

  watch(selectedContent, (newVal) => {
    localStorage.setItem("editorContent", newVal);
  });

  watch(selectedPath, (newVal) => {
    localStorage.setItem("selectedPath", newVal);
  });

  const handleFileSelected = (
    payload: string | { content: string; path: string },
  ) => {
    if (!payload) return;
    if (typeof payload === "string") {
      selectedContent.value = payload;
    } else {
      selectedContent.value = payload.content ?? "";
      selectedPath.value = payload.path ?? "";
    }
  };

  return {
    selectedContent,
    selectedPath,
    handleFileSelected,
  };
}
