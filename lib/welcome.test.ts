import { describe, it, expect, afterEach, vi } from "vitest";
import { hasSeenWelcome, markWelcomeSeen, WELCOME_STORAGE_KEY } from "./welcome";

afterEach(() => {
  localStorage.clear();
});

describe("hasSeenWelcome", () => {
  it("returns true when the stored key is '1'", () => {
    localStorage.setItem(WELCOME_STORAGE_KEY, "1");
    expect(hasSeenWelcome()).toBe(true);
  });

  it("returns false when the key is unset", () => {
    expect(hasSeenWelcome()).toBe(false);
  });

  it("returns false when the key holds an unexpected value", () => {
    localStorage.setItem(WELCOME_STORAGE_KEY, "0");
    expect(hasSeenWelcome()).toBe(false);
  });

  it("returns true (safe default) when localStorage.getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(hasSeenWelcome()).toBe(true);
  });
});

describe("markWelcomeSeen", () => {
  it("writes '1' to storage", () => {
    markWelcomeSeen();
    expect(localStorage.getItem(WELCOME_STORAGE_KEY)).toBe("1");
  });

  it("swallows a throwing setItem", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    expect(() => markWelcomeSeen()).not.toThrow();
  });
});
