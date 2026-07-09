import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingsProvider } from "@/lib/settings-context";
import { SettingsModal } from "@/components/SettingsModal";
import { SETTINGS_STORAGE_KEY } from "@/lib/settings";
import { fetchCollections } from "@/lib/nz-image";

// fetchCollections does a real network fetch; mock it so the modal gets a deterministic list.
vi.mock("@/lib/nz-image", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/nz-image")>();
  return { ...actual, fetchCollections: vi.fn() };
});

const mockFetchCollections = vi.mocked(fetchCollections);

function seedHidden(hiddenCollections: string[]) {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ hiddenCollections }));
}

function renderModal() {
  return render(
    <SettingsProvider>
      <SettingsModal isOpen onClose={() => {}} />
    </SettingsProvider>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  mockFetchCollections.mockReset();
});

describe("SettingsModal — hidden collections count (finding #1 regression)", () => {
  it("reads '0 of N hidden' once collections load with nothing hidden", async () => {
    mockFetchCollections.mockResolvedValue(["Alpha", "Beta", "Gamma"]);
    renderModal();

    await screen.findByText("Alpha");
    expect(screen.getByText("0 of 3 hidden")).toBeInTheDocument();
  });

  it("counts only hidden names present in the list — stale entries don't inflate the numerator", async () => {
    mockFetchCollections.mockResolvedValue(["Alpha", "Beta", "Gamma"]);
    // "Stale1"/"Stale2" were hidden previously but no longer exist upstream.
    seedHidden(["Alpha", "Stale1", "Stale2"]);
    renderModal();

    await screen.findByText("Alpha");
    // Only Alpha is really hidden; the numerator must never exceed the loaded total.
    expect(screen.getByText("1 of 3 hidden")).toBeInTheDocument();
    expect(screen.queryByText("3 of 3 hidden")).not.toBeInTheDocument();
  });

  it("keeps a genuinely-visible collection's toggle enabled despite stale hidden entries", async () => {
    mockFetchCollections.mockResolvedValue(["Alpha", "Beta", "Gamma"]);
    // Old code: visible = 3 - 3 = 0, so Beta's toggle was wrongly disabled (0 <= 1).
    // Fixed code: visible = 3 - 1 = 2, so Beta stays toggleable.
    seedHidden(["Alpha", "Stale1", "Stale2"]);
    renderModal();

    await screen.findByText("Beta");
    expect(screen.getByRole("switch", { name: "Hide Beta" })).toBeEnabled();
  });
});
