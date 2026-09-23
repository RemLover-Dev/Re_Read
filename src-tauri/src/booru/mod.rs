pub mod eshuushuu;
pub mod models;
pub mod safebooru;
pub mod zerochan;

#[cfg(test)]
mod tests {
    use super::*;
    use reqwest::Client;

    #[tokio::test]
    async fn test_safebooru_query() {
        let client = Client::builder()
            .user_agent("Mozilla/5.0")
            .build()
            .unwrap();
        let res = safebooru::query_safebooru(&client, "rem_(re:zero)", 0, 5).await;
        assert!(res.success, "Safebooru query should succeed");
        assert!(!res.posts.is_empty(), "Should return posts for Rem");
        assert!(res.posts[0].preview_url.starts_with("https://safebooru.org/"), "Preview URL should be fully qualified");
    }

    #[tokio::test]
    async fn test_eshuushuu_query() {
        let client = Client::builder()
            .user_agent("Mozilla/5.0")
            .build()
            .unwrap();
        let res = eshuushuu::query_eshuushuu(&client, "Rem", 0, 5).await;
        assert!(res.success, "Eshuushuu query should succeed");
        assert!(!res.posts.is_empty(), "Should return posts from e-shuushuu");
        assert!(res.posts[0].preview_url.contains("cdn.e-shuushuu.net"), "Eshuushuu thumb should use cdn");
    }

    #[tokio::test]
    async fn test_zerochan_query() {
        let client = Client::builder()
            .user_agent("Mozilla/5.0")
            .build()
            .unwrap();
        let res = zerochan::query_zerochan(&client, "Rem (Re:Zero)", 0, 3).await;
        assert!(res.success, "Zerochan query should succeed");
        assert!(!res.posts.is_empty(), "Should return posts from zerochan");
        assert!(res.posts[0].preview_url.contains("zerochan.net"), "Zerochan thumb should use zerochan CDN");
    }
}
