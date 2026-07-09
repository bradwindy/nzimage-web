import { describe, it, expect } from "vitest";
import {
  sanitizeSettings,
  settingsToDetailLevel,
  detailLevelToSettings,
  DEFAULT_SETTINGS,
  SETTINGS_VERSION,
  INTERVAL_MS_MIN,
  INTERVAL_MS_MAX,
  DESCRIPTION_CHAR_LIMIT_MIN,
  DESCRIPTION_CHAR_LIMIT_MAX,
} from "./settings";

describe("sanitizeSettings", () => {
  it("returns all defaults for non-object raw input", () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings("not an object")).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(42)).toEqual(DEFAULT_SETTINGS);
  });

  it("always stamps the current SETTINGS_VERSION regardless of input", () => {
    expect(sanitizeSettings({ version: 999 }).version).toBe(SETTINGS_VERSION);
    expect(sanitizeSettings({}).version).toBe(SETTINGS_VERSION);
  });

  describe("intervalMs", () => {
    it("falls back to the default when not a finite number", () => {
      expect(sanitizeSettings({ intervalMs: "30000" }).intervalMs).toBe(DEFAULT_SETTINGS.intervalMs);
      expect(sanitizeSettings({ intervalMs: NaN }).intervalMs).toBe(DEFAULT_SETTINGS.intervalMs);
      expect(sanitizeSettings({ intervalMs: Infinity }).intervalMs).toBe(DEFAULT_SETTINGS.intervalMs);
    });

    it("clamps below the minimum then snaps to the nearest step", () => {
      expect(sanitizeSettings({ intervalMs: 1 }).intervalMs).toBe(INTERVAL_MS_MIN);
    });

    it("clamps above the maximum then snaps to the nearest step", () => {
      expect(sanitizeSettings({ intervalMs: 999_999 }).intervalMs).toBe(INTERVAL_MS_MAX);
    });

    it("snaps an out-of-step value to the nearest valid step", () => {
      expect(sanitizeSettings({ intervalMs: 12345 }).intervalMs).toBe(10000);
    });

    it("leaves an already-valid step unchanged", () => {
      expect(sanitizeSettings({ intervalMs: 15000 }).intervalMs).toBe(15000);
    });
  });

  describe("enum fields", () => {
    it("falls back to the default mode on an unknown value", () => {
      expect(sanitizeSettings({ mode: "invalid" }).mode).toBe(DEFAULT_SETTINGS.mode);
      expect(sanitizeSettings({ mode: "dark" }).mode).toBe("dark");
    });

    it("falls back to the default tint on an unknown value", () => {
      expect(sanitizeSettings({ tint: "invalid" }).tint).toBe(DEFAULT_SETTINGS.tint);
      expect(sanitizeSettings({ tint: "sepia" }).tint).toBe("sepia");
    });

    it("falls back to the default font on an unknown value", () => {
      expect(sanitizeSettings({ font: "invalid" }).font).toBe(DEFAULT_SETTINGS.font);
      expect(sanitizeSettings({ font: "mono" }).font).toBe("mono");
    });

    it("falls back to the default infoDensity on an unknown value", () => {
      expect(sanitizeSettings({ infoDensity: "invalid" }).infoDensity).toBe(
        DEFAULT_SETTINGS.infoDensity
      );
      expect(sanitizeSettings({ infoDensity: "more" }).infoDensity).toBe("more");
    });
  });

  describe("hiddenCollections", () => {
    it("only accepts a string array, falling back to default otherwise", () => {
      expect(sanitizeSettings({ hiddenCollections: ["a", "b"] }).hiddenCollections).toEqual([
        "a",
        "b",
      ]);
      expect(sanitizeSettings({ hiddenCollections: "not an array" }).hiddenCollections).toEqual(
        DEFAULT_SETTINGS.hiddenCollections
      );
      expect(sanitizeSettings({ hiddenCollections: ["a", 1] }).hiddenCollections).toEqual(
        DEFAULT_SETTINGS.hiddenCollections
      );
    });
  });

  describe("showInfoPanel", () => {
    it("falls back to the default when not a boolean", () => {
      expect(sanitizeSettings({ showInfoPanel: "true" }).showInfoPanel).toBe(
        DEFAULT_SETTINGS.showInfoPanel
      );
      expect(sanitizeSettings({ showInfoPanel: false }).showInfoPanel).toBe(false);
    });
  });

  describe("descriptionCharLimit", () => {
    it("falls back to the default when not a finite number", () => {
      expect(sanitizeSettings({ descriptionCharLimit: "100" }).descriptionCharLimit).toBe(
        DEFAULT_SETTINGS.descriptionCharLimit
      );
    });

    it("clamps below the minimum", () => {
      expect(sanitizeSettings({ descriptionCharLimit: 0 }).descriptionCharLimit).toBe(
        DESCRIPTION_CHAR_LIMIT_MIN
      );
    });

    it("clamps above the maximum", () => {
      expect(sanitizeSettings({ descriptionCharLimit: 999_999_999 }).descriptionCharLimit).toBe(
        DESCRIPTION_CHAR_LIMIT_MAX
      );
    });

    it("passes through an in-range value unchanged", () => {
      expect(sanitizeSettings({ descriptionCharLimit: 200 }).descriptionCharLimit).toBe(200);
    });
  });

  describe("hideChromeUntilInteract", () => {
    it("falls back to the default when not a boolean", () => {
      expect(sanitizeSettings({ hideChromeUntilInteract: "yes" }).hideChromeUntilInteract).toBe(
        DEFAULT_SETTINGS.hideChromeUntilInteract
      );
      expect(sanitizeSettings({ hideChromeUntilInteract: true }).hideChromeUntilInteract).toBe(
        true
      );
    });
  });
});

describe("settingsToDetailLevel / detailLevelToSettings round-trip", () => {
  it.each(["none", "minimal", "all"] as const)("round-trips level %s", (level) => {
    const fields = detailLevelToSettings(level);
    const settings = { ...DEFAULT_SETTINGS, ...fields };
    expect(settingsToDetailLevel(settings)).toBe(level);
  });

  it("maps none to showInfoPanel: false", () => {
    expect(detailLevelToSettings("none")).toEqual({
      showInfoPanel: false,
      infoDensity: DEFAULT_SETTINGS.infoDensity,
    });
  });

  it("maps minimal to showInfoPanel: true, infoDensity: less", () => {
    expect(detailLevelToSettings("minimal")).toEqual({ showInfoPanel: true, infoDensity: "less" });
  });

  it("maps all to showInfoPanel: true, infoDensity: more", () => {
    expect(detailLevelToSettings("all")).toEqual({ showInfoPanel: true, infoDensity: "more" });
  });
});
