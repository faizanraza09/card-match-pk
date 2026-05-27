from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

from restaurant_match import (
    build_match_index as build_restaurant_match_index,  # name kept for call-site stability
    fix_mojibake,
    match_score as restaurant_match_score,
    normalize_tokens as normalize_restaurant_tokens,
    signature as restaurant_signature,
)


ROOT = Path(__file__).resolve().parents[2]
OFFERS_PATH = ROOT / "data" / "offers.json"
NBP_SOURCE_PATH = ROOT / "data" / "sources" / "nbp" / "active-merchants-food.json"


def normalize_offer(row: dict, card_name: str, restaurant_name: str) -> dict:
    discount_pct = row.get("discount_pct")
    if discount_pct is not None:
        discount_pct = float(discount_pct)

    fixed_discount_pkr = row.get("fixed_discount_pkr")
    if fixed_discount_pkr is not None:
        fixed_discount_pkr = int(fixed_discount_pkr)

    cap_pkr = row.get("cap_pkr")
    if cap_pkr is not None:
        cap_pkr = int(cap_pkr)

    discount_type = row.get("discount_type") or "percentage"

    discount_label = None
    if discount_type == "fixed" and fixed_discount_pkr is not None:
        discount_label = f"Save Rs. {fixed_discount_pkr:,}"
    elif discount_type == "up_to" and discount_pct is not None:
        discount_label = f"Up to {discount_pct:g}%"
    elif discount_type == "bogo" and discount_pct is not None:
        discount_label = f"Buy 1 Get 1 ({discount_pct:g}%)"
    elif discount_pct is not None:
        discount_label = f"{discount_pct:g}%"

    return {
        "city": row["city"],
        "restaurant": restaurant_name,
        "bank": "National Bank of Pakistan",
        "card": card_name,
        "cardCategory": "debit",
        "discountPct": discount_pct,
        "discountLabel": discount_label,
        "fixedDiscountPkr": fixed_discount_pkr,
        "offerTitle": row["offer_title"],
        "offerDescription": row.get("offer_description") or None,
        "orderTypes": [{"Instore": "Dine-In", "Ecommerce": "Delivery"}.get(row.get("vertical", ""), "Dine-In")],
        "days": list(range(7)),
        "daysLabel": "All Days",
        "capPkr": cap_pkr,
        "sourceMerchantName": row["merchant_name"],
        "sourceAddress": row.get("address") or None,
        "discountIsUpTo": row.get("discount_is_up_to") or False,
        "discountType": discount_type,
    }


def dedupe_key(offer: dict) -> tuple:
    return (
        offer["city"],
        offer["restaurant"],
        offer["bank"],
        offer["card"],
        tuple(offer["days"]),
        offer.get("discountPct"),
        offer.get("fixedDiscountPkr"),
        offer.get("capPkr"),
        offer.get("offerTitle"),
        offer.get("offerDescription"),
        tuple(offer.get("orderTypes", [])),
        offer.get("sourceAddress"),
    )


def merge_nbp_into_offers(
    offers_path: Path = OFFERS_PATH,
    nbp_source_path: Path = NBP_SOURCE_PATH,
) -> dict:
    offers_payload = json.loads(offers_path.read_text(encoding="utf-8"))
    nbp_payload = json.loads(nbp_source_path.read_text(encoding="utf-8"))

    existing_offers = [offer for offer in offers_payload["offers"] if offer.get("bank") != "National Bank of Pakistan"]
    existing_keys = {dedupe_key(row) for row in existing_offers}
    merged_offers = list(existing_offers)
    restaurants_by_city, token_frequency_by_city = build_restaurant_match_index(existing_offers)

    for row in nbp_payload["offers"]:
        city = row["city"]
        restaurant_name = row["merchant_name"]
        best_candidate = restaurant_name
        best_score = 0.0
        for candidate in sorted(restaurants_by_city.get(city, set())):
            score = restaurant_match_score(
                restaurant_name,
                candidate,
                city,
                token_frequency_by_city,
            )
            if score > best_score:
                best_score = score
                best_candidate = candidate
        restaurant_name = best_candidate

        for card_name in row["cards"]:
            normalized = normalize_offer(row, card_name, restaurant_name)
            key = dedupe_key(normalized)
            if key in existing_keys:
                continue
            merged_offers.append(normalized)
            existing_keys.add(key)

        restaurants_by_city.setdefault(city, set()).add(restaurant_name)

    merged_offers.sort(
        key=lambda item: (
            item["city"],
            item["bank"],
            item["card"],
            item["restaurant"],
            item["discountPct"] if item["discountPct"] is not None else -1,
        )
    )

    restaurants_by_city: dict[str, set[str]] = {}
    for offer in merged_offers:
        restaurants_by_city.setdefault(offer["city"], set()).add(offer["restaurant"])

    payload = {
        "generatedAt": offers_payload["generatedAt"],
        "dayNames": offers_payload["dayNames"],
        "cities": offers_payload["cities"],
        "restaurantsByCity": {
            city: sorted(values) for city, values in restaurants_by_city.items()
        },
        "stats": {
            "offers": len(merged_offers),
            "cards": len({f"{offer['bank']}||{offer['card']}" for offer in merged_offers}),
            "banks": len({offer["bank"] for offer in merged_offers}),
            "restaurants": len({f"{offer['city']}||{offer['restaurant']}" for offer in merged_offers}),
        },
        "offers": merged_offers,
    }
    # Preserve restaurant enrichment (cuisine tags, branches, social, photos).
    # Same fix as merge_easypaisa_into_offers.build_payload.
    if offers_payload.get("restaurants"):
        payload["restaurants"] = offers_payload["restaurants"]

    offers_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


def main() -> None:
    payload = merge_nbp_into_offers()
    print(
        json.dumps(
            {
                "offers": payload["stats"]["offers"],
                "cards": payload["stats"]["cards"],
                "banks": payload["stats"]["banks"],
                "restaurants": payload["stats"]["restaurants"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
