import { useEffect } from "react";
import { useTheme } from "./hooks/useTheme";
import { useDownloadStore } from "./store/useDownloadStore";
import { DependencyCheck } from "./components/DependencyCheck";
import { TopBar } from "./components/TopBar";
import { DownloadList } from "./components/DownloadList";
import { AddDownloadModal } from "./components/AddDownloadModal";
import { RenameDialog } from "./components/RenameDialog";
import { ConfirmDialog } from "./components/ConfirmDialog";

function App() {
  const { isDark, toggleTheme } = useTheme();
  const { dependencyChecked, loadDownloads, initEventListeners } =
    useDownloadStore();

  useEffect(() => {
    if (dependencyChecked) {
      loadDownloads();
      initEventListeners();
    }
  }, [dependencyChecked]);

  // Show dependency check screen first
  if (!dependencyChecked) {
    return <DependencyCheck />;
  }

  return (
    <div className="app-container">
      <TopBar isDark={isDark} onToggleTheme={toggleTheme} />
      <DownloadList />
      <AddDownloadModal />
      <RenameDialog />
      <ConfirmDialog />
    </div>
  );
}

export default App;
