import { ref, watch, onMounted, computed } from "vue";
import { config } from "md-editor-v3";
import { useMessage } from "naive-ui";
import { useI18n } from "vue-i18n";
import fm from "front-matter";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import ZH_TW from "@vavt/cm-extension/dist/locale/zh-TW";
import { handleSave } from "../utils/editorUtils";
import { loadFrontmatterSchema, initializeFormData } from "../utils/frontmatterUtils";

// Configure md-editor-v3 to only load essential languages for better performance
config({
  editorConfig: {
    languageUserDefined: {
      "zh-TW": ZH_TW,
    },
  },
  // Disable loading all language data to reduce bundle size
  // Only load languages that are actually needed
  codeMirrorExtensions: () => [],
});

interface EditorProps {
  content?: string;
  path?: string;
}

export function useEditor(props: EditorProps) {
  const { t, locale } = useI18n();
  const message = useMessage();

  const currentLanguage = computed(() => {
    switch (locale.value) {
      case "zh-cn":
        return "zh-CN";
      case "zh-hk":
        return "zh-TW";
      default:
        return "en-US";
    }
  });

  const theme = ref<"light" | "dark">("light");

  const loadTheme = async () => {
    try {
      const isDark = await invoke<boolean>("get_theme");
      theme.value = isDark ? "dark" : "light";
    } catch (err) {
      console.error("加载主题失败:", err);
      theme.value = "light";
    }
  };

  listen<boolean>("theme_changed", (event) => {
    theme.value = event.payload ? "dark" : "light";
  });

  onMounted(() => {
    loadTheme();
  });

  const toolbars = computed(() => [
    0,
    "bold",
    "underline",
    "italic",
    "-",
    "title",
    "strikeThrough",
    "sub",
    "sup",
    "quote",
    "unorderedList",
    "orderedList",
    "task",
    "-",
    "codeRow",
    "code",
    "link",
    "image",
    "table",
    "-",
    "revoke",
    "next",
    "save",
    "=",
    "pageFullscreen",
    "fullscreen",
    "preview",
    "previewOnly",
    "catalog",
  ]);

  const text = ref("Hello Editor!");
  const frontmatter = ref<Record<string, any>>({});

  // 检查是否有frontmatter
  const hasFrontmatter = computed(() => {
    return frontmatter.value && Object.keys(frontmatter.value).length > 0;
  });

  const updateFrontmatter = (newFrontmatter: Record<string, any>) => {
    frontmatter.value = newFrontmatter;
  };

  // 创建frontmatter
  const createFrontmatter = async () => {
    try {
      const schema = await loadFrontmatterSchema();
      if (schema.length === 0) {
        message.warning(t("frontmatter.noSchemaWarning"));
        return;
      }

      const emptyFrontmatter = await initializeFormData(schema, {});
      frontmatter.value = emptyFrontmatter;

      message.success(t("frontmatter.created"));
    } catch (error) {
      console.error("创建frontmatter失败:", error);
      message.error(t("frontmatter.createFailed"));
    }
  };

  watch(
    () => props.content,
    (newContent) => {
      if (newContent !== undefined) {
        const parsed = fm(newContent);
        text.value = parsed.body;
        frontmatter.value = parsed.attributes as Record<string, any>;
      }
    },
  );

  const onSave = async (v: any, h: any) => {
    console.debug("onSave触发，markdown长度:", v ? v.length : 0);

    if (!props.path) {
      message.error(t("editor.noPath"), { closable: true });
      return;
    }

    try {
      if (h && typeof h.then === "function") {
        try {
          const html = await h;
          console.debug("生成的HTML长度:", html ? html.length : 0);
        } catch (htmlErr) {
          console.warn("HTML生成失败（仍将尝试保存markdown）：", htmlErr);
        }
      }

      await handleSave(v, frontmatter.value, props.path);

      message.success(t("editor.saveSuccess"), {
        closable: true,
      });
    } catch (err) {
      console.error("save_markdown调用错误:", err);
      message.error(t("editor.saveFailed", { err: String(err) }), {
        closable: true,
      });
    }
  };

  return {
    currentLanguage,
    theme,
    toolbars,
    text,
    frontmatter,
    hasFrontmatter,
    updateFrontmatter,
    createFrontmatter,
    onSave,
  };
}
