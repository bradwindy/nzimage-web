// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import worker, { type WorkerEnv } from "./index";

const image = vi.fn();
const collections = vi.fn();
const assetsFetch = vi.fn();
const env = { API: { image, collections }, ASSETS: { fetch: assetsFetch } } as unknown as WorkerEnv;

function get(path: string, method = "GET") {
  return worker.fetch(new Request(`http://localhost${path}`, { method }), env);
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/image", () => {
  it("returns the upstream image with a no-store cache header", async () => {
    const body = { id: 1, title: "Photo" };
    image.mockResolvedValue(body);

    const res = await get("/api/image");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(body);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("calls image() with no options when exclude is absent", async () => {
    image.mockResolvedValue({});

    await get("/api/image");

    expect(image).toHaveBeenCalledExactlyOnceWith({});
  });

  it("forwards one exclude param per collection, keeping commas inside a name", async () => {
    image.mockResolvedValue({});

    await get("/api/image?exclude=a&exclude=Te%20Toi%20Uku%2C%20Crown%20Lynn");

    expect(image).toHaveBeenCalledWith({ exclude: ["a", "Te Toi Uku, Crown Lynn"] });
  });

  it("does not forward an empty exclude param", async () => {
    image.mockResolvedValue({});

    await get("/api/image?exclude=");

    expect(image).toHaveBeenCalledWith({});
  });

  it("returns 502 'Upstream error' when image() returns null", async () => {
    image.mockResolvedValue(null);

    const res = await get("/api/image");

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Upstream error" });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 502 'Upstream unreachable' when the RPC call throws", async () => {
    image.mockRejectedValue(new Error("network down"));

    const res = await get("/api/image");

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Upstream unreachable" });
  });
});

describe("GET /api/collections", () => {
  it("returns the upstream collections with a max-age cache header", async () => {
    const body = ["Collection A", "Collection B"];
    collections.mockResolvedValue(body);

    const res = await get("/api/collections");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(body);
    expect(res.headers.get("cache-control")).toBe("max-age=3600");
  });

  it("returns 502 'Upstream unreachable' when the RPC call throws", async () => {
    collections.mockRejectedValue(new Error("network down"));

    const res = await get("/api/collections");

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Upstream unreachable" });
  });
});

describe("routing", () => {
  it("rejects non-GET methods on API routes", async () => {
    const res = await get("/api/image", "POST");

    expect(res.status).toBe(405);
    expect(image).not.toHaveBeenCalled();
  });

  it("hands unknown paths to static assets", async () => {
    const notFound = new Response("not found", { status: 404 });
    assetsFetch.mockResolvedValue(notFound);

    const res = await get("/api/unknown");

    expect(res).toBe(notFound);
    expect(image).not.toHaveBeenCalled();
    expect(collections).not.toHaveBeenCalled();
  });
});
