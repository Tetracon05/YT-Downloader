use crate::state::AppState;
use crate::store;
use std::fs;
use std::path::Path;
use tauri::State;

/// Delete a download entry AND its file from disk
#[tauri::command]
pub async fn delete_download(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let mut downloads = state.downloads.lock().await;

    // Find and remove the entry, delete the file
    if let Some(pos) = downloads.iter().position(|d| d.id == id) {
        let file_path = downloads[pos].file_path.clone();
        downloads.remove(pos);

        // Try to delete the file from disk
        if !file_path.is_empty() {
            let path = Path::new(&file_path);
            if path.exists() {
                fs::remove_file(path).ok();
            }
            // Also try to remove .part files (yt-dlp temporary)
            let part_path = format!("{}.part", file_path);
            if Path::new(&part_path).exists() {
                fs::remove_file(&part_path).ok();
            }
        }
    }

    let data_dir = state.data_dir.lock().await;
    store::save_downloads(&data_dir, &downloads);
    Ok(())
}

/// Remove a download entry from the list (keep file on disk)
#[tauri::command]
pub async fn remove_download(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let mut downloads = state.downloads.lock().await;
    downloads.retain(|d| d.id != id);
    let data_dir = state.data_dir.lock().await;
    store::save_downloads(&data_dir, &downloads);
    Ok(())
}

/// Rename a downloaded file on disk and update the entry
#[tauri::command]
pub async fn rename_download(
    state: State<'_, AppState>,
    id: String,
    new_name: String,
) -> Result<String, String> {
    let mut downloads = state.downloads.lock().await;

    let dl = downloads
        .iter_mut()
        .find(|d| d.id == id)
        .ok_or("Download not found")?;

    let old_path = Path::new(&dl.file_path);
    if !old_path.exists() {
        return Err("File not found on disk".to_string());
    }

    let parent = old_path
        .parent()
        .ok_or("Cannot determine parent directory")?;
    let extension = old_path
        .extension()
        .map(|e| e.to_string_lossy().to_string())
        .unwrap_or_default();

    let new_filename = if new_name.contains('.') {
        new_name.clone()
    } else if !extension.is_empty() {
        format!("{}.{}", new_name, extension)
    } else {
        new_name.clone()
    };

    let new_path = parent.join(&new_filename);

    fs::rename(old_path, &new_path)
        .map_err(|e| format!("Failed to rename file: {}", e))?;

    let new_path_str = new_path.to_string_lossy().to_string();
    dl.file_path = new_path_str.clone();
    dl.title = new_name;

    let data_dir = state.data_dir.lock().await;
    store::save_downloads(&data_dir, &downloads);

    Ok(new_path_str)
}

/// Open the file's location in the OS file manager
#[tauri::command]
pub async fn show_in_folder(path: String) -> Result<(), String> {
    let file_path = Path::new(&path);

    if !file_path.exists() {
        return Err("File not found".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| format!("Failed to open Finder: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| format!("Failed to open Explorer: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try xdg-open on the parent directory
        let parent = file_path
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| path.clone());
        std::process::Command::new("xdg-open")
            .arg(&parent)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
    }

    Ok(())
}
