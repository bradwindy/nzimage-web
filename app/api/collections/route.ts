import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.IMAGE_API_URL;
  const secret = process.env.NZIMAGE_API_SECRET;
  if (!base || !secret) {
    return NextResponse.json({ error: "Image API not configured" }, { status: 500 });
  }
  try {
    const upstream = await fetch(`${base}/collections`, { headers: { secret } });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: upstream.status });
    }
    return NextResponse.json(await upstream.json(), {
      headers: { "cache-control": "max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 502 });
  }
}
