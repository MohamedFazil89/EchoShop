import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ThemeToggle from "../components/layout/ThemeToggle";
import { ThemeProvider } from "./ThemeContext";
import { getInitialTheme, THEME_STORAGE_KEY } from "../utils/themePreference";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("theme preference", () => {
  let container;
  let root;
  let storedValues;

  beforeEach(() => {
    vi.restoreAllMocks();
    storedValues = new Map();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key) => storedValues.get(key) ?? null,
        setItem: (key, value) => storedValues.set(key, String(value)),
      },
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) act(() => root.unmount());
    if (container) container.remove();
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
    vi.restoreAllMocks();
  });

  it("uses the system preference when no saved choice exists", () => {
    window.matchMedia.mockReturnValue({ matches: true });
    expect(getInitialTheme()).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("uses a valid saved choice ahead of the system preference", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    window.matchMedia.mockReturnValue({ matches: true });
    expect(getInitialTheme()).toBe("light");
  });

  it("ignores malformed or unavailable storage safely", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    window.matchMedia.mockReturnValue({ matches: true });
    expect(getInitialTheme()).toBe("dark");

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("Storage is disabled");
      },
    });
    expect(getInitialTheme()).toBe("dark");
  });

  it("still allows theme changes when preference storage is unavailable", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("Storage is disabled");
      },
    });
    act(() => {
      root.render(createElement(ThemeProvider, null, createElement(ThemeToggle)));
    });

    const button = container.querySelector("button");
    act(() => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("exposes an accessible toggle and persists explicit selections", () => {
    act(() => {
      root.render(createElement(ThemeProvider, null, createElement(ThemeToggle)));
    });

    const button = container.querySelector("button");
    expect(button.getAttribute("aria-label")).toBe("Switch to dark theme");
    expect(button.getAttribute("aria-pressed")).toBe("false");

    act(() => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(button.getAttribute("aria-label")).toBe("Switch to light theme");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(storedValues.get(THEME_STORAGE_KEY)).toBe("dark");
  });
});
