mod commands;
mod state;
mod store;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_drag::init())
        .setup(|app| {
            // Determine app data directory for persistence
            let data_dir = app
                .path()
                .app_data_dir()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_else(|_| {
                    dirs::data_dir()
                        .map(|p| p.join("yt-downloader").to_string_lossy().to_string())
                        .unwrap_or_else(|| ".".to_string())
                });

            // Create data directory if needed
            std::fs::create_dir_all(&data_dir).ok();

            // Load persisted downloads
            let downloads = store::load_downloads(&data_dir);

            let app_state = AppState::new(data_dir, downloads);

            app.manage(app_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::dependency::check_dependencies,
            commands::dependency::install_yt_dlp,
            commands::dependency::install_ffmpeg,
            commands::dependency::check_yt_dlp_update,
            commands::dependency::update_yt_dlp,
            commands::analyze::analyze_url,
            commands::analyze::abort_analysis,
            commands::download::start_download,
            commands::download::cancel_download,
            commands::download::get_downloads,
            commands::download::get_default_download_dir,
            commands::file_ops::delete_download,
            commands::file_ops::remove_download,
            commands::file_ops::rename_download,
            commands::file_ops::show_in_folder,
            commands::file_ops::start_drag,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
