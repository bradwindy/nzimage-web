import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // never statically cache; fresh image per call

export async function GET() {
  const base = process.env.IMAGE_API_URL;
  const secret = process.env.NZIMAGE_API_SECRET;
  if (!base || !secret) {
    return NextResponse.json({ error: "Image API not configured" }, { status: 500 });
  }
  try {
    const upstream = await fetch(`${base}/image`, {
      headers: { secret },
      cache: "no-store",
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: upstream.status });
    }
    return NextResponse.json(await upstream.json(), {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 502 });
  }
}
