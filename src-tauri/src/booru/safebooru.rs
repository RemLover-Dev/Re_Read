use super::models::{BooruPostSummary, BooruQueryResult};
use reqwest::Client;

pub async fn query_safebooru(
    client: &Client,
    tags: &str,
    page: u32,
    limit: u32,
) -> BooruQueryResult {
    let url = format!(
        "https://safebooru.org/index.php?page=dapi&s=post&q=index&tags={}&pid={}&limit={}&json=1",
        urlencoding::encode(tags.trim()),
        page,
        limit
    );

    let resp = match client.get(&url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            return BooruQueryResult {
                success: false,
                posts: vec![],
                total_found: 0,
                message: Some(format!("Safebooru network error: {}", e)),
            };
        }
    };

    if !resp.status().is_success() {
        return BooruQueryResult {
            success: false,
            posts: vec![],
            total_found: 0,
            message: Some(format!("Safebooru returned HTTP status {}", resp.status())),
        };
    }

    let raw_posts: Vec<serde_json::Value> = match resp.json().await {
        Ok(p) => p,
        Err(_) => {
            // Safebooru returns empty string on zero matches or invalid XML
            return BooruQueryResult {
                success: true,
                posts: vec![],
                total_found: 0,
                message: Some("No community wallpapers found — using procedural theme".into()),
            };
        }
    };

    let mut posts = Vec::new();
    for p in &raw_posts {
        if let Some(id_val) = p.get("id") {
            let id_str = id_val.to_string();
            
            let dir = p.get("directory")
                .map(|d| if let Some(s) = d.as_str() { s.to_string() } else { d.to_string() })
                .unwrap_or_default();
            let img = p.get("image").and_then(|i| i.as_str()).unwrap_or("");

            // Safebooru API provides direct preview_url and file_url
            let preview_url = if let Some(u) = p.get("preview_url").and_then(|v| v.as_str()) {
                if u.starts_with("//") {
                    format!("https:{}", u)
                } else if !u.starts_with("http") {
                    format!("https://safebooru.org/{}", u.trim_start_matches('/'))
                } else {
                    u.to_string()
                }
            } else {
                format!("https://safebooru.org/thumbnails/{}/thumbnail_{}", dir, img)
            };

            let file_url = if let Some(u) = p.get("file_url").and_then(|v| v.as_str()) {
                if u.starts_with("//") {
                    format!("https:{}", u)
                } else if !u.starts_with("http") {
                    format!("https://safebooru.org/{}", u.trim_start_matches('/'))
                } else {
                    u.to_string()
                }
            } else if let Some(u) = p.get("sample_url").and_then(|v| v.as_str()) {
                if u.starts_with("//") {
                    format!("https:{}", u)
                } else {
                    u.to_string()
                }
            } else {
                format!("https://safebooru.org/images/{}/{}", dir, img)
            };

            let width = p.get("width").and_then(|w| w.as_u64()).unwrap_or(0) as u32;
            let height = p.get("height").and_then(|h| h.as_u64()).unwrap_or(0) as u32;
            let tags_raw = p.get("tags").and_then(|t| t.as_str()).unwrap_or("");
            let tags_list: Vec<String> = tags_raw.split_whitespace().map(|s| s.to_string()).collect();

            // Compute aspect ratio & resolution badge
            let aspect_ratio = if height > 0 {
                let ratio = (width as f32) / (height as f32);
                if (ratio - 1.77).abs() < 0.15 {
                    "16:9".to_string()
                } else if (ratio - 1.6).abs() < 0.15 {
                    "16:10".to_string()
                } else if (ratio - 1.33).abs() < 0.15 {
                    "4:3".to_string()
                } else if ratio > 1.15 {
                    "Landscape".to_string()
                } else {
                    "Portrait".to_string()
                }
            } else {
                "Unknown".to_string()
            };

            let resolution_badge = if width >= 3840 || height >= 2160 {
                "4K UHD".to_string()
            } else if width >= 2560 || height >= 1440 {
                "2K QHD".to_string()
            } else if width >= 1920 || height >= 1080 {
                "FHD".to_string()
            } else if width >= 1280 || height >= 720 {
                "HD".to_string()
            } else {
                format!("{}x{}", width, height)
            };

            posts.push(BooruPostSummary {
                id: id_str,
                provider: "safebooru".to_string(),
                preview_url,
                file_url,
                width,
                height,
                aspect_ratio,
                resolution_badge,
                tags: tags_list,
                artist: None,
                source: p.get("source").and_then(|s| s.as_str()).map(|s| s.to_string()),
            });
        }
    }

    let count = posts.len();
    BooruQueryResult {
        success: true,
        posts,
        total_found: count,
        message: if count == 0 {
            Some("No community wallpapers found — using procedural theme".into())
        } else {
            None
        },
    }
}
