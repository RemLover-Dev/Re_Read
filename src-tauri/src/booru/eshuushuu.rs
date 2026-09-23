use super::models::{BooruPostSummary, BooruQueryResult};
use reqwest::Client;
use std::collections::HashSet;

/// Known Re:Zero character tag IDs on e-shuushuu for instant zero-latency lookup
fn get_known_re_zero_tag_id(tag: &str) -> Option<&'static str> {
    let lower = tag.trim().to_lowercase();
    match lower.as_str() {
        "rem" | "rem_(re:zero)" => Some("99369"),
        "ram" | "ram_(re:zero)" => Some("99370"),
        "emilia" | "emilia_(re:zero)" => Some("98504"),
        "natsuki subaru" | "subaru" | "natsuki_subaru" => Some("99368"),
        "beatrice" | "beatrice_(re:zero)" => Some("99371"),
        "echidna" | "echidna_(re:zero)" => Some("208753"),
        "felt" | "felt_(re:zero)" => Some("99372"),
        "crusch karsten" | "crusch" | "crusch_karsten" => Some("170691"),
        "felix argyle" | "felix" | "ferris" | "felix_argyle" => Some("170693"),
        "priscilla barielle" | "priscilla" | "priscilla_barielle" => Some("170692"),
        "anastasia hoshin" | "anastasia" | "anastasia_hoshin" => Some("170694"),
        "reinhard van astrea" | "reinhard" | "reinhard_van_astrea" => Some("99373"),
        "satella" | "satella_(re:zero)" => Some("213195"),
        "theresia van astrea" | "theresia" => Some("176461"),
        "wilhelm van astrea" | "wilhelm" => Some("170690"),
        "otto suwen" | "otto" => Some("170689"),
        "garfiel tinsel" | "garfiel" => Some("209865"),
        "frederica baumann" | "frederica" => Some("208752"),
        "petra leyte" | "petra" => Some("171173"),
        "shaula" | "shaula_(re:zero)" => Some("222718"),
        "carmilla" => Some("212061"),
        "minerva" => Some("211756"),
        "daphne" => Some("212060"),
        "typhon" => Some("211757"),
        "sekhmet" => Some("212059"),
        "pandora" => Some("216480"),
        "petelgeuse romanee-conti" | "petelgeuse" => Some("170695"),
        "regulus corneas" | "regulus" => Some("208754"),
        "capella emerada lugnica" | "capella" => Some("226065"),
        "sirius romanee-conti" | "sirius" => Some("226066"),
        "julius juukulius" | "julius" => Some("170696"),
        "mimi pearlbaton" | "mimi" => Some("171171"),
        "elsa granhiert" | "elsa" => Some("170688"),
        "meili portroute" | "meili" => Some("171172"),
        "aldebaran" | "al" => Some("170697"),
        _ => None,
    }
}

pub async fn query_eshuushuu(
    client: &Client,
    tag: &str,
    page: u32,
    _limit: u32,
) -> BooruQueryResult {
    let clean_tag = tag.trim();
    let mut resolved_tag_id: String = String::new();

    // 1. Check if the input is already a numeric tag ID
    if !clean_tag.is_empty() && clean_tag.chars().all(|c| c.is_ascii_digit()) {
        resolved_tag_id = clean_tag.to_string();
    } else if let Some(known_id) = get_known_re_zero_tag_id(clean_tag) {
        resolved_tag_id = known_id.to_string();
    } else {
        // Query e-shuushuu tag lookup API
        let lookup_url = format!(
            "https://e-shuushuu.net/api/v1/tags?search={}",
            urlencoding::encode(clean_tag)
        );

        if let Ok(resp) = client.get(&lookup_url)
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            .header("Referer", "https://e-shuushuu.net/")
            .send()
            .await
        {
            if resp.status().is_success() {
                if let Ok(json) = resp.json::<serde_json::Value>().await {
                    if let Some(tags_arr) = json.get("tags").and_then(|t| t.as_array()) {
                        let mut best_id: Option<String> = None;
                        let mut best_usage: u64 = 0;

                        for t in tags_arr {
                            let title = t.get("title").and_then(|v| v.as_str()).unwrap_or("");
                            let ttype = t.get("type").and_then(|v| v.as_u64()).unwrap_or(0);
                            let usage = t.get("usage_count").and_then(|v| v.as_u64()).unwrap_or(0);
                            let tid = t.get("tag_id").map(|v| v.to_string()).unwrap_or_default();

                            if title.eq_ignore_ascii_case(clean_tag) {
                                if ttype == 4 { // Type 4 is character in e-shuushuu
                                    best_id = Some(tid);
                                    break;
                                } else if usage >= best_usage {
                                    best_usage = usage;
                                    best_id = Some(tid);
                                }
                            } else if best_id.is_none() && ttype == 4 {
                                best_id = Some(tid);
                            }
                        }

                        if let Some(id) = best_id {
                            resolved_tag_id = id;
                        }
                    }
                }
            }
        }
    }

    // Default to Rem tag ID if nothing was resolved
    if resolved_tag_id.is_empty() {
        resolved_tag_id = "99369".to_string(); // Rem
    }

    let search_page = page + 1;
    let search_url = format!(
        "https://e-shuushuu.net/search?tags={}&page={}",
        resolved_tag_id,
        search_page
    );

    let resp = match client.get(&search_url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .header("Referer", "https://e-shuushuu.net/")
        .send()
        .await
    {
        Ok(r) => r,
        Err(e) => {
            return BooruQueryResult {
                success: false,
                posts: vec![],
                total_found: 0,
                message: Some(format!("E-shuushuu connection error: {}", e)),
            };
        }
    };

    if !resp.status().is_success() {
        return BooruQueryResult {
            success: true,
            posts: vec![],
            total_found: 0,
            message: Some(format!("E-shuushuu returned HTTP {}", resp.status())),
        };
    }

    let html = resp.text().await.unwrap_or_default();
    let mut posts = Vec::new();
    let mut seen_ids = HashSet::new();

    // Match /thumbs/YYYY-MM-DD-ID.webp
    let regex = regex::Regex::new(r#"/thumbs/(\d{4}-\d{2}-\d{2})-(\d+)\.webp"#).unwrap();
    for cap in regex.captures_iter(&html) {
        let date = &cap[1];
        let id_str = &cap[2];

        if !seen_ids.insert(id_str.to_string()) {
            continue;
        }

        let filename = format!("{}-{}", date, id_str);
        let preview_url = format!("https://cdn.e-shuushuu.net/thumbs/{}.webp", filename);
        let file_url = format!("https://cdn.e-shuushuu.net/fullsize/{}.png", filename);
        let source = format!("https://e-shuushuu.net/images/{}", id_str);

        posts.push(BooruPostSummary {
            id: id_str.to_string(),
            provider: "eshuushuu".to_string(),
            preview_url,
            file_url,
            width: 1920,
            height: 1080,
            aspect_ratio: "Portrait".to_string(),
            resolution_badge: "HD".to_string(),
            tags: vec![clean_tag.to_string(), "re:zero".to_string()],
            artist: None,
            source: Some(source),
        });
    }

    let count = posts.len();
    BooruQueryResult {
        success: true,
        posts,
        total_found: count,
        message: if count == 0 {
            Some("No wallpapers found on E-shuushuu for this tag".into())
        } else {
            None
        },
    }
}
