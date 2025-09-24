import { ref, watch, onMounted, computed } from "vue";
import { config } from "md-editor-v3";
import { useMessage } from "naive-ui";
import { useI18n } from "vue-i18n";
import fm from "front-matter";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import ZH_TW from "@vavt/cm-extension/dist/locale/zh-TW";
import { handleSave } from "../utils/editorUtils";

config({
  editorConfig: {
    languageUserDefined: {
      "zh-TW": ZH_TW,
    },
  },
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
      console.error("Failed to load theme:", err);
      theme.value = "light";
    }
  };

  listen<boolean>("theme_changed", (event) => {
    theme.value = event.payload ? "dark" : "light";
  });

  onMounted(() => {
    loadTheme();
  });

  const toolbars = [
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
    "mermaid",
    "katex",
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
  ];

  const text = ref("Hello Editor!");
  const frontmatter = ref<Record<string, any>>({});

  const updateFrontmatter = (newFrontmatter: Record<string, any>) => {
    frontmatter.value = newFrontmatter;
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
    console.debug("onSave triggered, md length:", v ? v.length : 0);

    if (!props.path) {
      message.error(t("editor.noPath"), { closable: true });
      return;
    }

    try {
      if (h && typeof h.then === "function") {
        try {
          const html = await h;
          console.debug("generated html length:", html ? html.length : 0);
        } catch (htmlErr) {
          console.warn("HTML 生成失败（仍将尝试保存 markdown）：", htmlErr);
        }
      }

      await handleSave(v, frontmatter.value, props.path);

      message.success(t("editor.saveSuccess"), {
        closable: true,
      });
    } catch (err) {
      console.error("save_markdown invoke error:", err);
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
    updateFrontmatter,
    onSave,
  };
}
