import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { SettingsRoot, type SettingsRootHandle } from "./SettingsRoot";
import { renderWithSettings } from "@/lib/test-utils";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SettingsRoot", () => {
  it("keeps the settings button visible when hideChromeUntilInteract is off (default)", () => {
    renderWithSettings(<SettingsRoot />);

    const button = screen.getByRole("button", { name: "Open settings" });
    expect(button.style.opacity).toBe("");
    expect(screen.queryByRole("button", { name: "Show settings" })).not.toBeInTheDocument();
  });

  it("opens the SettingsModal when the settings button is clicked", async () => {
    const user = userEvent.setup();
    renderWithSettings(<SettingsRoot />);

    await user.click(screen.getByRole("button", { name: "Open settings" }));

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  });

  it("hides the settings button after REVEAL_DURATION_MS when hideChromeUntilInteract is on", () => {
    vi.useFakeTimers();
    renderWithSettings(<SettingsRoot />, { hideChromeUntilInteract: true });

    expect(screen.getByRole("button", { name: "Open settings" }).style.opacity).toBe("");

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByRole("button", { name: "Open settings" })).toHaveStyle({ opacity: "0" });
    expect(screen.getByRole("button", { name: "Show settings" })).toBeInTheDocument();
  });

  it("exposes a reveal() imperative handle that re-shows the button", () => {
    vi.useFakeTimers();
    const ref = createRef<SettingsRootHandle>();
    renderWithSettings(<SettingsRoot ref={ref} />, { hideChromeUntilInteract: true });

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByRole("button", { name: "Show settings" })).toBeInTheDocument();

    act(() => {
      ref.current?.reveal();
    });

    expect(screen.getByRole("button", { name: "Open settings" }).style.opacity).toBe("");
    expect(screen.queryByRole("button", { name: "Show settings" })).not.toBeInTheDocument();
  });
});
