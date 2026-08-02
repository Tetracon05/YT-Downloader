import React from "react";
import type { AnalysisResult } from "../types";

interface AudioTabProps {
  analysis: AnalysisResult;
  selectedAudioFormat: string;
  setSelectedAudioFormat: (f: string) => void;
  selectedAudioContainer: string;
  setSelectedAudioContainer: (c: string) => void;
}

export const AudioTab: React.FC<AudioTabProps> = ({
  analysis,
  selectedAudioFormat,
  setSelectedAudioFormat,
  selectedAudioContainer,
  setSelectedAudioContainer,
}) => {
  const audioFormats = analysis.audio_formats;

  // Deduplicate by bitrate
  const bitrateOptions = Array.from(
    new Map(
      audioFormats
        .filter((f) => f.abr)
        .map((f) => [
          Math.round(f.abr!),
          { bitrate: Math.round(f.abr!), formatId: f.format_id, codec: f.acodec },
        ])
    ).values()
  ).sort((a, b) => b.bitrate - a.bitrate);

  return (
    <div className="tab-content">
      <div className="form-group">
        <label className="form-label">Audio Quality</label>
        <select
          className="form-select"
          value={selectedAudioFormat}
          onChange={(e) => setSelectedAudioFormat(e.target.value)}
        >
          {bitrateOptions.map((opt) => (
            <option key={opt.formatId} value={opt.formatId}>
              {opt.bitrate} kbps ({opt.codec})
            </option>
          ))}
          {bitrateOptions.length === 0 && (
            <option value="">No audio formats available</option>
          )}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Output Format</label>
        <select
          className="form-select"
          value={selectedAudioContainer}
          onChange={(e) => setSelectedAudioContainer(e.target.value)}
        >
          <option value="mp3">MP3</option>
          <option value="m4a">M4A</option>
          <option value="opus">Opus</option>
          <option value="wav">WAV</option>
        </select>
      </div>
    </div>
  );
};
