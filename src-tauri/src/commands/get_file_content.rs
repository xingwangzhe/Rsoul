use std::fs;
#[tauri::command]

pub fn get_file_content(file_path: String) -> Result<String, String> {
    fs::read_to_string(&file_path).map_err(|e| e.to_string())
}
