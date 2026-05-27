"""Regression tests for the restaurant_match module.

Every case here is a real drift pair from the May 2026 audit — the
matcher was producing duplicate restaurants for one of these reasons:
  - case-only delta ('TABAQ' vs 'Tabaq')
  - punctuation/whitespace ('Soho Cafe & Grill' vs 'Soho Cafe & Grill ')
  - split compound ('Steak House' vs 'Steakhouse')
  - HTML entities never decoded (Easypaisa: 'Meemu&#039;s')
  - Unicode accents never normalized (Easypaisa: 'Café Bleu')

Run directly:
    python3 apps/web/scripts/offers/test_restaurant_match.py
"""
from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from restaurant_match import (  # noqa: E402
    build_match_index,
    clean_name,
    find_match,
    match_score,
)


# ── clean_name: HTML entities, accents, mojibake, whitespace ───────────
def test_clean_html_entities() -> None:
    assert clean_name("Meemu&#039;s") == "Meemu's"
    assert clean_name("Papa Jee&#039;s") == "Papa Jee's"
    assert clean_name("Babaaz Café &amp; Cuisine") == "Babaaz Cafe & Cuisine"
    assert clean_name("LaLa&#039;s Café") == "LaLa's Cafe"


def test_clean_unicode_accents() -> None:
    assert clean_name("Café Bleu") == "Cafe Bleu"
    assert clean_name("Café Bogie") == "Cafe Bogie"
    assert clean_name("Marfa Café") == "Marfa Cafe"
    assert clean_name("Terrace Café") == "Terrace Cafe"


def test_clean_mojibake() -> None:
    # 'CafÃ©' is the latin1-decoded-as-utf8 mojibake for 'Café'
    assert clean_name("CafÃ© Bleu") == "Cafe Bleu"


def test_clean_whitespace() -> None:
    assert clean_name("Soho Cafe & Grill ") == "Soho Cafe & Grill"
    assert clean_name("  multiple   spaces  ") == "multiple spaces"


def test_clean_is_idempotent() -> None:
    x = "Café Bleu"
    assert clean_name(x) == clean_name(clean_name(x))
    y = "Meemu&#039;s"
    assert clean_name(y) == clean_name(clean_name(y))


def test_clean_handles_empty() -> None:
    assert clean_name("") == ""
    assert clean_name(None) == ""  # type: ignore[arg-type]


# ── match_score / find_match: the 8 drift cases ────────────────────────
def _index(offers: list[tuple[str, str]]):
    """Build a match index from (city, restaurant) tuples."""
    return build_match_index([{"city": c, "restaurant": r} for c, r in offers])


def test_drift_tabaq_case_only() -> None:
    # 5-char single-token signature — was failing the old 6-char threshold.
    existing = {("Karachi", "Tabaq")}
    by_city, freq = _index(list(existing))
    assert find_match("TABAQ", "Karachi", by_city["Karachi"], freq) == "Tabaq"


def test_drift_soho_trailing_whitespace() -> None:
    # After clean_name, trailing whitespace collapses; both produce sig "soho".
    by_city, freq = _index([("Karachi", "Soho Cafe & Grill ")])
    assert find_match("Soho Cafe & Grill", "Karachi", by_city["Karachi"], freq) == "Soho Cafe & Grill "


def test_drift_ox_steak_house_compound() -> None:
    # 'house' is no longer in GENERIC_TOKENS so 'Steak House' and
    # 'Steakhouse' both collapse to 'steakhouse' in the signature.
    by_city, freq = _index([("Karachi", "Ox & Grill Steakhouse")])
    assert find_match("OX & Grill Steak House", "Karachi", by_city["Karachi"], freq) == "Ox & Grill Steakhouse"


def test_drift_karnivora_steak_house_compound() -> None:
    by_city, freq = _index([("Lahore", "Karnivora Steakhouse")])
    assert find_match("Karnivora Steak House", "Lahore", by_city["Lahore"], freq) == "Karnivora Steakhouse"


def test_drift_butchers_steak_house_compound() -> None:
    by_city, freq = _index([("Lahore", "Butcher's Steakhouse")])
    assert find_match("Butcher's Steak House", "Lahore", by_city["Lahore"], freq) == "Butcher's Steakhouse"


def test_drift_fryday_case_only() -> None:
    by_city, freq = _index([("Lahore", "Fryday Cafe")])
    assert find_match("Fryday cafe", "Lahore", by_city["Lahore"], freq) == "Fryday Cafe"


def test_drift_substop_space() -> None:
    # 'Sub Stop' tokens after stripping = ['sub', 'stop']; 'Substop' = ['substop'].
    # Joined signatures: 'substop' == 'substop'. Two distinct tokens in 'Sub Stop'
    # so the multi-token branch returns 1.0.
    by_city, freq = _index([("Karachi", "Sub Stop")])
    assert find_match("Substop", "Karachi", by_city["Karachi"], freq) == "Sub Stop"


def test_drift_manzil_grill_parklane() -> None:
    by_city, freq = _index([("Lahore", "Manzil Grill (Park Lane Hotel)")])
    assert find_match(
        "Manzil Grill (Parklane Hotel)", "Lahore", by_city["Lahore"], freq
    ) == "Manzil Grill (Park Lane Hotel)"


def test_easypaisa_accented_cafe_matches_existing() -> None:
    # End-to-end Easypaisa case: a Peekaboo restaurant exists with
    # ASCII name, Easypaisa sends the accented version. After clean_name
    # they should match.
    by_city, freq = _index([("Karachi", "Cafe Bleu")])
    # Easypaisa raw -> clean_name -> "Cafe Bleu"
    assert clean_name("Café Bleu") == "Cafe Bleu"
    # Then find_match against the existing pool finds the exact match.
    cleaned = clean_name("Café Bleu")
    assert find_match(cleaned, "Karachi", by_city["Karachi"], freq) == "Cafe Bleu"


# ── negative cases: distinct restaurants must NOT collapse ─────────────
def test_distinct_restaurants_do_not_collapse() -> None:
    by_city, freq = _index([("Karachi", "KFC")])
    # 'KFC' is only 3 chars after stripping, below the new 4-char threshold.
    assert find_match("McDonald's", "Karachi", by_city["Karachi"], freq) is None


def test_common_short_token_blocked_by_frequency() -> None:
    # If many restaurants share a common short token like 'pizza',
    # single-token matches must be blocked even when the new threshold
    # allows them.
    existing = [
        ("Karachi", "Pizza Hut"),
        ("Karachi", "Pizza Max"),
        ("Karachi", "Pizza Slice"),
        ("Karachi", "Pizza Origin"),
    ]
    by_city, freq = _index(existing)
    # A standalone 'Pizza' shouldn't match any of the existing siblings
    # because 'pizza' is in too many existing entries (freq > 2).
    result = find_match("Pizza", "Karachi", by_city["Karachi"], freq)
    assert result is None, f"unexpected match: {result}"


def test_match_score_handles_empty_city_index() -> None:
    # Smoke: no existing offers in city → no match without crashing.
    by_city, freq = _index([])
    assert find_match("Anything", "Karachi", by_city.get("Karachi", set()), freq) is None


def main() -> int:
    tests = [
        test_clean_html_entities,
        test_clean_unicode_accents,
        test_clean_mojibake,
        test_clean_whitespace,
        test_clean_is_idempotent,
        test_clean_handles_empty,
        test_drift_tabaq_case_only,
        test_drift_soho_trailing_whitespace,
        test_drift_ox_steak_house_compound,
        test_drift_karnivora_steak_house_compound,
        test_drift_butchers_steak_house_compound,
        test_drift_fryday_case_only,
        test_drift_substop_space,
        test_drift_manzil_grill_parklane,
        test_easypaisa_accented_cafe_matches_existing,
        test_distinct_restaurants_do_not_collapse,
        test_common_short_token_blocked_by_frequency,
        test_match_score_handles_empty_city_index,
    ]
    failed = 0
    for t in tests:
        try:
            t()
        except AssertionError as e:
            print(f"FAIL: {t.__name__}\n  AssertionError: {e}")
            failed += 1
            continue
        except Exception as e:
            print(f"FAIL: {t.__name__}\n  {type(e).__name__}: {e}")
            failed += 1
            continue
        print(f"PASS: {t.__name__}")
    print(f"\n{len(tests) - failed}/{len(tests)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
