import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CategoryIcon } from "@/components/market/category-icon";
import { serverApi } from "@/lib/server-api";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const t = await getTranslations("browse");
  const [cats, crafts] = await Promise.all([
    serverApi<{ items: { slug: string; name: string }[] }>("/catalog/categories", { revalidate: 3600 }),
    serverApi<{ items: { slug: string; name: string; gi_tag: boolean; regions: string[] }[] }>("/catalog/crafts", { revalidate: 3600 }),
  ]);
  return (
    <div className="flex flex-col gap-10 pt-6">
      <section>
        <h1 className="font-display mb-5 text-h2 md:text-4xl">{t("all_categories")}</h1>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cats.items.map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`} className="flex min-h-20 items-center gap-3 rounded-sm border border-ink-100 bg-white p-4 hover:border-brand/40">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                <CategoryIcon slug={c.slug} className="size-5" />
              </span>
              <span className="font-semibold">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>
      <section id="crafts">
        <h2 className="font-display mb-5 text-h3 md:text-3xl">{t("crafts_clusters")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {crafts.items.map((c) => (
            <Link key={c.slug} href={`/craft/${c.slug}`} className="flex flex-col gap-1 rounded-sm border border-ink-100 bg-white p-4 hover:border-brand/40">
              <span className="font-display text-lg">{c.name}</span>
              <span className="text-sm text-ink-600">{c.regions.join(" · ")}</span>
              {c.gi_tag && <span className="w-fit rounded-full bg-gold-100 px-2 py-0.5 text-xs font-semibold text-ink-900">{t("gi_tag")}</span>}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
