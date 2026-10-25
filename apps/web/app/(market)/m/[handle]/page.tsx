import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { FollowButton, ListenButton } from "@/components/karu/maker-card";
import { PassportCard } from "@/components/karu/passport-card";
import { ProductGrid } from "@/components/karu/product-card";
import { ProductReviews } from "@/components/market/product-reviews";
import { StatTile } from "@/components/ui/stat-tile";
import { Tabs } from "@/components/ui/tabs";
import { date } from "@/lib/format";
import { serverApi, serverApiOrNull } from "@/lib/server-api";
import type { Card, Maker } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const m = await serverApiOrNull<Maker>(`/makers/${(await params).handle}`, { revalidate: 120 });
  return m && !m.under_review ? { title: `${m.name} · Karu Master Artisan`, description: m.story?.slice(0, 160) } : {};
}

/** B07 Maker Profile: Cover band with arch portrait, passport card, stat tiles, and tabs. */
export default async function MakerPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { handle } = await params;
  const sp = await searchParams;
  const currentTab = sp?.tab || "pieces";

  const m = await serverApiOrNull<Maker>(`/makers/${handle}`, {
    revalidate: 120,
    tags: [`m:${handle}`],
  });
  if (!m) notFound();

  const [t, locale] = await Promise.all([getTranslations("maker"), getLocale()]);

  if (m.under_review) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-body text-muted">{t("under_review")}</p>
      </div>
    );
  }

  const [products, reviews] = await Promise.all([
    serverApi<{ items: Card[]; total: number }>(`/makers/${handle}/products`, { revalidate: 120 }),
    serverApi<{
      items: { id: string; rating: number; text: string | null; photos: string[]; buyer: string; city?: string; product?: string; created_at: string }[];
    }>(`/makers/${handle}/reviews`, { revalidate: 300 }),
  ]);

  const avgRating =
    reviews.items.length > 0
      ? reviews.items.reduce((acc, r) => acc + r.rating, 0) / reviews.items.length
      : m.stats?.rating ?? null;

  return (
    <div className="w-full">
      {/* 1. Cover Band: Arch Portrait (4 cols), Story & Actions (5 cols), PassportCard (3 cols) */}
      <section className="bg-surface-alt border-b border-line pt-8 pb-10">
        <div className="container-page">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* Arch Portrait Frame (4 cols) */}
            <div className="flex justify-center lg:col-span-4">
              <div className="relative w-48 sm:w-56 lg:w-64">
                <div className="overflow-hidden rounded-t-full border-2 border-gold-500/40 bg-sand-200 shadow-lift aspect-[4/5]">
                  {m.photo_url ? (
                    <img
                      src={m.photo_url}
                      alt={m.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-serif text-4xl text-brand">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-3 start-1/2 -translate-x-1/2 rounded-full border border-gold-500/60 bg-surface px-3 py-0.5 text-caption font-semibold uppercase tracking-wider text-brand shadow-xs">
                  Master Artisan
                </div>
              </div>
            </div>

            {/* Maker Info & Quote (5 cols) */}
            <div className="flex flex-col gap-3 text-center lg:col-span-5 lg:text-start">
              <span className="text-eyebrow text-brand">
                {m.crafts.join(" · ") || "Handmade Heritage"}
              </span>

              <h1 className="font-serif text-display text-ink-900 leading-tight">
                {m.name}
              </h1>

              <p className="text-body-s text-muted">
                {m.place}
                {m.years_of_practice ? ` · ${t("years", { n: m.years_of_practice })}` : ""}
                {" · "}
                {t("member_since", { date: date(m.passport.member_since, locale) })}
              </p>

              <div className="mt-1 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
                <FollowButton artisanId={m.id} initial={m.following} />
                {m.voice_url && <ListenButton url={m.voice_url} name={m.name} />}
              </div>

              {m.story && (
                <blockquote
                  className="font-serif italic text-body-l text-ink-900 leading-relaxed pt-2 border-t border-line/60"
                  lang={m.story_lang}
                >
                  &ldquo;{m.story}&rdquo;
                </blockquote>
              )}
            </div>

            {/* Compact PassportCard (3 cols) */}
            <div className="lg:col-span-3">
              <PassportCard maker={m} locale={locale} compact exportable tone="olive" />
            </div>
          </div>

          {/* StatTile Row */}
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-6 sm:grid-cols-4">
            <StatTile label="Verified pieces" value={products.total} />
            <StatTile label="Rating" value={avgRating ? `${avgRating.toFixed(1)} ★` : "—"} />
            <StatTile label="Buyer reviews" value={reviews.items.length} />
            <StatTile label="Member since" value={new Date(m.passport.member_since).getFullYear()} />
          </div>
        </div>
      </section>

      {/* 2. Tabs Navigation & Content */}
      <div className="container-page py-10">
        <Tabs
          defaultValue={currentTab}
          tabs={[
            {
              value: "pieces",
              label: `${t("pieces", { n: products.total })}`,
              content: (
                <div className="pt-6">
                  {products.items.length === 0 ? (
                    <p className="text-center text-body text-muted py-12">
                      No pieces currently live from this maker.
                    </p>
                  ) : (
                    <ProductGrid cards={products.items} columns={4} />
                  )}
                </div>
              ),
            },
            {
              value: "story",
              label: "The Maker's Story",
              content: (
                <div className="mx-auto max-w-3xl pt-8 flex flex-col gap-6">
                  <h3 className="font-serif text-h2 text-ink-900">
                    Heritage & Journey of {m.name}
                  </h3>
                  {m.story ? (
                    <div className="prose prose-stone text-body leading-relaxed text-ink-900">
                      <p className="font-serif text-lg italic text-brand leading-relaxed">
                        &ldquo;{m.story}&rdquo;
                      </p>
                      {m.story_translated && (
                        <p className="text-caption text-muted">{t("story_translated")}</p>
                      )}
                      <p className="mt-4">
                        Working from {m.place}, {m.name} has practiced the art of {m.crafts.join(", ")} for over {m.years_of_practice || "many"} years.
                        Each piece is crafted by hand following ancestral traditions passed down across generations, preserving the authentic weave, clay shaping, and handcraft techniques without machine distortion.
                      </p>
                    </div>
                  ) : (
                    <p className="text-body text-muted">Maker story in curation.</p>
                  )}
                </div>
              ),
            },
            {
              value: "reviews",
              label: `Patron Reviews (${reviews.items.length})`,
              content: (
                <div className="pt-8">
                  <ProductReviews
                    makerHandle={handle}
                    summary={{ count: reviews.items.length, avg: avgRating }}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
