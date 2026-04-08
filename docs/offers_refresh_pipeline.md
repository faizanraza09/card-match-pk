# Offers Refresh Pipeline

The offers dataset now has one orchestrated entrypoint:

- `python scripts/refresh_all_offers.py`

That script runs the full rebuild in this order:

1. `refresh_data.py`
   - refreshes the main Peekaboo-backed offers dataset
   - writes `data/offers.json`
2. `scripts/extract_easypaisa_discountworld.py`
   - refreshes the public Easypaisa dataset
   - writes `data/easypaisa-discountworld-food.json`
3. `scripts/merge_easypaisa_into_offers.py`
   - merges Easypaisa rows into `data/offers.json`
   - recalculates dataset stats and restaurants-by-city
4. `scripts/validate_offers_dataset.py`
   - checks the merged dataset for duplicates, missing fields, invalid stats,
     and missing Easypaisa rows

## Why it is split this way

The sources are materially different:

- Peekaboo data is refreshed from the existing authenticated pipeline
- Easypaisa data is refreshed from public Discount World and Easypaisa pages

So the repo keeps source-specific refresh scripts, but the app-level workflow is
now one command.

## Files involved

- `refresh_data.py`
- `scripts/extract_easypaisa_discountworld.py`
- `scripts/merge_easypaisa_into_offers.py`
- `scripts/refresh_all_offers.py`
- `scripts/validate_offers_dataset.py`

## Expected output files

- `data/offers.json`
- `data/easypaisa-discountworld-food.json`

## Operational note

`refresh_data.py` still requires `PEEKABOO_TOKEN` to be present in `.env` or the
environment.
