export const THEME_STORAGE_KEY = "ecoshop-theme";

function readStoredTheme() {
  try {
    const theme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return theme === "light" || theme === "dark" ? theme : null;
  } catch {
    return null;
  }
}

export function getInitialTheme() {
  const storedTheme = readStoredTheme();
  if (storedTheme) return storedTheme;

  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}
