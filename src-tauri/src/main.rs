// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "macos")]
    {
        // When launched from Finder as a .app, macOS strips the PATH environment variable.
        // We inject common Homebrew paths so that we can find `brew`, `yt-dlp`, and `ffmpeg`.
        if let Some(path) = std::env::var_os("PATH") {
            let mut paths = std::env::split_paths(&path).collect::<Vec<_>>();
            paths.push(std::path::PathBuf::from("/usr/local/bin")); // Intel Macs
            paths.push(std::path::PathBuf::from("/opt/homebrew/bin")); // Apple Silicon Macs
            if let Ok(new_path) = std::env::join_paths(paths) {
                std::env::set_var("PATH", &new_path);
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        // Prepend ~/.local/bin and /usr/local/bin so updated binaries take precedence over stale apt packages in /usr/bin
        if let Some(home) = dirs::home_dir() {
            let local_bin = home.join(".local").join("bin");
            if let Some(path) = std::env::var_os("PATH") {
                let mut paths = vec![local_bin, std::path::PathBuf::from("/usr/local/bin")];
                paths.extend(std::env::split_paths(&path));
                if let Ok(new_path) = std::env::join_paths(paths) {
                    std::env::set_var("PATH", &new_path);
                }
            }
        }
    }
    tauri_app_lib::run()
}
