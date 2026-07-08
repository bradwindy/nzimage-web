export const WELCOME_STORAGE_KEY = "nzimage.welcome.v1";

export function hasSeenWelcome(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(WELCOME_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markWelcomeSeen(): void {
  try {
    window.localStorage.setItem(WELCOME_STORAGE_KEY, "1");
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — nothing to persist to.
  }
}
