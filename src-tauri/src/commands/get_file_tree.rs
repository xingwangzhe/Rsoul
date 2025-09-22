use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

/// 弹出系统文件夹选择对话框，返回用户选择的文件夹路径字符串
/// 将阻塞式对话框调用放到后台线程运行，避免阻塞主线程或导致前端等待 invoke 时界面无响应
#[tauri::command]
pub async fn get_file_tree(app: AppHandle) -> Result<String, String> {
    // AppHandle 是可克隆的，把它克隆到后台线程闭包中使用
    let app_handle = app.clone();

    // spawn_blocking 在后台线程执行阻塞调用（例如插件的 blocking_pick_folder）
    let selected = tauri::async_runtime::spawn_blocking(move || {
        // blocking_pick_folder 返回 Option<FilePath>
        app_handle.dialog().file().blocking_pick_folder()
    })
    .await
    .map_err(|e| format!("后台线程执行失败: {}", e))? // 处理线程 join/执行错误
    .ok_or_else(|| "用户未选择文件夹".to_string())?;

    // FilePath 实现了 Display/ToString，使用 to_string() 安全地转为 String
    Ok(selected.to_string())
}
