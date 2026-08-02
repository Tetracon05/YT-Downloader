import { useState, useEffect, useCallback } from "react";
import type { ContextMenuPosition } from "../types";

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    position: ContextMenuPosition;
    targetId: string;
  } | null>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, targetId: string) => {
      e.preventDefault();
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        targetId,
      });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Close on click outside or Escape
  useEffect(() => {
    if (!contextMenu) return;

    const handleClick = () => closeContextMenu();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeContextMenu();
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu, closeContextMenu]);

  return { contextMenu, handleContextMenu, closeContextMenu };
}
