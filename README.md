# nzimage-web

A full-screen slideshow of random New Zealand heritage images, built with Next.js
(App Router) and hosted on a Cloudflare Worker with Static Assets at
[nzimages.iolab.nz](https://nzimages.iolab.nz).

## Architecture

The site is a Next.js static export. `npm run build` writes it to `out/`, and Cloudflare
serves those files as static assets without running any code. Only `/api/*` runs the
Worker (`worker/index.ts`), which calls the `nzimages-api` Worker over an RPC service
binding. The browser never talks to the image API directly, and the site holds no secret.

```
Browser --GET /api/*--> nzimages-web Worker --env.API.image() / collections()--> nzimages-api Worker
Browser --GET /*------> Static Assets (out/)
```

- `GET /api/image?exclude=a&exclude=b` (one param per hidden collection, since names can contain
  commas) calls `env.API.image({ exclude: ["a", "b"] })` and returns
  the image JSON with `cache-control: no-store`. It returns 502 `Upstream error` when
  `image()` returns `null`, and 502 `Upstream unreachable` when the call throws.
- `GET /api/collections` returns `env.API.collections()` with `cache-control: max-age=3600`,
  or 502 `Upstream unreachable`.

`app/page.tsx` is a client component that polls `/api/image` in a loop, preloads each
image (`img.decode()`) before swapping it in, and shows a new one at the interval set in
settings (30 seconds by default). Polling pauses while the tab is hidden.

`wrangler.jsonc` holds the Worker config: the `out/` assets with a 404 page,
`run_worker_first: ["/api/*"]`, the `API` service binding, and the `nzimages.iolab.nz`
custom domain.

## Request budget

The Cloudflare account is on the Workers Free plan: 100,000 Worker requests a day, shared
by every Worker on the account, and 10 ms CPU per request. Static asset requests are free
and never run the Worker, so only `/api/*` calls count. A visible tab makes one
`/api/image` call per image shown, so a tab left open all day at the 30 second default
makes about 2,900. A hidden tab makes none. While `nzimages-api` is failing, a tab backs
off its retries from 1 second, doubling up to 60 seconds, so a down API costs about 60
requests an hour per tab.

## Local development

```bash
npm install
npm run dev
```

`npm run dev` serves the UI at [http://localhost:3000](http://localhost:3000), but it has no
`/api/*` routes, so images won't load. To run the full site:

```bash
npm run preview
```

This builds `out/` and serves it with `wrangler dev` at
[http://localhost:8787](http://localhost:8787). `/api/*` returns 502 `Upstream unreachable`
until the `API` binding can reach `nzimages-api`, either:

- run `npx wrangler dev` in the `nzimages-api` repo at the same time. Wrangler's dev
  registry connects the service binding, and `wrangler dev` lists it as `[connected]`.
- or add `"remote": true` to the `API` service binding in `wrangler.jsonc` to call the
  deployed Worker (needs `npx wrangler login`). Don't commit that change.

## Deploying

```bash
npx wrangler login
npm run deploy
```

This builds `out/` and runs `wrangler deploy`. The `nzimages-api` Worker must already be
deployed on the same account, since the service binding points at it.

## Scripts

- `npm run dev` - Next.js dev server, UI only
- `npm run build` - static export to `out/`
- `npm run preview` - build, then serve the Worker and assets locally with `wrangler dev`
- `npm run deploy` - build, then `wrangler deploy`
- `npm run lint` - ESLint
- `npm run typecheck:worker` - generate Worker runtime types with `wrangler types`, then
  type-check `worker/`
- `npm test` - run the Vitest suite once (use `npm run test:watch` for watch mode)
