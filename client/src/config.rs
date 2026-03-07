pub const API_URL: &str = env!("API_URL");
pub const USERNAME: &str = env!("USERNAME");
pub const PASSWORD: &str = env!("PASSWORD");

pub const LOG: bool = cfg!(oneway_log);
pub const DEBUG: bool = cfg!(oneway_debug);

pub fn insecure_tls_enabled() -> bool {
    std::env::var("ONEWAY_INSECURE_TLS")
        .map(|value| matches!(value.to_ascii_lowercase().as_str(), "1" | "true" | "yes"))
        .unwrap_or(false)
}

pub fn backend_cert_path() -> std::path::PathBuf {
    if let Ok(path) = std::env::var("ONEWAY_TLS_CERT") {
        return std::path::PathBuf::from(path);
    }

    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());

    std::path::PathBuf::from(home)
        .join(".onewAy")
        .join("onewAy.crt")
}
