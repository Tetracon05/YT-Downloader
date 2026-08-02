import React, { useState, useEffect } from "react";
import { useDownloadStore } from "../store/useDownloadStore";
import * as api from "../lib/tauri";
import type { DependencyStatus } from "../types";
export const DependencyCheck: React.FC = () => {
  const { setDependencyStatus, setDependencyChecked } = useDownloadStore();
  const [status, setStatus] = useState<DependencyStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [installingYtDlp, setInstallingYtDlp] = useState(false);
  const [installingFfmpeg, setInstallingFfmpeg] = useState(false);
  const [ytDlpMessage, setYtDlpMessage] = useState<string | null>(null);
  const [ffmpegMessage, setFfmpegMessage] = useState<string | null>(null);
  const [ytDlpError, setYtDlpError] = useState<string | null>(null);
  const [ffmpegError, setFfmpegError] = useState<string | null>(null);

  const checkDeps = async () => {
    setChecking(true);
    try {
      const result = await api.checkDependencies();
      setStatus(result);
      setDependencyStatus(result);

      // If both installed, proceed automatically
      if (result.yt_dlp_installed && result.ffmpeg_installed) {
        setDependencyChecked(true);
      }
    } catch (err) {
      console.error("Failed to check dependencies:", err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkDeps();
  }, []);

  const handleInstallYtDlp = async () => {
    setInstallingYtDlp(true);
    setYtDlpError(null);
    setYtDlpMessage(null);
    try {
      const msg = await api.installYtDlp();
      setYtDlpMessage(msg);
      // Re-check dependencies
      await checkDeps();
    } catch (err) {
      setYtDlpError(String(err));
    } finally {
      setInstallingYtDlp(false);
    }
  };

  const handleInstallFfmpeg = async () => {
    setInstallingFfmpeg(true);
    setFfmpegError(null);
    setFfmpegMessage(null);
    try {
      const msg = await api.installFfmpeg();
      setFfmpegMessage(msg);
      // Re-check dependencies
      await checkDeps();
    } catch (err) {
      setFfmpegError(String(err));
    } finally {
      setInstallingFfmpeg(false);
    }
  };

  const handleContinue = () => {
    setDependencyChecked(true);
  };

  if (checking) {
    return (
      <div className="dependency-screen">
        <div className="dependency-card">
          <div className="spinner spinner-large" />
          <h2 className="dependency-title">Checking dependencies...</h2>
          <p className="dependency-subtitle">
            Looking for yt-dlp and ffmpeg on your system
          </p>
        </div>
      </div>
    );
  }

  if (!status) return null;

  const allInstalled = status.yt_dlp_installed && status.ffmpeg_installed;

  return (
    <div className="dependency-screen">
      <div className="dependency-card">
        <div className="dependency-icon">⚙️</div>
        <h2 className="dependency-title">
          {allInstalled ? "All Ready!" : "Setup Required"}
        </h2>
        <p className="dependency-subtitle">
          {allInstalled
            ? "All dependencies are installed and ready to use."
            : "YT Downloader requires the following tools to be installed:"}
        </p>

        <div className="dependency-list">
          {/* yt-dlp */}
          <div
            className={`dependency-item ${
              status.yt_dlp_installed ? "installed" : "missing"
            }`}
          >
            <div className="dependency-item-header">
              <div className="dependency-item-info">
                <span
                  className={`status-dot ${
                    status.yt_dlp_installed ? "green" : "red"
                  }`}
                />
                <div>
                  <span className="dependency-name">yt-dlp</span>
                  {status.yt_dlp_version && (
                    <span className="dependency-version">
                      v{status.yt_dlp_version}
                    </span>
                  )}
                </div>
              </div>
              {!status.yt_dlp_installed && (
                <button
                  className="btn btn-install"
                  onClick={handleInstallYtDlp}
                  disabled={installingYtDlp}
                >
                  {installingYtDlp ? (
                    <>
                      <div className="spinner spinner-small" /> Installing...
                    </>
                  ) : (
                    "Install"
                  )}
                </button>
              )}
              {status.yt_dlp_installed && (
                <span className="installed-badge">✓ Installed</span>
              )}
            </div>
            {ytDlpMessage && (
              <p className="dependency-message success">{ytDlpMessage}</p>
            )}
            {ytDlpError && (
              <p className="dependency-message error">{ytDlpError}</p>
            )}
            {!status.yt_dlp_installed && !installingYtDlp && !ytDlpError && (
              <p className="dependency-hint">
                Downloads videos and audio from YouTube and other sites
              </p>
            )}
          </div>

          {/* ffmpeg */}
          <div
            className={`dependency-item ${
              status.ffmpeg_installed ? "installed" : "missing"
            }`}
          >
            <div className="dependency-item-header">
              <div className="dependency-item-info">
                <span
                  className={`status-dot ${
                    status.ffmpeg_installed ? "green" : "red"
                  }`}
                />
                <div>
                  <span className="dependency-name">ffmpeg</span>
                  {status.ffmpeg_version && (
                    <span className="dependency-version">
                      {status.ffmpeg_version.split(" ").slice(0, 3).join(" ")}
                    </span>
                  )}
                </div>
              </div>
              {!status.ffmpeg_installed && (
                <button
                  className="btn btn-install"
                  onClick={handleInstallFfmpeg}
                  disabled={installingFfmpeg}
                >
                  {installingFfmpeg ? (
                    <>
                      <div className="spinner spinner-small" /> Installing...
                    </>
                  ) : (
                    "Install"
                  )}
                </button>
              )}
              {status.ffmpeg_installed && (
                <span className="installed-badge">✓ Installed</span>
              )}
            </div>
            {ffmpegMessage && (
              <p className="dependency-message success">{ffmpegMessage}</p>
            )}
            {ffmpegError && (
              <p className="dependency-message error">{ffmpegError}</p>
            )}
            {!status.ffmpeg_installed && !installingFfmpeg && !ffmpegError && (
              <p className="dependency-hint">
                Required for merging video and audio streams
              </p>
            )}
          </div>
        </div>

        <div className="dependency-actions">
          <button
            className="btn btn-primary btn-continue"
            onClick={handleContinue}
            disabled={!allInstalled}
          >
            Continue
          </button>
          <button className="btn btn-secondary" onClick={checkDeps}>
            Re-check
          </button>
        </div>
      </div>
    </div>
  );
};
