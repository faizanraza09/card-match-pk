# KonsaCard

Monorepo for the KonsaCard restaurant-discount-card comparison tool, covering
the web app at [konsacard.pk](https://konsacard.pk) and the upcoming
React Native mobile app.

## Layout

```
.
├── apps/
│   ├── web/      Cloudflare Pages site (static + functions), Python data pipelines
│   └── mobile/   Expo (React Native + TypeScript) mobile app
└── packages/     Reserved for shared TS packages (planned: algorithms)
```

Each app keeps its own `package.json`, lockfile, and tooling. The shared
algorithm logic is still duplicated today (`apps/web/assets/algorithms.js`
vs. `apps/mobile/src/lib/algorithms.ts`); the planned `packages/algorithms/`
extraction will collapse that into a single TypeScript source that builds to
both targets.

## Running locally

### Web

```
cd apps/web
npm install
npm run dev          # Cloudflare Pages dev (wrangler) on :8002
# or
npm run dev:static   # plain Python static server on :8002
```

### Mobile

```
cd apps/mobile
npm install
npx expo start       # then open in Expo Go or a dev build
```

## Deployment

### Web

Cloudflare Pages auto-deploys from this repo's `main` branch with **Root
Directory** set to `apps/web/`. The Pages project also discovers Functions
under `apps/web/functions/` automatically.

### Mobile

Not auto-deployed. Use EAS Build / `expo run:ios` / `expo run:android`
during development; store submission is a manual step in Phase 5.

## Data pipelines

The offers + card-requirements pipelines live under `apps/web/scripts/` and
write to `apps/web/data/`. Mobile fetches that same data from the deployed
web origin (`konsacard.pk/data/...`) with a version-aware AsyncStorage cache,
so a single `npm run refresh:offers` on the web side flows through to mobile
on the next launch.

See `apps/web/README.md` for the full data-refresh procedure.
