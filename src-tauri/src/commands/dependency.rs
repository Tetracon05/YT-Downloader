use crate::state::{DependencyStatus};
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
        Err(_) => None,
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
        // Try pip first
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
