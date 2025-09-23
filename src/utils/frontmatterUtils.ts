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
 * 根据字段类型提供默认值
 */
export function defaultForType(type: string): any {
  switch (type) {
    case "number":
      return 0;
    case "string[]":
      return [];
    case "date":
    case "time":
    case "dateandtime":
      return null;
    default:
      return "";
  }
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

/**
 * 初始化表单数据
 */
export function initializeFormData(
  schema: Array<{ key: number; title: string; field_type: string }>,
  currentFrontmatter: Record<string, any> = {},
): Record<string, any> {
  const formData: Record<string, any> = {};
  schema.forEach((f) => {
    const val = currentFrontmatter[f.title];
    if (f.field_type === "string[]") {
      if (Array.isArray(val)) {
        formData[f.title] = val;
      } else if (typeof val === "string") {
        formData[f.title] = val
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      } else {
        formData[f.title] = [];
      }
    } else if (
      f.field_type === "date" ||
      f.field_type === "time" ||
      f.field_type === "dateandtime"
    ) {
      if (val) {
        try {
          formData[f.title] = new Date(val);
        } catch {
          formData[f.title] = null;
        }
      } else {
        formData[f.title] = null;
      }
    } else {
      formData[f.title] = val != null ? val : defaultForType(f.field_type);
    }
  });
  return formData;
}

/**
 * 保存表单数据到 frontmatter
 */
export function saveFormDataToFrontmatter(
  schema: Array<{ key: number; title: string; field_type: string }>,
  formData: Record<string, any>,
): Record<string, any> {
  const output: Record<string, any> = {};
  schema.forEach((f) => {
    const raw = formData[f.title];
    switch (f.field_type) {
      case "number":
        output[f.title] = Number(raw);
        break;
      case "string[]":
        if (Array.isArray(raw)) {
          output[f.title] = raw as any[];
        } else {
          const str = raw != null ? String(raw) : "";
          output[f.title] = str
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
        }
        break;
      case "date":
        output[f.title] =
          raw instanceof Date ? raw.toISOString().slice(0, 10) : "";
        break;
      case "time":
        output[f.title] =
          raw instanceof Date ? raw.toISOString().slice(11, 16) : "";
        break;
      case "dateandtime":
        output[f.title] = raw instanceof Date ? raw.toISOString() : "";
        break;
      default:
        output[f.title] = raw;
    }
  });
  const hasActualContent = Object.values(output).some(
    (val) =>
      val != null &&
      (Array.isArray(val) ? val.length > 0 : String(val).trim() !== ""),
  );
  return hasActualContent ? output : {};
}
