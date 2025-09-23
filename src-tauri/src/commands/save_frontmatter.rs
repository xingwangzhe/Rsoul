use serde::{Deserialize, Serialize};
use serde_json;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
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
    let store = app_handle
        .store(".frontmatter.dat")
        .map_err(|e| format!("Failed to open store: {}", e))?;

    // Load stored path
    let stored_path: Option<String> =
        serde_json::from_value(store.get("stored_path").unwrap_or(serde_json::Value::Null))
            .unwrap_or(None);

    let root_path = match stored_path {
        Some(path) => path,
        None => {
            // No path selected, save empty suggestions
            let fm_suggestions = FrontmatterSuggestions {
                field_suggestions: HashMap::new(),
            };
            store.set(
                "frontmatter_suggestions",
                serde_json::to_value(fm_suggestions).unwrap(),
            );
            store
                .save()
                .map_err(|e| format!("Failed to save empty suggestions: {}", e))?;
            return Ok(());
        }
    };

    let mut suggestions: HashMap<String, HashMap<String, usize>> = HashMap::new();

    // Walk through all .md files
    for entry in WalkDir::new(&root_path).into_iter().filter_map(|e| e.ok()) {
        if entry.path().extension().and_then(|s| s.to_str()) == Some("md") {
            if let Ok(content) = fs::read_to_string(entry.path()) {
                if let Some(frontmatter) = extract_frontmatter(&content) {
                    for (key, value) in frontmatter {
                        let field_sug = suggestions.entry(key).or_insert(HashMap::new());
                        match value {
                            serde_yaml::Value::String(s) => {
                                *field_sug.entry(s).or_insert(0) += 1;
                            }
                            serde_yaml::Value::Sequence(seq) => {
                                for item in seq {
                                    if let serde_yaml::Value::String(s) = item {
                                        *field_sug.entry(s).or_insert(0) += 1;
                                    }
                                }
                            }
                            _ => {} // Skip other types
                        }
                    }
                }
            }
        }
    }

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
    store.set(
        "frontmatter_suggestions",
        serde_json::to_value(fm_suggestions).unwrap(),
    );
    store
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
