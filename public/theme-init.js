(() => {
  let theme;

  try {
    const preference = window.localStorage.getItem("ecoshop-theme");
    if (preference === "light" || preference === "dark") {
      theme = preference;
    }
  } catch {
    // Storage may be disabled; fall back to the system preference.
  }

  if (!theme) {
    try {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch {
      theme = "light";
    }
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
})();
