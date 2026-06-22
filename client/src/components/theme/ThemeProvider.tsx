/**
 * ThemeProvider.tsx
 *
 * Manages the application's semantic color theme and configurable accent hue.
 * Reads/writes preferences from localStorage and applies CSS variables and the
 * `data-theme` attribute to the document element so Tailwind's dark mode and
 * the theme system can react immediately.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: ThemeMode;
  effectiveTheme: "light" | "dark";
  accentHue: number;
  setTheme: (theme: ThemeMode) => void;
  setAccentHue: (hue: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = "theme";
const ACCENT_HUE_STORAGE_KEY = "accentHue";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveEffectiveTheme(theme: ThemeMode): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

interface Props {
  children: ReactNode;
}

export function ThemeProvider({ children }: Props) {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [accentHue, setAccentHueState] = useState<number>(217);
  const [mounted, setMounted] = useState(false);

  // Read persisted preferences on mount.
  useEffect(() => {
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as
        | ThemeMode
        | null;
      const storedHue = window.localStorage.getItem(ACCENT_HUE_STORAGE_KEY);

      if (storedTheme && ["light", "dark", "system"].includes(storedTheme)) {
        setThemeState(storedTheme);
      }
      if (storedHue) {
        const parsed = Number(storedHue);
        if (!Number.isNaN(parsed)) {
          setAccentHueState(parsed);
        }
      }
    } catch {
      // localStorage may be unavailable in restricted environments.
    }
    setMounted(true);
  }, []);

  const effectiveTheme = useMemo(
    () => resolveEffectiveTheme(theme),
    [theme],
  );

  // Apply theme and accent hue to the document element whenever they change.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
    document.documentElement.style.setProperty("--accent-hue", String(accentHue));
  }, [effectiveTheme, accentHue]);

  // Persist changes to localStorage.
  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(ACCENT_HUE_STORAGE_KEY, String(accentHue));
    } catch {
      // ignore
    }
  }, [accentHue, mounted]);

  // Listen for system theme changes when in system mode.
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      document.documentElement.setAttribute(
        "data-theme",
        resolveEffectiveTheme(theme),
      );
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (value: ThemeMode) => setThemeState(value);
  const setAccentHue = (value: number) => setAccentHueState(value);

  const value: ThemeContextValue = {
    theme,
    effectiveTheme,
    accentHue,
    setTheme,
    setAccentHue,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
