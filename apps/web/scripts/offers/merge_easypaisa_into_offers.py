import json
import sys
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OFFERS_PATH = ROOT / "data" / "offers.json"
DEFAULT_EASYPAISA_PATH = ROOT / "data" / "sources" / "easypaisa" / "discountworld-food.json"

# Path setup so we can import from sibling restaurant_match without
# requiring the caller to mess with PYTHONPATH.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from restaurant_match import (  # noqa: E402
    build_match_index,
    clean_name,
    find_match,
)


def normalize_offer(row: dict) -> dict:
    """Build the canonical offer record. Cleans the merchant name (HTML
    entity decode + accent strip + whitespace collapse) so Easypaisa
    rows like 'Babaaz Café &amp; Cuisine' don't end up alongside their
    real siblings as a separate restaurant. Canonicalization against
    the existing pool happens at merge time, see merge_easypaisa_into_offers."""
    discount_pct_raw = row.get("headline_discount_pct")
    discount_pct = float(discount_pct_raw) if discount_pct_raw is not None else None

    discount_label = None
    if row.get("headline_discount_label"):
        discount_label = row["headline_discount_label"]
    elif discount_pct is not None:
        discount_label = f"{discount_pct:g}%"

    cap_pkr = row.get("cap_pkr")
    if cap_pkr is not None:
        cap_pkr = int(cap_pkr)

    cleaned_name = clean_name(row["merchant_name"])

    return {
        "city": row["city"],
        "restaurant": cleaned_name,
        "bank": "Easypaisa",
        "card": row["card_name"],
        "cardCategory": "debit",
        "discountPct": discount_pct,
        "discountLabel": discount_label,
        "fixedDiscountPkr": None,
        "offerTitle": None,
        "days": list(range(7)),
        "daysLabel": "All Days",
        "capPkr": cap_pkr,
        "sourceMerchantName": row.get("merchant_name"),
        "sourceAddress": None,
        "discountIsUpTo": False,
        "discountType": "percentage",
    }


def build_payload(offers: list[dict], existing_payload: dict) -> dict:
    restaurants_by_city: dict[str, set[str]] = {}
    for offer in offers:
        restaurants_by_city.setdefault(offer["city"], set()).add(offer["restaurant"])

    payload = {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "dayNames": existing_payload["dayNames"],
        "cities": existing_payload["cities"],
        "restaurantsByCity": {
            city: sorted(values) for city, values in restaurants_by_city.items()
        },
        "stats": {
            "offers": len(offers),
            "cards": len({f"{offer['bank']}||{offer['card']}" for offer in offers}),
            "banks": len({offer["bank"] for offer in offers}),
            "restaurants": len({f"{offer['city']}||{offer['restaurant']}" for offer in offers}),
        },
        "offers": offers,
    }
    # Preserve restaurant enrichment (cuisine tags, branches, social, photos).
    # Without this carry-forward, the merge silently strips enrichment from
    # offers.json, breaking the downstream cuisine filter in the UI.
    if existing_payload.get("restaurants"):
        payload["restaurants"] = existing_payload["restaurants"]
    return payload


def dedupe_offers(offers: list[dict]) -> list[dict]:
    deduped: dict[tuple, dict] = {}
    for offer in offers:
        key = (
            offer["city"],
            offer["restaurant"],
            offer["bank"],
            offer["card"],
            tuple(offer["days"]),
            offer.get("discountPct"),
            offer.get("fixedDiscountPkr"),
            offer.get("capPkr"),
            offer.get("offerTitle"),
            offer.get("sourceAddress"),
        )
        deduped[key] = offer
    return list(deduped.values())


def filter_invalid_offers(offers: list[dict]) -> list[dict]:
    cleaned = []
    for offer in offers:
        pct = offer.get("discountPct")
        fixed = offer.get("fixedDiscountPkr")
        if pct is None and fixed is None:
            continue
        if pct is not None and float(pct) <= 0:
            continue
        if fixed is not None and int(fixed) <= 0:
            continue
        cleaned.append(offer)
    return cleaned


def merge_easypaisa_into_offers(
    offers_path: Path = DEFAULT_OFFERS_PATH,
    easypaisa_path: Path = DEFAULT_EASYPAISA_PATH,
) -> dict:
    offers_payload = json.loads(offers_path.read_text(encoding="utf-8"))
    easypaisa_payload = json.loads(easypaisa_path.read_text(encoding="utf-8"))

    existing_offers = [offer for offer in offers_payload["offers"] if offer.get("bank") != "Easypaisa"]
    existing_keys = {
        (
            row["city"],
            row["restaurant"],
            row["bank"],
            row["card"],
            tuple(row["days"]),
            row.get("discountPct"),
            row.get("fixedDiscountPkr"),
            row.get("capPkr"),
            row.get("offerTitle"),
            row.get("sourceAddress"),
        )
        for row in existing_offers
    }

    # Canonicalize Easypaisa merchant names against the existing
    # restaurant pool (Peekaboo + NBP) so case/spacing/accent drift
    # doesn't spawn duplicate restaurants. e.g. 'Café Bleu' merges into
    # the existing 'Cafe Bleu'; 'Sub Stop' into 'Substop'; etc.
    restaurants_by_city, token_frequency_by_city = build_match_index(existing_offers)

    merged_offers = list(existing_offers)
    for row in easypaisa_payload["offers"]:
        normalized = normalize_offer(row)
        city = normalized["city"]
        candidates = restaurants_by_city.get(city, set())
        canonical = find_match(normalized["restaurant"], city, candidates, token_frequency_by_city)
        if canonical:
            normalized["restaurant"] = canonical
        key = (
            normalized["city"],
            normalized["restaurant"],
            normalized["bank"],
            normalized["card"],
            tuple(normalized["days"]),
            normalized.get("discountPct"),
            normalized.get("fixedDiscountPkr"),
            normalized.get("capPkr"),
            normalized.get("offerTitle"),
            normalized.get("sourceAddress"),
        )
        if key in existing_keys:
            continue
        merged_offers.append(normalized)
        existing_keys.add(key)

    merged_offers = filter_invalid_offers(merged_offers)
    merged_offers = dedupe_offers(merged_offers)

    merged_offers.sort(
        key=lambda item: (
            item["city"],
            item["bank"],
            item["card"],
            item["restaurant"],
            item["discountPct"] if item["discountPct"] is not None else -1,
        )
    )

    payload = build_payload(merged_offers, offers_payload)
    offers_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


def main() -> None:
    merge_easypaisa_into_offers()


if __name__ == "__main__":
    main()
