import { useState, useEffect, useCallback } from "react";
import { getEffectiveTheme, applyTheme, toggleTheme as switchTheme, ThemeMode } from "../lib/theme";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(getEffectiveTheme);

  useEffect(() => {
    // Sync current state on mount
    const current = getEffectiveTheme();
    setThemeState(current);
    applyTheme(current);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: ThemeMode }>;
      if (customEvent.detail?.theme) {
        setThemeState(customEvent.detail.theme);
      } else {
        setThemeState(getEffectiveTheme());
      }
    };

    window.addEventListener("kongo-theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("kongo-theme-change", handleThemeChange);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = switchTheme();
    setThemeState(next);
    return next;
  }, []);

  const setManualTheme = useCallback((mode: ThemeMode) => {
    applyTheme(mode);
    setThemeState(mode);
  }, []);

  return {
    theme,
    isDark: theme === "dark",
    toggleTheme: toggle,
    setTheme: setManualTheme,
  };
}
