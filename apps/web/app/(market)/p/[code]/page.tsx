import { Info, RotateCcw, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProofChecks, StockPill, VerifiedBadge, Woven } from "@/components/karu/badges";
import { ListenButton, MakerCard } from "@/components/karu/maker-card";
import { ProductRail } from "@/components/karu/product-card";
import { BuyBox } from "@/components/market/buy-box";
import { ProductGallery } from "@/components/market/product-gallery";
import { ProductReviews } from "@/components/market/product-reviews";
import { ReportLink } from "@/components/market/report-link";
import { StoryToggle } from "@/components/market/story-toggle";
import { ViewTracker } from "@/components/market/view-tracker";
import { inr } from "@/lib/format";
import { serverApi, serverApiOrNull } from "@/lib/server-api";
import type { Card, Product } from "@/lib/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function load(code: string) {
  return serverApiOrNull<Product>(`/catalog/products/${code.toUpperCase()}`, { revalidate: 60, tags: [`p:${code.toUpperCase()}`] });
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const p = await load((await params).code);
  if (!p) return {};
  const og = `${SITE}/api/v1/catalog/products/${p.code}/og.jpg`;
  return {
    title: p.title.text,
    description: p.description.text.slice(0, 160),
    alternates: { canonical: `/p/${p.code}` },
    openGraph: { title: p.title.text, description: `${inr(p.price_inr)} · ${p.maker.name}, ${p.maker.place}`, images: [{ url: og, width: 1200, height: 630 }], type: "website" },
    twitter: { card: "summary_large_image", images: [og] },
  };
}

const ATTR_ORDER = ["material", "technique", "dye", "colour", "dimensions", "time_to_make_days", "weight_g", "finish", "care"];

export default async function ProductPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const p = await load(code);
  if (!p) notFound();
  const t = await getTranslations("product");
  const similar = await serverApi<{ items: Card[] }>(`/catalog/products/${p.code}/similar`, { revalidate: 300 }).catch(() => ({ items: [] }));
  const v = p.verification;
  const attrs = ATTR_ORDER.filter((k) => p.attributes[k] !== undefined && p.attributes[k] !== null && p.attributes[k] !== "");
  const card: Card = {
    id: p.id, code: p.code, title: p.title.text, price_inr: p.price_inr, image: p.gallery[0] || null, verification: v.status, stock: p.stock,
    maker: { name: p.maker.name, handle: p.maker.handle, place: p.maker.place, passport_state: p.maker.passport.state }, rating: p.reviews.avg,
    rating_count: p.reviews.count, returnable: p.returnable, wishlisted: false,
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title.text,
    description: p.description.text,
    image: p.gallery.map((g) => g.large).filter(Boolean),
    sku: p.code,
    brand: { "@type": "Brand", name: p.maker.name },
    offers: { "@type": "Offer", price: p.price_inr, priceCurrency: "INR", availability: p.stock.state === "out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock", url: `${SITE}/p/${p.code}` },
    ...(p.reviews.count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.reviews.avg, reviewCount: p.reviews.count } } : {}),
  };

  return (
    <article className="pt-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewTracker card={card} />
      <nav className="mb-3 flex gap-1 text-sm text-ink-600" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">{t("home")}</Link>
        {p.category && (
          <>
            <span aria-hidden>/</span>
            <Link href={`/c/${p.category.slug}`} className="hover:underline">{p.category.name}</Link>
          </>
        )}
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        <ProductGallery images={p.gallery} title={p.title.text} video={v.status === "verified" ? v.making_video : null} videoLabel={t("making_video")} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <VerifiedBadge status={v.status} size="lg" />
              {p.craft?.gi_tag && <span className="rounded-full bg-haldi-100 px-2.5 py-1 text-xs font-semibold">{t("gi_craft", { craft: p.craft.name })}</span>}
            </div>
            <h1 className="font-display text-[26px] leading-tight md:text-4xl" lang={p.title.lang}>{p.title.text}</h1>
            <p className="text-ink-600">
              {t("by")}{" "}
              <Link href={`/m/${p.maker.handle}`} className="font-semibold text-indigo-900 hover:underline">{p.maker.name}</Link>
              {p.maker.place ? ` · ${p.maker.place}` : ""}
            </p>
            <div className="flex items-center gap-3">
              <p className="text-[28px] font-semibold">{inr(p.price_inr)}</p>
              <StockPill stock={p.stock} />
            </div>
            <p className="text-xs text-ink-600">{t("price_note")}</p>
          </div>

          {p.maker_suspended ? (
            <p className="rounded-[12px] bg-ink-100 p-4 text-ink-900">{t("maker_under_review")}</p>
          ) : (
            <BuyBox product={{ id: p.id, code: p.code, title: p.title.text, price_inr: p.price_inr, stock: p.stock }} />
          )}

          {/* Proof */}
          <section className="rounded-[16px] border border-ink-100 bg-white p-4" aria-labelledby="proof-h">
            <h2 id="proof-h" className="font-display mb-3 text-xl">{t("proof_title")}</h2>
            {v.status === "verified" || v.status === "checking" ? (
              <ProofChecks checks={v.checks} photosOriginal={v.photos_original} registry={v.registry} />
            ) : v.status === "revoked" ? (
              <p className="text-ink-600">{t("revoked", { date: v.revoked_on || "" })}</p>
            ) : (
              <p className="text-ink-600">{t("not_verified_body")}</p>
            )}
            <Link href="/verification-explained" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-900 hover:underline">
              <Info className="size-4" /> {t("what_verified_means")}
            </Link>
          </section>

          <MakerCard maker={p.maker} />

          {/* Story in the maker's words */}
          <section aria-labelledby="story-h">
            <h2 id="story-h" className="font-display mb-2 text-xl">{t("story")}</h2>
            <StoryToggle localized={p.description} labels={{ translated: t("translated_from", { lang: "{lang}" }), show_original: t("show_original"), show_translation: t("show_translation") }} />
            {p.maker.voice_url && (
              <div className="mt-3">
                <ListenButton url={p.maker.voice_url} name={p.maker.name} />
              </div>
            )}
          </section>

          {attrs.length > 0 && (
            <section aria-labelledby="attr-h">
              <h2 id="attr-h" className="font-display mb-2 text-xl">{t("details")}</h2>
              <dl className="divide-y divide-ink-100 rounded-[12px] border border-ink-100 bg-white">
                {attrs.map((k) => (
                  <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-[15px]">
                    <dt className="text-ink-600">{t(`attr.${k}`)}</dt>
                    <dd className="text-end font-medium">{formatAttr(k, p.attributes[k], t)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <ul className="flex flex-col gap-2 text-[15px]">
            <li className="flex items-start gap-3">
              <RotateCcw className="mt-0.5 size-5 shrink-0 text-indigo-900" />
              {p.returnable ? t("returnable", { days: p.return_window_days }) : t("not_returnable")}
            </li>
            <li className="flex items-start gap-3">
              <Truck className="mt-0.5 size-5 shrink-0 text-indigo-900" />
              {t("delivery")}
            </li>
          </ul>
          <ReportLink targetType="listing" targetId={p.id} />
        </div>
      </div>

      <Woven className="my-10" />
      <ProductReviews code={p.code} summary={p.reviews} />
      {similar.items.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display mb-4 text-2xl">{t("similar")}</h2>
          <ProductRail cards={similar.items} />
        </section>
      )}
    </article>
  );
}

function formatAttr(key: string, value: unknown, t: (k: string, v?: Record<string, string | number>) => string): string {
  if (Array.isArray(value)) return value.join(", ");
  if (key === "time_to_make_days") return t("days", { n: Number(value) });
  if (key === "weight_g") return `${value} g`;
  if (key === "dimensions" && value && typeof value === "object") {
    const d = value as Record<string, number>;
    const parts = [];
    if (d.length_m) parts.push(`${d.length_m} m`);
    if (d.width_m) parts.push(`${d.width_m} m`);
    if (d.height_cm) parts.push(`${d.height_cm} cm`);
    if (d.width_cm) parts.push(`${d.width_cm} cm`);
    if (d.depth_cm) parts.push(`${d.depth_cm} cm`);
    return parts.join(" × ");
  }
  return String(value);
}
