export interface NZImage {
  id: number;
  title: string;
  description?: string;
  thumbnailUrl: string;
  largeThumbnailUrl: string;
  displayCollection?: string;
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
  };
}

export async function fetchNZImage(signal?: AbortSignal): Promise<NZImage | null> {
  const res = await fetch("/api/image", { signal, cache: "no-store" });
  if (!res.ok) return null;
  return parseNZImage(await res.json());
}
