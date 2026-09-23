use std::path::PathBuf;
use directories::ProjectDirs;
use reqwest::Client;
use std::fs;

pub struct CacheManager {
    cache_dir: PathBuf,
}

impl CacheManager {
    pub fn new() -> Result<Self, String> {
        let proj_dirs = ProjectDirs::from("com", "remlover", "reread")
            .ok_or_else(|| "Could not determine local AppData directory".to_string())?;
        
        let cache_dir = proj_dirs.cache_dir().join("wallpapers");
        if !cache_dir.exists() {
            fs::create_dir_all(&cache_dir)
                .map_err(|e| format!("Failed to create wallpaper cache dir: {}", e))?;
        }

        Ok(Self { cache_dir })
    }

    pub fn get_cache_path(&self, filename: &str) -> PathBuf {
        self.cache_dir.join(filename)
    }

    pub async fn download_and_cache(
        &self,
        client: &Client,
        url: &str,
        filename: &str,
    ) -> Result<String, String> {
        let target_path = self.get_cache_path(filename);
        if target_path.exists() {
            if let Ok(meta) = fs::metadata(&target_path) {
                if meta.len() > 1024 {
                    return Ok(target_path.to_string_lossy().to_string());
                }
            }
        }

        let mut candidate_urls = vec![url.to_string()];

        // If e-shuushuu png fails or is probed, also candidate jpg
        if url.contains("cdn.e-shuushuu.net/fullsize/") && url.ends_with(".png") {
            candidate_urls.push(url.replace(".png", ".jpg"));
            candidate_urls.push(url.replace(".png", ".jpeg"));
        } else if url.contains("cdn.e-shuushuu.net/fullsize/") && url.ends_with(".jpg") {
            candidate_urls.push(url.replace(".jpg", ".png"));
        }

        let mut last_err = String::new();
        for cand in candidate_urls {
            let mut req = client.get(&cand);
            if cand.contains("e-shuushuu.net") {
                req = req.header("Referer", "https://e-shuushuu.net/");
            } else if cand.contains("safebooru.org") {
                req = req.header("Referer", "https://safebooru.org/");
            } else if cand.contains("zerochan.net") {
                req = req.header("Referer", "https://www.zerochan.net/");
            }

            match req.send().await {
                Ok(resp) if resp.status().is_success() => {
                    if let Ok(bytes) = resp.bytes().await {
                        if bytes.len() > 1024 {
                            if let Err(e) = fs::write(&target_path, bytes) {
                                return Err(format!("Failed to write wallpaper to disk: {}", e));
                            }
                            return Ok(target_path.to_string_lossy().to_string());
                        }
                    }
                }
                Ok(resp) => {
                    last_err = format!("HTTP {}", resp.status());
                }
                Err(e) => {
                    last_err = e.to_string();
                }
            }
        }

        Err(format!("Download failed: {}", last_err))
    }
}
