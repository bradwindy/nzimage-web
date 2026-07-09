export type Mode = "system" | "light" | "dark";
export type Tint = "neutral" | "sepia" | "blue" | "orange";
export type FontChoice = "system" | "serif" | "mono" | "display";
export type InfoDensity = "less" | "more";
export type DetailLevel = "none" | "minimal" | "all";

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
  shortLabel: string;
  longLabel: string;
  value: number;
}

// "Unlimited" is a large sentinel rather than Infinity so the setting survives JSON
// round-tripping through localStorage (JSON.stringify(Infinity) === "null").
export const DESCRIPTION_CHAR_LIMIT_UNLIMITED = 100_000;
export const DESCRIPTION_LENGTH_OPTIONS: DescriptionLengthOption[] = [
  { label: "Small", shortLabel: "Small (100 chars)", longLabel: "Small (100 characters)", value: 100 },
  { label: "Medium", shortLabel: "Medium (200 chars)", longLabel: "Medium (200 characters)", value: 200 },
  { label: "Large", shortLabel: "Large (500 chars)", longLabel: "Large (500 characters)", value: 500 },
  {
    label: "Unlimited",
    shortLabel: "Unlimited",
    longLabel: "Unlimited",
    value: DESCRIPTION_CHAR_LIMIT_UNLIMITED,
  },
];
export const DESCRIPTION_CHAR_LIMIT_MIN = DESCRIPTION_LENGTH_OPTIONS[0].value;
export const DESCRIPTION_CHAR_LIMIT_MAX = DESCRIPTION_CHAR_LIMIT_UNLIMITED;

export const MODES: Mode[] = ["system", "light", "dark"];
export const TINTS: Tint[] = ["neutral", "sepia", "blue", "orange"];
export const FONT_CHOICES: FontChoice[] = ["system", "serif", "mono", "display"];
export const INFO_DENSITIES: InfoDensity[] = ["less", "more"];
export const DETAIL_LEVELS: DetailLevel[] = ["none", "minimal", "all"];

export const DEFAULT_SETTINGS: Settings = {
  version: SETTINGS_VERSION,
  intervalMs: 30000,
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

// intervalMs and descriptionCharLimit are effectively enums (each is one of a fixed option set),
// not continuous ranges, so out-of-step values (a stale value from before an option redesign, or a
// hand-edited localStorage entry) must snap to the nearest valid step rather than just clamp, or
// the dropdown shows the raw value instead of a label (no option matches it).
const INTERVAL_MS_STEPS = INTERVAL_STEP_OPTIONS_SECONDS.map((s) => s * 1000);
const DESCRIPTION_CHAR_LIMIT_STEPS = DESCRIPTION_LENGTH_OPTIONS.map((o) => o.value);
function snapToNearest(value: number, steps: number[]): number {
  return steps.reduce((closest, step) =>
    Math.abs(step - value) < Math.abs(closest - value) ? step : closest
  );
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
        ? snapToNearest(clamp(o.intervalMs, INTERVAL_MS_MIN, INTERVAL_MS_MAX), INTERVAL_MS_STEPS)
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
        ? snapToNearest(
            clamp(o.descriptionCharLimit, DESCRIPTION_CHAR_LIMIT_MIN, DESCRIPTION_CHAR_LIMIT_MAX),
            DESCRIPTION_CHAR_LIMIT_STEPS
          )
        : DEFAULT_SETTINGS.descriptionCharLimit,
    hideChromeUntilInteract:
      typeof o.hideChromeUntilInteract === "boolean"
        ? o.hideChromeUntilInteract
        : DEFAULT_SETTINGS.hideChromeUntilInteract,
  };
}

/** Derives the single "Detail level" control value from the two underlying settings fields. */
export function settingsToDetailLevel(settings: Settings): DetailLevel {
  if (!settings.showInfoPanel) return "none";
  return settings.infoDensity === "more" ? "all" : "minimal";
}

/** Maps a "Detail level" selection back onto the two underlying settings fields. */
export function detailLevelToSettings(level: DetailLevel): Pick<Settings, "showInfoPanel" | "infoDensity"> {
  if (level === "none") return { showInfoPanel: false, infoDensity: DEFAULT_SETTINGS.infoDensity };
  return { showInfoPanel: true, infoDensity: level === "all" ? "more" : "less" };
}

// Counts are derived from the intersection of the loaded collection list and the hidden set rather
// than plain array-length arithmetic: `hidden` can contain names not present in `all` (the list is
// still loading, or upstream renamed/removed a collection a user had hidden). Length subtraction
// would then under-count visibles — showing a nonsensical "N of M hidden" caption and wrongly
// disabling the last toggle.
export function countHiddenCollections(all: string[], hidden: string[]): number {
  return all.reduce((n, name) => (hidden.includes(name) ? n + 1 : n), 0);
}
export function countVisibleCollections(all: string[], hidden: string[]): number {
  return all.length - countHiddenCollections(all, hidden);
}
