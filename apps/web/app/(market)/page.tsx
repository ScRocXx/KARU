import { ArrowRight, BadgeCheck, CheckCircle2, QrCode, Shield, Sparkles, Store } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { VerifiedBadge, Woven } from "@/components/karu/badges";
import { ProductGrid, ProductRail } from "@/components/karu/product-card";
import { RecentlyViewed } from "@/components/market/recently-viewed";
import { CategoryShowcase } from "@/components/market/category-showcase";
import { HeritageProcess } from "@/components/market/heritage-process";
import { ArtisanSpotlight } from "@/components/market/artisan-spotlight";
import { PatronTestimonials } from "@/components/market/patron-testimonials";
import { serverApi } from "@/lib/server-api";
import type { Card, Maker } from "@/lib/types";

interface Home {
  categories: { slug: string; name: string; icon: string; count: number }[];
  verified_picks: Card[];
  new_arrivals: Card[];
  craft_rails: { craft: { slug: string; name: string; gi_tag: boolean; regions: string[] }; items: Card[] }[];
  makers: Maker[];
  impact: { artisans: number; pieces_verified: number; paid_to_artisans: string; clusters: number; states: number };
}

export default async function HomePage() {
  const t = await getTranslations("home");
  const data = await serverApi<Home>("/catalog/home", { revalidate: 60, tags: ["home"] });
  const hero = data.verified_picks[0] || data.new_arrivals[0];
  const featuredMaker = data.makers.find((m) => m.photo_url && m.story) || data.makers[0];

  return (
    <div className="flex flex-col gap-14 pt-4 md:pt-6">
      {/* 1. EDITORIAL SPLIT HERO (Homage to Mrittika: Tradition Meets Today) */}
      <section className="relative overflow-hidden rounded-[28px] border border-sand-200/90 bg-gradient-to-br from-[#FAF7F2] via-[#FDFBF7] to-[#F5EFE6] p-6 sm:p-10 lg:p-14 shadow-xs">
        {/* Decorative artisan emblem watermark */}
        <div className="pointer-events-none absolute -right-20 -bottom-20 size-96 rounded-full border border-terracotta-800/10 opacity-30" />
        <div className="pointer-events-none absolute -left-10 -top-10 size-64 rounded-full border border-dashed border-sand-300/40 opacity-40" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-sand-200/80 bg-white/80 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-terracotta-800 shadow-2xs backdrop-blur-xs">
              <Sparkles className="size-3 text-gold-600" />
              <span>{t("eyebrow")} · Direct from Heritage Clusters</span>
            </div>

            <h1 className="font-serif text-4xl font-normal tracking-tight text-ink-950 sm:text-5xl lg:text-[54px] lg:leading-[1.12]">
              Made by Hands. <br />
              <span className="italic text-terracotta-800">Proven for Generations.</span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-ink-700 sm:text-lg">
              {t("subtitle")}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/search?verified=true"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-terracotta-800 px-7 text-sm font-medium tracking-wide text-white transition-all hover:bg-terracotta-900 active:scale-98 shadow-sm"
              >
                <BadgeCheck className="size-4.5" />
                <span>{t("cta_verified")}</span>
                <ArrowRight className="size-4 ml-0.5" />
              </Link>

              <Link
                href="/sell"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-ink-800/80 bg-transparent px-6 text-sm font-medium tracking-wide text-ink-900 transition-colors hover:bg-ink-950 hover:text-white"
              >
                <Store className="size-4" />
                <span>{t("cta_sell")}</span>
              </Link>
            </div>

            {/* Micro trust hallmarks */}
            <div className="flex flex-wrap items-center gap-5 border-t border-sand-200/80 pt-5 text-xs text-ink-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-peacock-700" />
                <span>100% Provenance with Karu ID</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-peacock-700" />
                <span>Zero Machine Replicas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-peacock-700" />
                <span>Direct Maker Payout (0% Cut)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Showcase Card */}
          {hero?.image?.large && (
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <Link
                href={`/p/${hero.code}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-[24px] bg-sand-200 shadow-md transition-all duration-300 hover:shadow-xl"
              >
                <img
                  src={hero.image.large}
                  alt={hero.title}
                  className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-104"
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Floating Provenance Hallmark Badge */}
                <div className="absolute bottom-4 inset-x-4 flex items-center justify-between gap-3 rounded-[16px] border border-white/40 bg-white/95 p-3.5 text-ink-900 shadow-md backdrop-blur-md">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-sm font-semibold text-ink-950">{hero.title}</p>
                    <p className="truncate text-xs text-ink-600">
                      {t("made_by", { name: hero.maker.name, place: hero.maker.place })}
                    </p>
                  </div>
                  <VerifiedBadge status={hero.verification} />
                </div>
              </Link>

              {/* Floating Karu ID Tag badge */}
              <div className="absolute -top-3.5 -right-3.5 rounded-full border border-sand-200 bg-white px-3.5 py-1 text-[11px] font-mono font-medium text-ink-800 shadow-sm flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-peacock-600" />
                <span>ID #{hero.code}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. THREE-STEP PROVENANCE ENGINE (How Karu Protects Authentic Craft) */}
      <section className="grid gap-4 sm:grid-cols-3">
        {(["passport", "karu_id", "scan"] as const).map((k, i) => (
          <div
            key={k}
            className="flex flex-col justify-between gap-4 rounded-[20px] border border-sand-200/90 bg-white p-6 transition-all hover:border-terracotta-800/30 hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-full bg-sand-100 font-serif text-lg font-medium text-terracotta-800">
                0{i + 1}
              </span>
              {i === 2 ? (
                <QrCode className="size-5 text-terracotta-700" />
              ) : (
                <Shield className="size-5 text-terracotta-700" />
              )}
            </div>
            <div>
              <h2 className="font-serif text-lg font-medium text-ink-950">{t(`how.${k}.title`)}</h2>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-ink-600">{t(`how.${k}.body`)}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 3. CIRCULAR CATEGORY SHOWCASE (Homage to Terra & Soul) */}
      <CategoryShowcase categories={data.categories} />

      {/* 4. CURATED VERIFIED PICKS (Homage to Mrittika: Curated Collection) */}
      {data.verified_picks.length > 0 && (
        <section aria-labelledby="vp-heading" className="py-2">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-terracotta-700">
                The Karu Edit
              </p>
              <h2
                id="vp-heading"
                className="mt-1 font-serif text-2xl font-medium tracking-tight text-ink-950 sm:text-3xl"
              >
                {t("verified_picks")}
              </h2>
              <p className="mt-1 text-sm text-ink-600">{t("verified_picks_sub")}</p>
            </div>
            <Link
              href="/search?verified=true"
              className="group inline-flex items-center gap-1.5 self-start sm:self-end text-xs font-semibold uppercase tracking-wider text-terracotta-800 hover:text-terracotta-900 transition-colors"
            >
              <span>{t("see_all")} ({data.verified_picks.length})</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <ProductGrid cards={data.verified_picks.slice(0, 10)} />
        </section>
      )}

      {/* 5. ROOTED IN HERITAGE CRAFT PROCESS GRID (Homage to Mrittika: 4-Photo Craft Showcase) */}
      <HeritageProcess />

      {/* 6. MASTER ARTISAN SPOTLIGHT (Homage to Terra & Soul: The Story Behind Every Piece) */}
      <ArtisanSpotlight maker={featuredMaker} />

      {/* 7. CRAFT RAILS (GI-Tagged Craft Disciplines) */}
      {data.craft_rails.map((r) => (
        <section key={r.craft.slug} aria-label={r.craft.name} className="py-2">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-terracotta-700">
                  {r.craft.regions.join(" · ")}
                </span>
                {r.craft.gi_tag && (
                  <span className="rounded-full bg-gold-100 border border-gold-300 px-2 py-0.5 text-[10px] font-semibold text-gold-800 uppercase tracking-wider">
                    {t("gi_tag")}
                  </span>
                )}
              </div>
              <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight text-ink-950 sm:text-3xl">
                {r.craft.name}
              </h2>
            </div>
            <Link
              href={`/craft/${r.craft.slug}`}
              className="group inline-flex items-center gap-1.5 self-start sm:self-end text-xs font-semibold uppercase tracking-wider text-terracotta-800 hover:text-terracotta-900 transition-colors"
            >
              <span>{t("explore_craft")}</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <ProductRail cards={r.items} />
        </section>
      ))}

      {/* 8. COMMUNITY TESTIMONIALS & PROVENANCE GUARANTEE (Homage to Terra & Soul: Deep Olive Panel) */}
      <PatronTestimonials />

      <RecentlyViewed />

      {/* 9. KARU TRUST & IMPACT STATS */}
      <section className="rounded-[24px] border border-sand-200/90 bg-white p-6 sm:p-10 shadow-xs">
        <Woven className="mb-8" />
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <Stat value={String(data.impact.artisans)} label={t("impact.artisans")} />
          <Stat value={String(data.impact.pieces_verified)} label={t("impact.pieces_verified")} />
          <Stat value={data.impact.paid_to_artisans || "100% Direct"} label={t("impact.paid")} />
          <Stat value={String(data.impact.clusters)} label={t("impact.clusters")} />
        </div>
        <div className="mt-8 border-t border-sand-200 pt-6 flex items-center justify-between">
          <p className="text-xs text-ink-500 font-serif italic">
            Zero machine intermediaries. Every rupee accounted for on the Karu ledger.
          </p>
          <Link
            href="/impact"
            className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-terracotta-800 hover:text-terracotta-900 transition-colors"
          >
            <span>{t("impact.more")}</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-serif text-3xl font-medium tracking-tight text-terracotta-900 sm:text-4xl md:text-5xl">
        {value}
      </p>
      <p className="text-xs sm:text-sm font-medium text-ink-600">{label}</p>
    </div>
  );
}
