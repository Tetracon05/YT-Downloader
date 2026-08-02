import { useState, useEffect, useCallback } from "react";

type ThemeMode = "system" | "light" | "dark";

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme-mode");
      if (saved === "light" || saved === "dark") return saved;
    }
    return "system";
  });

  const getSystemDark = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const [isDark, setIsDark] = useState(() => {
    if (mode === "light") return false;
    if (mode === "dark") return true;
    return getSystemDark();
  });

  // Listen for OS theme changes when in system mode
  useEffect(() => {
    if (mode !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode]);

  // Apply dark class to html element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Toggle through: system → light → dark → system
  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      let next: ThemeMode;
      if (prev === "system") {
        next = isDark ? "light" : "dark";
      } else if (prev === "light") {
        next = "dark";
      } else {
        next = "light";
      }
      localStorage.setItem("theme-mode", next);
      if (next === "light") setIsDark(false);
      else if (next === "dark") setIsDark(true);
      else setIsDark(getSystemDark());
      return next;
    });
  }, [isDark]);

  return { isDark, mode, toggleTheme };
}
