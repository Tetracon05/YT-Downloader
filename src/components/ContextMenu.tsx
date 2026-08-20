import React from "react";
import { useDownloadStore } from "../store/useDownloadStore";
import {
  IconPause,
  IconPlay,
  IconFolderOpen,
  IconEdit,
  IconX,
  IconTrash,
} from "./Icons";
import * as api from "../lib/tauri";

interface ContextMenuProps {
  x: number;
  y: number;
  downloadId: string;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  downloadId,
  onClose,
}) => {
  const { downloads, removeDownloadsFromList, setRenameDialogId, setConfirmDeleteIds } =
    useDownloadStore();
  const download = downloads.find((d) => d.id === downloadId);

  if (!download) return null;

  const isActive =
    download.status === "downloading" || download.status === "processing";
  const isPaused = download.status === "paused";
  const isCompleted = download.status === "completed";

  const handlePause = async () => {
    onClose();
    await api.pauseDownload(downloadId);
  };

  const handleResume = async () => {
    onClose();
    await api.resumeDownload(downloadId);
  };

  const handleDelete = () => {
    onClose();
    setConfirmDeleteIds([downloadId]);
  };

  const handleRemove = async () => {
    onClose();
    await api.removeDownload(downloadId);
    removeDownloadsFromList([downloadId]);
  };

  const handleRename = () => {
    onClose();
    setRenameDialogId(downloadId);
  };

  const handleShowInFolder = async () => {
    onClose();
    if (download.file_path) {
      await api.showInFolder(download.file_path);
    }
  };

  // Adjust position to stay within viewport
  const menuStyle: React.CSSProperties = {
    position: "fixed",
    top: y,
    left: x,
    zIndex: 1000,
  };

  return (
    <div className="context-menu-overlay" onClick={onClose}>
      <div
        className="context-menu"
        style={menuStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {isActive && (
          <button className="context-menu-item" onClick={handlePause}>
            <span className="menu-icon"><IconPause size={14} /></span> Pause
          </button>
        )}
        {isPaused && (
          <button className="context-menu-item" onClick={handleResume}>
            <span className="menu-icon"><IconPlay size={14} /></span> Resume
          </button>
        )}
        {isCompleted && (
          <>
            <button className="context-menu-item" onClick={handleShowInFolder}>
              <span className="menu-icon"><IconFolderOpen size={14} /></span> Show in Folder
            </button>
            <button className="context-menu-item" onClick={handleRename}>
              <span className="menu-icon"><IconEdit size={14} /></span> Rename
            </button>
          </>
        )}
        <div className="context-menu-divider" />
        <button className="context-menu-item" onClick={handleRemove}>
          <span className="menu-icon"><IconX size={14} /></span> Remove from List
        </button>
        <button className="context-menu-item danger" onClick={handleDelete}>
          <span className="menu-icon"><IconTrash size={14} /></span> Delete File
        </button>
      </div>
    </div>
  );
};
