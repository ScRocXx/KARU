import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Browse } from "@/components/market/browse";
import { SearchSuggest } from "@/components/market/search-suggest";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const t = await getTranslations("browse");
  return (
    <div className="pt-6">
      <h1 className="font-display mb-4 text-[26px] md:text-4xl">{sp.q ? t("search_title", { q: sp.q }) : t("search_all")}</h1>
      <Suspense>
        <SearchSuggest initial={sp.q || ""} />
        <div className="mt-6">
          <Browse showQuery />
        </div>
      </Suspense>
    </div>
  );
}
