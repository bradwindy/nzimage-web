import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsModal } from "./SettingsModal";
import { renderWithSettings } from "@/lib/test-utils";
import { SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS, type Settings } from "@/lib/settings";
import { fetchCollections } from "@/lib/nz-image";

// fetchCollections does a real network fetch; mock it so the modal gets a deterministic list.
vi.mock("@/lib/nz-image", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/nz-image")>();
  return { ...actual, fetchCollections: vi.fn() };
});

const mockFetchCollections = vi.mocked(fetchCollections);
const collections = ["Auckland Libraries", "National Library"];

function readPersisted(): Settings {
  return JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "null");
}

beforeEach(() => {
  mockFetchCollections.mockReset();
  mockFetchCollections.mockResolvedValue(collections);
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

describe("SettingsModal — hidden collections count (regression: intersection, not length subtraction)", () => {
  it("reads '0 of N hidden' once collections load with nothing hidden", async () => {
    renderWithSettings(<SettingsModal isOpen onClose={() => {}} />);

    await screen.findByText(collections[0]);
    expect(screen.getByText(`0 of ${collections.length} hidden`)).toBeInTheDocument();
  });

  it("counts only hidden names present in the list — stale entries don't inflate the numerator", async () => {
    // "Stale1"/"Stale2" were hidden previously but no longer exist upstream.
    renderWithSettings(<SettingsModal isOpen onClose={() => {}} />, {
      hiddenCollections: [collections[0], "Stale1", "Stale2"],
    });

    await screen.findByText(collections[0]);
    // Only collections[0] is really hidden; the numerator must never exceed the loaded total.
    expect(screen.getByText(`1 of ${collections.length} hidden`)).toBeInTheDocument();
    expect(screen.queryByText(`${collections.length} of ${collections.length} hidden`)).not.toBeInTheDocument();
  });

  it("keeps a genuinely-visible collection's toggle enabled despite stale hidden entries", async () => {
    // Old code: visible = 3 - 3 = 0, so a genuinely-visible collection's toggle was wrongly
    // disabled (0 <= 1). Fixed code: visible = 3 - 1 = 2, so it stays toggleable.
    mockFetchCollections.mockResolvedValue([...collections, "Third Collection"]);
    renderWithSettings(<SettingsModal isOpen onClose={() => {}} />, {
      hiddenCollections: [collections[0], "Stale1", "Stale2"],
    });

    await screen.findByText(collections[1]);
    expect(screen.getByRole("switch", { name: `Hide ${collections[1]}` })).toBeEnabled();
  });
});
