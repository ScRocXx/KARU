import { RotateCcw, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { GiTag, StockPill, VerifiedBadge } from "@/components/karu/badges";
import { ListenButton, MakerCard } from "@/components/karu/maker-card";
import { ProductRail } from "@/components/karu/product-card";
import { ProvenancePanel } from "@/components/karu/provenance-panel";
import { Container } from "@/components/layout";
import { BuyBox } from "@/components/market/buy-box";
import { ProductGallery } from "@/components/market/product-gallery";
import { ProductReviews } from "@/components/market/product-reviews";
import { ReportLink } from "@/components/market/report-link";
import { StoryToggle } from "@/components/market/story-toggle";
import { ViewTracker } from "@/components/market/view-tracker";
import { Accordion } from "@/components/ui/accordion";
import { Avatar } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { RatingSummary } from "@/components/ui/stars";
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

  const breadcrumbs = [
    { label: t("home"), href: "/" },
    ...(p.category ? [{ label: p.category.name, href: `/c/${p.category.slug}` }] : []),
    ...(p.craft ? [{ label: p.craft.name, href: `/craft/${p.craft.slug}` }] : []),
    { label: p.title.text },
  ];

  return (
    <article className="pt-4 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewTracker card={card} />

      <Container size="page">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        {/* 12-Column Desktop Layout (7 cols Gallery / 5 cols Sticky Buy Panel) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* 7-col Gallery */}
          <div className="lg:col-span-7">
            <ProductGallery
              images={p.gallery}
              title={p.title.text}
              video={v.status === "verified" ? v.making_video : null}
              videoLabel={t("making_video")}
            />
          </div>

          {/* 5-col Sticky Info Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
            <div className="flex flex-col gap-3">
              {/* Eyebrow: craft, region, GI tag */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-eyebrow text-brand">
                  {[p.craft?.name, p.maker.place].filter(Boolean).join(" · ")}
                </span>
                {p.craft?.gi_tag && <GiTag craft={p.craft.name} />}
              </div>

              {/* Title */}
              <h1 className="text-h1 font-serif text-text" lang={p.title.lang}>
                {p.title.text}
              </h1>

              {/* Maker Attribution Line */}
              <div className="flex items-center gap-2.5 pt-1">
                <Avatar src={p.maker.photo_url} name={p.maker.name} size={32} verified={p.maker.passport.state === "verified"} />
                <div className="flex items-center gap-1.5 text-body-s">
                  <span className="text-muted">{t("by")}</span>
                  <Link href={`/m/${p.maker.handle}`} className="font-semibold text-text hover:text-brand transition-colors">
                    {p.maker.name}
                  </Link>
                  {p.maker.place && <span className="text-muted">· {p.maker.place}</span>}
                </div>
              </div>

              {/* Rating Summary */}
              {p.reviews.count > 0 && (
                <div className="pt-1">
                  <RatingSummary rating={p.reviews.avg || 5} count={p.reviews.count} />
                </div>
              )}

              {/* Pricing Section */}
              <div className="mt-2 flex flex-wrap items-baseline gap-4 border-y border-line py-3.5">
                <p className="text-price font-serif text-text font-medium text-3xl sm:text-4xl">
                  {inr(p.price_inr)}
                </p>
                <StockPill stock={p.stock} />
              </div>

              {/* Verification Badge line */}
              <div className="flex items-center gap-3 pt-1">
                <VerifiedBadge status={v.status} size="lg" />
              </div>
            </div>

            {/* Buy Box */}
            <BuyBox product={{ id: p.id, code: p.code, title: p.title.text, price_inr: p.price_inr, stock: p.stock }} />

            {/* Trust Assurances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xs border border-line bg-surface-alt p-4 text-caption text-text">
              <div className="flex items-center gap-2">
                <RotateCcw className="size-4 text-brand shrink-0" />
                <span>{p.returnable ? t("returnable", { days: p.return_window_days }) : t("not_returnable")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-brand shrink-0" />
                <span>{t("delivery")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Accordion Detail Section */}
        <div className="mt-16 max-w-4xl">
          <h2 className="text-h2 font-serif text-text mb-6">Piece Story & Specifications</h2>

          <Accordion title={t("story")} defaultOpen iconStyle="plus">
            <StoryToggle
              localized={p.description}
              labels={{
                translated: t("translated_from", { lang: "{lang}" }),
                show_original: t("show_original"),
                show_translation: t("show_translation"),
              }}
            />
            {p.maker.voice_url && (
              <div className="mt-4">
                <ListenButton url={p.maker.voice_url} name={p.maker.name} />
              </div>
            )}
          </Accordion>

          {attrs.length > 0 && (
            <Accordion title={t("details")} defaultOpen iconStyle="plus">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 py-2">
                {attrs.map((k) => (
                  <div key={k} className="flex justify-between border-b border-line pb-2">
                    <dt className="text-muted font-medium">{t(`attr.${k}`)}</dt>
                    <dd className="font-semibold text-text text-end">{formatAttr(k, p.attributes[k], t)}</dd>
                  </div>
                ))}
              </dl>
            </Accordion>
          )}

          <Accordion title="Proof of Handmade & Karu ID Verification" iconStyle="plus">
            <ProvenancePanel
              code={p.code}
              verification={v.status}
              checks={v.checks}
              photosOriginal={v.photos_original}
              registry={v.registry}
              makingVideo={v.status === "verified" ? v.making_video : null}
            />
          </Accordion>

          <Accordion title="Shipping, Dispatch & Returns" iconStyle="plus">
            <p className="text-body-s text-muted leading-relaxed">
              Every order is hand-packaged directly in the artisan&apos;s cluster and shipped with its verified Karu ID tag.
              {p.returnable ? ` Returns are accepted within ${p.return_window_days} days of delivery if the tag remains attached.` : " Due to the custom handmade nature of this piece, returns are not accepted unless damaged in transit."}
            </p>
          </Accordion>
        </div>

        {/* Meet the Maker Feature Band */}
        <div className="mt-16">
          <MakerCard maker={p.maker} variant="feature" />
        </div>

        {/* Customer Reviews */}
        <div className="mt-16">
          <ProductReviews code={p.code} summary={p.reviews} />
        </div>

        {/* Similar Handcrafted Pieces Rail */}
        {similar.items.length > 0 && (
          <div className="mt-16">
            <h2 className="text-h2 font-serif text-text mb-6">{t("similar")}</h2>
            <ProductRail cards={similar.items} />
          </div>
        )}

        <div className="mt-10 border-t border-line pt-6">
          <ReportLink targetType="listing" targetId={p.id} />
        </div>
      </Container>
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
