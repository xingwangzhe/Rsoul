// Rsoul/src/utils/frontmatterUtils.ts

import { invoke } from "@tauri-apps/api/core";

/**
 * 加载 frontmatter schema
 */
export async function loadFrontmatterSchema(): Promise<
  Array<{ key: number; title: string; field_type: string }>
> {
  const loaded = (await invoke("load_frontmatter")) as Array<{
    key: number;
    title: string;
    field_type?: string;
    type?: string;
  }>;
  return loaded.map((f) => ({
    key: f.key,
    title: f.title,
    field_type: f.field_type ?? f.type ?? "string",
  }));
}

/**
 * 加载 frontmatter suggestions
 */
export async function loadFrontmatterSuggestions(): Promise<
  Record<string, Array<{ value: string; count: number }>>
> {
  const loadedSuggestions = (await invoke("load_frontmatter_suggestions")) as {
    field_suggestions: Record<string, Array<{ value: string; count: number }>>;
  };
  return loadedSuggestions.field_suggestions;
}

/**
 * 收集 frontmatter suggestions
 */
export async function collectFrontmatterSuggestions(): Promise<void> {
  await invoke("collect_frontmatter_suggestions");
}

/**
 * 保存 frontmatter 字段
 */
export async function saveFrontmatterFields(
  fields: Array<{ key: number; title: string; field_type: string }>,
): Promise<void> {
  await invoke("save_frontmatter", { fields });
}

/**
 * 初始化表单数据（后端处理）
 */
export async function initializeFormData(
  schema: Array<{ key: number; title: string; field_type: string }>,
  currentFrontmatter: Record<string, any> = {},
): Promise<Record<string, any>> {
  const result = await invoke("initialize_form_data", {
    schema,
    currentFrontmatter,
  });
  return result as Record<string, any>;
}

/**
 * 保存表单数据到 frontmatter（后端处理）
 */
export async function saveFormDataToFrontmatter(
  schema: Array<{ key: number; title: string; field_type: string }>,
  formData: Record<string, any>,
): Promise<Record<string, any>> {
  const result = await invoke("save_form_data_to_frontmatter", {
    schema,
    formData,
  });
  return result as Record<string, any>;
}

/**
 * 获取字段的建议选项，用于 string 和 string[] 字段
 */
export function getFieldOptions(
  fieldTitle: string,
  suggestions: Record<string, Array<{ value: string; count: number }>>,
  currentValues?: string[],
): Array<{ label: string; value: string }> {
  console.log(
    `获取字段 ${fieldTitle} 的选项，suggestions 中所有字段:`,
    Object.keys(suggestions),
  );
  const fieldSuggestions = suggestions[fieldTitle] || [];
  console.log(`字段 ${fieldTitle} 的建议:`, fieldSuggestions);
  const options = fieldSuggestions.map((s) => {
    let displayCount = s.count;
    if (
      currentValues &&
      Array.isArray(currentValues) &&
      currentValues.includes(s.value)
    ) {
      displayCount += 1;
    }
    return {
      label: `${s.value} (${displayCount})`,
      value: s.value,
    };
  });
  console.log(`字段 ${fieldTitle} 的选项:`, options);
  return options;
}
