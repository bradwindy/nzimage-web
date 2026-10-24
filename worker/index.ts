// RPC surface of the `nzimages-api` Worker's `ImageApi` entrypoint. `wrangler types` can only
// type the binding as a plain `Service`, since that Worker's code lives in another repo.
export interface ImageApi {
  image(opts: { collection?: string; exclude?: string[] }): Promise<Record<string, unknown> | null>;
  collections(): Promise<string[]>;
}

export type WorkerEnv = Omit<Env, "API"> & { API: ImageApi };

const NO_STORE = "no-store";

function json(body: unknown, status: number, cacheControl?: string): Response {
  return Response.json(body, {
    status,
    headers: cacheControl ? { "cache-control": cacheControl } : undefined,
  });
}

async function handleImage(api: ImageApi, url: URL): Promise<Response> {
  // One `exclude` param per collection: names can contain commas ("Te Toi Uku, Crown Lynn and
  // Clayworks Museum"), so a comma-joined list can't carry them.
  const exclude = url.searchParams.getAll("exclude").filter(Boolean);
  try {
    const image = await api.image(exclude.length > 0 ? { exclude } : {});
    if (image == null) return json({ error: "Upstream error" }, 502, NO_STORE);
    return json(image, 200, NO_STORE);
  } catch (error) {
    console.error("nzimages-api image() failed", error);
    return json({ error: "Upstream unreachable" }, 502, NO_STORE);
  }
}

async function handleCollections(api: ImageApi): Promise<Response> {
  try {
    return json(await api.collections(), 200, "max-age=3600");
  } catch (error) {
    console.error("nzimages-api collections() failed", error);
    return json({ error: "Upstream unreachable" }, 502);
  }
}

const routes: Record<string, (api: ImageApi, url: URL) => Promise<Response>> = {
  "/api/image": handleImage,
  "/api/collections": handleCollections,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = routes[url.pathname];
    if (!route) return env.ASSETS.fetch(request);
    if (request.method !== "GET") {
      return new Response(null, { status: 405, headers: { allow: "GET" } });
    }
    return route(env.API, url);
  },
} satisfies ExportedHandler<WorkerEnv>;
