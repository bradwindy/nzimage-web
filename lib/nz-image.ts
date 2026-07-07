export interface NZImage {
  id: number;
  title: string;
  description?: string;
  thumbnailUrl: string;
  largeThumbnailUrl: string;
  displayCollection?: string;
  landingUrl?: string;
  creator?: string[];
  date?: string[];
  subject?: string[];
}

function parseOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  if (!value.every((v) => typeof v === "string")) return undefined;
  return value;
}

export function parseNZImage(data: unknown): NZImage | null {
  if (typeof data !== "object" || data === null) return null;
  const o = data as Record<string, unknown>;
  if (
    typeof o.id !== "number" ||
    typeof o.title !== "string" ||
    typeof o.large_thumbnail_url !== "string" ||
    typeof o.thumbnail_url !== "string"
  ) {
    return null;
  }
  return {
    id: o.id,
    title: o.title,
    thumbnailUrl: o.thumbnail_url,
    largeThumbnailUrl: o.large_thumbnail_url,
    description: typeof o.description === "string" ? o.description : undefined,
    displayCollection:
      typeof o.display_collection === "string" ? o.display_collection : undefined,
    landingUrl: typeof o.landing_url === "string" ? o.landing_url : undefined,
    creator: parseOptionalStringArray(o.creator),
    date: parseOptionalStringArray(o.date),
    subject: parseOptionalStringArray(o.subject),
  };
}

export interface FetchNZImageOptions {
  signal?: AbortSignal;
  exclude?: string[];
}

export async function fetchNZImage(opts: FetchNZImageOptions = {}): Promise<NZImage | null> {
  const params = new URLSearchParams();
  if (opts.exclude && opts.exclude.length > 0) {
    params.set("exclude", opts.exclude.join(","));
  }
  const query = params.toString();
  const url = query ? `/api/image?${query}` : "/api/image";

  const res = await fetch(url, { signal: opts.signal, cache: "no-store" });
  if (!res.ok) return null;
  return parseNZImage(await res.json());
}

export async function fetchCollections(signal?: AbortSignal): Promise<string[]> {
  const res = await fetch("/api/collections", { signal });
  if (!res.ok) return [];
  const data: unknown = await res.json();
  if (!Array.isArray(data) || !data.every((v) => typeof v === "string")) return [];
  return data;
}
