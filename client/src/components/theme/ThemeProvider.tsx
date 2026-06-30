/* eslint-disable react-refresh/only-export-components */
/**
 * ThemeProvider.tsx
 *
 * Manages the application's semantic color theme and configurable accent color.
 * Reads/writes preferences from localStorage and applies CSS variables and the
 * `data-theme` attribute to the document element so Tailwind's dark mode and
 * the theme system can react immediately.
 *
 * This file intentionally exports both the Provider component and the useTheme
 * hook together, which is the standard React pattern for context consumers.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface AccentColor {
  hue: number;
  saturation: number;
}

interface ThemeContextValue {
  theme: ThemeMode;
  effectiveTheme: "light" | "dark";
  accentHue: number;
  accentSaturation: number;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = "theme";
const ACCENT_HUE_STORAGE_KEY = "accentHue";
const ACCENT_SATURATION_STORAGE_KEY = "accentSaturation";
const DEFAULT_ACCENT_HUE = 217;
const DEFAULT_ACCENT_SATURATION = 80;

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveEffectiveTheme(theme: ThemeMode): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as
      | ThemeMode
      | null;
    return stored && ["light", "dark", "system"].includes(stored)
      ? stored
      : "system";
  } catch {
    return "system";
  }
}

function readStoredHue(): number {
  if (typeof window === "undefined") return DEFAULT_ACCENT_HUE;
  try {
    const stored = window.localStorage.getItem(ACCENT_HUE_STORAGE_KEY);
    const parsed = stored ? Number(stored) : Number.NaN;
    return Number.isNaN(parsed) ? DEFAULT_ACCENT_HUE : parsed;
  } catch {
    return DEFAULT_ACCENT_HUE;
  }
}

function readStoredSaturation(): number {
  if (typeof window === "undefined") return DEFAULT_ACCENT_SATURATION;
  try {
    const stored = window.localStorage.getItem(ACCENT_SATURATION_STORAGE_KEY);
    const parsed = stored ? Number(stored) : Number.NaN;
    return Number.isNaN(parsed) ? DEFAULT_ACCENT_SATURATION : parsed;
  } catch {
    return DEFAULT_ACCENT_SATURATION;
  }
}

interface Props {
  children: ReactNode;
}

export function ThemeProvider({ children }: Props) {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);
  const [accentHue, setAccentHueState] = useState<number>(readStoredHue);
  const [accentSaturation, setAccentSaturationState] = useState<number>(
    readStoredSaturation,
  );
  const isFirstRender = useRef(true);

  const effectiveTheme = useMemo(
    () => resolveEffectiveTheme(theme),
    [theme],
  );

  // Apply theme and accent color to the document element whenever they change.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
    document.documentElement.style.setProperty("--accent-hue", String(accentHue));
    document.documentElement.style.setProperty(
      "--accent-saturation",
      `${accentSaturation}%`,
    );
  }, [effectiveTheme, accentHue, accentSaturation]);

  // Persist changes to localStorage, skipping the initial render so we don't
  // overwrite stored values with defaults before reading them.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      window.localStorage.setItem(ACCENT_HUE_STORAGE_KEY, String(accentHue));
      window.localStorage.setItem(
        ACCENT_SATURATION_STORAGE_KEY,
        String(accentSaturation),
      );
    } catch {
      // ignore localStorage errors
    }
  }, [theme, accentHue, accentSaturation]);

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
  const setAccentColor = (color: AccentColor) => {
    setAccentHueState(color.hue);
    setAccentSaturationState(color.saturation);
  };

  const value: ThemeContextValue = {
    theme,
    effectiveTheme,
    accentHue,
    accentSaturation,
    setTheme,
    setAccentColor,
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
