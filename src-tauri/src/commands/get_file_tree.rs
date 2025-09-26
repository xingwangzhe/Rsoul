use serde::Deserialize;
use serde::Serialize;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_store::StoreExt;

/// 表示发送给前端的文件或目录结构化节点（例如 n-tree）
#[derive(Debug, Serialize)]
pub struct TreeNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    /// 对于目录，children 为 Some(vec)（可能为空），对于文件为 None
    pub children: Option<Vec<TreeNode>>,
    /// 文件的大小（字节），目录或未知为 None
    pub size: Option<u64>,
}

/// 限制以避免读取过深或过多节点的大文件夹。
/// 根据需要调整这些常量。
const MAX_DEPTH: usize = 6;
const MAX_NODES: usize = 5000;

/// 递归为 `path` 构建 TreeNode。
/// 使用 `node_count` 在递归中强制全局最大节点限制。
fn build_tree(path: &Path, depth: usize, node_count: &mut usize) -> Result<TreeNode, io::Error> {
    // 如果达到节点限制，提前退出
    if *node_count >= MAX_NODES {
        return Err(io::Error::new(io::ErrorKind::Other, "node limit reached"));
    }

    let metadata = fs::symlink_metadata(path)?;
    let file_name = path
        .file_name()
        .and_then(|s| s.to_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| path.to_string_lossy().to_string());

    if metadata.is_dir() {
        // 目录
        let mut children: Vec<TreeNode> = Vec::new();

        // 如果达到深度限制，不再深入；返回空 children。
        if depth < MAX_DEPTH {
            // 读取条目；如果读取目录出错，跳过 children 但返回节点
            match fs::read_dir(path) {
                Ok(read_dir) => {
                    // 收集条目并按文件名排序以保持确定性顺序
                    let mut entries: Vec<PathBuf> = read_dir
                        .filter_map(|res| res.ok().and_then(|e| Some(e.path())))
                        .collect();
                    entries.sort_by_key(|p| p.file_name().map(|n| n.to_os_string()));

                    for entry_path in entries {
                        if *node_count >= MAX_NODES {
                            break;
                        }

                        // 通过对每个条目使用 symlink_metadata 避免跟随符号链接目录
                        match build_tree(&entry_path, depth + 1, node_count) {
                            Ok(child_node) => {
                                children.push(child_node);
                            }
                            Err(_) => {
                                // 如果特定子项失败（权限、损坏的符号链接等），跳过它。
                                continue;
                            }
                        }
                    }
                }
                Err(_) => {
                    // 无法读取目录条目（权限？），保持 children 为空
                }
            }
        }

        *node_count += 1;
        Ok(TreeNode {
            name: file_name,
            path: path.to_string_lossy().to_string(),
            is_dir: true,
            children: Some(children),
            size: None,
        })
    } else {
        // 文件：如果可用，获取大小
        let size = metadata.len();
        *node_count += 1;
        Ok(TreeNode {
            name: file_name,
            path: path.to_string_lossy().to_string(),
            is_dir: false,
            children: None,
            size: Some(size),
        })
    }
}

/// Tauri 命令：弹出文件夹选择器，选择文件夹并保存路径，然后构建文件树。
/// 重/阻塞工作（对话框 + 文件系统遍历）在阻塞线程中执行，以避免阻塞主线程。
#[tauri::command]
pub async fn get_file_tree(app: AppHandle) -> Result<TreeNode, String> {
    // 克隆句柄以在阻塞闭包中使用
    let app_handle = app.clone();

    // 在阻塞线程中运行阻塞对话框 + 遍历，以不阻塞运行时/主线程。
    let res = tauri::async_runtime::spawn_blocking(move || {
        // 显示阻塞文件夹选择器。这返回 Option<file_path>
        let selected = app_handle
            .dialog()
            .file()
            .blocking_pick_folder()
            .ok_or_else(|| io::Error::new(io::ErrorKind::Other, "用户未选择文件夹"))?;

        // 转换为 PathBuf
        let root_path = PathBuf::from(selected.to_string());

        // 保存到存储
        let store = app_handle
            .store(".settings.dat")
            .map_err(|e| io::Error::new(io::ErrorKind::Other, format!("无法访问存储: {}", e)))?;
        store.set("selectedPath", root_path.to_string_lossy().to_string());

        // 使用限制构建树以避免内存/时间爆炸
        let mut node_count: usize = 0;
        match build_tree(&root_path, 0usize, &mut node_count) {
            Ok(tree) => Ok(tree),
            Err(e) => Err(e),
        }
    })
    .await
    .map_err(|e| format!("后台线程执行失败: {}", e))?;

    match res {
        Ok(tree_node) => Ok(tree_node),
        Err(io_err) => Err(format!("无法读取目录: {}", io_err)),
    }
}

/// Tauri 命令：从指定路径构建文件树，而不弹出选择器。
#[tauri::command]
pub async fn get_file_tree_from_path(path: String) -> Result<TreeNode, String> {
    // 在阻塞线程中运行文件系统遍历，以避免阻塞主线程。
    let res = tauri::async_runtime::spawn_blocking(move || {
        let root_path = PathBuf::from(path);

        // 使用限制构建树以避免内存/时间爆炸
        let mut node_count: usize = 0;
        match build_tree(&root_path, 0usize, &mut node_count) {
            Ok(tree) => Ok(tree),
            Err(e) => Err(e),
        }
    })
    .await
    .map_err(|e| format!("后台线程执行失败: {}", e))?;

    match res {
        Ok(tree_node) => Ok(tree_node),
        Err(io_err) => Err(format!("无法读取目录: {}", io_err)),
    }
}

/// Tauri 命令：获取存储的文件夹路径。
#[tauri::command]
pub fn get_stored_path(app: AppHandle) -> Result<Option<String>, String> {
    let store = app
        .store(".settings.dat")
        .map_err(|e| format!("无法访问存储: {}", e))?;
    let path = store
        .get("selectedPath")
        .and_then(|v| v.as_str().map(|s| s.to_string()));
    Ok(path)
}

#[derive(Debug, Deserialize)]
pub struct SetWorkingDirectoryRequest {
    pub path: String,
}

/// Tauri 命令：设置新的工作目录并更新存储。
#[tauri::command]
pub fn set_working_directory(
    app: AppHandle,
    request: SetWorkingDirectoryRequest,
) -> Result<(), String> {
    let path = PathBuf::from(&request.path);

    // 检查路径是否存在且为目录
    if !path.exists() {
        return Err(format!("路径不存在: {}", path.display()));
    }

    if !path.is_dir() {
        return Err(format!("路径不是目录: {}", path.display()));
    }

    // 保存到存储
    let store = app
        .store(".settings.dat")
        .map_err(|e| format!("无法访问存储: {}", e))?;
    store.set("selectedPath", request.path);

    Ok(())
}
