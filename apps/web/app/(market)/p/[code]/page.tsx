import { ArrowRight, CheckCircle2, ChevronRight, Info, RotateCcw, ShieldCheck, Sparkles, Truck } from "lucide-react";
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
    <article className="pt-2 pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewTracker card={card} />

      {/* Editorial Breadcrumbs */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs tracking-wider uppercase text-ink-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-terracotta-800 transition-colors">{t("home")}</Link>
        {p.category && (
          <>
            <ChevronRight className="size-3 text-ink-400" aria-hidden />
            <Link href={`/c/${p.category.slug}`} className="hover:text-terracotta-800 transition-colors">{p.category.name}</Link>
          </>
        )}
        {p.craft && (
          <>
            <ChevronRight className="size-3 text-ink-400" aria-hidden />
            <Link href={`/craft/${p.craft.slug}`} className="hover:text-terracotta-800 transition-colors">{p.craft.name}</Link>
          </>
        )}
      </nav>

      {/* Main Luxury 2-Column Split */}
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14 items-start">
        {/* Left Column: Gallery & Proof Seal */}
        <div className="flex flex-col gap-6">
          <ProductGallery
            images={p.gallery}
            title={p.title.text}
            video={v.status === "verified" ? v.making_video : null}
            videoLabel={t("making_video")}
          />

          {/* Karu ID Provenance Hallmark Card */}
          <section className="rounded-[20px] border border-sand-200/90 bg-white p-5 sm:p-6 shadow-xs" aria-labelledby="proof-h">
            <div className="flex items-center justify-between border-b border-sand-200/80 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-terracotta-800" />
                <h2 id="proof-h" className="font-serif text-lg font-medium text-ink-950">
                  {t("proof_title")}
                </h2>
              </div>
              <span className="font-mono text-xs font-semibold text-peacock-700 bg-peacock-50 border border-peacock-200/60 rounded-full px-2.5 py-0.5">
                Karu ID #{p.code}
              </span>
            </div>

            {v.status === "verified" || v.status === "checking" ? (
              <ProofChecks checks={v.checks} photosOriginal={v.photos_original} registry={v.registry} />
            ) : v.status === "revoked" ? (
              <p className="text-sm text-ink-600">{t("revoked", { date: v.revoked_on || "" })}</p>
            ) : (
              <p className="text-sm text-ink-600">{t("not_verified_body")}</p>
            )}

            <div className="mt-4 pt-3 border-t border-sand-200/60 flex items-center justify-between text-xs">
              <Link href="/verification-explained" className="inline-flex items-center gap-1 font-semibold text-terracotta-800 hover:text-terracotta-900 transition-colors">
                <Info className="size-3.5" /> {t("what_verified_means")}
              </Link>
              <Link href={`/k/${p.code}`} className="font-mono text-ink-500 hover:text-ink-800 flex items-center gap-1">
                View Certificate <ArrowRight className="size-3" />
              </Link>
            </div>
          </section>
        </div>

        {/* Right Column: Title, Maker, Price, BuyBox, Story, Specs */}
        <div className="flex flex-col gap-6">
          {/* Eyebrow & Badges */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <VerifiedBadge status={v.status} size="lg" />
              {p.craft?.gi_tag && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 border border-gold-300 px-3 py-1 text-xs font-medium text-gold-900">
                  <Sparkles className="size-3 text-gold-600" />
                  {t("gi_craft", { craft: p.craft.name })}
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-950 sm:text-4xl lg:text-[40px] leading-[1.18]" lang={p.title.lang}>
              {p.title.text}
            </h1>

            {/* Maker Attribution */}
            <p className="text-sm text-ink-600">
              {t("by")}{" "}
              <Link href={`/m/${p.maker.handle}`} className="font-serif font-semibold text-terracotta-800 hover:underline">
                {p.maker.name}
              </Link>
              {p.maker.place ? ` · ${p.maker.place}` : ""}
            </p>

            {/* Pricing Section */}
            <div className="mt-2 flex flex-wrap items-baseline gap-4 border-y border-sand-200/80 py-3.5">
              <p className="font-serif text-3xl sm:text-4xl font-medium text-ink-950">
                {inr(p.price_inr)}
              </p>
              <StockPill stock={p.stock} />
            </div>
            <p className="text-xs text-ink-500 font-serif italic">
              {t("price_note")} · 100% direct artisan payout with zero commission.
            </p>
          </div>

          {/* Buy Box */}
          {p.maker_suspended ? (
            <p className="rounded-[16px] bg-sand-100 p-4 text-ink-900">{t("maker_under_review")}</p>
          ) : (
            <BuyBox product={{ id: p.id, code: p.code, title: p.title.text, price_inr: p.price_inr, stock: p.stock }} />
          )}

          {/* Trust Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-[16px] border border-sand-200/80 bg-[#FAF7F2] p-4 text-xs text-ink-700">
            <div className="flex items-center gap-2.5">
              <RotateCcw className="size-4 shrink-0 text-terracotta-800" />
              <span>{p.returnable ? t("returnable", { days: p.return_window_days }) : t("not_returnable")}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="size-4 shrink-0 text-terracotta-800" />
              <span>{t("delivery")}</span>
            </div>
          </div>

          {/* Maker Voice & Story */}
          <section className="rounded-[20px] border border-sand-200/90 bg-white p-5 sm:p-6 shadow-xs" aria-labelledby="story-h">
            <div className="flex items-center justify-between mb-3">
              <h2 id="story-h" className="font-serif text-xl font-medium text-ink-950">
                {t("story")}
              </h2>
              {p.maker.voice_url && (
                <ListenButton url={p.maker.voice_url} name={p.maker.name} />
              )}
            </div>
            <StoryToggle
              localized={p.description}
              labels={{
                translated: t("translated_from", { lang: "{lang}" }),
                show_original: t("show_original"),
                show_translation: t("show_translation"),
              }}
            />
          </section>

          {/* Maker Card */}
          <MakerCard maker={p.maker} />

          {/* Craft Attributes & Specifications */}
          {attrs.length > 0 && (
            <section className="rounded-[20px] border border-sand-200/90 bg-white p-5 sm:p-6 shadow-xs" aria-labelledby="attr-h">
              <h2 id="attr-h" className="font-serif text-xl font-medium text-ink-950 mb-3">
                {t("details")}
              </h2>
              <dl className="divide-y divide-sand-200/70 text-sm">
                {attrs.map((k) => (
                  <div key={k} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-ink-500 font-medium">{t(`attr.${k}`)}</dt>
                    <dd className="text-end font-semibold text-ink-900">{formatAttr(k, p.attributes[k], t)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <div className="pt-2">
            <ReportLink targetType="listing" targetId={p.id} />
          </div>
        </div>
      </div>

      <Woven className="my-14" />
      <ProductReviews code={p.code} summary={p.reviews} />

      {/* Similar Handcrafted Pieces */}
      {similar.items.length > 0 && (
        <section className="mt-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-terracotta-700">
                Craft Heritage
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-ink-950">
                {t("similar")}
              </h2>
            </div>
          </div>
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
