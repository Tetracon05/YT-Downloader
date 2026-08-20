use crate::state::{DependencyStatus, UpdateCheckResult};
use std::process::Command;

/// Check if yt-dlp and ffmpeg are installed and available in PATH
#[tauri::command]
pub async fn check_dependencies() -> Result<DependencyStatus, String> {
    let yt_dlp = check_binary("yt-dlp", &["--version"]);
    let ffmpeg = check_binary("ffmpeg", &["-version"]);

    Ok(DependencyStatus {
        yt_dlp_installed: yt_dlp.is_some(),
        ffmpeg_installed: ffmpeg.is_some(),
        yt_dlp_version: yt_dlp,
        ffmpeg_version: ffmpeg,
    })
}

/// Try to run a binary and return its version string
fn check_binary(name: &str, args: &[&str]) -> Option<String> {
    let mut cmd = Command::new(name);
    cmd.args(args);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    match cmd.output() {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let version = stdout.lines().next().unwrap_or("").trim().to_string();
                Some(version)
            } else {
                None
            }
        }
        Err(_) => {
            #[cfg(target_os = "linux")]
            {
                // Check ~/.local/bin/ in case user installed via pip --user or curl
                if let Some(home) = dirs::home_dir() {
                    let local_path = home.join(".local").join("bin").join(name);
                    if local_path.exists() {
                        let mut fallback_cmd = Command::new(&local_path);
                        fallback_cmd.args(args);
                        if let Ok(output) = fallback_cmd.output() {
                            if output.status.success() {
                                let stdout = String::from_utf8_lossy(&output.stdout);
                                let version = stdout.lines().next().unwrap_or("").trim().to_string();
                                return Some(version);
                            }
                        }
                    }
                }
            }
            None
        }
    }
}

/// Install yt-dlp using the appropriate method for the current OS
#[tauri::command]
pub async fn install_yt_dlp() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        // Try brew first
        let output = Command::new("brew")
            .args(["install", "yt-dlp"])
            .output()
            .map_err(|e| format!("Failed to run brew: {}", e))?;

        if output.status.success() {
            return Ok("yt-dlp installed successfully via Homebrew".to_string());
        }

        // Fallback to pip
        let output = Command::new("pip3")
            .args(["install", "yt-dlp"])
            .output()
            .map_err(|e| format!("Failed to run pip3: {}", e))?;

        if output.status.success() {
            return Ok("yt-dlp installed successfully via pip".to_string());
        }

        Err(format!(
            "Failed to install yt-dlp. Error: {}",
            String::from_utf8_lossy(&output.stderr)
        ))
    }

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;

        // Try winget first
        let mut winget_cmd = Command::new("winget");
        winget_cmd.args(["install", "yt-dlp.yt-dlp"]);
        winget_cmd.creation_flags(0x08000000);
        let output = winget_cmd.output();

        if let Ok(output) = output {
            if output.status.success() {
                return Ok("yt-dlp installed successfully via winget".to_string());
            }
        }

        // Fallback to pip
        let mut pip_cmd = Command::new("pip");
        pip_cmd.args(["install", "yt-dlp"]);
        pip_cmd.creation_flags(0x08000000);
        let output = pip_cmd
            .output()
            .map_err(|e| format!("Failed to run pip: {}", e))?;

        if output.status.success() {
            return Ok("yt-dlp installed successfully via pip".to_string());
        }

        Err(format!(
            "Failed to install yt-dlp. Error: {}",
            String::from_utf8_lossy(&output.stderr)
        ))
    }

    #[cfg(target_os = "linux")]
    {
        // 1. Try pip3 (with --break-system-packages for Debian 12+/Ubuntu 23+)
        if let Ok(output) = Command::new("pip3")
            .args(["install", "--break-system-packages", "yt-dlp"])
            .output()
        {
            if output.status.success() {
                return Ok("yt-dlp installed successfully via pip3".to_string());
            }
        }

        // Standard pip3 fallback
        if let Ok(output) = Command::new("pip3")
            .args(["install", "yt-dlp"])
            .output()
        {
            if output.status.success() {
                return Ok("yt-dlp installed successfully via pip3".to_string());
            }
        }

        // 2. Try pipx
        if let Ok(output) = Command::new("pipx")
            .args(["install", "yt-dlp"])
            .output()
        {
            if output.status.success() {
                return Ok("yt-dlp installed successfully via pipx".to_string());
            }
        }

        // 3. Try apt (Debian/Ubuntu)
        if let Ok(output) = Command::new("sudo")
            .args(["apt", "install", "-y", "yt-dlp"])
            .output()
        {
            if output.status.success() {
                return Ok("yt-dlp installed successfully via apt".to_string());
            }
        }

        // 4. Try dnf (Fedora/RHEL)
        if let Ok(output) = Command::new("sudo")
            .args(["dnf", "install", "-y", "yt-dlp"])
            .output()
        {
            if output.status.success() {
                return Ok("yt-dlp installed successfully via dnf".to_string());
            }
        }

        // 5. Try pacman (Arch Linux)
        if let Ok(output) = Command::new("sudo")
            .args(["pacman", "-S", "--noconfirm", "yt-dlp"])
            .output()
        {
            if output.status.success() {
                return Ok("yt-dlp installed successfully via pacman".to_string());
            }
        }

        // 6. Direct binary download via curl to ~/.local/bin/yt-dlp
        if let Some(home) = dirs::home_dir() {
            let local_bin = home.join(".local").join("bin");
            let _ = std::fs::create_dir_all(&local_bin);
            let target_path = local_bin.join("yt-dlp");
            let target_str = target_path.to_string_lossy().to_string();

            if let Ok(output) = Command::new("curl")
                .args([
                    "-L",
                    "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp",
                    "-o",
                    &target_str,
                ])
                .output()
            {
                if output.status.success() {
                    let _ = Command::new("chmod").args(["a+rx", &target_str]).output();
                    return Ok(format!(
                        "yt-dlp downloaded successfully to {}",
                        target_str
                    ));
                }
            }
        }

        Err("Failed to install yt-dlp. Tried pip3, pipx, apt, dnf, pacman, and direct download. Please install manually.".to_string())
    }
}

/// Install ffmpeg using the appropriate method for the current OS
#[tauri::command]
pub async fn install_ffmpeg() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("brew")
            .args(["install", "ffmpeg"])
            .output()
            .map_err(|e| format!("Failed to run brew: {}", e))?;

        if output.status.success() {
            return Ok("ffmpeg installed successfully via Homebrew".to_string());
        }

        Err(format!(
            "Failed to install ffmpeg. Error: {}",
            String::from_utf8_lossy(&output.stderr)
        ))
    }

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        let mut winget_cmd = Command::new("winget");
        winget_cmd.args(["install", "Gyan.FFmpeg"]);
        winget_cmd.creation_flags(0x08000000);
        let output = winget_cmd.output();

        if let Ok(output) = output {
            if output.status.success() {
                return Ok("ffmpeg installed successfully via winget".to_string());
            }
        }

        Err("Failed to install ffmpeg. Please install manually from https://ffmpeg.org/download.html".to_string())
    }

    #[cfg(target_os = "linux")]
    {
        // Try apt first
        let output = Command::new("sudo")
            .args(["apt", "install", "-y", "ffmpeg"])
            .output();

        if let Ok(output) = output {
            if output.status.success() {
                return Ok("ffmpeg installed successfully via apt".to_string());
            }
        }

        // Try dnf
        let output = Command::new("sudo")
            .args(["dnf", "install", "-y", "ffmpeg"])
            .output();

        if let Ok(output) = output {
            if output.status.success() {
                return Ok("ffmpeg installed successfully via dnf".to_string());
            }
        }

        Err("Failed to install ffmpeg. Please install using your package manager.".to_string())
    }
}

/// Check if a newer version of yt-dlp is available.
/// Compares the locally installed version against the latest GitHub release.
#[tauri::command]
pub async fn check_yt_dlp_update() -> Result<UpdateCheckResult, String> {
    // Get current installed version
    let current = check_binary("yt-dlp", &["--version"])
        .ok_or_else(|| "yt-dlp is not installed".to_string())?;

    // Fetch the latest release tag from GitHub API
    let latest = fetch_latest_yt_dlp_version().await?;

    // Compare: versions are in YYYY.MM.DD or YYYY.MM.DD.HHMMSS format.
    // A simple string comparison works because the format is lexicographically ordered.
    let update_available = normalize_version(&latest) > normalize_version(&current);

    Ok(UpdateCheckResult {
        current_version: current,
        latest_version: latest,
        update_available,
    })
}

/// Fetch the latest yt-dlp version string from GitHub releases API
async fn fetch_latest_yt_dlp_version() -> Result<String, String> {
    let url = "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest";

    // Use curl which is available on all target platforms
    let mut cmd = Command::new("curl");
    cmd.args(["-s", "-A", "yt-downloader-app/1.0", url]);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to fetch latest version: {}", e))?;

    if !output.status.success() {
        return Err("Failed to fetch latest yt-dlp release from GitHub".to_string());
    }

    let body = String::from_utf8_lossy(&output.stdout);

    // Parse "tag_name" from JSON manually to avoid adding serde_json dep here
    // JSON looks like: {..., "tag_name": "2026.08.19", ...}
    let tag = body
        .split("\"tag_name\"")
        .nth(1)
        .and_then(|s| s.split('"').nth(1))
        .map(|s| s.trim().to_string())
        .ok_or_else(|| "Could not parse latest version from GitHub response".to_string())?;

    Ok(tag)
}

/// Normalize a version string: strip leading "stable@", "nightly@" etc.
/// e.g. "stable@2026.08.19" → "2026.08.19", "2026.07.04" → "2026.07.04"
fn normalize_version(v: &str) -> String {
    if let Some(pos) = v.find('@') {
        v[pos + 1..].to_string()
    } else {
        v.to_string()
    }
}

/// Update yt-dlp using the appropriate package manager for the current OS.
/// Returns a success message or an error.
#[tauri::command]
pub async fn update_yt_dlp() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        // Prefer brew if available
        let brew_check = Command::new("which").arg("brew").output();
        if brew_check.map(|o| o.status.success()).unwrap_or(false) {
            let output = Command::new("brew")
                .args(["upgrade", "yt-dlp"])
                .output()
                .map_err(|e| format!("brew upgrade failed: {}", e))?;

            if output.status.success() {
                return Ok("yt-dlp updated successfully via Homebrew".to_string());
            }
            // brew upgrade returns non-zero if already up-to-date; check stderr
            let stderr = String::from_utf8_lossy(&output.stderr);
            if stderr.contains("already installed") || stderr.contains("up-to-date") {
                return Ok("yt-dlp is already up to date".to_string());
            }
        }

        // Fallback: pip with --break-system-packages
        let output = Command::new("pip3")
            .args(["install", "-U", "--break-system-packages", "yt-dlp"])
            .output()
            .map_err(|e| format!("pip3 install failed: {}", e))?;

        if output.status.success() {
            return Ok("yt-dlp updated successfully via pip".to_string());
        }

        Err(format!(
            "Update failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ))
    }

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;

        // Try yt-dlp's built-in self-updater first
        let mut self_update_cmd = Command::new("yt-dlp");
        self_update_cmd.args(["-U"]);
        self_update_cmd.creation_flags(0x08000000);
        if let Ok(output) = self_update_cmd.output() {
            if output.status.success() {
                return Ok("yt-dlp updated successfully via yt-dlp -U".to_string());
            }
        }

        // Try winget
        let mut cmd = Command::new("winget");
        cmd.args(["upgrade", "yt-dlp.yt-dlp", "--accept-package-agreements", "--accept-source-agreements"]);
        cmd.creation_flags(0x08000000);
        if let Ok(output) = cmd.output() {
            if output.status.success() {
                return Ok("yt-dlp updated successfully via winget".to_string());
            }
        }

        // Fallback: pip
        let mut pip_cmd = Command::new("pip");
        pip_cmd.args(["install", "-U", "yt-dlp"]);
        pip_cmd.creation_flags(0x08000000);
        let output = pip_cmd.output();

        if let Ok(output) = output {
            if output.status.success() {
                return Ok("yt-dlp updated successfully via pip".to_string());
            }
        }

        Err("Failed to update yt-dlp via self-update (-U), winget, or pip.".to_string())
    }

    #[cfg(target_os = "linux")]
    {
        // 1. Try yt-dlp's built-in self-updater first
        if let Ok(output) = Command::new("yt-dlp").arg("-U").output() {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                if stdout.contains("is up to date") || stdout.contains("Updated yt-dlp") {
                    return Ok("yt-dlp updated successfully via yt-dlp -U".to_string());
                }
                return Ok("yt-dlp self-update completed".to_string());
            }
        }

        // 2. Try pip3 with --break-system-packages
        if let Ok(output) = Command::new("pip3")
            .args(["install", "-U", "--break-system-packages", "yt-dlp"])
            .output()
        {
            if output.status.success() {
                return Ok("yt-dlp updated successfully via pip3".to_string());
            }
        }

        // 3. Try standard pip3
        if let Ok(output) = Command::new("pip3")
            .args(["install", "-U", "yt-dlp"])
            .output()
        {
            if output.status.success() {
                return Ok("yt-dlp updated successfully via pip3".to_string());
            }
        }

        // 4. Try pipx
        if let Ok(output) = Command::new("pipx")
            .args(["upgrade", "yt-dlp"])
            .output()
        {
            if output.status.success() {
                return Ok("yt-dlp updated successfully via pipx".to_string());
            }
        }

        // 5. Try apt (Debian/Ubuntu)
        if let Ok(output) = Command::new("sudo")
            .args(["apt", "install", "--only-upgrade", "-y", "yt-dlp"])
            .output()
        {
            if output.status.success() {
                return Ok("yt-dlp updated successfully via apt".to_string());
            }
        }

        // 6. Try dnf (Fedora/RHEL)
        if let Ok(output) = Command::new("sudo")
            .args(["dnf", "upgrade", "-y", "yt-dlp"])
            .output()
        {
            if output.status.success() {
                return Ok("yt-dlp updated successfully via dnf".to_string());
            }
        }

        // 7. Try pacman (Arch Linux)
        if let Ok(output) = Command::new("sudo")
            .args(["pacman", "-Sy", "--noconfirm", "yt-dlp"])
            .output()
        {
            if output.status.success() {
                return Ok("yt-dlp updated successfully via pacman".to_string());
            }
        }

        Err("Failed to update yt-dlp via yt-dlp -U, pip3, pipx, apt, dnf, or pacman.".to_string())
    }
}
