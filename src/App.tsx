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
import { getSavedLanguage, initLanguage } from "./lib/i18n";

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

  useEffect(() => {
    if (dependencyChecked) {
      loadDownloads();
      let unlisten: (() => void) | undefined;
      initEventListeners().then((fn) => { unlisten = fn; });
      return () => { unlisten?.(); };
    }
  }, [dependencyChecked]);

  // Step 1: Language selection (first launch only)
  if (!languageSelected) {
    return <LanguageSelect onSelect={() => setLanguageSelected(true)} />;
  }

  // Step 2: Dependency check
  if (!dependencyChecked) {
    return <DependencyCheck />;
  }

  // Step 3: Main app
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