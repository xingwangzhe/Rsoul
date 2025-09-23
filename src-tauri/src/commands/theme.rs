use serde::{Deserialize, Serialize};
use serde_json;

use tauri::Emitter;
use tauri_plugin_store::StoreExt;

#[tauri::command]
pub async fn get_theme(app_handle: tauri::AppHandle) -> Result<bool, String> {
    let store = app_handle
        .store(".settings.dat")
        .map_err(|e| format!("Failed to open settings store: {}", e))?;

    let theme: bool = serde_json::from_value(
        store
            .get("dark_mode")
            .unwrap_or(serde_json::Value::Bool(false)),
    )
    .unwrap_or(false);

    Ok(theme)
}

#[tauri::command]
pub async fn if_change_dark(app_handle: tauri::AppHandle, theme: bool) -> Result<(), String> {
    // 持久化存储这个键值对
    let store = app_handle
        .store(".settings.dat")
        .map_err(|e| format!("Failed to open settings store: {}", e))?;

    store.set("dark_mode", serde_json::to_value(theme).unwrap());
    store
        .save()
        .map_err(|e| format!("Failed to save settings: {}", e))?;

    // 发送事件到前端
    app_handle
        .emit("theme_changed", theme)
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    Ok(())
}
