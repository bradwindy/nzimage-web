# nzimage-web

A full-screen slideshow of random New Zealand heritage images, built with Next.js
(App Router).

## Architecture

The browser never talks to the image API directly. It calls the same-origin route
`GET /api/image` (`app/api/image/route.ts`), which runs server-side on Vercel, attaches
the `secret` header required by the upstream Swift Lambda, and forwards the JSON
response. This keeps the API secret out of the client bundle entirely — see
`nzimageapi-lambda/docs/ACCESS-CONTROL.md` for why the lambda requires this.

```
Browser --GET /api/image--> Route Handler --GET {IMAGE_API_URL}/image, header: secret--> Lambda
```

`app/page.tsx` is a client component that polls `/api/image` in a loop, preloads each
image (`img.decode()`) before swapping it in, and displays a new image roughly every
10 seconds.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `IMAGE_API_URL` — base URL of the lambda's API Gateway (no trailing slash, no
  `/image` suffix).
- `NZIMAGE_API_SECRET` — a per-consumer secret provisioned in the lambda's
  `ApiClientSecrets` (see `nzimageapi-lambda/docs/ACCESS-CONTROL.md` §5 for how the
  lambda owner provisions one for this site). **Server-side only** — never prefix
  these with `NEXT_PUBLIC_`.

Both variables must also be set in the Vercel project (Production and Preview
environments) for deployed builds.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Images won't load until
`NZIMAGE_API_SECRET` is a valid secret provisioned on the lambda side.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint
