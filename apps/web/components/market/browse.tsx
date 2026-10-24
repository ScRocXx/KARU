"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/karu/product-card";
import { Button, Chip, EmptyState, Select, Sheet, Skeleton, Switch } from "@/components/ui";
import { api } from "@/lib/api";
import type { Card } from "@/lib/types";

interface SearchResult {
  items: Card[];
  total: number;
  next_cursor: number | null;
  facets: { materials: Record<string, number>; verified: number };
}

const STATES = ["Bihar", "Gujarat", "Uttar Pradesh", "Punjab", "West Bengal", "Odisha", "Rajasthan", "Karnataka", "Tamil Nadu", "Kerala", "Maharashtra", "Chhattisgarh"];

export function Browse({ fixed = {}, initial, showQuery }: { fixed?: Record<string, string>; initial?: SearchResult; showQuery?: boolean }) {
  const t = useTranslations("browse");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const query = useMemo(() => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(fixed)) q.set(k, v);
    q.delete("cursor");
    return q;
  }, [params, fixed]);
  const key = query.toString();

  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => api<{ items: { slug: string; name: string }[] }>("/catalog/categories") });
  const { data: crafts } = useQuery({ queryKey: ["crafts"], queryFn: () => api<{ items: { slug: string; name: string }[] }>("/catalog/crafts") });

  const results = useInfiniteQuery({
    queryKey: ["search", key],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => api<SearchResult>(`/catalog/search?${key}&cursor=${pageParam}&limit=24`),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    initialData: initial && key === new URLSearchParams(fixed).toString() ? { pages: [initial], pageParams: [0] } : undefined,
  });

  const set = (k: string, v: string | null) => {
    const q = new URLSearchParams(params.toString());
    if (v === null || v === "") q.delete(k);
    else q.set(k, v);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };
  const items = results.data?.pages.flatMap((p) => p.items) || [];
  const total = results.data?.pages[0]?.total ?? 0;
  const facets = results.data?.pages[0]?.facets;

  const filters = (
    <div className="flex flex-col gap-6">
      <Switch checked={params.get("verified") === "true"} onChange={(v) => set("verified", v ? "true" : null)} label={t("verified_only")} description={t("verified_only_hint")} />
      {!fixed.category && cats && (
        <FilterGroup title={t("category")}>
          <Select value={params.get("category") || ""} onChange={(e) => set("category", e.target.value)}>
            <option value="">{t("any")}</option>
            {cats.items.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </FilterGroup>
      )}
      {!fixed.craft && crafts && (
        <FilterGroup title={t("craft")}>
          <Select value={params.get("craft") || ""} onChange={(e) => set("craft", e.target.value)}>
            <option value="">{t("any")}</option>
            {crafts.items.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </FilterGroup>
      )}
      <FilterGroup title={t("price")}>
        <div className="flex items-center gap-2">
          <input
            inputMode="numeric"
            placeholder={t("min")}
            defaultValue={params.get("min_price") || ""}
            onBlur={(e) => set("min_price", e.target.value.replace(/\D/g, ""))}
            className="min-h-11 w-full rounded-[8px] border border-ink-300 px-3"
            aria-label={t("min_price")}
          />
          <span className="text-ink-600">–</span>
          <input
            inputMode="numeric"
            placeholder={t("max")}
            defaultValue={params.get("max_price") || ""}
            onBlur={(e) => set("max_price", e.target.value.replace(/\D/g, ""))}
            className="min-h-11 w-full rounded-[8px] border border-ink-300 px-3"
            aria-label={t("max_price")}
          />
        </div>
      </FilterGroup>
      <FilterGroup title={t("region")}>
        <Select value={params.get("state") || ""} onChange={(e) => set("state", e.target.value)}>
          <option value="">{t("any")}</option>
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </FilterGroup>
      {facets && Object.keys(facets.materials).length > 0 && (
        <FilterGroup title={t("material")}>
          <div className="flex flex-wrap gap-2">
            {Object.entries(facets.materials).map(([m, n]) => (
              <Chip key={m} active={params.get("material") === m} onClick={() => set("material", params.get("material") === m ? null : m)}>
                {m} <span className="text-xs opacity-70">{n}</span>
              </Chip>
            ))}
          </div>
        </FilterGroup>
      )}
      <Switch checked={params.get("returnable") === "true"} onChange={(v) => set("returnable", v ? "true" : null)} label={t("returnable")} />
      <Switch checked={params.get("in_stock") === "true"} onChange={(v) => set("in_stock", v ? "true" : null)} label={t("in_stock")} />
      <Switch checked={params.get("min_rating") === "4"} onChange={(v) => set("min_rating", v ? "4" : null)} label={t("rating_4")} />
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-20 rounded-[12px] border border-ink-100 bg-white p-4">{filters}</div>
      </aside>
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-ink-600" aria-live="polite">
            {results.isFetching && !results.isFetchingNextPage ? t("loading") : t("results", { n: total })}
            {showQuery && params.get("q") ? ` · “${params.get("q")}”` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="S" className="lg:hidden" icon={<SlidersHorizontal className="size-4" />} onClick={() => setOpen(true)}>
              {t("filters")}
            </Button>
            <Select value={params.get("sort") || "relevance"} onChange={(e) => set("sort", e.target.value)} className="!min-h-9 w-auto py-1 text-sm" aria-label={t("sort")}>
              {["relevance", "new", "price_asc", "price_desc", "rating"].map((s) => (
                <option key={s} value={s}>
                  {t(`sort_${s}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {results.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5]" />
            ))}
          </div>
        ) : results.isError ? (
          <EmptyState title={t("error")} action={<Button onClick={() => results.refetch()}>{t("retry")}</Button>} />
        ) : items.length === 0 ? (
          <EmptyState art="basket" title={t("empty")} body={t("empty_body")} />
        ) : (
          <>
            <ProductGrid cards={items} />
            {results.hasNextPage && (
              <div className="mt-8 flex justify-center">
                <Button variant="secondary" loading={results.isFetchingNextPage} onClick={() => results.fetchNextPage()}>
                  {t("load_more")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={t("filters")}>
        {filters}
        <Button block className="mt-6" onClick={() => setOpen(false)}>
          {t("show_results", { n: total })}
        </Button>
      </Sheet>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold text-ink-900">{title}</legend>
      {children}
    </fieldset>
  );
}
