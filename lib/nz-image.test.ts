import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseNZImage, fetchNZImage, fetchCollections } from "./nz-image";

const validRaw = {
  id: 1,
  title: "A photo",
  large_thumbnail_url: "https://example.com/large.jpg",
  thumbnail_url: "https://example.com/thumb.jpg",
  description: "A description",
  display_collection: "Some Collection",
  landing_url: "https://example.com/landing",
  creator: ["Jane Doe"],
  date: ["1900"],
  subject: ["Landscapes"],
};

describe("parseNZImage", () => {
  it.each([undefined, null, "string", 1, true])("returns null for non-object primitive %p", (value) => {
    expect(parseNZImage(value)).toBeNull();
  });

  it.each([
    ["id", { ...validRaw, id: "1" }],
    ["title", { ...validRaw, title: 1 }],
    ["large_thumbnail_url", { ...validRaw, large_thumbnail_url: 1 }],
    ["thumbnail_url", { ...validRaw, thumbnail_url: 1 }],
  ])("returns null when %s has the wrong type", (_field, raw) => {
    expect(parseNZImage(raw)).toBeNull();
  });

  it.each([
    ["id", { ...validRaw, id: undefined }],
    ["title", { ...validRaw, title: undefined }],
    ["large_thumbnail_url", { ...validRaw, large_thumbnail_url: undefined }],
    ["thumbnail_url", { ...validRaw, thumbnail_url: undefined }],
  ])("returns null when %s is missing", (_field, raw) => {
    expect(parseNZImage(raw)).toBeNull();
  });

  it("maps snake_case fields to camelCase on success", () => {
    expect(parseNZImage(validRaw)).toEqual({
      id: 1,
      title: "A photo",
      thumbnailUrl: "https://example.com/thumb.jpg",
      largeThumbnailUrl: "https://example.com/large.jpg",
      description: "A description",
      displayCollection: "Some Collection",
      landingUrl: "https://example.com/landing",
      creator: ["Jane Doe"],
      date: ["1900"],
      subject: ["Landscapes"],
    });
  });

  it("allows id: NaN since typeof NaN === 'number'", () => {
    expect(parseNZImage({ ...validRaw, id: NaN })).not.toBeNull();
  });

  it.each(["description", "display_collection", "landing_url"])(
    "maps a non-string optional %s to undefined without failing the parse",
    (field) => {
      const result = parseNZImage({ ...validRaw, [field]: 42 });
      expect(result).not.toBeNull();
    }
  );

  it("omits all optional fields when they are absent", () => {
    const minimal = {
      id: 1,
      title: "A photo",
      large_thumbnail_url: "https://example.com/large.jpg",
      thumbnail_url: "https://example.com/thumb.jpg",
    };
    expect(parseNZImage(minimal)).toEqual({
      id: 1,
      title: "A photo",
      thumbnailUrl: "https://example.com/thumb.jpg",
      largeThumbnailUrl: "https://example.com/large.jpg",
      description: undefined,
      displayCollection: undefined,
      landingUrl: undefined,
      creator: undefined,
      date: undefined,
      subject: undefined,
    });
  });

  describe("parseOptionalStringArray quirks", () => {
    it("maps an empty array to an empty array", () => {
      const result = parseNZImage({ ...validRaw, creator: [] });
      expect(result?.creator).toEqual([]);
    });

    it("maps a mixed-type array to undefined", () => {
      const result = parseNZImage({ ...validRaw, creator: ["a", 1] });
      expect(result?.creator).toBeUndefined();
    });

    it("maps a non-array value to undefined", () => {
      const result = parseNZImage({ ...validRaw, creator: "not an array" });
      expect(result?.creator).toBeUndefined();
    });
  });
});

describe("fetchNZImage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("requests /api/image with no query string when exclude is absent", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ ok: true, json: async () => validRaw });

    await fetchNZImage();

    expect(fetchMock).toHaveBeenCalledWith("/api/image", {
      signal: undefined,
      cache: "no-store",
    });
  });

  it("joins a non-empty exclude list into the query string", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ ok: true, json: async () => validRaw });

    await fetchNZImage({ exclude: ["a", "b"] });

    expect(fetchMock).toHaveBeenCalledWith("/api/image?exclude=a%2Cb", {
      signal: undefined,
      cache: "no-store",
    });
  });

  it("does not add an exclude param for an empty exclude array", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ ok: true, json: async () => validRaw });

    await fetchNZImage({ exclude: [] });

    expect(fetchMock).toHaveBeenCalledWith("/api/image", {
      signal: undefined,
      cache: "no-store",
    });
  });

  it("passes the abort signal through to fetch", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ ok: true, json: async () => validRaw });
    const controller = new AbortController();

    await fetchNZImage({ signal: controller.signal });

    expect(fetchMock).toHaveBeenCalledWith("/api/image", {
      signal: controller.signal,
      cache: "no-store",
    });
  });

  it("returns null when the response is not ok", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ ok: false, json: async () => validRaw });

    expect(await fetchNZImage()).toBeNull();
  });

  it("returns the parsed image when the response is ok", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ ok: true, json: async () => validRaw });

    const result = await fetchNZImage();

    expect(result?.id).toBe(1);
    expect(result?.title).toBe("A photo");
  });

  it("returns null when the response body fails to parse", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ bad: "data" }) });

    expect(await fetchNZImage()).toBeNull();
  });
});

describe("fetchCollections", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns [] when the response is not ok", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ ok: false, json: async () => ["a"] });

    expect(await fetchCollections()).toEqual([]);
  });

  it("returns [] when the response body is not an array", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ not: "an array" }) });

    expect(await fetchCollections()).toEqual([]);
  });

  it("returns [] when the array contains a non-string element", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ ok: true, json: async () => ["a", 1] });

    expect(await fetchCollections()).toEqual([]);
  });

  it("returns the string array when the response is ok", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ ok: true, json: async () => ["a", "b"] });

    expect(await fetchCollections()).toEqual(["a", "b"]);
  });

  it("passes the abort signal through to fetch", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ ok: true, json: async () => [] });
    const controller = new AbortController();

    await fetchCollections(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith("/api/collections", { signal: controller.signal });
  });
});
