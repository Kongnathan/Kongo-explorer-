// Theme management with manual override support for Kongo Explorer

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "kongo_theme";

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      return stored;
    }
  } catch {
    // LocalStorage might be disabled in private mode
  }
  return null;
}

export function getEffectiveTheme(): ThemeMode {
  const stored = getStoredTheme();
  if (stored) return stored;
  
  if (typeof window !== "undefined" && window.matchMedia) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  }
  return "light";
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  
  if (theme === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";
  }
  root.classList.add("notranslate");
  root.setAttribute("translate", "no");
  
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors
  }
  
  // Update browser mobile header bar theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", theme === "dark" ? "#0f1412" : "#00342b");
  }
  
  // Broadcast event for live UI reactivity
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("kongo-theme-change", { detail: { theme } }));
  }
}

export function toggleTheme(): ThemeMode {
  const current = getEffectiveTheme();
  const next: ThemeMode = current === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

export function initTheme(): ThemeMode {
  const effective = getEffectiveTheme();
  applyTheme(effective);
  return effective;
}
