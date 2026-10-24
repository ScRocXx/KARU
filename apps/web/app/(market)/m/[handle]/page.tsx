import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { FollowButton, ListenButton } from "@/components/karu/maker-card";
import { PassportCard } from "@/components/karu/passport-card";
import { ProductGrid } from "@/components/karu/product-card";
import { Stars } from "@/components/ui";
import { date } from "@/lib/format";
import { serverApi, serverApiOrNull } from "@/lib/server-api";
import type { Card, Maker } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const m = await serverApiOrNull<Maker>(`/makers/${(await params).handle}`, { revalidate: 120 });
  return m && !m.under_review ? { title: m.name, description: m.story?.slice(0, 160) } : {};
}

/** B07 maker profile: passport card, story, products, reviews, follow. */
export default async function MakerPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const m = await serverApiOrNull<Maker>(`/makers/${handle}`, { revalidate: 120, tags: [`m:${handle}`] });
  if (!m) notFound();
  const [t, locale] = await Promise.all([getTranslations("maker"), getLocale()]);
  if (m.under_review) {
    return <p className="mx-auto max-w-md py-20 text-center text-ink-600">{t("under_review")}</p>;
  }
  const [products, reviews] = await Promise.all([
    serverApi<{ items: Card[]; total: number }>(`/makers/${handle}/products`, { revalidate: 120 }),
    serverApi<{ items: { rating: number; text: string | null; buyer: string; product: string; created_at: string }[] }>(`/makers/${handle}/reviews`, { revalidate: 300 }),
  ]);
  return (
    <div className="flex flex-col gap-10 pt-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <PassportCard maker={m} locale={locale} />
        <section className="flex flex-col gap-4">
          <h1 className="font-display text-[32px] leading-tight md:text-5xl">{m.name}</h1>
          <p className="text-ink-600">
            {m.place}
            {m.years_of_practice ? ` · ${t("years", { n: m.years_of_practice })}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <FollowButton artisanId={m.id} initial={m.following} />
            {m.voice_url && <ListenButton url={m.voice_url} name={m.name} />}
          </div>
          {m.story && (
            <blockquote className="font-display border-s-4 border-haldi-500 ps-4 text-xl leading-relaxed text-ink-900" lang={m.story_lang}>
              “{m.story}”
            </blockquote>
          )}
          {m.story_translated && <p className="text-xs text-ink-600">{t("story_translated")}</p>}
          <p className="text-sm text-ink-600">{t("member_since", { date: date(m.passport.member_since, locale) })}</p>
        </section>
      </div>
      <section>
        <h2 className="font-display mb-4 text-2xl">{t("pieces", { n: products.total })}</h2>
        <ProductGrid cards={products.items} />
      </section>
      {reviews.items.length > 0 && (
        <section>
          <h2 className="font-display mb-4 text-2xl">{t("reviews")}</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {reviews.items.map((r, i) => (
              <li key={i} className="rounded-[12px] border border-ink-100 bg-white p-4">
                <Stars value={r.rating} label={`${r.rating} / 5`} />
                {r.text && <p className="mt-2">{r.text}</p>}
                <p className="mt-2 text-xs text-ink-600">
                  {r.buyer} · {r.product} · {date(r.created_at, locale)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
