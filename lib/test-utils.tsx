import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { SettingsProvider } from "./settings-context";
import { SETTINGS_STORAGE_KEY, type Settings } from "./settings";

/** Renders `ui` inside a real SettingsProvider, optionally seeding localStorage first so the
 * provider's mount effect picks up specific settings values. */
export function renderWithSettings(
  ui: ReactElement,
  initialSettings?: Partial<Settings>
): RenderResult {
  if (initialSettings) {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(initialSettings));
  }
  return render(<SettingsProvider>{ui}</SettingsProvider>);
}
