use serde_json;
use serde_yaml;
use std::collections::HashMap;
use std::{fs, path::Path};

#[tauri::command]
pub fn save_markdown(file_path: String, content: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent dirs: {}", e))?;
        }
    }

    fs::write(path, content).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn save_markdown_with_frontmatter(
    frontmatter: HashMap<String, serde_json::Value>,
    content: String,
    file_path: String,
) -> Result<(), String> {
    // Check if frontmatter has actual content
    let has_content = frontmatter.values().any(|v| match v {
        serde_json::Value::Array(arr) => !arr.is_empty(),
        serde_json::Value::String(s) => !s.trim().is_empty(),
        serde_json::Value::Number(_) => true,
        serde_json::Value::Bool(_) => true,
        _ => !v.is_null(),
    });

    let full_content = if has_content {
        let yaml_str = serde_yaml::to_string(&frontmatter)
            .map_err(|e| format!("YAML serialization error: {}", e))?;
        format!("---\n{}---\n\n{}", yaml_str, content)
    } else {
        content
    };

    save_markdown(file_path, full_content)
}
