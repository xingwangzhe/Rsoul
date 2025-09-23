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
 * 将 frontmatter 和正文发送到后端进行序列化和保存，并更新建议。
 */
export async function handleSave(
  text: string,
  frontmatter: Record<string, any>,
  filePath: string,
): Promise<void> {
  // 发送 frontmatter 和内容到后端，后端处理序列化和保存
  await invoke("save_markdown_with_frontmatter", {
    frontmatter,
    content: text,
    filePath,
  });

  // 更新 frontmatter 建议
  try {
    await invoke("collect_frontmatter_suggestions");
  } catch (e) {
    console.warn("更新 frontmatter 建议失败:", e);
  }
}
