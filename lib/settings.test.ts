import { describe, it, expect } from "vitest";
import {
  DEFAULT_SETTINGS,
  SETTINGS_VERSION,
  countHiddenCollections,
  countVisibleCollections,
  detailLevelToSettings,
  sanitizeSettings,
  settingsToDetailLevel,
  type DetailLevel,
} from "./settings";

describe("sanitizeSettings", () => {
  it("returns defaults for non-object input", () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings("nope")).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(42)).toEqual(DEFAULT_SETTINGS);
  });

  it("always stamps the current version, ignoring a stored one", () => {
    expect(sanitizeSettings({ version: 99 }).version).toBe(SETTINGS_VERSION);
  });

  describe("intervalMs", () => {
    it("snaps an off-step value to the nearest step", () => {
      expect(sanitizeSettings({ intervalMs: 12000 }).intervalMs).toBe(10000);
      expect(sanitizeSettings({ intervalMs: 13000 }).intervalMs).toBe(15000);
    });

    it("clamps out-of-range values, then snaps", () => {
      expect(sanitizeSettings({ intervalMs: 1 }).intervalMs).toBe(5000);
      expect(sanitizeSettings({ intervalMs: 999999 }).intervalMs).toBe(120000);
    });

    it("falls back to the default for non-finite / wrong-typed values", () => {
      expect(sanitizeSettings({ intervalMs: "30000" }).intervalMs).toBe(DEFAULT_SETTINGS.intervalMs);
      expect(sanitizeSettings({ intervalMs: NaN }).intervalMs).toBe(DEFAULT_SETTINGS.intervalMs);
      expect(sanitizeSettings({ intervalMs: Infinity }).intervalMs).toBe(DEFAULT_SETTINGS.intervalMs);
    });
  });

  describe("descriptionCharLimit (regression: must snap, not just clamp)", () => {
    it("snaps an off-step value to the nearest option", () => {
      // 300 is closer to 200 (100 away) than 500 (200 away).
      expect(sanitizeSettings({ descriptionCharLimit: 300 }).descriptionCharLimit).toBe(200);
      // 450 is closer to 500 than to 200.
      expect(sanitizeSettings({ descriptionCharLimit: 450 }).descriptionCharLimit).toBe(500);
    });

    it("clamps below/above the option range, then snaps", () => {
      expect(sanitizeSettings({ descriptionCharLimit: 5 }).descriptionCharLimit).toBe(100);
      expect(sanitizeSettings({ descriptionCharLimit: 999999 }).descriptionCharLimit).toBe(100000);
    });

    it("preserves exact valid option values", () => {
      for (const v of [100, 200, 500, 100000]) {
        expect(sanitizeSettings({ descriptionCharLimit: v }).descriptionCharLimit).toBe(v);
      }
    });
  });

  describe("enum-ish fields fall back on unknown values", () => {
    it("mode / tint / font", () => {
      const s = sanitizeSettings({ mode: "purple", tint: "chartreuse", font: "comic" });
      expect(s.mode).toBe(DEFAULT_SETTINGS.mode);
      expect(s.tint).toBe(DEFAULT_SETTINGS.tint);
      expect(s.font).toBe(DEFAULT_SETTINGS.font);
    });

    it("accepts valid enum values", () => {
      const s = sanitizeSettings({ mode: "dark", tint: "sepia", font: "mono" });
      expect(s.mode).toBe("dark");
      expect(s.tint).toBe("sepia");
      expect(s.font).toBe("mono");
    });
  });

  describe("hiddenCollections", () => {
    it("keeps a valid string array", () => {
      expect(sanitizeSettings({ hiddenCollections: ["A", "B"] }).hiddenCollections).toEqual(["A", "B"]);
    });

    it("falls back to [] for non-arrays or arrays with non-strings", () => {
      expect(sanitizeSettings({ hiddenCollections: "A,B" }).hiddenCollections).toEqual([]);
      expect(sanitizeSettings({ hiddenCollections: [1, 2] }).hiddenCollections).toEqual([]);
      expect(sanitizeSettings({ hiddenCollections: ["A", 2] }).hiddenCollections).toEqual([]);
    });
  });

  it("falls back to defaults for wrong-typed booleans", () => {
    expect(sanitizeSettings({ showInfoPanel: "yes" }).showInfoPanel).toBe(DEFAULT_SETTINGS.showInfoPanel);
    expect(sanitizeSettings({ hideChromeUntilInteract: 1 }).hideChromeUntilInteract).toBe(
      DEFAULT_SETTINGS.hideChromeUntilInteract
    );
  });
});

describe("collection counts (regression: intersection, not length subtraction)", () => {
  it("ignores hidden entries that aren't in the loaded list", () => {
    expect(countHiddenCollections(["A", "B"], ["A", "X"])).toBe(1);
    expect(countVisibleCollections(["A", "B"], ["A", "X"])).toBe(1);
  });

  it("never goes negative while the list is still loading (empty all)", () => {
    expect(countHiddenCollections([], ["A", "B"])).toBe(0);
    expect(countVisibleCollections([], ["A", "B"])).toBe(0);
  });

  it("handles the normal case", () => {
    expect(countHiddenCollections(["A", "B", "C"], ["B"])).toBe(1);
    expect(countVisibleCollections(["A", "B", "C"], ["B"])).toBe(2);
    expect(countVisibleCollections(["A"], [])).toBe(1);
  });
});

describe("detail-level derivation round-trips", () => {
  it("settingsToDetailLevel", () => {
    expect(settingsToDetailLevel({ ...DEFAULT_SETTINGS, showInfoPanel: false })).toBe("none");
    expect(settingsToDetailLevel({ ...DEFAULT_SETTINGS, showInfoPanel: true, infoDensity: "less" })).toBe(
      "minimal"
    );
    expect(settingsToDetailLevel({ ...DEFAULT_SETTINGS, showInfoPanel: true, infoDensity: "more" })).toBe(
      "all"
    );
  });

  it("detailLevelToSettings ∘ settingsToDetailLevel is identity on each level", () => {
    for (const level of ["none", "minimal", "all"] as DetailLevel[]) {
      const merged = { ...DEFAULT_SETTINGS, ...detailLevelToSettings(level) };
      expect(settingsToDetailLevel(merged)).toBe(level);
    }
  });
});
