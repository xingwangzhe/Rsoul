// use serde::{Deserialize, Serialize};
use serde_json;

use tauri::Emitter;
use tauri_plugin_store::StoreExt;

#[tauri::command]
pub async fn get_lang(app_handle: tauri::AppHandle) -> Result<String, String> {
    let store = app_handle
        .store(".settings.dat")
        .map_err(|e| format!("Failed to open settings store: {}", e))?;

    let lang: String = serde_json::from_value(
        store
            .get("language")
            .unwrap_or(serde_json::Value::String("en".to_string())),
    )
    .unwrap_or("en".to_string());

    Ok(lang)
}

#[tauri::command]
pub async fn set_lang(app_handle: tauri::AppHandle, lang: String) -> Result<(), String> {
    // 持久化存储这个键值对
    let store = app_handle
        .store(".settings.dat")
        .map_err(|e| format!("Failed to open settings store: {}", e))?;

    store.set("language", serde_json::to_value(lang.clone()).unwrap());
    store
        .save()
        .map_err(|e| format!("Failed to save settings: {}", e))?;

    // 发送事件到前端
    app_handle
        .emit("lang_changed", lang)
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    Ok(())
}
