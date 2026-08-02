import React from "react";
import { useDownloadStore } from "../store/useDownloadStore";
import {
  IconPlus,
  IconPause,
  IconPlay,
  IconFolderOpen,
  IconEdit,
  IconX,
  IconTrash,
  IconSun,
  IconMoon,
  IconCheckSquare,
} from "./Icons";
import * as api from "../lib/tauri";

interface TopBarProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ isDark, onToggleTheme }) => {
  const {
    downloads,
    selectedIds,
    isMultiSelectMode,
    setAddPanelOpen,
    removeDownloadsFromList,
    setRenameDialogId,
    setConfirmDeleteIds,
    toggleMultiSelectMode,
  } = useDownloadStore();

  const selectedArray = [...selectedIds];
  const singleSelected =
    selectedArray.length === 1
      ? downloads.find((d) => d.id === selectedArray[0])
      : null;
  const hasSelection = selectedArray.length > 0;

  const isActive =
    singleSelected?.status === "downloading" ||
    singleSelected?.status === "processing";
  const isPaused = singleSelected?.status === "paused";
  const isCompleted = singleSelected?.status === "completed";

  const handlePause = async () => {
    if (!singleSelected) return;
    await api.pauseDownload(singleSelected.id);
  };

  const handleResume = async () => {
    if (!singleSelected) return;
    await api.resumeDownload(singleSelected.id, []);
  };

  const handleDelete = () => {
    if (!hasSelection) return;
    setConfirmDeleteIds(selectedArray);
  };

  const handleRemove = async () => {
    for (const id of selectedArray) {
      try {
        await api.removeDownload(id);
      } catch (err) {
        console.error("Failed to remove:", id, err);
      }
    }
    removeDownloadsFromList(selectedArray);
  };

  const handleShowInFolder = async () => {
    if (!singleSelected?.file_path) return;
    await api.showInFolder(singleSelected.file_path);
  };

  return (
    <div className="top-bar">
      <button
        className="btn btn-primary btn-add-download"
        onClick={() => setAddPanelOpen(true)}
      >
        <IconPlus size={16} />
        Add Download
      </button>

      <div className="top-bar-divider" />

      <div className="top-bar-actions">
        {/* Multi-select toggle */}
        <button
          className={`btn btn-action ${isMultiSelectMode ? "btn-active" : ""}`}
          onClick={toggleMultiSelectMode}
          title={isMultiSelectMode ? "Exit Multi-Select" : "Multi-Select"}
        >
          <IconCheckSquare size={15} />
          <span className="btn-label">Select</span>
        </button>

        {/* Single-item actions */}
        {singleSelected && isActive && (
          <button
            className="btn btn-action"
            onClick={handlePause}
            title="Pause Download"
          >
            <IconPause size={15} />
            <span className="btn-label">Pause</span>
          </button>
        )}

        {singleSelected && isPaused && (
          <button
            className="btn btn-action"
            onClick={handleResume}
            title="Resume Download"
          >
            <IconPlay size={15} />
            <span className="btn-label">Resume</span>
          </button>
        )}

        {singleSelected && isCompleted && (
          <>
            <button
              className="btn btn-action"
              onClick={handleShowInFolder}
              title="Show in Folder"
            >
              <IconFolderOpen size={15} />
              <span className="btn-label">Show</span>
            </button>
            <button
              className="btn btn-action"
              onClick={() => setRenameDialogId(singleSelected.id)}
              title="Rename File"
            >
              <IconEdit size={15} />
              <span className="btn-label">Rename</span>
            </button>
          </>
        )}

        {/* Multi-item actions */}
        {hasSelection && (
          <>
            <button
              className="btn btn-action"
              onClick={handleRemove}
              title="Remove from List"
            >
              <IconX size={15} />
              <span className="btn-label">Remove</span>
            </button>

            <button
              className="btn btn-action btn-danger"
              onClick={handleDelete}
              title="Delete File(s)"
            >
              <IconTrash size={15} />
              <span className="btn-label">
                Delete{selectedArray.length > 1 ? ` (${selectedArray.length})` : ""}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <button
        className="btn btn-action btn-theme-toggle"
        onClick={onToggleTheme}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
      </button>
    </div>
  );
};
