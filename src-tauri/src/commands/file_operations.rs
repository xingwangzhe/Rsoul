use serde::Deserialize;
use std::path::PathBuf;

#[derive(Debug, Deserialize)]
pub struct CreateFileRequest {
    pub path: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateFolderRequest {
    pub path: String,
}

#[derive(Debug, Deserialize)]
pub struct RenameItemRequest {
    pub old_path: String,
    pub new_name: String,
}

#[derive(Debug, Deserialize)]
pub struct DeleteItemRequest {
    pub path: String,
}

/// Tauri 命令：创建新文件（异步方式）
#[tauri::command]
pub async fn create_file(request: CreateFileRequest) -> Result<(), String> {
    let result = tauri::async_runtime::spawn_blocking(move || {
        let path = PathBuf::from(&request.path);

        // 检查父目录是否存在
        if let Some(parent) = path.parent() {
            if !parent.exists() {
                return Err(format!(
                    "Parent directory does not exist: {}",
                    parent.display()
                ));
            }
        }

        // 创建空文件
        match std::fs::File::create(&path) {
            Ok(_) => {
                println!("File created successfully: {}", path.display());
                Ok(())
            }
            Err(e) => Err(format!("Failed to create file {}: {}", path.display(), e)),
        }
    })
    .await
    .map_err(|e| format!("Background thread failed: {}", e))?;

    result
}

/// Tauri 命令：创建新文件夹（异步方式）
#[tauri::command]
pub async fn create_folder(request: CreateFolderRequest) -> Result<(), String> {
    let result = tauri::async_runtime::spawn_blocking(move || {
        let path = PathBuf::from(&request.path);

        // 检查父目录是否存在
        if let Some(parent) = path.parent() {
            if !parent.exists() {
                return Err(format!(
                    "Parent directory does not exist: {}",
                    parent.display()
                ));
            }
        }

        // 创建目录（包括所有必要的父目录）
        match std::fs::create_dir_all(&path) {
            Ok(_) => {
                println!("Folder created successfully: {}", path.display());
                Ok(())
            }
            Err(e) => Err(format!("Failed to create folder {}: {}", path.display(), e)),
        }
    })
    .await
    .map_err(|e| format!("Background thread failed: {}", e))?;

    result
}

/// Tauri 命令：重命名文件或文件夹（异步方式）
#[tauri::command]
pub async fn rename_item(request: RenameItemRequest) -> Result<(), String> {
    let result = tauri::async_runtime::spawn_blocking(move || {
        let old_path = PathBuf::from(&request.old_path);
        let new_path = old_path
            .parent()
            .map(|parent| parent.join(&request.new_name))
            .ok_or_else(|| "Invalid path".to_string())?;

        // 检查原路径是否存在
        if !old_path.exists() {
            return Err(format!("Item does not exist: {}", old_path.display()));
        }

        // 检查新路径是否已存在
        if new_path.exists() {
            return Err(format!("Item already exists: {}", new_path.display()));
        }

        // 重命名
        match std::fs::rename(&old_path, &new_path) {
            Ok(_) => {
                println!(
                    "Item renamed successfully: {} -> {}",
                    old_path.display(),
                    new_path.display()
                );
                Ok(())
            }
            Err(e) => Err(format!("Failed to rename: {}", e)),
        }
    })
    .await
    .map_err(|e| format!("Background thread failed: {}", e))?;

    result
}

/// Tauri 命令：删除文件或文件夹（异步方式）
#[tauri::command]
pub async fn delete_item(request: DeleteItemRequest) -> Result<(), String> {
    let result = tauri::async_runtime::spawn_blocking(move || {
        let path = PathBuf::from(&request.path);

        // 检查路径是否存在
        if !path.exists() {
            return Err(format!("Item does not exist: {}", path.display()));
        }

        // 检查是文件还是目录
        let metadata =
            std::fs::metadata(&path).map_err(|e| format!("Failed to get metadata: {}", e))?;

        if metadata.is_dir() {
            // 删除目录（递归）
            match std::fs::remove_dir_all(&path) {
                Ok(_) => {
                    println!("Folder deleted successfully: {}", path.display());
                    Ok(())
                }
                Err(e) => Err(format!("Failed to delete folder: {}", e)),
            }
        } else {
            // 删除文件
            match std::fs::remove_file(&path) {
                Ok(_) => {
                    println!("File deleted successfully: {}", path.display());
                    Ok(())
                }
                Err(e) => Err(format!("Failed to delete file: {}", e)),
            }
        }
    })
    .await
    .map_err(|e| format!("Background thread failed: {}", e))?;

    result
}
