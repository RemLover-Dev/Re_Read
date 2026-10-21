use tauri::WebviewWindow;
#[cfg(target_os = "windows")]
use window_vibrancy::{apply_mica, clear_acrylic, clear_mica};

pub fn apply_effect(window: &WebviewWindow, effect: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let _ = clear_mica(window);
        let _ = clear_acrylic(window);

        match effect {
            "mica" => {
                // Windows 11 Mica blur (dark mode)
                apply_mica(window, Some(true))
                    .map_err(|e| format!("Failed to apply Mica: {:?}", e))?;
            }
            "acrylic" => {
                // Acrylic causes severe DWM compositor lag and mouse stuttering on Windows 10/11.
                // Prefer smooth Mica if supported; otherwise gracefully clear blur to prevent DWM lag.
                if apply_mica(window, Some(true)).is_err() {
                    let _ = clear_acrylic(window);
                }
            }
            "none" | "off" => {
                let _ = clear_mica(window);
                let _ = clear_acrylic(window);
            }
            _ => return Err(format!("Unsupported effect: {}", effect)),
        }
    }
    #[cfg(not(target_os = "windows"))]
    let _ = (window, effect);
    Ok(())
}
