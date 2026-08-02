import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDownloadStore } from "../store/useDownloadStore";
import { VideoTab } from "./VideoTab";
import { AudioTab } from "./AudioTab";
import * as api from "../lib/tauri";
import { generateId, formatDuration } from "../lib/utils";
import type { AnalysisResult, TabType } from "../types";
import { open } from "@tauri-apps/plugin-dialog";
export const AddDownloadModal: React.FC = () => {
  const { isAddPanelOpen, setAddPanelOpen, loadDownloads } =
    useDownloadStore();

  const [url, setUrl] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("video");
  const [downloading, setDownloading] = useState(false);
  const [outputDir, setOutputDir] = useState("");

  // Video options
  const [selectedResolution, setSelectedResolution] = useState("");
  const [selectedFps, setSelectedFps] = useState("");
  const [selectedContainer, setSelectedContainer] = useState("mp4");
  const [videoOnly, setVideoOnly] = useState(false);

  // Audio options
  const [selectedAudioFormat, setSelectedAudioFormat] = useState("");
  const [selectedAudioContainer, setSelectedAudioContainer] = useState("mp3");

  const analyzeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlRef = useRef(url);

  // Load default download directory
  useEffect(() => {
    if (isAddPanelOpen && !outputDir) {
      api.getDefaultDownloadDir().then(setOutputDir).catch(console.error);
    }
  }, [isAddPanelOpen]);

  // Update URL ref
  useEffect(() => {
    urlRef.current = url;
  }, [url]);

  // Debounced URL analysis
  const triggerAnalysis = useCallback(
    (inputUrl: string) => {
      // Clear previous timeout
      if (analyzeTimeoutRef.current) {
        clearTimeout(analyzeTimeoutRef.current);
      }

      // Reset state
      setAnalysis(null);
      setAnalyzeError(null);

      if (!inputUrl.trim()) {
        setAnalyzing(false);
        return;
      }

      // Basic URL validation
      if (
        !inputUrl.startsWith("http://") &&
        !inputUrl.startsWith("https://")
      ) {
        setAnalyzeError("Please enter a valid URL");
        return;
      }

      setAnalyzing(true);

      // Debounce 500ms
      analyzeTimeoutRef.current = setTimeout(async () => {
        try {
          // Abort any existing analysis
          await api.abortAnalysis().catch(() => { });

          const result = await api.analyzeUrl(inputUrl);

          // Check if URL hasn't changed during analysis
          if (urlRef.current === inputUrl) {
            setAnalysis(result);
            setAnalyzeError(null);

            // Set defaults from analysis
            const allVideoFormats = [
              ...result.video_formats,
              ...result.combined_formats,
            ];
            if (allVideoFormats.length > 0) {
              const bestHeight = allVideoFormats[0]?.height;
              if (bestHeight) {
                setSelectedResolution(String(bestHeight));
                const fps = allVideoFormats[0]?.fps;
                if (fps) setSelectedFps(String(Math.round(fps)));
              }
            }
            if (result.audio_formats.length > 0) {
              setSelectedAudioFormat(result.audio_formats[0].format_id);
            }
          }
        } catch (err) {
          if (urlRef.current === inputUrl) {
            setAnalyzeError(String(err));
          }
        } finally {
          if (urlRef.current === inputUrl) {
            setAnalyzing(false);
          }
        }
      }, 500);
    },
    []
  );

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    triggerAnalysis(newUrl);
  };

  const handlePaste = (_e: React.ClipboardEvent<HTMLInputElement>) => {
    // onChange will fire after paste, which calls triggerAnalysis
  };

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        defaultPath: outputDir || undefined,
      });
      if (selected) {
        setOutputDir(selected as string);
      }
    } catch (err) {
      console.error("Failed to open folder dialog:", err);
    }
  };

  const handleStartDownload = async () => {
    if (!analysis || !url.trim() || downloading) return;

    setDownloading(true);

    try {
      const id = generateId();
      const isAudio = activeTab === "audio";

      let formatArgs: string[] = [];
      let kind = "videoaudio";
      let ext = selectedContainer;

      if (isAudio) {
        kind = "audio";
        ext = selectedAudioContainer;
        formatArgs = [
          "-x",
          "--audio-format",
          selectedAudioContainer,
        ];
        if (selectedAudioFormat) {
          formatArgs.push("-f", selectedAudioFormat);
        }
      } else {
        const height = selectedResolution;
        const fps = selectedFps;

        if (videoOnly) {
          kind = "video";
          let formatStr = `bestvideo[height<=${height}]`;
          if (fps) formatStr += `[fps<=${fps}]`;
          formatArgs = ["-f", formatStr];
        } else {
          kind = "videoaudio";
          let formatStr = `bestvideo[height<=${height}]`;
          if (fps) formatStr += `[fps<=${fps}]`;
          formatStr += "+bestaudio/best";
          formatArgs = [
            "-f",
            formatStr,
            "--merge-output-format",
            selectedContainer,
          ];
        }
      }

      const sanitizedTitle = analysis.title.replace(/[/\\?%*:|"<>]/g, "_");
      const outputPath = `${outputDir}/${sanitizedTitle}.${ext}`;

      await api.startDownload({
        id,
        url,
        title: analysis.title,
        formatArgs,
        outputPath,
        kind,
      });

      await loadDownloads();

      // Reset and close
      setUrl("");
      setAnalysis(null);
      setAddPanelOpen(false);
    } catch (err) {
      console.error("Failed to start download:", err);
      setAnalyzeError(String(err));
    } finally {
      setDownloading(false);
    }
  };

  const handleClose = () => {
    // Abort any running analysis
    api.abortAnalysis().catch(() => { });
    if (analyzeTimeoutRef.current) {
      clearTimeout(analyzeTimeoutRef.current);
    }
    setUrl("");
    setAnalysis(null);
    setAnalyzeError(null);
    setAnalyzing(false);
    setAddPanelOpen(false);
  };

  if (!isAddPanelOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="add-download-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Add Download</h2>
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* URL Input */}
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">URL</label>
            <div className="url-input-wrapper">
              <input
                type="text"
                className="form-input url-input"
                placeholder="Paste a video or audio URL..."
                value={url}
                onChange={handleUrlChange}
                onPaste={handlePaste}
                autoFocus
              />
              {analyzing && (
                <div className="url-spinner">
                  <div className="spinner" />
                </div>
              )}
            </div>
            {analyzeError && (
              <p className="form-error">{analyzeError}</p>
            )}
          </div>

          {/* Video info preview */}
          {analysis && (
            <div className="video-preview">
              <div className="preview-info">
                <h3 className="preview-title">{analysis.title}</h3>
                <div className="preview-meta">
                  {analysis.uploader && (
                    <span className="preview-uploader">{analysis.uploader}</span>
                  )}
                  {analysis.duration && (
                    <span className="preview-duration">
                      {formatDuration(analysis.duration)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          {analysis && (
            <>
              <div className="tabs">
                <button
                  className={`tab ${activeTab === "video" ? "active" : ""}`}
                  onClick={() => setActiveTab("video")}
                >
                  Video
                </button>
                <button
                  className={`tab ${activeTab === "audio" ? "active" : ""}`}
                  onClick={() => setActiveTab("audio")}
                >
                  Audio
                </button>
              </div>

              {activeTab === "video" ? (
                <VideoTab
                  analysis={analysis}
                  selectedResolution={selectedResolution}
                  setSelectedResolution={setSelectedResolution}
                  selectedFps={selectedFps}
                  setSelectedFps={setSelectedFps}
                  selectedContainer={selectedContainer}
                  setSelectedContainer={setSelectedContainer}
                  videoOnly={videoOnly}
                  setVideoOnly={setVideoOnly}
                />
              ) : (
                <AudioTab
                  analysis={analysis}
                  selectedAudioFormat={selectedAudioFormat}
                  setSelectedAudioFormat={setSelectedAudioFormat}
                  selectedAudioContainer={selectedAudioContainer}
                  setSelectedAudioContainer={setSelectedAudioContainer}
                />
              )}

              {/* Output directory */}
              <div className="form-group">
                <label className="form-label">Save to</label>
                <div className="folder-picker">
                  <input
                    type="text"
                    className="form-input folder-input"
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    readOnly
                  />
                  <button
                    className="btn btn-secondary btn-browse"
                    onClick={handleSelectFolder}
                  >
                    Browse
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleStartDownload}
            disabled={!analysis || analyzing || downloading}
          >
            {downloading ? (
              <>
                <div className="spinner spinner-small" /> Starting...
              </>
            ) : (
              "Start Download"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
