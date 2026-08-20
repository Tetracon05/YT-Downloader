import React from "react";
import { useDownloadStore } from "../store/useDownloadStore";
import {
  IconPlus,
  IconFolderOpen,
  IconEdit,
  IconX,
  IconTrash,
  IconCheckSquare,
} from "./Icons";
import * as api from "../lib/tauri";
import { useLanguage } from "../hooks/useLanguage";

interface TopBarProps {
  onOpenSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenSettings }) => {
  const { t } = useLanguage();
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

  const isCompleted = singleSelected?.status === "completed";

  const handleDelete = () => {
    if (!hasSelection) return;
    setConfirmDeleteIds(selectedArray);
  };

  const handleRemove = async () => {
    for (const id of selectedArray) {
      try { await api.removeDownload(id); }
      catch (err) { console.error("Failed to remove:", id, err); }
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
        {t("topBar_addDownload")}
      </button>

      <div className="top-bar-divider" />

      <div className="top-bar-actions">
        <button
          className={`btn btn-action ${isMultiSelectMode ? "btn-active" : ""}`}
          onClick={toggleMultiSelectMode}
          title={isMultiSelectMode ? t("topBar_exitSelect") : t("topBar_select")}
        >
          <IconCheckSquare size={15} />
          <span className="btn-label">{t("topBar_select")}</span>
        </button>

        {singleSelected && isCompleted && (
          <>
            <button className="btn btn-action" onClick={handleShowInFolder} title={t("topBar_show")}>
              <IconFolderOpen size={15} />
              <span className="btn-label">{t("topBar_show")}</span>
            </button>
            <button
              className="btn btn-action"
              onClick={() => setRenameDialogId(singleSelected.id)}
              title={t("topBar_rename")}
            >
              <IconEdit size={15} />
              <span className="btn-label">{t("topBar_rename")}</span>
            </button>
          </>
        )}

        {hasSelection && (
          <>
            <button className="btn btn-action" onClick={handleRemove} title={t("topBar_remove")}>
              <IconX size={15} />
              <span className="btn-label">{t("topBar_remove")}</span>
            </button>
            <button className="btn btn-action btn-danger" onClick={handleDelete} title={t("topBar_delete")}>
              <IconTrash size={15} />
              <span className="btn-label">
                {t("topBar_delete")}{selectedArray.length > 1 ? ` (${selectedArray.length})` : ""}
              </span>
            </button>
          </>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Settings button */}
      <button
        className="btn btn-action btn-settings"
        onClick={onOpenSettings}
        title={t("topBar_settings")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span className="btn-label">{t("topBar_settings")}</span>
      </button>
    </div>
  );
};