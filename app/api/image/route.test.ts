// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

function makeRequest(path = "/api/image") {
  return new Request(`http://localhost${path}`);
}

describe("GET /api/image", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns 500 when IMAGE_API_URL is unset", async () => {
    vi.stubEnv("IMAGE_API_URL", "");
    vi.stubEnv("NZIMAGE_API_SECRET", "shh");

    const res = await GET(makeRequest());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Image API not configured" });
  });

  it("returns 500 when NZIMAGE_API_SECRET is unset", async () => {
    vi.stubEnv("IMAGE_API_URL", "https://upstream.example.com");
    vi.stubEnv("NZIMAGE_API_SECRET", "");

    const res = await GET(makeRequest());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Image API not configured" });
  });

  describe("with a configured environment", () => {
    beforeEach(() => {
      vi.stubEnv("IMAGE_API_URL", "https://upstream.example.com");
      vi.stubEnv("NZIMAGE_API_SECRET", "shh");
    });

    it("proxies a successful upstream response with a no-store cache header", async () => {
      const body = { id: 1, title: "Photo" };
      const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
      fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => body });

      const res = await GET(makeRequest());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(body);
      expect(res.headers.get("cache-control")).toBe("no-store");
    });

    it("sends the secret header and forwards to {base}/image", async () => {
      const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
      fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

      await GET(makeRequest());

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toBe("https://upstream.example.com/image");
      expect(init.headers).toEqual({ secret: "shh" });
      expect(init.cache).toBe("no-store");
    });

    it("forwards a non-empty exclude param to the upstream URL", async () => {
      const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
      fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

      await GET(makeRequest("/api/image?exclude=a,b"));

      const [url] = fetchMock.mock.calls[0];
      expect(String(url)).toBe("https://upstream.example.com/image?exclude=a%2Cb");
    });

    it("does not forward an empty exclude param", async () => {
      const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
      fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

      await GET(makeRequest("/api/image?exclude="));

      const [url] = fetchMock.mock.calls[0];
      expect(String(url)).toBe("https://upstream.example.com/image");
    });

    it("propagates a non-2xx upstream status as an 'Upstream error'", async () => {
      const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
      fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });

      const res = await GET(makeRequest());

      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: "Upstream error" });
    });

    it("returns 502 when fetch throws", async () => {
      const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
      fetchMock.mockRejectedValue(new Error("network down"));

      const res = await GET(makeRequest());

      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ error: "Upstream unreachable" });
    });

    it("returns 502 when upstream.json() rejects", async () => {
      const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error("bad json");
        },
      });

      const res = await GET(makeRequest());

      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ error: "Upstream unreachable" });
    });
  });
});
