export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "laliga-theme";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", mode === "dark");
  window.localStorage.setItem(STORAGE_KEY, mode);
}

/** Runs before hydration so the chosen theme never flashes. */
export const themeBootstrapScript = `(function(){try{var m=localStorage.getItem("${STORAGE_KEY}");document.documentElement.classList.toggle("dark",m!=="light");}catch(e){document.documentElement.classList.add("dark");}})();`;
