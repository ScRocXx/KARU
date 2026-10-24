import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Woven } from "@/components/karu/badges";
import { MakerStrip } from "@/components/market/maker-strip";
import { ProductGrid } from "@/components/karu/product-card";
import { serverApiOrNull } from "@/lib/server-api";
import type { Card, Maker } from "@/lib/types";

interface CraftPage {
  slug: string;
  name: string;
  description: string;
  description_lang: string;
  gi_tag: boolean;
  regions: string[];
  makers: Maker[];
  items: Card[];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await serverApiOrNull<CraftPage>(`/catalog/crafts/${(await params).slug}`, { revalidate: 300 });
  return c ? { title: c.name, description: c.description.slice(0, 160) } : {};
}

/** B03 craft & cluster page: heritage text, GI info, region, makers, products. */
export default async function CraftPageView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await serverApiOrNull<CraftPage>(`/catalog/crafts/${slug}`, { revalidate: 300 });
  if (!c) notFound();
  const t = await getTranslations("craft");
  return (
    <div className="flex flex-col gap-10 pt-6">
      <section className="rounded-[20px] bg-white p-6 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-terracotta-600">{c.regions.join(" · ")}</p>
        <h1 className="font-display mt-2 text-[32px] md:text-5xl">{c.name}</h1>
        <Woven className="my-5 max-w-xs" />
        <p className="max-w-2xl text-[17px] leading-relaxed text-ink-900" lang={c.description_lang}>
          {c.description}
        </p>
        {c.gi_tag && (
          <div className="mt-5 max-w-2xl rounded-[12px] bg-haldi-100 p-4">
            <p className="font-semibold">{t("gi_title")}</p>
            <p className="text-sm text-ink-600">{t("gi_body")}</p>
          </div>
        )}
      </section>
      {c.makers.length > 0 && (
        <section>
          <h2 className="font-display mb-4 text-2xl">{t("makers")}</h2>
          <MakerStrip makers={c.makers} />
        </section>
      )}
      <section>
        <h2 className="font-display mb-4 text-2xl">{t("pieces")}</h2>
        {c.items.length ? <ProductGrid cards={c.items} /> : <p className="text-ink-600">{t("none_yet")}</p>}
      </section>
    </div>
  );
}
