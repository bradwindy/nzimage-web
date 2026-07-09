import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Provide a real in-memory localStorage. jsdom's is unreliable under Node 26 (its experimental
// global `localStorage` shadows jsdom's and is unavailable without --localstorage-file), and the
// settings layer reads/writes window.localStorage on mount.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}
Object.defineProperty(window, "localStorage", { writable: true, value: new MemoryStorage() });

// jsdom doesn't implement the native <dialog> modal methods, but Modal/ConfirmDialog call them in
// effects. Stub them to toggle the `open` property so component tests don't throw. (jsdom keeps
// children in the DOM regardless of `open`, so queries still work.)
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
}

// jsdom doesn't implement matchMedia, but SettingsProvider (via resolveDarkMode) calls it on mount.
// Default to a no-op, light-mode MediaQueryList so provider-wrapped component tests don't throw.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
