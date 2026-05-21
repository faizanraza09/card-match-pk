# Build pipeline

The `banks/` and `restaurants/` directories on disk are **build artifacts**
generated from `data/offers.json` + `scripts/seo/generate_seo_pages.py`. They
are ignored by git (see `.gitignore`) and regenerated at deploy time.

## Why ignore them?

- ~1,500 file diffs every time `data/offers.json` is refreshed make PRs
  unreviewable.
- Visual changes to the bank/restaurant page template require regenerating
  every page (we already hit this once when fixing a responsive overflow —
  had to add a higher-specificity global CSS override because inline `<style>`
  blocks in the generated HTML were frozen at generation time).
- Two devs running `npm run generate:seo` on different branches produce
  unmergeable conflicts in 1,500 files.

## How it works

1. Source of truth: `data/offers.json` + `scripts/seo/generate_seo_pages.py`
2. CF Pages runs `npm run build` (= the Python generator) on every deploy.
3. The output `banks/` and `restaurants/` directories are served by CF Pages.

## Cloudflare Pages configuration

In the Cloudflare Pages dashboard:

* **Settings → Builds & deployments → Build configurations**
* **Build command**: `npm run build`
* **Build output directory**: `.` (the project root — same as `pages_build_output_dir` in `wrangler.toml`)
* **Root directory**: leave as `/` (project root)
* **Environment variables**: ensure `PYTHON_VERSION=3.11` (CF Pages defaults to 2.7)

`package.json` exposes:
```bash
npm run build         # runs scripts/seo/generate_seo_pages.py
npm run generate:seo  # alias
```

## Local development

After pulling a fresh clone, run the generator once to populate `banks/` and
`restaurants/`:

```bash
npm run build
```

Re-run any time you change `data/offers.json` or the generator template.
