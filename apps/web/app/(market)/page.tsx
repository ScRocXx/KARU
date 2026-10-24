import { ArrowRight, BadgeCheck, QrCode, Store } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { VerifiedBadge, Woven } from "@/components/karu/badges";
import { CategoryIcon } from "@/components/market/category-icon";
import { MakerStrip } from "@/components/market/maker-strip";
import { RecentlyViewed } from "@/components/market/recently-viewed";
import { ProductRail } from "@/components/karu/product-card";
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
  return (
    <div className="flex flex-col gap-12 pt-4">
      {/* Hero */}
      <section className="grid items-center gap-6 overflow-hidden rounded-[20px] bg-indigo-900 text-white md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-5 p-6 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-haldi-500">{t("eyebrow")}</p>
          <h1 className="font-display text-[32px] leading-tight md:text-5xl">{t("title")}</h1>
          <p className="max-w-md text-[17px] text-white/85">{t("subtitle")}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/search?verified=true" className="inline-flex min-h-12 items-center gap-2 rounded-[10px] bg-haldi-500 px-5 font-semibold text-ink-900 hover:brightness-95">
              <BadgeCheck className="size-5" /> {t("cta_verified")}
            </Link>
            <Link href="/sell" className="inline-flex min-h-12 items-center gap-2 rounded-[10px] border-2 border-white/60 px-5 font-semibold text-white hover:bg-white/10">
              <Store className="size-5" /> {t("cta_sell")}
            </Link>
          </div>
        </div>
        {hero?.image?.large && (
          <Link href={`/p/${hero.code}`} className="relative block aspect-[4/5] max-h-[460px] w-full overflow-hidden md:aspect-auto md:h-full md:max-h-none md:min-h-[440px] md:self-stretch">
            <img src={hero.image.large} alt={hero.title} className="absolute inset-0 size-full object-cover" fetchPriority="high" />
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-[12px] bg-white/95 p-3 text-ink-900 backdrop-blur">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{hero.title}</p>
                <p className="truncate text-xs text-ink-600">{t("made_by", { name: hero.maker.name, place: hero.maker.place })}</p>
              </div>
              <VerifiedBadge status={hero.verification} />
            </div>
          </Link>
        )}
      </section>

      {/* How the proof works */}
      <section className="grid gap-3 sm:grid-cols-3">
        {(["passport", "karu_id", "scan"] as const).map((k, i) => (
          <div key={k} className="flex gap-3 rounded-[12px] border border-ink-100 bg-white p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-900">
              {i === 2 ? <QrCode className="size-5" /> : <span className="font-display text-lg">{i + 1}</span>}
            </span>
            <div>
              <h2 className="font-semibold">{t(`how.${k}.title`)}</h2>
              <p className="text-sm text-ink-600">{t(`how.${k}.body`)}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section aria-labelledby="cat-h">
        <SectionHead id="cat-h" title={t("categories")} href="/categories" more={t("see_all")} />
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {data.categories.map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`} className="flex w-24 shrink-0 flex-col items-center gap-2 text-center">
              <span className="flex size-16 items-center justify-center rounded-full border border-ink-100 bg-white text-indigo-900">
                <CategoryIcon slug={c.slug} className="size-7" />
              </span>
              <span className="text-[13px] font-medium leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {data.verified_picks.length > 0 && (
        <section aria-labelledby="vp-h">
          <SectionHead id="vp-h" title={t("verified_picks")} sub={t("verified_picks_sub")} href="/search?verified=true" more={t("see_all")} />
          <ProductRail cards={data.verified_picks} />
        </section>
      )}

      {data.craft_rails.map((r) => (
        <section key={r.craft.slug} aria-label={r.craft.name}>
          <SectionHead
            title={r.craft.name}
            sub={[r.craft.regions.join(" · "), r.craft.gi_tag ? t("gi_tag") : null].filter(Boolean).join(" — ")}
            href={`/craft/${r.craft.slug}`}
            more={t("explore_craft")}
          />
          <ProductRail cards={r.items} />
        </section>
      ))}

      {data.makers.length > 0 && (
        <section aria-labelledby="mk-h">
          <SectionHead id="mk-h" title={t("meet_makers")} sub={t("meet_makers_sub")} />
          <MakerStrip makers={data.makers} />
        </section>
      )}

      <RecentlyViewed />

      {/* Impact strip */}
      <section className="rounded-[20px] bg-white p-6 md:p-8">
        <Woven className="mb-6" />
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <Stat value={String(data.impact.artisans)} label={t("impact.artisans")} />
          <Stat value={String(data.impact.pieces_verified)} label={t("impact.pieces_verified")} />
          <Stat value={data.impact.paid_to_artisans} label={t("impact.paid")} />
          <Stat value={String(data.impact.clusters)} label={t("impact.clusters")} />
        </div>
        <Link href="/impact" className="mt-6 inline-flex items-center gap-1 font-semibold text-indigo-900 hover:underline">
          {t("impact.more")} <ArrowRight className="flip-rtl size-4" />
        </Link>
      </section>
    </div>
  );
}

function SectionHead({ title, sub, href, more, id }: { title: string; sub?: string; href?: string; more?: string; id?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 id={id} className="font-display text-[22px] leading-tight md:text-[28px]">
          {title}
        </h2>
        {sub && <p className="text-sm text-ink-600">{sub}</p>}
      </div>
      {href && more && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-indigo-900 hover:underline">
          {more} <ArrowRight className="flip-rtl size-4" />
        </Link>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl text-indigo-900 md:text-4xl">{value}</p>
      <p className="text-sm text-ink-600">{label}</p>
    </div>
  );
}
