"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  sanitizeSettings,
  type Settings,
} from "@/lib/settings";

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function readStoredSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function resolveDarkMode(mode: Settings["mode"]): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Starts at DEFAULT_SETTINGS (matching what the server rendered, since localStorage doesn't
  // exist during SSR) and only reads the real persisted value after mount. Reading localStorage
  // synchronously in the initializer would make the client's first hydration render diverge from
  // the server's, which React reports as a hydration mismatch on anything that renders
  // differently per-setting (e.g. which Mode/Tint/Font button shows as active).
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // One deliberate extra render on mount to sync from localStorage (unavailable during SSR) --
    // the standard hydration-safe pattern for persisted client settings (same approach next-themes
    // uses). The alternative (reading it in the initializer) is what caused the mismatch above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(readStoredSettings());
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = sanitizeSettings({ ...prev, ...patch });
      try {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable (private mode, quota, etc.) — keep going in-memory.
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch {
      // localStorage unavailable — keep going in-memory.
    }
  }, []);

  // Apply presentation settings to the root element so CSS can theme off `data-*` attributes.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.tint = settings.tint;
    root.dataset.font = settings.font;

    const applyMode = () => {
      root.dataset.mode = resolveDarkMode(settings.mode) ? "dark" : "light";
    };
    applyMode();

    if (settings.mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", applyMode);
    return () => mql.removeEventListener("change", applyMode);
  }, [settings.mode, settings.tint, settings.font]);

  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
