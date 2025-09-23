use serde::{Deserialize, Serialize};
use serde_json;
use std::collections::HashMap;
use std::fs;
use tauri_plugin_store::StoreExt;
use walkdir::WalkDir;

#[derive(Serialize, Deserialize, Clone)]
pub struct FrontmatterField {
    pub key: usize,
    pub title: String,
    pub field_type: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct FrontmatterSuggestion {
    pub value: String,
    pub count: usize,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct FrontmatterSuggestions {
    pub field_suggestions: HashMap<String, Vec<FrontmatterSuggestion>>,
}

#[tauri::command]
pub async fn save_frontmatter(
    app_handle: tauri::AppHandle,
    fields: Vec<FrontmatterField>,
) -> Result<(), String> {
    let store = app_handle
        .store(".frontmatter.dat")
        .map_err(|e| format!("Failed to open store: {}", e))?;

    store.set("frontmatter_fields", serde_json::to_value(fields).unwrap());
    store
        .save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn load_frontmatter(
    app_handle: tauri::AppHandle,
) -> Result<Vec<FrontmatterField>, String> {
    let store = app_handle
        .store(".frontmatter.dat")
        .map_err(|e| format!("Failed to open store: {}", e))?;

    let fields: Vec<FrontmatterField> =
        serde_json::from_value(store.get("frontmatter_fields").unwrap_or_default())
            .unwrap_or_default();

    Ok(fields)
}

#[tauri::command]
pub async fn collect_frontmatter_suggestions(app_handle: tauri::AppHandle) -> Result<(), String> {
    let settings_store = app_handle
        .store(".settings.dat")
        .map_err(|e| format!("Failed to open settings store: {}", e))?;
    let frontmatter_store = app_handle
        .store(".frontmatter.dat")
        .map_err(|e| format!("Failed to open frontmatter store: {}", e))?;

    // Load stored path from settings store
    let stored_path: Option<String> = serde_json::from_value(
        settings_store
            .get("selectedPath")
            .unwrap_or(serde_json::Value::Null),
    )
    .unwrap_or(None);

    let root_path = match stored_path {
        Some(path) => {
            println!("收集建议：存储路径 = {}", path);
            path
        }
        None => {
            println!("收集建议：未找到存储路径，返回空建议");
            // No path selected, save empty suggestions
            let fm_suggestions = FrontmatterSuggestions {
                field_suggestions: HashMap::new(),
            };
            frontmatter_store.set(
                "frontmatter_suggestions",
                serde_json::to_value(fm_suggestions).unwrap(),
            );
            frontmatter_store
                .save()
                .map_err(|e| format!("Failed to save empty suggestions: {}", e))?;
            return Ok(());
        }
    };

    let mut suggestions: HashMap<String, HashMap<String, usize>> = HashMap::new();
    let mut md_file_count = 0;
    let mut frontmatter_count = 0;

    // Walk through all .md files
    for entry in WalkDir::new(&root_path).into_iter().filter_map(|e| e.ok()) {
        if entry.path().extension().and_then(|s| s.to_str()) == Some("md") {
            md_file_count += 1;
            if let Ok(content) = fs::read_to_string(entry.path()) {
                if let Some(frontmatter) = extract_frontmatter(&content) {
                    frontmatter_count += 1;
                    println!("找到 frontmatter 文件: {}", entry.path().display());
                    for (key, value) in &frontmatter {
                        println!("  字段: {} = {:?}", key, value);
                        let field_sug = suggestions.entry(key.clone()).or_insert(HashMap::new());
                        match value {
                            serde_yaml::Value::String(s) => {
                                *field_sug.entry(s.clone()).or_insert(0) += 1;
                            }
                            serde_yaml::Value::Sequence(seq) => {
                                println!("  字段 {} 是数组，包含 {} 个元素", key, seq.len());
                                for item in seq {
                                    if let serde_yaml::Value::String(s) = item {
                                        println!("    数组元素: {}", s);
                                        *field_sug.entry(s.clone()).or_insert(0) += 1;
                                    } else {
                                        println!("    非字符串数组元素: {:?}", item);
                                    }
                                }
                            }
                            _ => {
                                println!("  字段 {} 是其他类型: {:?}", key, value);
                            }
                        }
                    }
                } else {
                    println!("文件 {} 没有有效的 frontmatter", entry.path().display());
                }
            } else {
                println!("无法读取文件: {}", entry.path().display());
            }
        }
    }

    println!(
        "扫描完成：找到 {} 个 md 文件，其中 {} 个有 frontmatter",
        md_file_count, frontmatter_count
    );
    println!(
        "收集到的建议字段: {:?}",
        suggestions.keys().collect::<Vec<_>>()
    );

    // Convert to FrontmatterSuggestions
    let mut field_suggestions: HashMap<String, Vec<FrontmatterSuggestion>> = HashMap::new();
    for (field, values) in suggestions {
        let mut sorted_suggestions: Vec<FrontmatterSuggestion> = values
            .into_iter()
            .map(|(value, count)| FrontmatterSuggestion { value, count })
            .collect();
        sorted_suggestions.sort_by(|a, b| b.count.cmp(&a.count));
        field_suggestions.insert(field, sorted_suggestions);
    }

    let fm_suggestions = FrontmatterSuggestions { field_suggestions };
    frontmatter_store.set(
        "frontmatter_suggestions",
        serde_json::to_value(fm_suggestions).unwrap(),
    );
    frontmatter_store
        .save()
        .map_err(|e| format!("Failed to save suggestions: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn load_frontmatter_suggestions(
    app_handle: tauri::AppHandle,
) -> Result<FrontmatterSuggestions, String> {
    let store = app_handle
        .store(".frontmatter.dat")
        .map_err(|e| format!("Failed to open store: {}", e))?;

    let suggestions: FrontmatterSuggestions = serde_json::from_value(
        store.get("frontmatter_suggestions").unwrap_or_default(),
    )
    .unwrap_or(FrontmatterSuggestions {
        field_suggestions: HashMap::new(),
    });

    Ok(suggestions)
}

#[tauri::command]
pub fn initialize_form_data(
    schema: Vec<FrontmatterField>,
    current_frontmatter: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let mut form_data = serde_json::Map::new();
    let current: HashMap<String, serde_json::Value> =
        serde_json::from_value(current_frontmatter).unwrap_or_default();

    for field in schema {
        let val = current.get(&field.title);
        match field.field_type.as_str() {
            "string[]" => {
                if let Some(v) = val {
                    if v.is_array() {
                        form_data.insert(field.title, v.clone());
                    } else if v.is_string() {
                        let arr: Vec<serde_json::Value> = v
                            .as_str()
                            .unwrap()
                            .split(',')
                            .map(|s| serde_json::Value::String(s.trim().to_string()))
                            .filter(|s| !s.as_str().unwrap().is_empty())
                            .collect();
                        form_data.insert(field.title, serde_json::Value::Array(arr));
                    } else {
                        form_data.insert(field.title, serde_json::Value::Array(vec![]));
                    }
                } else {
                    form_data.insert(field.title, serde_json::Value::Array(vec![]));
                }
            }
            "date" | "time" | "dateandtime" => {
                if let Some(v) = val {
                    if v.is_string() {
                        form_data.insert(field.title, v.clone());
                    } else {
                        form_data.insert(field.title, serde_json::Value::Null);
                    }
                } else {
                    form_data.insert(field.title, serde_json::Value::Null);
                }
            }
            _ => {
                let default_val = match field.field_type.as_str() {
                    "number" => serde_json::Value::Number(0.into()),
                    _ => serde_json::Value::String("".to_string()),
                };
                form_data.insert(field.title, val.cloned().unwrap_or(default_val));
            }
        }
    }
    Ok(serde_json::Value::Object(form_data))
}

#[tauri::command]
pub fn save_form_data_to_frontmatter(
    schema: Vec<FrontmatterField>,
    form_data: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let form: HashMap<String, serde_json::Value> =
        serde_json::from_value(form_data).unwrap_or_default();
    let mut output = serde_json::Map::new();

    for field in schema {
        let raw = form.get(&field.title);
        match field.field_type.as_str() {
            "number" => {
                if let Some(v) = raw {
                    if let Some(n) = v.as_f64() {
                        output.insert(field.title, serde_json::Value::Number((n as i64).into()));
                    }
                }
            }
            "string[]" => {
                if let Some(v) = raw {
                    if v.is_array() {
                        output.insert(field.title, v.clone());
                    } else if v.is_string() {
                        let arr: Vec<serde_json::Value> = v
                            .as_str()
                            .unwrap()
                            .split(',')
                            .map(|s| serde_json::Value::String(s.trim().to_string()))
                            .filter(|s| !s.as_str().unwrap().is_empty())
                            .collect();
                        output.insert(field.title, serde_json::Value::Array(arr));
                    }
                }
            }
            "date" => {
                if let Some(v) = raw {
                    if v.is_string() {
                        let date_str = v.as_str().unwrap();
                        if !date_str.is_empty() {
                            output.insert(
                                field.title,
                                serde_json::Value::String(date_str.to_string()),
                            );
                        }
                    }
                }
            }
            "time" => {
                if let Some(v) = raw {
                    if v.is_string() {
                        let time_str = v.as_str().unwrap();
                        if !time_str.is_empty() {
                            output.insert(
                                field.title,
                                serde_json::Value::String(time_str.to_string()),
                            );
                        }
                    }
                }
            }
            "dateandtime" => {
                if let Some(v) = raw {
                    if v.is_string() {
                        let datetime_str = v.as_str().unwrap();
                        if !datetime_str.is_empty() {
                            output.insert(
                                field.title,
                                serde_json::Value::String(datetime_str.to_string()),
                            );
                        }
                    }
                }
            }
            _ => {
                if let Some(v) = raw {
                    output.insert(field.title, v.clone());
                }
            }
        }
    }

    let has_content = output.values().any(|v| match v {
        serde_json::Value::Array(arr) => !arr.is_empty(),
        serde_json::Value::String(s) => !s.trim().is_empty(),
        serde_json::Value::Number(_) => true,
        _ => false,
    });

    if has_content {
        Ok(serde_json::Value::Object(output))
    } else {
        Ok(serde_json::Value::Object(serde_json::Map::new()))
    }
}

fn extract_frontmatter(content: &str) -> Option<HashMap<String, serde_yaml::Value>> {
    if content.starts_with("---") {
        if let Some(end) = content[3..].find("---") {
            let yaml_str = &content[3..3 + end];
            if let Ok(value) = serde_yaml::from_str::<serde_yaml::Value>(yaml_str) {
                if let serde_yaml::Value::Mapping(mapping) = value {
                    let mut result = HashMap::new();
                    for (key, val) in mapping {
                        if let serde_yaml::Value::String(k) = key {
                            result.insert(k, val);
                        }
                    }
                    return Some(result);
                }
            }
        }
    }
    None
}
