mod commands;
use commands::get_file_content::get_file_content;
use commands::get_file_tree::{get_file_tree, get_file_tree_from_path, get_stored_path};
use commands::save_frontmatter::{
    collect_frontmatter_suggestions, load_frontmatter, load_frontmatter_suggestions,
    save_frontmatter,
};
use commands::save_markdown::{save_markdown, save_markdown_with_frontmatter};
use tauri::menu::MenuBuilder;
use tauri::Emitter;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_file_tree,
            get_file_tree_from_path,
            get_stored_path,
            get_file_content,
            save_markdown,
            save_markdown_with_frontmatter,
            save_frontmatter,
            load_frontmatter,
            collect_frontmatter_suggestions,
            load_frontmatter_suggestions
        ])
        .setup(|app| {
            let menu = MenuBuilder::new(app)
                .text("nav-home", "Editor")
                .text("nav-about", "About")
                .text("nav-settings", "Settings")
                .build()?;
            app.set_menu(menu.clone())?;
            app.on_menu_event(move |app_handle: &tauri::AppHandle, event| {
                println!("menu event: {:?}", event.id());
                match event.id().0.as_str() {
                    "nav-home" => {
                        println!("nav-home");
                        app_handle.emit("change_router", "/").unwrap()
                    }
                    "nav-about" => {
                        println!("nav-about");
                        app_handle.emit("change_router", "/about").unwrap()
                    }
                    "nav-settings" => {
                        println!("nav-settings");
                        app_handle.emit("change_router", "/settings").unwrap()
                    }
                    _ => {
                        println!("nothing")
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
