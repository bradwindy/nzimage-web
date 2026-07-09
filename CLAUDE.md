# CLAUDE.md - nzimage-web

## What this is

A single-page, full-screen slideshow of random New Zealand heritage images. Next.js 16
(App Router), React 19, TypeScript, deployed on Vercel. One user-facing page (`app/page.tsx`)
backed by a client-side settings layer (`lib/settings*`, `components/`) and two API routes
(`/api/image`, `/api/collections`); there is no database and no auth.

## Commands

```bash
npm run dev        # dev server at http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint (flat config, eslint.config.mjs)
npm test           # run the Vitest suite once
npm run test:watch # Vitest in watch mode
```

Tests use Vitest (config in `vitest.config.mts`, setup in `vitest.setup.ts`). Pure logic in
`lib/` is unit-tested (`lib/*.test.ts`); client components are tested with React Testing
Library + jsdom (`components/*.test.tsx`). CI (`.github/workflows/test.yml`) runs lint, test,
and build.

Images will not load in dev until `NZIMAGE_API_SECRET` holds a valid secret (see below).

## Architecture

The one non-obvious thing to understand is the **secret-proxy pattern**. The browser never
calls the upstream image API directly. The request chain is:

```
Browser --GET /api/image--> Route Handler --GET {IMAGE_API_URL}/image, header: secret--> upstream Lambda
```

- `app/api/image/route.ts` — server-side Route Handler. Reads `IMAGE_API_URL` and
  `NZIMAGE_API_SECRET` from the environment, attaches `secret` as a request header, and
  forwards the upstream JSON. This is the only place the secret is used, keeping it out of
  the client bundle. Marked `dynamic = "force-dynamic"` with `cache: "no-store"` on both the
  upstream fetch and the response so every call returns a fresh image.
- `app/page.tsx` — `"use client"` component. A single async loop inside `useEffect` drives
  the slideshow: fetch an image → preload it with `img.decode()` → swap it into state →
  `sleep(10s)` → repeat. A failed fetch retries after 1s; an image that fails to decode is
  skipped and a new one fetched immediately. Cleanup uses an `AbortController` plus a
  `cancelled` flag so the loop stops on unmount.
- `lib/nz-image.ts` — the data boundary. The upstream returns **snake_case** JSON
  (`large_thumbnail_url`, `thumbnail_url`, `display_collection`); `parseNZImage` validates
  it and maps to the **camelCase** `NZImage` interface, returning `null` on anything
  malformed. Keep validation here rather than in the component.

The upstream is a separate Swift Lambda project (`nzimageapi-lambda`, not in this repo, but should be in the same ~/Developer directory on the users machine).

Its access-control contract — why the `secret` header is required and how per-consumer secrets
are provisioned — lives in `nzimageapi-lambda/docs/ACCESS-CONTROL.md`.

## Conventions and constraints

- **Env vars are server-only.** `IMAGE_API_URL` and `NZIMAGE_API_SECRET` must never be
  prefixed with `NEXT_PUBLIC_` — that would leak the secret into the browser bundle. Copy
  `.env.example` to `.env.local` for local dev. Both must also be set in the Vercel project
  (Production and Preview) for deployed builds.
- **Images are unoptimized on purpose.** `next.config.js` sets `images.unoptimized: true`
  and `<Image>` uses the `unoptimized` prop, because the sources are arbitrary external
  upstream thumbnail URLs. Don't re-enable Next image optimization for these.
- Path alias `@/*` maps to the repo root (e.g. `@/lib/nz-image`).
- `reactStrictMode` is on, so the `useEffect` loop runs twice in dev — the AbortController
  cleanup must keep working for that to be safe.
