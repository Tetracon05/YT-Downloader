import { invoke } from "@tauri-apps/api/core";
import type {
  AnalysisResult,
  DependencyStatus,
  DownloadEntry,
} from "../types";

// ===== Dependency Commands =====

export async function checkDependencies(): Promise<DependencyStatus> {
  return invoke("check_dependencies");
}

export async function installYtDlp(): Promise<string> {
  return invoke("install_yt_dlp");
}

export async function installFfmpeg(): Promise<string> {
  return invoke("install_ffmpeg");
}

// ===== Analysis Commands =====

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  return invoke("analyze_url", { url });
}

export async function abortAnalysis(): Promise<void> {
  return invoke("abort_analysis");
}

// ===== Download Commands =====

export async function startDownload(params: {
  id: string;
  url: string;
  title: string;
  formatArgs: string[];
  outputPath: string;
  kind: string;
}): Promise<void> {
  return invoke("start_download", params);
}

export async function pauseDownload(id: string): Promise<void> {
  return invoke("pause_download", { id });
}

export async function resumeDownload(
  id: string,
  formatArgs: string[]
): Promise<void> {
  return invoke("resume_download", { id, formatArgs });
}

export async function cancelDownload(id: string): Promise<void> {
  return invoke("cancel_download", { id });
}

export async function getDownloads(): Promise<DownloadEntry[]> {
  return invoke("get_downloads");
}

export async function getDefaultDownloadDir(): Promise<string> {
  return invoke("get_default_download_dir");
}

// ===== File Operation Commands =====

export async function deleteDownload(id: string): Promise<void> {
  return invoke("delete_download", { id });
}

export async function removeDownload(id: string): Promise<void> {
  return invoke("remove_download", { id });
}

export async function renameDownload(
  id: string,
  newName: string
): Promise<string> {
  return invoke("rename_download", { id, newName });
}

export async function showInFolder(path: string): Promise<void> {
  return invoke("show_in_folder", { path });
}
