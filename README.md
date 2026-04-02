# Card Match App

This folder is the self-contained web app.

## What is inside

- `index.html`
- `assets/`
- `data/offers.json`
- `refresh_data.py`

## Refresh the app data

This app no longer needs the Excel pipeline.

Run:

```powershell
python refresh_data.py
```

That script scrapes Peekaboo directly and rewrites:

```text
data/offers.json
```

## Run locally

From this folder:

```powershell
python -m http.server 8000 --bind 0.0.0.0
```

Then open:

```text
http://localhost:8000
```

## Deploy for free

Recommended:

- Cloudflare Pages
- Netlify
- GitHub Pages

For all three, publish this folder as a static site.

## Recommended deployment path

The app is a static site, so deployment is straightforward:

1. Put this folder in a GitHub repository.
2. Make sure `data/offers.json` is committed.
3. Connect the repo to a static host.
4. Set the publish directory to the repo root or this folder, depending on how you store it.

### Netlify

- New site from Git
- Build command: leave blank
- Publish directory: `.`

### Cloudflare Pages

- Create application from Git
- Framework preset: `None`
- Build command: leave blank
- Build output directory: `.`

### GitHub Pages

- If this folder is the repo root, enable Pages and deploy from the main branch.
- If this folder lives inside a larger repo, use a GitHub Actions workflow to publish just this directory.

## Before going live

- Run `python refresh_data.py` to refresh the latest offers.
- Test locally with `python -m http.server 8000 --bind 0.0.0.0`.
- Check the filters and results in desktop and mobile layout.
- If you want automatic data refresh, the next step is to move `refresh_data.py` into a scheduled job that rewrites `data/offers.json` and pushes the update to your repo on a daily or weekly cadence.
