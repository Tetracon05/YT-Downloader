use crate::state::DownloadEntry;
use std::fs;
use std::path::PathBuf;

const STORE_FILE: &str = "downloads.json";

/// Get the path to the downloads JSON store file
fn get_store_path(data_dir: &str) -> PathBuf {
    let path = PathBuf::from(data_dir);
    fs::create_dir_all(&path).ok();
    path.join(STORE_FILE)
}

/// Load all download entries from the JSON store
pub fn load_downloads(data_dir: &str) -> Vec<DownloadEntry> {
    let path = get_store_path(data_dir);
    if !path.exists() {
        return Vec::new();
    }

    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => Vec::new(),
    }
}

/// Save all download entries to the JSON store
pub fn save_downloads(data_dir: &str, downloads: &[DownloadEntry]) {
    let path = get_store_path(data_dir);
    if let Ok(json) = serde_json::to_string_pretty(downloads) {
        fs::write(&path, json).ok();
    }
}
