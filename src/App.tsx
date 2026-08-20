import { useEffect, useState } from "react";
import { useTheme } from "./hooks/useTheme";
import { useDownloadStore } from "./store/useDownloadStore";
import { DependencyCheck } from "./components/DependencyCheck";
import { LanguageSelect } from "./components/LanguageSelect";
import { TopBar } from "./components/TopBar";
import { DownloadList } from "./components/DownloadList";
import { AddDownloadModal } from "./components/AddDownloadModal";
import { RenameDialog } from "./components/RenameDialog";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { SettingsPanel } from "./components/SettingsPanel";
import { UpdateDialog } from "./components/UpdateDialog";
import { getSavedLanguage, initLanguage } from "./lib/i18n";
import * as api from "./lib/tauri";
import type { UpdateCheckResult } from "./types";

// Initialize language from localStorage before first render
initLanguage();

function App() {
  const { mode, setMode } = useTheme();
  const { dependencyChecked, loadDownloads, initEventListeners } = useDownloadStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Language selection: show if no language saved yet
  const [languageSelected, setLanguageSelected] = useState<boolean>(() => {
    return getSavedLanguage() !== null;
  });

  // yt-dlp update check state
  const [updateCheckDone, setUpdateCheckDone] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<UpdateCheckResult | null>(null);

  // Run update check once dependencies are confirmed and we haven't checked yet
  useEffect(() => {
    if (!dependencyChecked || updateCheckDone) return;

    api.checkYtDlpUpdate()
      .then((result) => {
        if (result.update_available) {
          setPendingUpdate(result);
        } else {
          setUpdateCheckDone(true);
        }
      })
      .catch(() => {
        // Network error or yt-dlp not installed — skip silently
        setUpdateCheckDone(true);
      });
  }, [dependencyChecked]);

  useEffect(() => {
    if (dependencyChecked && updateCheckDone) {
      loadDownloads();
      let unlisten: (() => void) | undefined;
      initEventListeners().then((fn) => { unlisten = fn; });
      return () => { unlisten?.(); };
    }
  }, [dependencyChecked, updateCheckDone]);

  // Step 1: Language selection (first launch only)
  if (!languageSelected) {
    return <LanguageSelect onSelect={() => setLanguageSelected(true)} />;
  }

  // Step 2: Dependency check
  if (!dependencyChecked) {
    return <DependencyCheck />;
  }

  // Step 3: yt-dlp version check / update dialog
  if (!updateCheckDone) {
    if (pendingUpdate) {
      return (
        <UpdateDialog
          updateInfo={pendingUpdate}
          onDone={() => {
            setPendingUpdate(null);
            setUpdateCheckDone(true);
          }}
        />
      );
    }
    // Still checking — show nothing (instant, runs in background)
    return null;
  }

  // Step 4: Main app
  return (
    <div className="app-container">
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />
      <DownloadList />
      <AddDownloadModal />
      <RenameDialog />
      <ConfirmDialog />
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        themeMode={mode}
        onSetTheme={setMode}
      />
    </div>
  );
}

export default App;