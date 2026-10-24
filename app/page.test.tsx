import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import Home from "./page";
import { fetchNZImage, type NZImage } from "@/lib/nz-image";
import { renderWithSettings } from "@/lib/test-utils";

vi.mock("@/lib/nz-image", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/nz-image")>()),
  fetchNZImage: vi.fn(),
}));

const image: NZImage = {
  id: 1,
  title: "A photo",
  thumbnailUrl: "https://example.com/thumb.jpg",
  largeThumbnailUrl: "https://example.com/large.jpg",
};

let visibility: DocumentVisibilityState;

function setVisibility(state: DocumentVisibilityState) {
  visibility = state;
  document.dispatchEvent(new Event("visibilitychange"));
}

const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

beforeAll(() => {
  // jsdom has no HTMLImageElement.decode; the slideshow preloads every image with it.
  HTMLImageElement.prototype.decode = () => Promise.resolve();
});

beforeEach(() => {
  visibility = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
});

describe("Home slideshow while the tab is hidden", () => {
  it("stops fetching and showing images, then resumes a single loop when visible", async () => {
    const pending: Array<(value: NZImage) => void> = [];
    vi.mocked(fetchNZImage).mockImplementation(() => new Promise((resolve) => pending.push(resolve)));

    renderWithSettings(<Home />);
    await waitFor(() => expect(fetchNZImage).toHaveBeenCalledTimes(1));

    setVisibility("hidden");
    pending[0](image);
    await flush();

    expect(fetchNZImage).toHaveBeenCalledTimes(1);
    expect(screen.queryByAltText(image.title)).not.toBeInTheDocument();

    setVisibility("visible");

    expect(await screen.findByAltText(image.title)).toBeInTheDocument();
    await flush();
    expect(fetchNZImage).toHaveBeenCalledTimes(2);
  });

  it("never fetches if unmounted before the tab becomes visible", async () => {
    visibility = "hidden";
    const { unmount } = renderWithSettings(<Home />);
    await flush();

    unmount();
    setVisibility("visible");
    await flush();

    expect(fetchNZImage).not.toHaveBeenCalled();
  });
});

describe("Home slideshow when /api/image fails", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

  async function expectNextRetryAfter(ms: number) {
    const calls = vi.mocked(fetchNZImage).mock.calls.length;
    await advance(ms - 1);
    expect(fetchNZImage).toHaveBeenCalledTimes(calls);
    await advance(1);
    expect(fetchNZImage).toHaveBeenCalledTimes(calls + 1);
  }

  it("retries with exponential backoff capped at 60 s", async () => {
    vi.mocked(fetchNZImage).mockResolvedValue(null);

    renderWithSettings(<Home />);
    await advance(0);
    expect(fetchNZImage).toHaveBeenCalledTimes(1);

    for (const ms of [1000, 2000, 4000, 8000, 16000, 32000, 60000, 60000]) {
      await expectNextRetryAfter(ms);
    }
  });

  it("resets the backoff after a successful fetch", async () => {
    vi.mocked(fetchNZImage)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(image)
      .mockResolvedValue(null);

    renderWithSettings(<Home />);
    await advance(0);
    await expectNextRetryAfter(1000);
    await advance(2000); // the third fetch succeeds, so a fourth starts at once and fails
    expect(fetchNZImage).toHaveBeenCalledTimes(4);

    await expectNextRetryAfter(1000);
  });
});
