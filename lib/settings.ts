export type Mode = "system" | "light" | "dark";
export type Tint = "neutral" | "sepia" | "blue" | "orange";
export type FontChoice = "system" | "serif" | "mono" | "display";
export type InfoDensity = "less" | "more";

export interface Settings {
  version: number;
  intervalMs: number;
  mode: Mode;
  tint: Tint;
  font: FontChoice;
  hiddenCollections: string[];
  showInfoPanel: boolean;
  infoDensity: InfoDensity;
  descriptionCharLimit: number;
  hideChromeUntilInteract: boolean;
}

export const SETTINGS_VERSION = 1;
export const SETTINGS_STORAGE_KEY = "nzimage.settings.v1";

// Dropdown steps, seconds — deliberately widening gaps as the value approaches the max so
// coarser (rarely-needed) long intervals don't clutter the list with as many stops as the
// finely-grained short end.
export const INTERVAL_STEP_OPTIONS_SECONDS = [5, 10, 15, 20, 30, 45, 60, 90, 120] as const;
export const INTERVAL_MS_MIN = INTERVAL_STEP_OPTIONS_SECONDS[0] * 1000;
export const INTERVAL_MS_MAX =
  INTERVAL_STEP_OPTIONS_SECONDS[INTERVAL_STEP_OPTIONS_SECONDS.length - 1] * 1000;

export interface DescriptionLengthOption {
  label: string;
  value: number;
}

// "Unlimited" is a large sentinel rather than Infinity so the setting survives JSON
// round-tripping through localStorage (JSON.stringify(Infinity) === "null").
export const DESCRIPTION_CHAR_LIMIT_UNLIMITED = 100_000;
export const DESCRIPTION_LENGTH_OPTIONS: DescriptionLengthOption[] = [
  { label: "Small", value: 100 },
  { label: "Medium", value: 200 },
  { label: "Large", value: 500 },
  { label: "Unlimited", value: DESCRIPTION_CHAR_LIMIT_UNLIMITED },
];
export const DESCRIPTION_CHAR_LIMIT_MIN = DESCRIPTION_LENGTH_OPTIONS[0].value;
export const DESCRIPTION_CHAR_LIMIT_MAX = DESCRIPTION_CHAR_LIMIT_UNLIMITED;

export const MODES: Mode[] = ["system", "light", "dark"];
export const TINTS: Tint[] = ["neutral", "sepia", "blue", "orange"];
export const FONT_CHOICES: FontChoice[] = ["system", "serif", "mono", "display"];
export const INFO_DENSITIES: InfoDensity[] = ["less", "more"];

export const DEFAULT_SETTINGS: Settings = {
  version: SETTINGS_VERSION,
  intervalMs: 10000,
  mode: "system",
  tint: "neutral",
  font: "system",
  hiddenCollections: [],
  showInfoPanel: true,
  infoDensity: "less",
  descriptionCharLimit: 100,
  hideChromeUntilInteract: false,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

/**
 * Merges parsed storage over defaults field-by-field with type/range checks. Storage content is
 * untrusted (could be stale, hand-edited, or from a future version), so every field falls back to
 * its default rather than propagating a malformed value.
 */
export function sanitizeSettings(raw: unknown): Settings {
  const o = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

  return {
    version: SETTINGS_VERSION,
    intervalMs:
      typeof o.intervalMs === "number" && Number.isFinite(o.intervalMs)
        ? clamp(o.intervalMs, INTERVAL_MS_MIN, INTERVAL_MS_MAX)
        : DEFAULT_SETTINGS.intervalMs,
    mode: MODES.includes(o.mode as Mode) ? (o.mode as Mode) : DEFAULT_SETTINGS.mode,
    tint: TINTS.includes(o.tint as Tint) ? (o.tint as Tint) : DEFAULT_SETTINGS.tint,
    font: FONT_CHOICES.includes(o.font as FontChoice)
      ? (o.font as FontChoice)
      : DEFAULT_SETTINGS.font,
    hiddenCollections: isStringArray(o.hiddenCollections)
      ? o.hiddenCollections
      : DEFAULT_SETTINGS.hiddenCollections,
    showInfoPanel:
      typeof o.showInfoPanel === "boolean" ? o.showInfoPanel : DEFAULT_SETTINGS.showInfoPanel,
    infoDensity: INFO_DENSITIES.includes(o.infoDensity as InfoDensity)
      ? (o.infoDensity as InfoDensity)
      : DEFAULT_SETTINGS.infoDensity,
    descriptionCharLimit:
      typeof o.descriptionCharLimit === "number" && Number.isFinite(o.descriptionCharLimit)
        ? clamp(o.descriptionCharLimit, DESCRIPTION_CHAR_LIMIT_MIN, DESCRIPTION_CHAR_LIMIT_MAX)
        : DEFAULT_SETTINGS.descriptionCharLimit,
    hideChromeUntilInteract:
      typeof o.hideChromeUntilInteract === "boolean"
        ? o.hideChromeUntilInteract
        : DEFAULT_SETTINGS.hideChromeUntilInteract,
  };
}
