pub mod booru;
pub mod commands;
pub mod storage;
pub mod window;

use tauri::Manager;
use window::vibrancy::apply_effect;

pub fn run() {
    #[cfg(target_os = "windows")]
    {
        if std::env::var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS").is_err() {
            std::env::set_var(
                "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
                "--enable-pinch --enable-viewport --enable-features=TouchpadOverscrollHistoryNavigation",
            );
        }
    }

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

                    let _ = main_window.with_webview(|webview| {
                        unsafe {
                            use webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2Settings5;
                            use windows_core::Interface;
                            let controller = webview.controller();
                            if let Ok(core) = controller.CoreWebView2() {
                                if let Ok(settings) = core.Settings() {
                                    let _ = settings.SetIsZoomControlEnabled(true);
                                    if let Ok(settings5) = settings.cast::<ICoreWebView2Settings5>() {
                                        let _ = settings5.SetIsPinchZoomEnabled(true);
                                    }
                                }
                            }
                        }
                    });
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
