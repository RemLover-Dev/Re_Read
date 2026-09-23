use tauri::{AppHandle, WebviewWindow};
use crate::booru::models::{BooruQueryResult, WallpaperDownloadResult};
use crate::booru::{eshuushuu, safebooru, zerochan};
use crate::storage::cache_manager::CacheManager;
use crate::window::vibrancy::apply_effect;

#[tauri::command]
pub fn set_window_vibrancy(window: WebviewWindow, effect: String) -> Result<(), String> {
    apply_effect(&window, &effect)
}

#[tauri::command]
pub async fn search_booru(
    provider: String,
    tags: String,
    page: u32,
    limit: u32,
) -> Result<BooruQueryResult, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    match provider.to_lowercase().as_str() {
        "zerochan" => Ok(zerochan::query_zerochan(&client, &tags, page, limit).await),
        "eshuushuu" => Ok(eshuushuu::query_eshuushuu(&client, &tags, page, limit).await),
        _ => Ok(safebooru::query_safebooru(&client, &tags, page, limit).await),
    }
}

#[tauri::command]
pub async fn download_wallpaper(
    _app: AppHandle,
    url: String,
    filename: String,
) -> Result<WallpaperDownloadResult, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let manager = CacheManager::new()?;
    match manager.download_and_cache(&client, &url, &filename).await {
        Ok(path) => Ok(WallpaperDownloadResult {
            success: true,
            local_path: Some(path),
            error: None,
        }),
        Err(e) => Ok(WallpaperDownloadResult {
            success: false,
            local_path: None,
            error: Some(e),
        }),
    }
}
