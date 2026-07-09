import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsModal } from "./SettingsModal";
import { renderWithSettings } from "@/lib/test-utils";
import { SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS, type Settings } from "@/lib/settings";

const collections = ["Auckland Libraries", "National Library"];

function readPersisted(): Settings {
  return JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "null");
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => collections })
  );
});

describe("SettingsModal", () => {
  it("changes the slideshow interval via the Interval dropdown", async () => {
    const user = userEvent.setup();
    renderWithSettings(<SettingsModal isOpen onClose={() => {}} />);

    const intervalRoot = screen.getByText("Interval").parentElement!;
    await user.click(within(intervalRoot).getByRole("button"));
    await user.click(within(intervalRoot).getByRole("option", { name: "15s" }));

    await waitFor(() => expect(readPersisted().intervalMs).toBe(15000));
  });

  it("changes the detail level via the Detail level dropdown", async () => {
    const user = userEvent.setup();
    renderWithSettings(<SettingsModal isOpen onClose={() => {}} />);

    const detailRoot = screen.getByText("Detail level").parentElement!;
    await user.click(within(detailRoot).getByRole("button"));
    await user.click(within(detailRoot).getByRole("option", { name: "All" }));

    await waitFor(() => {
      const persisted = readPersisted();
      expect(persisted.showInfoPanel).toBe(true);
      expect(persisted.infoDensity).toBe("more");
    });
  });

  it("toggles a collection into hiddenCollections", async () => {
    const user = userEvent.setup();
    renderWithSettings(<SettingsModal isOpen onClose={() => {}} />);

    await screen.findByRole("switch", { name: `Hide ${collections[0]}` });
    await user.click(screen.getByRole("switch", { name: `Hide ${collections[0]}` }));

    await waitFor(() => expect(readPersisted().hiddenCollections).toEqual([collections[0]]));
  });

  it("un-hides a collection when toggled off", async () => {
    const user = userEvent.setup();
    renderWithSettings(<SettingsModal isOpen onClose={() => {}} />, {
      hiddenCollections: [collections[0]],
    });

    const toggle = await screen.findByRole("switch", { name: `Hide ${collections[0]}` });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await user.click(toggle);

    await waitFor(() => expect(readPersisted().hiddenCollections).toEqual([]));
  });

  it("resets all settings back to defaults after confirming", async () => {
    const user = userEvent.setup();
    renderWithSettings(<SettingsModal isOpen onClose={() => {}} />);

    const intervalRoot = screen.getByText("Interval").parentElement!;
    await user.click(within(intervalRoot).getByRole("button"));
    await user.click(within(intervalRoot).getByRole("option", { name: "15s" }));
    await waitFor(() => expect(readPersisted().intervalMs).toBe(15000));

    const [resetLink] = screen.getAllByRole("button", { name: "Reset all" });
    await user.click(resetLink);

    const confirmDialog = screen.getByRole("dialog", { name: "Reset all settings?" });
    await user.click(within(confirmDialog).getByRole("button", { name: "Reset all" }));

    await waitFor(() => expect(readPersisted()).toEqual(DEFAULT_SETTINGS));
  });

  it("does not reset when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    renderWithSettings(<SettingsModal isOpen onClose={() => {}} />);

    const intervalRoot = screen.getByText("Interval").parentElement!;
    await user.click(within(intervalRoot).getByRole("button"));
    await user.click(within(intervalRoot).getByRole("option", { name: "15s" }));
    await waitFor(() => expect(readPersisted().intervalMs).toBe(15000));

    const [resetLink] = screen.getAllByRole("button", { name: "Reset all" });
    await user.click(resetLink);

    const confirmDialog = screen.getByRole("dialog", { name: "Reset all settings?" });
    await user.click(within(confirmDialog).getByRole("button", { name: "Cancel" }));

    expect(readPersisted().intervalMs).toBe(15000);
  });
});
