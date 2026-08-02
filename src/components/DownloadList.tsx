import React from "react";
import { useDownloadStore } from "../store/useDownloadStore";
import { DownloadRow } from "./DownloadRow";
import { useContextMenu } from "../hooks/useContextMenu";
import { ContextMenu } from "./ContextMenu";
import { IconDownload } from "./Icons";

export const DownloadList: React.FC = () => {
  const { downloads, selectedIds, selectId, isMultiSelectMode } =
    useDownloadStore();
  const { contextMenu, handleContextMenu, closeContextMenu } =
    useContextMenu();

  const handleSelect = (id: string, e: React.MouseEvent) => {
    const multiKey = e.metaKey || e.ctrlKey || isMultiSelectMode;
    selectId(id, multiKey);
  };

  return (
    <div className="download-list-container">
      {downloads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <IconDownload size={48} />
          </div>
          <h3 className="empty-title">No downloads yet</h3>
          <p className="empty-description">
            Click <strong>"Add Download"</strong> to get started
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="download-table">
            <thead>
              <tr>
                {isMultiSelectMode && <th className="th-check" />}
                <th className="th-name">Name</th>
                <th className="th-kind">Kind</th>
                <th className="th-size">Size</th>
                <th className="th-date">Date</th>
                <th className="th-progress">Progress</th>
              </tr>
            </thead>
            <tbody>
              {downloads.map((dl) => (
                <DownloadRow
                  key={dl.id}
                  download={dl}
                  isSelected={selectedIds.has(dl.id)}
                  isMultiSelectMode={isMultiSelectMode}
                  onSelect={handleSelect}
                  onContextMenu={handleContextMenu}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.position.x}
          y={contextMenu.position.y}
          downloadId={contextMenu.targetId}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};
