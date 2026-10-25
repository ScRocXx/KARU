import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { Browse } from "@/components/market/browse";
import { SearchSuggest } from "@/components/market/search-suggest";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const t = await getTranslations("browse");
  const title = sp.q ? t("search_title", { q: sp.q }) : t("search_all");

  return (
    <Container size="page" className="py-6 sm:py-8">
      <div className="mb-6 border-b border-line/60 pb-5">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: sp.q ? `Search: "${sp.q}"` : "Catalogue Search" },
          ]}
        />
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-text mt-3">{title}</h1>
      </div>
      <Suspense>
        <SearchSuggest initial={sp.q || ""} />
        <div className="mt-6">
          <Browse showQuery />
        </div>
      </Suspense>
    </Container>
  );
}
