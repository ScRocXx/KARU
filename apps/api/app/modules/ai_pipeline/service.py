"""Snap + Speak pipeline (Part 2 §6): photos + voice note → reviewed draft listing.

Steps (job progress): transcribe → understand (structured extraction) → write
(title/description in source language + English + Hindi) → draft ready. Partial results
stream to the wait screen via `job.result["preview"]`. Then, in the background:
enhance photos (non-generative) + AI catalogue shots (Gemini), and market prices.
Extraction failing twice falls back to the manual form (F2 edge case); the artisan
always reviews before publishing. Originals are kept for verification and proof; AI shots
go in the gallery and can be removed by the artisan.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import imaging
from app.core.db import utcnow
from app.core.i18n import LANGUAGE_NAMES_EN
from app.core.jobs import enqueue, handler, on_failure, set_progress
from app.core.storage import get_storage
from app.modules.artisans.models import ArtisanProfile
from app.modules.artisans.service import place_of
from app.modules.catalog import attributes
from app.modules.catalog.models import AiExtraction, Category, Craft, Listing, ListingMedia
from app.modules.catalog.service import all_categories, listing_media, refresh_search
from app.modules.media.models import Media
from app.providers.imagegen import get_imagegen
from app.providers.llm import get_llm, rule_based_extract
from app.providers.stt import get_stt

logger = logging.getLogger(__name__)

# Attribute fields come from the category specs (catalog/reference.py). The LLM only fills values;
# missing fields and notes are computed from the specs, never taken from the model.
_ATTR_SCHEMA, _ATTR_KEYS = attributes.llm_schema()
EXTRACT_SCHEMA = {
    "type": "object",
    "properties": {
        "category_slug": {"type": "string"},
        "craft_slug": {"type": "string"},
        "attributes": _ATTR_SCHEMA,
        "price_inr": {"type": "number"},
        "quantity_mentioned": {"type": "integer"},
        "field_confidence": {"type": "object", "properties": {
            k: {"type": "number"} for k in ("category_slug", "price_inr", *_ATTR_KEYS)}},
    },
    "required": ["attributes", "field_confidence"],
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
        "number words to digits (e.g. 'अठारह सौ' → 1800). If something is not stated or visible, omit the key "
        "rather than guessing. field_confidence values are 0–1.\n"
        f"Allowed category_slug values: {json.dumps(category_slugs)}.\n"
        f"Known crafts (craft_slug only if clearly this craft): {json.dumps(craft_list, ensure_ascii=False)}.\n"
        f"TRANSCRIPT:\n{transcript or '(no voice note — use photos only; price will be asked separately)'}"
    )
    extract_schema = EXTRACT_SCHEMA
    if category_slugs:
        import copy
        extract_schema = copy.deepcopy(EXTRACT_SCHEMA)
        extract_schema["properties"]["category_slug"]["enum"] = category_slugs
    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            result = await llm.generate_json(prompt, schema=extract_schema, purpose="extract", images=photos,
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

SHOT_GROUPS = {
    "pottery-terracotta": "object",
    "woodcraft": "object",
    "metal-brass": "object",
    "bamboo-cane": "object",
    "toys": "object",
    "other": "object",
    "sarees": "textile",
    "dupattas-stoles": "textile",
    "kurtas-fabric": "textile",
    "home-textiles": "home",
    "jewellery": "jewel",
    "paintings": "art",
    "leather": "leather",
}

SHOTS: dict[str, list[tuple[str, str]]] = {
    "object": [
        ("hero", "white bg, 3/4 front view, soft shadow"),
        ("lifestyle", "warm Indian home (shelf or table), natural light"),
        ("detail", "macro of glaze, carving or tool marks"),
        ("scale", "held in a hand or next to a cup, using height/width attributes"),
        ("angle", "side or top view on white"),
    ],
    "textile": [
        ("hero", "neatly folded on white, border visible"),
        ("worn", "draped on an Indian model, light-grey studio"),
        ("detail", "weave or motif macro"),
        ("spread", "laid flat, full pattern or pallu"),
        ("lifestyle", "festive styled scene"),
    ],
    "home": [
        ("hero", "folded on white"),
        ("lifestyle", "on a bed, sofa or table in a room"),
        ("detail", "weave macro"),
        ("spread", "full pattern laid flat"),
        ("scale", "on furniture"),
    ],
    "jewel": [
        ("hero", "white bg, about 75% fill"),
        ("worn", "close crop on a model (neck, ear or wrist)"),
        ("detail", "macro"),
        ("scale", "in a palm"),
        ("lifestyle", "on fabric or a tray, gift mood"),
    ],
    "art": [
        ("hero", "straight-on, white surround"),
        ("lifestyle", "on a wall above furniture (also shows scale)"),
        ("detail", "brushwork macro"),
        ("angle", "30° view showing the edge or frame"),
        ("scale", "next to a person or chair"),
    ],
    "leather": [
        ("hero", "white bg"),
        ("worn", "carried or in use"),
        ("detail", "stitching macro"),
        ("angle", "open, showing the inside"),
        ("scale", "in a hand"),
    ],
}

SHOT_PROMPT_PREFIX = (
    "Using the reference photo, create a professional e-commerce product photograph. "
    "The product must remain exactly identical: same shape, proportions, colours, pattern, "
    "glaze, and handmade imperfections. Do not add, remove or alter anything on the product. "
    "No text, logos or watermarks."
)


async def generate_shots(db: AsyncSession, listing: Listing, job=None) -> int:
    """Generate up to 5 marketplace-style AI catalogue images from real photos."""
    rows = await listing_media(db, listing.id, ("photo",))
    if not rows:
        return 0
    rows.sort(key=lambda r: (not r[0].is_primary, r[0].position))
    primary_orig = rows[0][1]

    st = get_storage()
    photo_bytes: list[bytes] = []
    for _, m in rows:
        data = await st.get_private(m.storage_key)
        img = await asyncio.to_thread(imaging.load_image, data)
        compressed = await asyncio.to_thread(imaging.compress_for_llm, img)
        photo_bytes.append(compressed)

    cat_slug = "other"
    if listing.category_id:
        cat = await db.get(Category, listing.category_id)
        if cat:
            cat_slug = cat.slug
    group = SHOT_GROUPS.get(cat_slug, "object")
    shot_list = SHOTS.get(group, SHOTS["object"])

    all_media = await listing_media(db, listing.id)
    existing_shots = {lm.role for lm, _ in all_media if (lm.role or "").startswith("ai_")}

    title_en = (listing.title or {}).get("en") or (listing.title or {}).get(listing.source_lang, "")
    attrs = listing.attributes or {}
    dims = attrs.get("dimensions")
    dims_str = ""
    if isinstance(dims, dict):
        dims_str = ", ".join(f"{k}: {v}" for k, v in dims.items() if v)
    elif dims:
        dims_str = str(dims)

    count = 0
    total = len(shot_list)
    for i, (shot, instruction) in enumerate(shot_list):
        role = f"ai_{shot}"
        if role in existing_shots:
            continue

        prompt_lines = [
            SHOT_PROMPT_PREFIX,
            f"Shot instruction: {instruction}.",
        ]
        if title_en:
            prompt_lines.append(f"Title: {title_en}")
        if cat_slug:
            prompt_lines.append(f"Category: {cat_slug}")
        if attrs.get("material"):
            prompt_lines.append(f"Material: {attrs['material']}")
        if dims_str:
            prompt_lines.append(f"Dimensions: {dims_str}")
        prompt = "\n".join(prompt_lines)

        try:
            ai_bytes = await get_imagegen().edit(
                prompt,
                photo_bytes,
                aspect_ratio="4:5",
                purpose="ai_image",
                listing_id=listing.id,
            )
        except Exception as exc:
            logger.warning("ai shot %s failed for listing %s: %s", shot, listing.id, exc)
            continue

        try:
            ai_img = await asyncio.to_thread(imaging.load_image, ai_bytes)
            derived = Media(
                owner_user_id=primary_orig.owner_user_id,
                kind="ai_image",
                mime="image/jpeg",
                storage_key="pending",
                status="ready",
                created_at=utcnow(),
            )
            db.add(derived)
            await db.flush()

            derived.storage_key = f"derived/{derived.id}.jpg"
            await st.put_private(derived.storage_key, imaging.encode(ai_img, "JPEG", 90), "image/jpeg")

            vars_ = await asyncio.to_thread(imaging.variants, ai_img)
            keys = {}
            for name, blob in vars_.items():
                key = f"public/{derived.id}/{name}"
                await st.put_public(key, blob, "image/webp" if name.endswith(".webp") else "image/jpeg")
                keys[name] = key
            derived.variants = keys
            derived.public_key = keys.get("800_4x5.jpg")
            derived.width, derived.height = ai_img.size

            db.add(ListingMedia(
                listing_id=listing.id,
                media_id=derived.id,
                role=role,
                position=i,
                source_media_id=primary_orig.id,
            ))
            await db.commit()
            count += 1
        except Exception as exc:
            logger.warning("saving ai shot %s failed for listing %s: %s", shot, listing.id, exc)
            continue

        if job:
            pct = int((i + 1) / total * 100)
            await set_progress(db, job, pct, f"shot_{shot}")
            await db.commit()

    return count


@handler("ai.generate_shots", queue="ai", max_attempts=2, timeout_s=300)
async def generate_shots_job(db: AsyncSession, job) -> dict:
    listing = await db.get(Listing, uuid.UUID(job.ref_id))
    if listing is None:
        return {"skipped": True}
    # Non-generative clean-up first (fast, idempotent); the progress bump makes the review screen refetch.
    await enhance_photos(db, listing)
    await set_progress(db, job, 5, "enhancing_photos")
    count = await generate_shots(db, listing, job=job)
    return {"listing_id": str(listing.id), "shots_generated": count}


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
            try:
                audio = await get_storage().get_private(m.storage_key)
                tr = await get_stt().transcribe(audio, m.mime, listing.source_lang, duration_s=m.duration_s,
                                                client_transcript=payload.get("client_transcript"), listing_id=listing.id)
                transcript = {"lang": tr.language, "text": tr.text, "confidence": tr.confidence, "provider": tr.provider,
                              "segments": tr.segments}
            except Exception as exc:
                logger.warning("Audio transcription failed for %s: %s; falling back to client transcript", listing.id, exc)
                c_text = (payload.get("client_transcript") or "").strip()
                transcript = {"lang": listing.source_lang, "text": c_text, "confidence": 0.5 if c_text else 0.0,
                              "provider": "browser" if c_text else "fallback", "segments": []}
            m.transcript = transcript
        transcript_text = transcript.get("text", "")
    elif payload.get("client_transcript"):
        transcript_text = payload["client_transcript"]
        transcript = {"lang": listing.source_lang, "text": transcript_text, "confidence": 0.6, "provider": "browser"}

    # Partial results ride on job.result so the wait screen can show them as they land (SSE pushes changes).
    preview = {"transcript": transcript_text}
    job.result = {"preview": preview}

    # 2. Understand
    await set_progress(db, job, 35, "understanding")
    photos = await _photos_for_llm(db, listing)
    fallback = False
    try:
        extracted = await extract(db, listing, transcript_text, photos, cat_slugs, crafts)
    except ExtractionFailed:
        extracted = rule_based_extract(transcript_text, cat_slugs)
        fallback = True
    cat = None
    if extracted.get("category_slug"):
        cat = (await db.execute(select(Category).where(Category.slug == extracted["category_slug"]))).scalar_one_or_none()
        listing.category_id = cat.id if cat else listing.category_id
    if cat is None and listing.category_id:
        cat = await db.get(Category, listing.category_id)
    craft = None
    if extracted.get("craft_slug"):
        craft = next((c for c in crafts if c.slug == extracted["craft_slug"]), None)
    if craft is None and profile and profile.crafts:
        craft = next((c for c in crafts if c.slug in profile.crafts), None)
    if craft:
        listing.craft_id = craft.id
    listing.attributes = attributes.normalize({**(extracted.get("attributes") or {}), **(listing.attributes or {})})
    if extracted.get("price_inr") and listing.price_inr is None:
        listing.price_inr = Decimal(str(round(float(extracted["price_inr"]), 2)))
    listing.field_confidence = extracted.get("field_confidence") or {}
    listing.missing_fields = attributes.missing_fields(cat.attribute_schema if cat else None, listing.attributes,
                                                       price=listing.price_inr, has_category=cat is not None)
    listing.notes_for_artisan = attributes.notes_for_artisan(price=listing.price_inr)
    preview = {**preview, "category_slug": extracted.get("category_slug"),
               "price_inr": float(listing.price_inr) if listing.price_inr is not None else None,
               "material": (listing.attributes or {}).get("material")}
    job.result = {"preview": preview}
    await db.commit()

    # 3. Write
    await set_progress(db, job, 65, "writing")
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

    c_name = (craft.name or {}).get("en") if craft else (cat.name if cat else "Handmade Craft")
    c_name = c_name or "Handmade Indian Craft"
    if not listing.title or not any(listing.title.values()):
        listing.title = {
            "en": f"Handcrafted {c_name}",
            "hi": f"हस्तनिर्मित {c_name}",
            listing.source_lang: f"Handcrafted {c_name}",
        }
    if not listing.description or not any(listing.description.values()):
        mat = (listing.attributes or {}).get("material") or "authentic materials"
        tech = (listing.attributes or {}).get("technique") or "traditional craftsmanship"
        desc_en = f"Authentic handcrafted {c_name} made with {mat} using {tech}. Checked by Karu verification."
        listing.description = {
            "en": desc_en,
            "hi": f"पारंपरिक भारतीय हस्तशिल्प ({c_name}), {mat} और {tech} से निर्मित।",
            listing.source_lang: desc_en,
        }
    if not listing.tags:
        listing.tags = ["handmade", "craft", "authentic", "karu"]
    title = listing.title or {}
    job.result = {"preview": {**preview, "title": title.get(listing.source_lang) or title.get("en")}}
    await db.commit()

    # Photo enhancement and market prices are slow and not needed to review the text, so they run as
    # background jobs (ai.generate_shots, pricing.refresh_listing) after the draft is handed over.
    primary = await listing_media(db, listing.id, ("photo",))
    if primary:
        prim = next((m for lm, m in primary if lm.is_primary), primary[0][1])
        listing.image_embedding = prim.embedding
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
    owner = profile.user_id if profile else getattr(job, "owner_user_id", None)
    await enqueue(db, "ai.generate_shots", ref_type="listing", ref_id=str(listing.id), owner_user_id=owner)
    await enqueue(db, "pricing.refresh_listing", ref_type="listing", ref_id=str(listing.id), owner_user_id=owner)
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
        listing.attributes = attributes.normalize(fresh.get("attributes")) or listing.attributes
        listing.field_confidence = fresh.get("field_confidence") or listing.field_confidence
        listing.missing_fields = attributes.missing_fields(category.attribute_schema if category else None, listing.attributes,
                                                           price=listing.price_inr, has_category=category is not None)
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
