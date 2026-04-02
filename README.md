# Card Match PK

Static web app for comparing dining card offers in Pakistan.

## Refresh data

Create a `.env` file in the project root with:

```text
PEEKABOO_TOKEN=PASTE_TOKEN_HERE
```

Then run:

```powershell
python refresh_data.py
```

That rewrites:

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

## Local test flow

Use this sequence before deploying:

```powershell
python refresh_data.py
python -m http.server 8000 --bind 0.0.0.0
```

Then open `http://localhost:8000` and test:

- city filters
- restaurant filters
- bank filters
- card type filters
- result ranking

## Deploy

Recommended host:

- Cloudflare Pages

Use the repo root as the static site directory.
