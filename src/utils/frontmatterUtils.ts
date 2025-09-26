// Rsoul/src/utils/frontmatterUtils.ts - Frontmatter工具函数

import { invoke } from "@tauri-apps/api/core";

/**
 * 加载frontmatter字段定义schema
 */
export async function loadFrontmatterSchema(): Promise<
  Array<{
    key: number;
    title: string;
    field_type: string;
    save_as_array: boolean;
    quote_strings: boolean;
  }>
> {
  const loaded = (await invoke("load_frontmatter")) as Array<{
    key: number;
    title: string;
    field_type?: string;
    type?: string;
    save_as_array?: boolean;
    quote_strings?: boolean;
  }>;
  return loaded.map((f) => ({
    key: f.key,
    title: f.title,
    field_type: f.field_type ?? f.type ?? "string",
    save_as_array: f.save_as_array ?? false,
    quote_strings: f.quote_strings ?? false,
  }));
}

/**
 * 加载frontmatter字段值建议
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
 * 收集frontmatter字段值建议
 */
export async function collectFrontmatterSuggestions(): Promise<void> {
  await invoke("collect_frontmatter_suggestions");
}

/**
 * 保存frontmatter字段定义
 */
export async function saveFrontmatterFields(
  fields: Array<{
    key: number;
    title: string;
    field_type: string;
    save_as_array: boolean;
    quote_strings: boolean;
  }>,
): Promise<void> {
  await invoke("save_frontmatter", { fields });
}

/**
 * 初始化表单数据（由后端处理类型转换）
 */
export async function initializeFormData(
  schema: Array<{
    key: number;
    title: string;
    field_type: string;
    save_as_array: boolean;
    quote_strings: boolean;
  }>,
  currentFrontmatter: Record<string, any> = {},
): Promise<Record<string, any>> {
  const result = await invoke("initialize_form_data", {
    schema,
    currentFrontmatter,
  });
  return result as Record<string, any>;
}

/**
 * 保存表单数据到frontmatter（由后端处理类型转换）
 */
export async function saveFormDataToFrontmatter(
  schema: Array<{
    key: number;
    title: string;
    field_type: string;
    save_as_array: boolean;
    quote_strings: boolean;
  }>,
  formData: Record<string, any>,
): Promise<Record<string, any>> {
  const result = await invoke("save_form_data_to_frontmatter", {
    schema,
    formData,
  });
  return result as Record<string, any>;
}

/**
 * 获取字段的建议选项，用于string和string[]类型的字段
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
