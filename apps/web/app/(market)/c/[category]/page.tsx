import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Browse } from "@/components/market/browse";
import { serverApi } from "@/lib/server-api";
import type { Card } from "@/lib/types";

async function category(slug: string) {
  const cats = await serverApi<{ items: { slug: string; name: string }[] }>("/catalog/categories", { revalidate: 3600 });
  return cats.items.find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const c = await category((await params).category);
  return { title: c?.name };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const c = await category(slug);
  if (!c) notFound();
  const t = await getTranslations("browse");
  const initial = await serverApi<{ items: Card[]; total: number; next_cursor: number | null; facets: { materials: Record<string, number>; verified: number } }>(
    `/catalog/search?category=${slug}&cursor=0&limit=24`,
    { revalidate: 60 },
  );
  return (
    <div className="pt-6">
      <h1 className="font-display mb-1 text-[26px] md:text-4xl">{c.name}</h1>
      <p className="mb-6 text-ink-600">{t("category_sub")}</p>
      <Suspense>
        <Browse fixed={{ category: slug }} initial={initial} />
      </Suspense>
    </div>
  );
}
