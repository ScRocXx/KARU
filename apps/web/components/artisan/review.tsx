"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Pencil, RefreshCw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { PriceRangeBar } from "@/components/karu/price-range-bar";
import { MicButton } from "@/components/karu/voice";
import { useToast } from "@/components/toast";
import { Banner, Button, Input, Select, Skeleton, Spinner, Textarea } from "@/components/ui";
import { languageNames, type Locale } from "@/i18n/config";
import { ApiError, api } from "@/lib/api";
import { cx, inr } from "@/lib/format";
import { useJob } from "@/lib/hooks";
import type { ImageSet, PriceAdvice } from "@/lib/types";

export interface ArtisanListing {
  id: string;
  code: string;
  status: string;
  source_lang: string;
  title: Record<string, string>;
  description: Record<string, string>;
  attributes: Record<string, unknown>;
  tags: string[];
  price_inr: number | null;
  category_slug: string | null;
  craft_slug: string | null;
  returnable: boolean;
  quantity_total: number;
  quantity_available: number;
  verification_status: string;
  price_position: string;
  field_confidence: Record<string, number>;
  missing_fields: string[];
  notes_for_artisan: string[];
  transcript: string | null;
  transcript_provider: string | null;
  extraction_status: string | null;
  processing: { job_id: string; status: string; progress: number; step: string | null } | null;
  gallery: (ImageSet & { is_primary: boolean; enhanced: boolean; original_id: string })[];
  making_video: { id: string; duration_s: number | null; poster: string | null } | null;
  views: number;
  shares: number;
  sales: { units: number; revenue_inr: number };
  share_url: string;
  published_at: string | null;
  regenerate_left: number;
}

const ATTRS: { key: string; kind: "text" | "number" | "list" | "length" | "height" }[] = [
  { key: "material", kind: "text" },
  { key: "technique", kind: "text" },
  { key: "dye", kind: "text" },
  { key: "colour", kind: "list" },
  { key: "length_m", kind: "length" },
  { key: "height_cm", kind: "height" },
  { key: "time_to_make_days", kind: "number" },
  { key: "care", kind: "text" },
];

export function useListing(id: string | null) {
  return useQuery({ queryKey: ["listing", id], queryFn: () => api<ArtisanListing>(`/listings/${id}`), enabled: !!id });
}

/** A07b: "Karu is listening…" with live job steps. */
export function Processing({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const t = useTranslations("sell.new");
  const job = useJob(jobId, (j) => j.status === "completed" || j.status === "failed" ? onDone() : undefined);
  const steps = ["listening", "understanding", "writing", "enhancing_photos", "checking_prices"];
  const current = job?.step ? steps.indexOf(job.step) : 0;
  return (
    <section className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="relative flex size-32 items-center justify-center">
        <span className="animate-pulse-ring absolute inset-0 rounded-full bg-indigo-900/10" />
        <span className="flex size-24 items-center justify-center rounded-full bg-indigo-900 text-white">
          <Sparkles className="size-10" />
        </span>
      </div>
      <h1 className="font-display text-[26px]">{t("listening")}</h1>
      <ol className="flex w-full max-w-xs flex-col gap-2 text-start">
        {steps.map((s, i) => (
          <li key={s} className={cx("flex items-center gap-3 text-[15px]", i < current ? "text-peacock-600" : i === current ? "font-semibold text-ink-900" : "text-ink-300")}>
            <span className="flex size-6 items-center justify-center">{i < current ? "✓" : i === current ? <Spinner className="size-5" /> : "•"}</span>
            {t(`step.${s}`)}
          </li>
        ))}
      </ol>
      <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-indigo-900 transition-all" style={{ width: `${job?.progress ?? 5}%` }} />
      </div>
      <p className="text-sm text-ink-600">{t("usually_20s")}</p>
    </section>
  );
}

/** A08: one page of cards; each card has ✏️ edit, 🎤 speak, 🔄 regenerate. Low-confidence fields highlighted. */
export function ReviewStep({ listing, onNext }: { listing: ArtisanListing; onNext: () => void }) {
  const t = useTranslations("sell.review");
  const qc = useQueryClient();
  const toast = useToast();
  const src = listing.source_lang;
  const [title, setTitle] = useState(listing.title);
  const [desc, setDesc] = useState(listing.description);
  const [attrs, setAttrs] = useState<Record<string, unknown>>(listing.attributes);
  const [price, setPrice] = useState<string>(listing.price_inr ? String(listing.price_inr) : "");
  const [category, setCategory] = useState(listing.category_slug || "");
  const [craft, setCraft] = useState(listing.craft_slug || "");
  const [regenJob, setRegenJob] = useState<{ id: string; field: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => api<{ items: { slug: string; name: string }[] }>("/catalog/categories") });
  const { data: crafts } = useQuery({ queryKey: ["crafts"], queryFn: () => api<{ items: { slug: string; name: string }[] }>("/catalog/crafts") });
  const advice = useQuery({ queryKey: ["advice", listing.id], queryFn: () => api<PriceAdvice>(`/listings/${listing.id}/price-advice`) });

  useJob(regenJob?.id, async () => {
    const fresh = await qc.fetchQuery({ queryKey: ["listing", listing.id], queryFn: () => api<ArtisanListing>(`/listings/${listing.id}`) });
    if (regenJob?.field === "title" || regenJob?.field === "all") setTitle(fresh.title);
    if (regenJob?.field === "description" || regenJob?.field === "all") setDesc(fresh.description);
    if (regenJob?.field === "attributes") setAttrs(fresh.attributes);
    setRegenJob(null);
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync local edit state when the listing is refetched
    setTitle(listing.title);
    setDesc(listing.description);
  }, [listing.title, listing.description]);

  const regenerate = async (field: string) => {
    try {
      const r = await api<{ job_id: string }>(`/listings/${listing.id}/regenerate`, { method: "POST", body: { field } });
      setRegenJob({ id: r.job_id, field });
    } catch (e) {
      toast(e instanceof ApiError && e.code === "regenerate_limit_reached" ? t("regen_limit") : t("error"), "error");
    }
  };
  const low = (k: string) => (listing.field_confidence?.[k] ?? 1) < 0.7 || listing.missing_fields.includes(k);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const dims: Record<string, number> = { ...((attrs.dimensions as Record<string, number>) || {}) };
      const clean: Record<string, unknown> = { ...attrs };
      delete clean.length_m;
      delete clean.height_cm;
      if (attrs.length_m) dims.length_m = Number(attrs.length_m);
      if (attrs.height_cm) dims.height_cm = Number(attrs.height_cm);
      if (Object.keys(dims).length) clean.dimensions = dims;
      await api(`/listings/${listing.id}`, {
        method: "PATCH",
        body: {
          title,
          description: desc,
          attributes: clean,
          price_inr: price ? Number(price) : undefined,
          category_slug: category || undefined,
          craft_slug: craft,
        },
      });
      await qc.invalidateQueries({ queryKey: ["listing", listing.id] });
      onNext();
    } catch {
      setError(t("error"));
    } finally {
      setSaving(false);
    }
  };

  const flatAttrs: Record<string, unknown> = { ...attrs, length_m: (attrs.dimensions as Record<string, number>)?.length_m ?? attrs.length_m, height_cm: (attrs.dimensions as Record<string, number>)?.height_cm ?? attrs.height_cm };
  const langs = Array.from(new Set([src, "en", "hi"]));
  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-display text-[26px] leading-tight">{t("title")}</h1>
      {listing.extraction_status === "fallback" || listing.notes_for_artisan.includes("manual_form") ? <Banner tone="warn">{t("manual_fallback")}</Banner> : null}
      {listing.notes_for_artisan.filter((n) => n !== "manual_form").map((n) => (
        <Banner key={n} tone="warn" icon={<AlertTriangle className="size-5" />}>{t.has(`note.${n}`) ? t(`note.${n}`) : t("note.generic", { field: n })}</Banner>
      ))}
      {error && <Banner tone="danger">{error}</Banner>}

      <ReviewCard title={t("photos")}>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {listing.gallery.map((g) => (
            <div key={g.id} className="relative w-28 shrink-0">
              {g.card && <img src={g.card} alt="" className="aspect-[4/5] w-full rounded-[10px] object-cover" />}
              {g.enhanced && <span className="absolute start-1 top-1 rounded-full bg-white/95 px-2 text-[11px] font-semibold text-indigo-900">{t("cleaned_up")}</span>}
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm text-ink-600">{t("photos_note")}</p>
      </ReviewCard>

      <ReviewCard
        title={t("name")}
        low={low("title")}
        busy={regenJob?.field === "title"}
        onRegenerate={() => regenerate("title")}
        onSpeak={(text) => setTitle({ ...title, [src]: text })}
        regenLeft={listing.regenerate_left}
      >
        {langs.map((l) => (
          <label key={l} className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-600">{languageNames[l as Locale]?.native || l}</span>
            <Input value={title[l] || ""} onChange={(e) => setTitle({ ...title, [l]: e.target.value })} lang={l} dir={l === "ur" ? "rtl" : undefined} />
          </label>
        ))}
      </ReviewCard>

      <ReviewCard
        title={t("description")}
        low={low("description")}
        busy={regenJob?.field === "description"}
        onRegenerate={() => regenerate("description")}
        onSpeak={(text) => setDesc({ ...desc, [src]: `${desc[src] ? `${desc[src]} ` : ""}${text}` })}
        regenLeft={listing.regenerate_left}
      >
        {langs.map((l) => (
          <label key={l} className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-600">{languageNames[l as Locale]?.native || l}</span>
            <Textarea value={desc[l] || ""} onChange={(e) => setDesc({ ...desc, [l]: e.target.value })} lang={l} dir={l === "ur" ? "rtl" : undefined} className="min-h-32" />
          </label>
        ))}
      </ReviewCard>

      <ReviewCard title={t("details")} busy={regenJob?.field === "attributes"} onRegenerate={() => regenerate("attributes")} regenLeft={listing.regenerate_left}>
        <div className="grid gap-3 sm:grid-cols-2">
          {ATTRS.map(({ key, kind }) => {
            const value = flatAttrs[key];
            const lowConf = low(key === "length_m" || key === "height_cm" ? "dimensions" : key);
            return (
              <label key={key} className="flex flex-col gap-1">
                <span className={cx("text-sm font-semibold", lowConf ? "text-terracotta-600" : "text-ink-900")}>
                  {t(`attr.${key}`)} {lowConf && <span className="text-xs font-normal">· {t("please_check")}</span>}
                </span>
                <div className="flex gap-2">
                  <Input
                    inputMode={kind === "text" || kind === "list" ? undefined : "decimal"}
                    value={Array.isArray(value) ? value.join(", ") : value === undefined || value === null ? "" : String(value)}
                    onChange={(e) =>
                      setAttrs({
                        ...flatAttrs,
                        [key]: kind === "list" ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean) : kind === "text" ? e.target.value : e.target.value.replace(/[^\d.]/g, ""),
                      })
                    }
                    className={lowConf ? "border-haldi-500 ring-2 ring-haldi-500/30" : ""}
                  />
                  <MicButton size={44} onText={(text) => setAttrs({ ...flatAttrs, [key]: kind === "text" ? text : kind === "list" ? text.split(/[,،]/).map((s) => s.trim()) : text.replace(/[^\d.]/g, "") })} />
                </div>
              </label>
            );
          })}
        </div>
      </ReviewCard>

      <ReviewCard title={t("category")} low={low("category_slug")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t("category")}>
            <option value="">{t("choose")}</option>
            {cats?.items.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </Select>
          <Select value={craft} onChange={(e) => setCraft(e.target.value)} aria-label={t("craft")}>
            <option value="">{t("no_craft")}</option>
            {crafts?.items.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </Select>
        </div>
      </ReviewCard>

      <ReviewCard title={t("price")} low={low("price_inr")}>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold">₹</span>
          <Input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} className="text-2xl font-semibold" aria-label={t("price")} />
          <MicButton onText={(text) => setPrice(text.replace(/\D/g, ""))} />
        </div>
        {!price && <p className="text-sm text-terracotta-600">{t("price_missing")}</p>}
        {advice.isLoading ? (
          <Skeleton className="h-20" />
        ) : advice.data && advice.data.status !== "none" ? (
          <div className="mt-2 flex flex-col gap-3">
            <PriceRangeBar advice={advice.data} price={price ? Number(price) : null} />
            {advice.data.suggested_inr && Number(price) !== advice.data.suggested_inr && (
              <Button variant="secondary" onClick={() => setPrice(String(advice.data!.suggested_inr))}>{t("use_price", { price: inr(advice.data.suggested_inr) })}</Button>
            )}
            <p className="text-xs text-ink-600">{t("never_changes")}</p>
          </div>
        ) : null}
      </ReviewCard>

      {listing.transcript && (
        <details className="rounded-[12px] bg-white p-4">
          <summary className="cursor-pointer font-semibold">{t("what_you_said")}</summary>
          <p className="mt-2 text-[15px]" lang={src}>{listing.transcript}</p>
          {listing.transcript_provider === "browser" && <p className="mt-1 text-xs text-ink-600">{t("browser_transcript")}</p>}
        </details>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" size="L" icon={<RefreshCw className="size-5" />} onClick={() => regenerate("all")} loading={regenJob?.field === "all"} disabled={listing.regenerate_left <= 0}>
          {t("regenerate_all")}
        </Button>
        <Button size="L" block loading={saving} disabled={!price || !category || !(title[src] || title.en)} onClick={save}>
          {t("looks_good")}
        </Button>
      </div>
    </section>
  );
}

function ReviewCard({ title, children, low, busy, onRegenerate, onSpeak, regenLeft }: { title: string; children: ReactNode; low?: boolean; busy?: boolean; onRegenerate?: () => void; onSpeak?: (text: string) => void; regenLeft?: number }) {
  const t = useTranslations("sell.review");
  return (
    <div className={cx("flex flex-col gap-3 rounded-[16px] border-2 bg-white p-4", low ? "border-haldi-500" : "border-ink-100")}>
      <div className="flex items-center gap-2">
        <h2 className="flex flex-1 items-center gap-2 font-semibold">
          <Pencil className="size-4 text-ink-600" /> {title}
        </h2>
        {onSpeak && <MicButton size={44} onText={onSpeak} />}
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={busy || (regenLeft ?? 1) <= 0}
            className="tap inline-flex items-center justify-center rounded-full text-indigo-900 hover:bg-indigo-50 disabled:text-ink-300"
            aria-label={t("regenerate")}
            title={t("regen_left", { n: regenLeft ?? 0 })}
          >
            <RefreshCw className={cx("size-5", busy && "animate-spin")} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
