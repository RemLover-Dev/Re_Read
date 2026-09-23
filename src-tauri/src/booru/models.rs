use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BooruPostSummary {
    pub id: String,
    pub provider: String,
    pub preview_url: String,
    pub file_url: String,
    pub width: u32,
    pub height: u32,
    pub aspect_ratio: String,
    pub resolution_badge: String,
    pub tags: Vec<String>,
    pub artist: Option<String>,
    pub source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BooruQueryResult {
    pub success: bool,
    pub posts: Vec<BooruPostSummary>,
    pub total_found: usize,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WallpaperDownloadResult {
    pub success: bool,
    pub local_path: Option<String>,
    pub error: Option<String>,
}
