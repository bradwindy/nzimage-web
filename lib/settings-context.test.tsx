import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsProvider, useSettings } from "./settings-context";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, type Settings } from "./settings";

function Consumer() {
  const { settings, update, reset } = useSettings();
  return (
    <div>
      <pre data-testid="settings">{JSON.stringify(settings)}</pre>
      <button onClick={() => update({ intervalMs: 12345 })}>update interval</button>
      <button onClick={() => reset()}>reset</button>
    </div>
  );
}

function readSettings(): Settings {
  return JSON.parse(screen.getByTestId("settings").textContent ?? "{}");
}

function readPersisted(): Settings | null {
  const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

describe("SettingsProvider", () => {
  it("provides DEFAULT_SETTINGS on mount when nothing is persisted", async () => {
    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    );

    await waitFor(() => expect(readSettings()).toEqual(DEFAULT_SETTINGS));
  });

  it("loads and sanitizes a persisted value from localStorage", async () => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ intervalMs: 12345 }));

    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    );

    await waitFor(() => expect(readSettings().intervalMs).toBe(10000));
  });

  it("update() merges the patch, re-sanitizes, and persists the result", async () => {
    const user = userEvent.setup();
    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    );
    await waitFor(() => expect(readSettings()).toEqual(DEFAULT_SETTINGS));

    await user.click(screen.getByText("update interval"));

    await waitFor(() => expect(readSettings().intervalMs).toBe(10000));
    expect(readSettings().mode).toBe(DEFAULT_SETTINGS.mode);
    expect(readPersisted()?.intervalMs).toBe(10000);
  });

  it("reset() restores DEFAULT_SETTINGS and persists it", async () => {
    const user = userEvent.setup();
    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    );
    await waitFor(() => expect(readSettings()).toEqual(DEFAULT_SETTINGS));
    await user.click(screen.getByText("update interval"));
    await waitFor(() => expect(readSettings().intervalMs).toBe(10000));

    await user.click(screen.getByText("reset"));

    await waitFor(() => expect(readSettings()).toEqual(DEFAULT_SETTINGS));
    expect(readPersisted()).toEqual(DEFAULT_SETTINGS);
  });

  it("sets data-mode/data-tint/data-font on the document root", async () => {
    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.tint).toBe(DEFAULT_SETTINGS.tint);
      expect(document.documentElement.dataset.font).toBe(DEFAULT_SETTINGS.font);
      // window.matchMedia is polyfilled to always report matches: false in vitest.setup.ts, so
      // "system" mode resolves to light.
      expect(document.documentElement.dataset.mode).toBe("light");
    });
  });
});

describe("useSettings", () => {
  it("throws when used outside a SettingsProvider", () => {
    expect(() => render(<Consumer />)).toThrow(
      "useSettings must be used within a SettingsProvider"
    );
  });
});
