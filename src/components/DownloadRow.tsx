import React from "react";
import type { DownloadEntry } from "../types";
import { ProgressCell } from "./ProgressCell";
import { IconVideo, IconMusic, IconMonitor, IconCheckSquare, IconSquare } from "./Icons";
import { formatBytes, formatDate } from "../lib/utils";

interface DownloadRowProps {
  download: DownloadEntry;
  isSelected: boolean;
  isMultiSelectMode: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

const kindLabels: Record<string, string> = {
  video: "Video",
  audio: "Audio",
  videoaudio: "Video",
};

const KindIcon: React.FC<{ kind: string }> = ({ kind }) => {
  switch (kind) {
    case "video":
      return <IconVideo size={13} />;
    case "audio":
      return <IconMusic size={13} />;
    case "videoaudio":
      return <IconMonitor size={13} />;
    default:
      return <IconMonitor size={13} />;
  }
};

export const DownloadRow: React.FC<DownloadRowProps> = ({
  download,
  isSelected,
  isMultiSelectMode,
  onSelect,
  onContextMenu,
}) => {
  return (
    <tr
      className={`download-row ${isSelected ? "selected" : ""}`}
      onClick={(e) => onSelect(download.id, e)}
      onContextMenu={(e) => onContextMenu(e, download.id)}
    >
      {isMultiSelectMode && (
        <td className="cell-check">
          {isSelected ? (
            <IconCheckSquare size={16} className="check-icon checked" />
          ) : (
            <IconSquare size={16} className="check-icon" />
          )}
        </td>
      )}
      <td className="cell-name">
        <div className="name-content">
          <span className="name-text" title={download.title}>
            {download.title}
          </span>
        </div>
      </td>
      <td className="cell-kind">
        <span className="kind-badge">
          <KindIcon kind={download.kind} />
          {kindLabels[download.kind] || download.kind}
        </span>
      </td>
      <td className="cell-size">
        <span className="size-text">
          {download.file_size ? formatBytes(download.file_size) : "—"}
        </span>
      </td>
      <td className="cell-date">
        <span className="date-text">
          {formatDate(download.created_at)}
        </span>
      </td>
      <td className="cell-progress">
        <ProgressCell download={download} />
      </td>
    </tr>
  );
};
