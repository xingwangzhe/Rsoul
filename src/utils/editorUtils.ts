// Rsoul/src/utils/editorUtils.ts

import { invoke } from "@tauri-apps/api/core";
import i18next from "i18next";

/**
 * saveMarkdown:
 * - 使用提供的 `filePath` 作为目标文件路径。
 * - 调用 Tauri 后端 `save_markdown` 命令，参数与 Rust 函数签名匹配。
 * - 出错时抛出异常，以便调用者显示错误消息。
 */
export async function saveMarkdown(
  content: string,
  filePath: string,
): Promise<void> {
  if (!filePath) {
    throw new Error(i18next.t("editor.noPath") as string);
  }
  try {
    // 使用与 Rust 命令签名匹配的键调用：file_path 和 content
    await invoke("save_markdown", { filePath, content });
  } catch (e) {
    throw e;
  }
}

/**
 * 处理保存带有 frontmatter 的 markdown 内容。
 * 将 frontmatter 和正文组合成完整的 markdown，保存它，并更新建议。
 */
export async function handleSave(
  text: string,
  frontmatter: Record<string, any>,
  filePath: string,
  serializeFM: (attrs: Record<string, any>, content: string) => string,
): Promise<void> {
  // 将 frontmatter 和正文组合成完整的 markdown
  const hasFrontmatterContent = Object.values(frontmatter).some((val) => {
    if (Array.isArray(val)) return val.length > 0;
    return val != null && String(val).trim() !== "";
  });
  const fullMarkdown = hasFrontmatterContent
    ? serializeFM(frontmatter, text)
    : text;

  // 保存完整的 markdown 内容到后端
  await saveMarkdown(fullMarkdown, filePath);

  // 更新 frontmatter 建议
  try {
    await invoke("collect_frontmatter_suggestions");
  } catch (e) {
    console.warn("更新 frontmatter 建议失败:", e);
  }
}
