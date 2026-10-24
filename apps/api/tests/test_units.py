import re
from datetime import date
from decimal import Decimal

import pytest

from app.core.i18n import format_date, format_inr, t
from app.core.ids import CROCKFORD, is_karu_id, new_karu_id, new_order_number, new_passport_code, normalise_code, uuid7
from app.core.translit import phonetic_key
from app.modules.catalog.service import relevance
from app.modules.pricing.service import percentile, remove_outliers, round_to, size_bucket


def test_ids():
    for _ in range(200):
        k = new_karu_id()
        assert re.fullmatch(r"KRU-[0-9A-HJKMNP-TV-Z]{8}", k)
        assert is_karu_id(k)
        assert not set(k[4:]) & set("ILOU")
    assert new_passport_code().startswith("KRP-")
    assert set(CROCKFORD).isdisjoint("ILOU")
    assert normalise_code("kru-8f29a1qo") == "KRU-8F29A1Q0"
    assert re.fullmatch(r"KO-\d{6}-[0-9A-Z]{5}", new_order_number(__import__("datetime").datetime(2026, 10, 24)))
    a, b = uuid7(), uuid7()
    assert a.version == 7 and a.int >> 80 <= b.int >> 80


@pytest.mark.parametrize("amount,expected", [
    (1800, "₹1,800"), (100000, "₹1,00,000"), (2600, "₹2,600"), (12345678, "₹1,23,45,678"), (999, "₹999"),
    (Decimal("1499.50"), "₹1,499.50"), (0, "₹0"),
])
def test_inr_indian_grouping(amount, expected):
    assert format_inr(amount) == expected


def test_dates_localised_with_western_digits():
    assert format_date(date(2026, 10, 24), "en") == "24 Oct 2026"
    assert format_date(date(2026, 11, 3), "hi").endswith("2026")
    assert format_date(date(2026, 11, 3), "hi").startswith("3 ")


def test_catalogue_placeholders_and_fallback():
    assert "₹2,600–₹3,400" in t("price.below", "en", basis_label="handmade sarees", low="₹2,600", high="₹3,400", price="₹1,800")
    assert t("tip.add_video", "ur") != t("tip.add_video", "en")
    assert t("notif.order_shipped", "ta", order_number="X", title="Y", tracking="") .startswith("Your order")  # en fallback


def test_transliteration_matches_hinglish_and_devanagari():
    target = "A:" + phonetic_key("बनारसी साड़ी") + "|B:|C:"
    for q in ("banarasi saree", "benarasi sari", "बनारसी साड़ी", "Banarasi"):
        assert relevance(phonetic_key(q).split(), target) > 0.5, q
    assert relevance(phonetic_key("pottery").split(), target) == 0


def test_pricing_math():
    vals = [1000, 1100, 1200, 1300, 1400, 9000]
    kept = remove_outliers(vals)
    assert 9000 not in kept
    assert percentile([1, 2, 3, 4], 0.5) == 2.5
    assert round_to(2810, 50) == Decimal(2800)
    assert round_to(2830, 50) == Decimal(2850)
    assert size_bucket({"dimensions": {"length_m": 5.5}}) == "len4-6"
    assert size_bucket({}) == "na"
