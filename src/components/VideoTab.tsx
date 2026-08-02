import React from "react";
import type { AnalysisResult } from "../types";
import { deduplicateResolutions } from "../lib/utils";

interface VideoTabProps {
  analysis: AnalysisResult;
  selectedResolution: string;
  setSelectedResolution: (r: string) => void;
  selectedFps: string;
  setSelectedFps: (f: string) => void;
  selectedContainer: string;
  setSelectedContainer: (c: string) => void;
  videoOnly: boolean;
  setVideoOnly: (v: boolean) => void;
}

export const VideoTab: React.FC<VideoTabProps> = ({
  analysis,
  selectedResolution,
  setSelectedResolution,
  selectedFps,
  setSelectedFps,
  selectedContainer,
  setSelectedContainer,
  videoOnly,
  setVideoOnly,
}) => {
  // Get available resolutions from video formats
  const allVideoFormats = [...analysis.video_formats, ...analysis.combined_formats];
  const resolutions = deduplicateResolutions(allVideoFormats);

  // Get available FPS for the selected resolution
  const selectedHeight = parseInt(selectedResolution) || 0;
  const fpsOptions = Array.from(
    new Set(
      allVideoFormats
        .filter((f) => f.height === selectedHeight && f.fps)
        .map((f) => Math.round(f.fps!))
    )
  ).sort((a, b) => b - a);

  return (
    <div className="tab-content">
      <div className="form-group">
        <label className="form-label">Resolution</label>
        <select
          className="form-select"
          value={selectedResolution}
          onChange={(e) => setSelectedResolution(e.target.value)}
        >
          {resolutions.map((r) => (
            <option key={r.height} value={String(r.height)}>
              {r.label}
            </option>
          ))}
          {resolutions.length === 0 && (
            <option value="">No video formats available</option>
          )}
        </select>
      </div>

      {fpsOptions.length > 1 && (
        <div className="form-group">
          <label className="form-label">Frame Rate</label>
          <select
            className="form-select"
            value={selectedFps}
            onChange={(e) => setSelectedFps(e.target.value)}
          >
            {fpsOptions.map((fps) => (
              <option key={fps} value={String(fps)}>
                {fps} fps
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Container Format</label>
        <select
          className="form-select"
          value={selectedContainer}
          onChange={(e) => setSelectedContainer(e.target.value)}
        >
          <option value="mp4">MP4</option>
          <option value="mkv">MKV</option>
          <option value="webm">WebM</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-checkbox-label">
          <input
            type="checkbox"
            className="form-checkbox"
            checked={videoOnly}
            onChange={(e) => setVideoOnly(e.target.checked)}
          />
          <span className="checkbox-text">Video only (no audio)</span>
        </label>
      </div>
    </div>
  );
};
