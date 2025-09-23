use serde::{Deserialize, Serialize};
use serde_json;
use tauri_plugin_store::StoreExt;

#[derive(Serialize, Deserialize, Clone)]
pub struct FrontmatterField {
    pub key: usize,
    pub title: String,
    pub field_type: String,
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
