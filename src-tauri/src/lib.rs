pub mod booru;
pub mod commands;
pub mod storage;
pub mod window;

use tauri::Manager;
use window::vibrancy::apply_effect;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if let Some(main_window) = app.get_webview_window("main") {
                #[cfg(target_os = "windows")]
                {
                    // Default to Windows 11 Mica blur
                    let _ = apply_effect(&main_window, "mica");
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::set_window_vibrancy,
            commands::search_booru,
            commands::download_wallpaper
        ])
        .run(tauri::generate_context!())
        .expect("error while running Re:Read application");
}
