use crate::state::{AnalysisResult, AppState, VideoFormat};
use std::process::Command;
use tauri::State;

/// Analyze a URL by running yt-dlp --dump-json and parsing the output
#[tauri::command]
pub async fn analyze_url(
    url: String,
    state: State<'_, AppState>,
) -> Result<AnalysisResult, String> {
    // Kill any existing analysis process
    abort_analysis_inner(&state).await;

    // Spawn yt-dlp --dump-json
    let mut cmd = Command::new("yt-dlp");
    cmd.args(["--dump-json", "--no-playlist", &url])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    let child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start yt-dlp: {}", e))?;

    // Store the PID so it can be aborted
    {
        let mut analyze_pid = state.analyze_process.lock().await;
        *analyze_pid = Some(child.id());
    }

    let output = child
        .wait_with_output()
        .map_err(|e| format!("yt-dlp process error: {}", e))?;

    // Clear the stored PID
    {
        let mut analyze_pid = state.analyze_process.lock().await;
        *analyze_pid = None;
    }

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Analysis failed: {}", stderr.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let json: serde_json::Value =
        serde_json::from_str(&stdout).map_err(|e| format!("Failed to parse yt-dlp output: {}", e))?;

    // Extract video info
    let title = json["title"]
        .as_str()
        .unwrap_or("Unknown Title")
        .to_string();
    let duration = json["duration"].as_f64();
    let thumbnail = json["thumbnail"].as_str().map(|s| s.to_string());
    let uploader = json["uploader"].as_str().map(|s| s.to_string());

    // Parse formats
    let formats = json["formats"]
        .as_array()
        .cloned()
        .unwrap_or_default();

    let mut video_formats = Vec::new();
    let mut audio_formats = Vec::new();
    let mut combined_formats = Vec::new();

    for fmt in &formats {
        let vcodec = fmt["vcodec"]
            .as_str()
            .unwrap_or("none")
            .to_string();
        let acodec = fmt["acodec"]
            .as_str()
            .unwrap_or("none")
            .to_string();

        let has_video = vcodec != "none" && !vcodec.is_empty();
        let has_audio = acodec != "none" && !acodec.is_empty();

        let height = fmt["height"].as_u64().map(|h| h as u32);
        let width = fmt["width"].as_u64().map(|w| w as u32);

        let resolution = if let Some(h) = height {
            format!("{}p", h)
        } else {
            fmt["resolution"]
                .as_str()
                .unwrap_or("unknown")
                .to_string()
        };

        let format = VideoFormat {
            format_id: fmt["format_id"]
                .as_str()
                .unwrap_or("")
                .to_string(),
            ext: fmt["ext"].as_str().unwrap_or("").to_string(),
            resolution: resolution.clone(),
            width,
            height,
            fps: fmt["fps"].as_f64(),
            vcodec: vcodec.clone(),
            acodec: acodec.clone(),
            filesize: fmt["filesize"].as_u64().or(fmt["filesize_approx"].as_u64()),
            tbr: fmt["tbr"].as_f64(),
            abr: fmt["abr"].as_f64(),
            format_note: fmt["format_note"]
                .as_str()
                .unwrap_or("")
                .to_string(),
            has_video,
            has_audio,
        };

        if has_video && has_audio {
            combined_formats.push(format);
        } else if has_video {
            video_formats.push(format);
        } else if has_audio {
            audio_formats.push(format);
        }
    }

    // Sort video formats by height (highest first), then fps
    video_formats.sort_by(|a, b| {
        b.height
            .unwrap_or(0)
            .cmp(&a.height.unwrap_or(0))
            .then_with(|| {
                b.fps
                    .unwrap_or(0.0)
                    .partial_cmp(&a.fps.unwrap_or(0.0))
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
    });

    // Sort audio formats by bitrate (highest first)
    audio_formats.sort_by(|a, b| {
        b.abr
            .unwrap_or(0.0)
            .partial_cmp(&a.abr.unwrap_or(0.0))
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    combined_formats.sort_by(|a, b| {
        b.height
            .unwrap_or(0)
            .cmp(&a.height.unwrap_or(0))
    });

    Ok(AnalysisResult {
        title,
        duration,
        thumbnail,
        uploader,
        video_formats,
        audio_formats,
        combined_formats,
    })
}

/// Abort the current URL analysis process
#[tauri::command]
pub async fn abort_analysis(state: State<'_, AppState>) -> Result<(), String> {
    abort_analysis_inner(&state).await;
    Ok(())
}

async fn abort_analysis_inner(state: &AppState) {
    let mut analyze_pid = state.analyze_process.lock().await;
    if let Some(pid) = analyze_pid.take() {
        // Kill the process by PID
        #[cfg(unix)]
        {
            use std::process::Command;
            Command::new("kill")
                .args(["-9", &pid.to_string()])
                .output()
                .ok();
        }
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            use std::process::Command;
            let mut cmd = Command::new("taskkill");
            cmd.args(["/F", "/PID", &pid.to_string()]);
            cmd.creation_flags(0x08000000);
            cmd.output().ok();
        }
    }
}
