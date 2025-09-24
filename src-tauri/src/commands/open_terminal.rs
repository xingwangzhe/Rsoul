use tauri::AppHandle;

/// Open the system terminal at the specified path.
#[tauri::command]
pub fn open_terminal(_app: AppHandle, path: String) -> Result<(), String> {
    let os = std::env::consts::OS;
    match os {
        "linux" => {
            // Try common Linux terminals
            let terminals = ["gnome-terminal", "konsole", "xfce4-terminal", "xterm"];
            for term in &terminals {
                if std::process::Command::new(term)
                    .arg("--working-directory")
                    .arg(&path)
                    .spawn()
                    .is_ok()
                {
                    return Ok(());
                }
            }
            Err("No supported terminal found".to_string())
        }
        "macos" => {
            std::process::Command::new("open")
                .arg("-a")
                .arg("Terminal")
                .arg(&path)
                .spawn()
                .map_err(|e| e.to_string())?;
            Ok(())
        }
        "windows" => {
            std::process::Command::new("cmd")
                .arg("/c")
                .arg("start")
                .arg("cmd")
                .arg("/k")
                .arg(format!("cd /d {}", path))
                .spawn()
                .map_err(|e| e.to_string())?;
            Ok(())
        }
        _ => Err(format!("Unsupported OS: {}", os)),
    }
}
