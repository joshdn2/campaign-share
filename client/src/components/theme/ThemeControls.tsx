/**
 * ThemeControls.tsx
 *
 * UI for switching between light, dark, and system themes and picking an
 * accent color. Used inside the user dropdown in the top navigation bar.
 */

import { useTheme, type ThemeMode } from "./ThemeProvider";

interface AccentOption {
  label: string;
  hue: number;
  saturation: number;
}

const ACCENTS: AccentOption[] = [
  { label: "Grey", hue: 0, saturation: 0 },
  { label: "Red", hue: 0, saturation: 80 },
  { label: "Orange", hue: 25, saturation: 80 },
  { label: "Yellow", hue: 45, saturation: 80 },
  { label: "Green", hue: 145, saturation: 80 },
  { label: "Blue", hue: 217, saturation: 80 },
  { label: "Purple", hue: 270, saturation: 80 },
  { label: "Pink", hue: 330, saturation: 80 },
];

const MODES: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeControls() {
  const { theme, accentHue, accentSaturation, setTheme, setAccentColor } = useTheme();

  return (
    <div className="space-y-4 p-3">
      {/* Theme mode segmented control */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Theme
        </h3>
        <div className="flex rounded-lg border border-border-default bg-inset p-1">
          {MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setTheme(mode.value)}
              className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                theme === mode.value
                  ? "bg-elevated text-text-primary shadow-sm ring-1 ring-accent"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accent color swatches */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Accent
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {ACCENTS.map((accent) => {
            const isActive = accentHue === accent.hue && accentSaturation === accent.saturation;
            return (
              <button
                key={`${accent.hue}-${accent.saturation}`}
                onClick={() => setAccentColor({ hue: accent.hue, saturation: accent.saturation })}
                title={accent.label}
                className={`flex flex-col items-center gap-1 rounded-md p-1 transition-colors hover:bg-surface ${
                  isActive ? "bg-surface ring-1 ring-accent" : ""
                }`}
              >
                <span
                  className="h-6 w-6 rounded-full border border-border-default shadow-sm"
                  style={{
                    backgroundColor: `hsl(${accent.hue}, ${accent.saturation}%, 55%)`,
                  }}
                />
                <span
                  className={`text-[10px] ${
                    isActive ? "font-medium text-text-primary" : "text-text-muted"
                  }`}
                >
                  {accent.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
