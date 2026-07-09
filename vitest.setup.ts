import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

// This setup file runs for both the default jsdom environment and the `node` environment used
// by the API route handler tests (`@vitest-environment node`), so every DOM-only polyfill below
// must be guarded — `window` doesn't exist in the node environment.
if (typeof window !== "undefined") {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  // jsdom does not implement <dialog> interactivity (showModal/close) at all, but Modal and
  // ConfirmDialog rely on it to open/close.
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    };
  }

  afterEach(() => {
    localStorage.clear();
  });
}
