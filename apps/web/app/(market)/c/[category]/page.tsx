import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { Browse } from "@/components/market/browse";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
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
    <Container size="page" className="py-6 sm:py-8">
      <div className="mb-6 border-b border-line/60 pb-5">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Categories", href: "/categories" },
            { label: c.name },
          ]}
        />
        <div className="mt-3 flex flex-col gap-1">
          <span className="text-eyebrow text-brand">Craft Category</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-text">{c.name}</h1>
          <p className="text-body-s text-muted">{t("category_sub")}</p>
        </div>
      </div>
      <Suspense>
        <Browse fixed={{ category: slug }} initial={initial} />
      </Suspense>
    </Container>
  );
}
