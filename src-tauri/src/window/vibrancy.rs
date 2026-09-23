use tauri::WebviewWindow;
use window_vibrancy::{apply_acrylic, apply_mica, clear_acrylic, clear_mica};

pub fn apply_effect(window: &WebviewWindow, effect: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let _ = clear_mica(window);
        let _ = clear_acrylic(window);

        match effect {
            "mica" => {
                apply_mica(window, None)
                    .map_err(|e| format!("Failed to apply Mica: {:?}", e))?;
            }
            "acrylic" => {
                // RGBA tint for dark acrylic: (12, 16, 28, 140)
                apply_acrylic(window, Some((12, 16, 28, 140)))
                    .map_err(|e| format!("Failed to apply Acrylic: {:?}", e))?;
            }
            "none" => {}
            _ => return Err(format!("Unsupported effect: {}", effect)),
        }
    }
    Ok(())
}
