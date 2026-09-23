use super::models::{BooruPostSummary, BooruQueryResult};
use reqwest::Client;
use std::path::Path;
use tokio::process::Command;

pub async fn query_zerochan(
    _client: &Client,
    tag: &str,
    page: u32,
    limit: u32,
) -> BooruQueryResult {
    let clean_tag = tag.trim();

    // 1. Try running Python with gallery-dl / curl_cffi from Rems Dl virtualenv
    let python_candidates = [
        r"E:\projects\RemLover-Dev\Rems Dl\.venv\Scripts\python.exe",
        "python",
        "py",
    ];

    let script_candidates = [
        r"scripts\query-zerochan.py",
        r"..\scripts\query-zerochan.py",
        r"E:\projects\RemLover-Dev\Rems Reader\scripts\query-zerochan.py",
    ];

    let mut found_python = None;
    for py in &python_candidates {
        if Path::new(py).exists() || *py == "python" || *py == "py" {
            found_python = Some(py.to_string());
            break;
        }
    }

    let mut found_script = None;
    for sc in &script_candidates {
        if Path::new(sc).exists() {
            found_script = Some(sc.to_string());
            break;
        }
    }

    if let (Some(py_exe), Some(script_path)) = (found_python, found_script) {
        let page_arg = (page + 1).to_string();
        let limit_arg = limit.to_string();

        let output = Command::new(&py_exe)
            .args(&[&script_path, clean_tag, &page_arg, &limit_arg])
            .output()
            .await;

        if let Ok(out) = output {
            if out.status.success() {
                let stdout_str = String::from_utf8_lossy(&out.stdout);
                if let Ok(res) = serde_json::from_str::<serde_json::Value>(&stdout_str) {
                    let mut posts = Vec::new();
                    if let Some(items) = res.get("posts").and_then(|p| p.as_array()) {
                        for item in items {
                            let id = item.get("id").and_then(|i| i.as_str()).unwrap_or("").to_string();
                            let preview_url = item.get("preview_url").and_then(|p| p.as_str()).unwrap_or("").to_string();
                            let file_url = item.get("file_url").and_then(|f| f.as_str()).unwrap_or("").to_string();
                            let width = item.get("width").and_then(|w| w.as_u64()).unwrap_or(1920) as u32;
                            let height = item.get("height").and_then(|h| h.as_u64()).unwrap_or(1080) as u32;
                            let aspect_ratio = item.get("aspect_ratio").and_then(|a| a.as_str()).unwrap_or("Portrait").to_string();
                            let resolution_badge = item.get("resolution_badge").and_then(|r| r.as_str()).unwrap_or("HD").to_string();
                            let tags_arr = item.get("tags").and_then(|t| t.as_array());
                            let tags = tags_arr
                                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
                                .unwrap_or_default();
                            let source = item.get("source").and_then(|s| s.as_str()).map(|s| s.to_string());

                            posts.push(BooruPostSummary {
                                id,
                                provider: "zerochan".to_string(),
                                preview_url,
                                file_url,
                                width,
                                height,
                                aspect_ratio,
                                resolution_badge,
                                tags,
                                artist: None,
                                source,
                            });
                        }
                    }

                    let count = posts.len();
                    return BooruQueryResult {
                        success: true,
                        posts,
                        total_found: count,
                        message: if count == 0 {
                            Some("No wallpapers found on Zerochan for this tag".into())
                        } else {
                            None
                        },
                    };
                }
            }
        }
    }

    BooruQueryResult {
        success: false,
        posts: vec![],
        total_found: 0,
        message: Some("Zerochan requires Python gallery-dl bridge (configured in scripts/query-zerochan.py). Try Safebooru or E-shuushuu.".into()),
    }
}
