"""Snap + Speak pipeline (Part 2 §6): photos + voice note → reviewed draft listing.

Steps (job progress): transcribe → understand (structured extraction) → write
(title/description in source language + English + Hindi) → enhance photos
(non-generative) → market prices → done. Extraction failing twice falls back to the
manual form (F2 edge case); the artisan always reviews before publishing.
"""

from __future__ import annotations

import asyncio
import json
import time
import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import imaging
from app.core.db import utcnow
from app.core.i18n import LANGUAGE_NAMES_EN
from app.core.jobs import handler, on_failure, set_progress
from app.core.storage import get_storage
from app.modules.artisans.models import ArtisanProfile
from app.modules.artisans.service import place_of
from app.modules.catalog.models import AiExtraction, Category, Craft, Listing, ListingMedia
from app.modules.catalog.service import all_categories, listing_media, refresh_search
from app.modules.media.models import Media
from app.providers.llm import get_llm, rule_based_extract
from app.providers.stt import get_stt

EXTRACT_SCHEMA = {
    "type": "object",
    "properties": {
        "category_slug": {"type": "string"},
        "craft_slug": {"type": "string"},
        "attributes": {
            "type": "object",
            "properties": {
                "material": {"type": "string"}, "technique": {"type": "string"}, "dye": {"type": "string"},
                "colour": {"type": "array", "items": {"type": "string"}},
                "dimensions": {"type": "object", "properties": {
                    "length_m": {"type": "number"}, "width_m": {"type": "number"},
                    "height_cm": {"type": "number"}, "width_cm": {"type": "number"}, "depth_cm": {"type": "number"}}},
                "time_to_make_days": {"type": "integer"}, "care": {"type": "string"}, "weight_g": {"type": "integer"},
            },
        },
        "price_inr": {"type": "number"},
        "quantity_mentioned": {"type": "integer"},
        "field_confidence": {"type": "object", "properties": {
            "category_slug": {"type": "number"}, "price_inr": {"type": "number"}, "material": {"type": "number"},
            "technique": {"type": "number"}, "dye": {"type": "number"}, "dimensions": {"type": "number"},
            "time_to_make_days": {"type": "number"}, "colour": {"type": "number"}}},
        "missing_fields": {"type": "array", "items": {"type": "string"}},
        "notes_for_artisan": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["attributes", "field_confidence", "missing_fields"],
}

DESCRIBE_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "object", "properties": {"source": {"type": "string"}, "en": {"type": "string"}, "hi": {"type": "string"}},
                  "required": ["source", "en", "hi"]},
        "description": {"type": "object", "properties": {"source": {"type": "string"}, "en": {"type": "string"}, "hi": {"type": "string"}},
                        "required": ["source", "en", "hi"]},
        "tags": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["title", "description", "tags"],
}

WRITING_RULES = (
    "Rules: warm and factual, 60–120 words for the description, no invented claims. Use ONLY facts from the transcript "
    "and what is visible in the photos. Never claim 'GI certified', 'organic', 'pure silk', 'natural dye' or any origin "
    "detail unless the artisan said it. Do not mention prices. Titles under 70 characters. Tags: 3–8 short lowercase "
    "English keywords."
)


async def _photos_for_llm(db: AsyncSession, listing: Listing, limit: int = 3) -> list[tuple[bytes, str]]:
    rows = await listing_media(db, listing.id, ("photo",))
    out = []
    st = get_storage()
    for _, m in rows[:limit]:
        data = await st.get_private(m.storage_key)
        img = await asyncio.to_thread(imaging.load_image, data)
        out.append((await asyncio.to_thread(imaging.compress_for_llm, img), "image/jpeg"))
    return out


async def extract(db: AsyncSession, listing: Listing, transcript: str, photos, category_slugs: list[str],
                  crafts: list[Craft]) -> dict:
    llm = get_llm()
    craft_list = [{"slug": c.slug, "name": (c.name or {}).get("en"), "category": c.category_slug} for c in crafts]
    prompt = (
        "You help Indian artisans list handmade products. From the artisan's voice-note transcript (in "
        f"{LANGUAGE_NAMES_EN.get(listing.source_lang, listing.source_lang)}) and the product photos, extract structured "
        "listing data. Only use facts the artisan said or that are clearly visible. Prices are in Indian rupees; convert "
        "number words to digits (e.g. 'अठारह सौ' → 1800). If something is not stated, leave it out and list it in "
        "missing_fields (omit unknown keys rather than guessing). field_confidence values are 0–1. notes_for_artisan: short field names the artisan should say "
        "again (e.g. 'price', 'dimensions').\n"
        f"Allowed category_slug values: {json.dumps(category_slugs)}.\n"
        f"Known crafts (craft_slug only if clearly this craft): {json.dumps(craft_list, ensure_ascii=False)}.\n"
        f"TRANSCRIPT:\n{transcript or '(no voice note — use photos only; price will be asked separately)'}"
    )
    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            result = await llm.generate_json(prompt, schema=EXTRACT_SCHEMA, purpose="extract", images=photos,
                                             temperature=0.1 + attempt * 0.2, listing_id=listing.id,
                                             fake_context={"transcript": transcript, "category_slugs": category_slugs})
            if result.get("category_slug") not in category_slugs:
                result["category_slug"] = None
            return result
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
    raise ExtractionFailed(str(last_exc))


class ExtractionFailed(Exception):
    pass


async def describe(listing: Listing, transcript: str, photos, extracted: dict, *, craft_name: str | None, place: str,
                   maker: str, variant: int = 0, only_field: str | None = None) -> dict:
    llm = get_llm()
    src = listing.source_lang
    prompt = (
        f"Write a marketplace title and description for this handmade product in three languages: the artisan's language "
        f"('{src}', {LANGUAGE_NAMES_EN.get(src, src)}) as `source`, English as `en`, Hindi as `hi`. {WRITING_RULES}\n"
        f"Maker: {maker}. Place: {place}. Craft: {craft_name or 'unknown'}.\n"
        f"Structured facts: {json.dumps(extracted.get('attributes', {}), ensure_ascii=False)}\n"
        f"Artisan's words: {transcript or '(none)'}"
    )
    if only_field:
        prompt += f"\nWrite a fresh alternative {only_field} (variation #{variant}); keep the other fields short."
    res = await llm.generate_json(
        prompt, schema=DESCRIBE_SCHEMA, purpose="describe" if not only_field else "regenerate_field", images=photos,
        temperature=0.4 + 0.15 * min(variant, 4), listing_id=listing.id,
        fake_context={"attributes": extracted.get("attributes", {}), "category_slug": extracted.get("category_slug"),
                      "craft_name": craft_name, "place": place, "transcript": transcript, "source_lang": src,
                      "variant": variant, "field": only_field},
    )
    # Normalise {source, en, hi} → {src_lang: …, en: …, hi: …}
    out = {}
    for field in ("title", "description"):
        vals = res.get(field) or {}
        if not vals:
            continue
        mapped = {k: v for k, v in vals.items() if k in ("en", "hi") and v}
        if vals.get("source"):
            mapped[src] = vals["source"]
        elif vals.get(src):
            mapped[src] = vals[src]
        out[field] = mapped
    if res.get("tags"):
        out["tags"] = [str(t).lower()[:32] for t in res["tags"]][:10]
    if res.get("attributes"):
        out["attributes"] = res["attributes"]
    return out


async def enhance_photos(db: AsyncSession, listing: Listing) -> int:
    """Non-generative enhancement; originals stay private and are used for verification."""
    st = get_storage()
    rows = await listing_media(db, listing.id, ("photo", "enhanced_photo"))
    have = {lm.source_media_id for lm, _ in rows if lm.role == "enhanced_photo"}
    count = 0
    for lm, m in rows:
        if lm.role != "photo" or m.id in have:
            continue
        data = await st.get_private(m.storage_key)
        img = await asyncio.to_thread(imaging.load_image, data)
        enhanced = await asyncio.to_thread(imaging.enhance, img)
        derived = Media(owner_user_id=m.owner_user_id, kind="derived_image", mime="image/jpeg", storage_key="pending",
                        status="ready", created_at=utcnow())
        db.add(derived)
        await db.flush()
        derived.storage_key = f"derived/{derived.id}.jpg"
        await st.put_private(derived.storage_key, imaging.encode(enhanced, "JPEG", 90), "image/jpeg")
        vars_ = await asyncio.to_thread(imaging.variants, enhanced)
        keys = {}
        for name, blob in vars_.items():
            key = f"public/{derived.id}/{name}"
            await st.put_public(key, blob, "image/webp" if name.endswith(".webp") else "image/jpeg")
            keys[name] = key
        derived.variants = keys
        derived.public_key = keys.get("800_4x5.jpg")
        derived.width, derived.height = enhanced.size
        derived.phash = m.phash  # derived from the same photo
        derived.embedding = m.embedding
        db.add(ListingMedia(listing_id=listing.id, media_id=derived.id, role="enhanced_photo", position=lm.position,
                            is_primary=lm.is_primary, source_media_id=m.id))
        count += 1
    return count


async def _context(db: AsyncSession, listing: Listing) -> tuple[ArtisanProfile, list[str], list[Craft]]:
    profile = await db.get(ArtisanProfile, listing.artisan_id)
    cats = [c.slug for c in await all_categories(db)]
    crafts = list((await db.execute(select(Craft))).scalars())
    return profile, cats, crafts


@handler("ai.process_listing", queue="ai", max_attempts=2, timeout_s=300)
async def process_listing(db: AsyncSession, job) -> dict:
    started = time.perf_counter()
    listing = await db.get(Listing, uuid.UUID(job.ref_id))
    if listing is None:
        return {"skipped": True}
    profile, cat_slugs, crafts = await _context(db, listing)
    payload = job.payload or {}

    # 1. Transcribe
    await set_progress(db, job, 10, "listening")
    transcript_text, transcript = "", None
    voice = await listing_media(db, listing.id, ("voice_note",))
    if voice:
        m = voice[-1][1]
        if m.transcript and m.transcript.get("text"):
            transcript = m.transcript
        else:
            audio = await get_storage().get_private(m.storage_key)
            tr = await get_stt().transcribe(audio, m.mime, listing.source_lang, duration_s=m.duration_s,
                                            client_transcript=payload.get("client_transcript"), listing_id=listing.id)
            transcript = {"lang": tr.language, "text": tr.text, "confidence": tr.confidence, "provider": tr.provider,
                          "segments": tr.segments}
            m.transcript = transcript
        transcript_text = transcript.get("text", "")
    elif payload.get("client_transcript"):
        transcript_text = payload["client_transcript"]
        transcript = {"lang": listing.source_lang, "text": transcript_text, "confidence": 0.6, "provider": "browser"}

    # 2. Understand
    await set_progress(db, job, 30, "understanding")
    photos = await _photos_for_llm(db, listing)
    fallback = False
    try:
        extracted = await extract(db, listing, transcript_text, photos, cat_slugs, crafts)
    except ExtractionFailed:
        extracted = rule_based_extract(transcript_text, cat_slugs)
        fallback = True
    if extracted.get("category_slug"):
        cat = (await db.execute(select(Category).where(Category.slug == extracted["category_slug"]))).scalar_one_or_none()
        listing.category_id = cat.id if cat else listing.category_id
    craft = None
    if extracted.get("craft_slug"):
        craft = next((c for c in crafts if c.slug == extracted["craft_slug"]), None)
    if craft is None and profile and profile.crafts:
        craft = next((c for c in crafts if c.slug in profile.crafts), None)
    if craft:
        listing.craft_id = craft.id
    listing.attributes = {**(extracted.get("attributes") or {}), **(listing.attributes or {})}
    if extracted.get("price_inr") and listing.price_inr is None:
        listing.price_inr = Decimal(str(round(float(extracted["price_inr"]), 2)))
    listing.field_confidence = extracted.get("field_confidence") or {}
    listing.missing_fields = extracted.get("missing_fields") or []
    listing.notes_for_artisan = extracted.get("notes_for_artisan") or []
    await db.commit()

    # 3. Write
    await set_progress(db, job, 50, "writing")
    place = place_of(profile) if profile else ""
    try:
        written = await describe(listing, transcript_text, photos, extracted,
                                 craft_name=(craft.name or {}).get("en") if craft else None, place=place,
                                 maker=profile.public_name if profile else "")
    except Exception:  # noqa: BLE001
        written = {}
        fallback = True
    if written.get("title"):
        listing.title = {**written["title"], **{k: v for k, v in (listing.title or {}).items() if v}}
    if written.get("description"):
        listing.description = {**written["description"], **{k: v for k, v in (listing.description or {}).items() if v}}
    if written.get("tags"):
        listing.tags = written["tags"]
    await db.commit()

    # 4. Enhance photos (non-generative)
    await set_progress(db, job, 70, "enhancing_photos")
    await enhance_photos(db, listing)
    primary = await listing_media(db, listing.id, ("photo",))
    if primary:
        prim = next((m for lm, m in primary if lm.is_primary), primary[0][1])
        listing.image_embedding = prim.embedding
    await db.commit()

    # 5. Market prices (TinyFish)
    await set_progress(db, job, 85, "checking_prices")
    from app.modules.pricing.service import advise

    try:
        await advise(db, listing, refresh=True)
    except Exception:  # noqa: BLE001 - price guidance must never block a listing
        pass

    await refresh_search(db, listing)
    if listing.status == "processing":
        listing.status = "draft"
    db.add(AiExtraction(
        listing_id=listing.id,
        input_media_ids=[str(m.id) for _, m in await listing_media(db, listing.id, ("photo", "voice_note"))],
        transcript=transcript, extracted=extracted, field_confidence=extracted.get("field_confidence"),
        model_versions={"llm": get_llm().name, "stt": transcript.get("provider") if transcript else None},
        duration_ms=int((time.perf_counter() - started) * 1000), status="fallback" if fallback else "completed",
    ))
    await db.commit()
    return {"listing_id": str(listing.id), "fallback": fallback}


@on_failure("ai.process_listing")
async def process_listing_failed(db: AsyncSession, job) -> None:
    listing = await db.get(Listing, uuid.UUID(job.ref_id))
    if listing and listing.status == "processing":
        listing.status = "draft"  # manual form with mic buttons (F2 edge case)
        listing.notes_for_artisan = ["manual_form"]


@handler("ai.regenerate", queue="ai", max_attempts=1, timeout_s=120)
async def regenerate(db: AsyncSession, job) -> dict:
    listing = await db.get(Listing, uuid.UUID(job.ref_id))
    if listing is None:
        return {"skipped": True}
    field = job.payload["field"]
    variant = int(job.payload.get("variant", 1))
    profile, cat_slugs, crafts = await _context(db, listing)
    ext = (await db.execute(select(AiExtraction).where(AiExtraction.listing_id == listing.id)
                            .order_by(AiExtraction.created_at.desc()).limit(1))).scalar_one_or_none()
    transcript = ((ext.transcript or {}).get("text") if ext else "") or ""
    craft = await db.get(Craft, listing.craft_id) if listing.craft_id else None
    category = await db.get(Category, listing.category_id) if listing.category_id else None
    photos = await _photos_for_llm(db, listing, limit=2)
    extracted = {"attributes": listing.attributes, "category_slug": category.slug if category else None}
    await set_progress(db, job, 30, f"regenerating_{field}")
    if field == "attributes":
        fresh = await extract(db, listing, transcript, photos, cat_slugs, crafts)
        listing.attributes = fresh.get("attributes") or listing.attributes
        listing.field_confidence = fresh.get("field_confidence") or listing.field_confidence
    else:
        written = await describe(listing, transcript, photos, extracted, craft_name=(craft.name or {}).get("en") if craft else None,
                                 place=place_of(profile), maker=profile.public_name, variant=variant,
                                 only_field=None if field == "all" else field)
        if field in ("title", "all") and written.get("title"):
            listing.title = written["title"]
        if field in ("description", "all") and written.get("description"):
            listing.description = written["description"]
        if field in ("tags", "all") and written.get("tags"):
            listing.tags = written["tags"]
    await refresh_search(db, listing)
    await db.commit()
    return {"field": field}


TRANSLATE_SCHEMA = {"type": "object", "properties": {"title": {"type": "string"}, "description": {"type": "string"}},
                    "required": ["title", "description"]}


@handler("ai.translate", queue="ai", max_attempts=2, timeout_s=120)
async def translate_listing(db: AsyncSession, job) -> dict:
    """Buyer-locale translation on first view, cached on the listing (Part 2 §6.4)."""
    listing = await db.get(Listing, uuid.UUID(job.ref_id))
    target = job.payload.get("locale")
    llm = get_llm()
    if listing is None or not target or target in (listing.description or {}) or llm.name == "fake":
        return {"skipped": True}
    src = listing.source_lang if listing.source_lang in (listing.description or {}) else "en"
    res = await llm.generate_json(
        f"Translate this handmade-product title and description from {LANGUAGE_NAMES_EN.get(src, src)} into "
        f"{LANGUAGE_NAMES_EN.get(target, target)}. Keep craft names and place names as they are. Do not add claims.\n"
        f"TITLE: {(listing.title or {}).get(src, '')}\nDESCRIPTION: {(listing.description or {}).get(src, '')}",
        schema=TRANSLATE_SCHEMA, purpose="translate", temperature=0.2, listing_id=listing.id,
        fake_context={"text": (listing.description or {}).get(src, "")},
    )
    if res.get("title"):
        listing.title = {**listing.title, target: res["title"]}
    if res.get("description"):
        listing.description = {**listing.description, target: res["description"]}
    await refresh_search(db, listing)
    await db.commit()
    return {"locale": target}
