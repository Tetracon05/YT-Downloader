import React, { useState } from "react";
import * as api from "../lib/tauri";
import { useLanguage } from "../hooks/useLanguage";
import type { UpdateCheckResult } from "../types";

interface UpdateDialogProps {
  updateInfo: UpdateCheckResult;
  onDone: () => void;
}

export const UpdateDialog: React.FC<UpdateDialogProps> = ({ updateInfo, onDone }) => {
  const { t } = useLanguage();
  const [updating, setUpdating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleUpdate = async () => {
    setUpdating(true);
    setResult(null);
    try {
      const msg = await api.updateYtDlp();
      setResult({ success: true, message: msg });
      // Auto-close after a short delay on success
      setTimeout(onDone, 1800);
    } catch (err) {
      setResult({ success: false, message: String(err) });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="update-dialog-overlay">
      <div className="update-dialog">
        {/* Icon */}
        <div className="update-dialog__icon">⬆️</div>

        <h2 className="update-dialog__title">{t("update_title")}</h2>
        <p className="update-dialog__desc">{t("update_desc")}</p>

        {/* Version comparison */}
        <div className="update-version-box">
          <div className="update-version-row">
            <span className="update-version-label">{t("update_current")}</span>
            <span className="update-version-value update-version-value--old">
              {updateInfo.current_version}
            </span>
          </div>
          <div className="update-version-arrow">↓</div>
          <div className="update-version-row">
            <span className="update-version-label">{t("update_latest")}</span>
            <span className="update-version-value update-version-value--new">
              {updateInfo.latest_version}
            </span>
          </div>
        </div>

        {/* Result message */}
        {result && (
          <div className={`update-result ${result.success ? "update-result--success" : "update-result--error"}`}>
            {result.success ? (
              <span>✓ {t("update_success")}</span>
            ) : (
              <span>✗ {t("update_error")} {result.message}</span>
            )}
          </div>
        )}

        {/* Actions */}
        {!result?.success && (
          <div className="update-dialog__actions">
            <button
              className="btn btn-secondary"
              onClick={onDone}
              disabled={updating}
            >
              {t("update_skip")}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpdate}
              disabled={updating}
            >
              {updating ? (
                <>
                  <div className="spinner spinner-small" />
                  {t("update_updating")}
                </>
              ) : (
                t("update_now")
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
