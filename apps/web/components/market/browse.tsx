"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Grid2X2, Grid3X3, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/karu/product-card";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/chip";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadMore } from "@/components/ui/load-more";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import type { Card } from "@/lib/types";

interface SearchResult {
  items: Card[];
  total: number;
  next_cursor: number | null;
  facets: { materials: Record<string, number>; verified: number };
}

const STATES = [
  "Bihar",
  "Gujarat",
  "Uttar Pradesh",
  "Punjab",
  "West Bengal",
  "Odisha",
  "Rajasthan",
  "Karnataka",
  "Tamil Nadu",
  "Kerala",
  "Maharashtra",
  "Chhattisgarh",
];

const PRICE_PRESETS = [
  { label: "Under ₹1,000", min: "", max: "1000" },
  { label: "₹1,000 – ₹3,000", min: "1000", max: "3000" },
  { label: "₹3,000+", min: "3000", max: "" },
];

export function Browse({
  fixed = {},
  initial,
  showQuery = false,
}: {
  fixed?: Record<string, string>;
  initial?: SearchResult;
  showQuery?: boolean;
}) {
  void showQuery;
  const t = useTranslations("browse");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cols, setCols] = useState<3 | 4>(4);

  const query = useMemo(() => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(fixed)) q.set(k, v);
    q.delete("cursor");
    return q;
  }, [params, fixed]);

  const key = query.toString();

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<{ items: { slug: string; name: string }[] }>("/catalog/categories"),
  });
  const { data: crafts } = useQuery({
    queryKey: ["crafts"],
    queryFn: () => api<{ items: { slug: string; name: string }[] }>("/catalog/crafts"),
  });

  const results = useInfiniteQuery({
    queryKey: ["search", key],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => api<SearchResult>(`/catalog/search?${key}&cursor=${pageParam}&limit=24`),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    initialData:
      initial && key === new URLSearchParams(fixed).toString()
        ? { pages: [initial], pageParams: [0] }
        : undefined,
  });

  const setFilter = (k: string, v: string | null) => {
    const q = new URLSearchParams(params.toString());
    if (v === null || v === "") q.delete(k);
    else q.set(k, v);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(fixed)) q.set(k, v);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };

  const items = results.data?.pages.flatMap((p) => p.items) || [];
  const total = results.data?.pages[0]?.total ?? 0;
  const facets = results.data?.pages[0]?.facets;

  // Active filters list
  const activeFilters = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    if (params.get("verified") === "true") list.push({ key: "verified", label: "Karu Verified" });
    if (params.get("category") && !fixed.category) {
      const c = cats?.items.find((x) => x.slug === params.get("category"));
      list.push({ key: "category", label: c ? c.name : params.get("category")! });
    }
    if (params.get("craft") && !fixed.craft) {
      const cr = crafts?.items.find((x) => x.slug === params.get("craft"));
      list.push({ key: "craft", label: cr ? cr.name : params.get("craft")! });
    }
    if (params.get("state") && !fixed.state) list.push({ key: "state", label: params.get("state")! });
    if (params.get("material")) list.push({ key: "material", label: params.get("material")! });
    if (params.get("min_price") || params.get("max_price")) {
      const min = params.get("min_price");
      const max = params.get("max_price");
      list.push({
        key: "price",
        label: min && max ? `₹${min} - ₹${max}` : min ? `> ₹${min}` : `< ₹${max}`,
      });
    }
    return list;
  }, [params, fixed, cats, crafts]);

  const filterContent = (
    <div className="flex flex-col gap-5">
      {/* 1. Karu Verified Toggle */}
      <div className="rounded-xs border border-peacock-200/60 bg-verified-soft/70 p-3">
        <Switch
          checked={params.get("verified") === "true"}
          onChange={(v) => setFilter("verified", v ? "true" : null)}
          label={
            <span className="font-semibold text-verified flex items-center gap-1.5 text-body-s">
              <span className="size-2 rounded-full bg-verified" />
              {t("verified_only")}
            </span>
          }
          description={t("verified_only_hint")}
        />
      </div>

      <Accordion defaultOpen="price" className="divide-y divide-line">
        {/* Price Range */}
        <AccordionItem value="price" title={t("price")}>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center gap-2">
              <Input
                inputMode="numeric"
                prefix="₹"
                placeholder={t("min")}
                defaultValue={params.get("min_price") || ""}
                onBlur={(e) => setFilter("min_price", e.target.value.replace(/\D/g, ""))}
                aria-label={t("min_price")}
              />
              <span className="text-muted">–</span>
              <Input
                inputMode="numeric"
                prefix="₹"
                placeholder={t("max")}
                defaultValue={params.get("max_price") || ""}
                onBlur={(e) => setFilter("max_price", e.target.value.replace(/\D/g, ""))}
                aria-label={t("max_price")}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRICE_PRESETS.map((p) => {
                const active = params.get("min_price") === p.min && params.get("max_price") === p.max;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      if (active) {
                        setFilter("min_price", null);
                        setFilter("max_price", null);
                      } else {
                        setFilter("min_price", p.min || null);
                        setFilter("max_price", p.max || null);
                      }
                    }}
                    className={`rounded-xs border px-2 py-1 text-caption transition-colors ${
                      active
                        ? "border-brand bg-brand text-on-dark font-medium"
                        : "border-line bg-surface hover:border-brand/40 text-ink-800"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </AccordionItem>

        {/* Categories */}
        {!fixed.category && cats && (
          <AccordionItem value="category" title={t("category")}>
            <div className="flex flex-col gap-1 py-1 max-h-56 overflow-y-auto no-scrollbar">
              <label className="flex items-center gap-2 py-1 text-body-s cursor-pointer hover:text-brand">
                <input
                  type="radio"
                  name="category"
                  checked={!params.get("category")}
                  onChange={() => setFilter("category", null)}
                  className="accent-brand"
                />
                <span>{t("any")}</span>
              </label>
              {cats.items.map((c) => (
                <label key={c.slug} className="flex items-center gap-2 py-1 text-body-s cursor-pointer hover:text-brand">
                  <input
                    type="radio"
                    name="category"
                    checked={params.get("category") === c.slug}
                    onChange={() => setFilter("category", c.slug)}
                    className="accent-brand"
                  />
                  <span>{c.name}</span>
                </label>
              ))}
            </div>
          </AccordionItem>
        )}

        {/* Crafts */}
        {!fixed.craft && crafts && (
          <AccordionItem value="craft" title={t("craft")}>
            <div className="flex flex-col gap-1 py-1 max-h-56 overflow-y-auto no-scrollbar">
              <label className="flex items-center gap-2 py-1 text-body-s cursor-pointer hover:text-brand">
                <input
                  type="radio"
                  name="craft"
                  checked={!params.get("craft")}
                  onChange={() => setFilter("craft", null)}
                  className="accent-brand"
                />
                <span>{t("any")}</span>
              </label>
              {crafts.items.map((cr) => (
                <label key={cr.slug} className="flex items-center gap-2 py-1 text-body-s cursor-pointer hover:text-brand">
                  <input
                    type="radio"
                    name="craft"
                    checked={params.get("craft") === cr.slug}
                    onChange={() => setFilter("craft", cr.slug)}
                    className="accent-brand"
                  />
                  <span>{cr.name}</span>
                </label>
              ))}
            </div>
          </AccordionItem>
        )}

        {/* Region */}
        <AccordionItem value="region" title={t("region")}>
          <div className="flex flex-col gap-1 py-1 max-h-56 overflow-y-auto no-scrollbar">
            <label className="flex items-center gap-2 py-1 text-body-s cursor-pointer hover:text-brand">
              <input
                type="radio"
                name="state"
                checked={!params.get("state")}
                onChange={() => setFilter("state", null)}
                className="accent-brand"
              />
              <span>{t("any")}</span>
            </label>
            {STATES.map((st) => (
              <label key={st} className="flex items-center gap-2 py-1 text-body-s cursor-pointer hover:text-brand">
                <input
                  type="radio"
                  name="state"
                  checked={params.get("state") === st}
                  onChange={() => setFilter("state", st)}
                  className="accent-brand"
                />
                <span>{st}</span>
              </label>
            ))}
          </div>
        </AccordionItem>

        {/* Materials */}
        {facets && Object.keys(facets.materials).length > 0 && (
          <AccordionItem value="material" title={t("material")}>
            <div className="flex flex-wrap gap-1.5 py-2">
              {Object.entries(facets.materials).map(([m, n]) => (
                <FilterChip
                  key={m}
                  selected={params.get("material") === m}
                  onClick={() => setFilter("material", params.get("material") === m ? null : m)}
                >
                  {m} <span className="opacity-60 text-caption">({n})</span>
                </FilterChip>
              ))}
            </div>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );

  return (
    <div className="w-full">
      {/* Mobile Sticky Filter/Sort Toolbar */}
      <div className="sticky top-16 z-20 flex items-center justify-between border-b border-line bg-bg/95 py-3 backdrop-blur lg:hidden">
        <span className="text-body-s font-medium text-ink-900">
          {total} {total === 1 ? "piece" : "pieces"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="S"
            icon={<SlidersHorizontal className="size-3.5" />}
            onClick={() => setMobileDrawerOpen(true)}
          >
            Filters {activeFilters.length > 0 ? `(${activeFilters.length})` : ""}
          </Button>
        </div>
      </div>

      {/* Main Grid Layout: 3-col Desktop Sticky Filter Sidebar + 9-col Results */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Desktop Sticky Filter Sidebar (3 cols) */}
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24 rounded-xs border border-line/60 bg-surface p-4 sm:p-5">
            <div className="min-h-10 flex items-center justify-between border-b border-line/60 pb-3 mb-4">
              <span className="text-eyebrow text-text font-semibold">Filters</span>
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-caption text-brand underline underline-offset-4 hover:text-brand-hover"
                >
                  Clear all
                </button>
              )}
            </div>
            {filterContent}
          </div>
        </aside>

        {/* Results Area (9 cols) */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          {/* Results Toolbar */}
          <div className="min-h-10 flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-body-s font-medium text-ink-900">
                {total} {total === 1 ? "piece" : "pieces"}
              </span>
              {/* Active Filter Chips */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 ms-2">
                  {activeFilters.map((af) => (
                    <span
                      key={af.key}
                      className="inline-flex items-center gap-1.5 rounded-xs border border-line/60 bg-surface-alt px-2.5 py-1 text-caption text-text"
                    >
                      {af.label}
                      <button
                        type="button"
                        onClick={() => {
                          if (af.key === "price") {
                            setFilter("min_price", null);
                            setFilter("max_price", null);
                          } else {
                            setFilter(af.key, null);
                          }
                        }}
                        className="ms-0.5 text-muted hover:text-brand"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-caption text-brand underline underline-offset-4 hover:text-brand-hover ms-1"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Desktop Density Toggle */}
            <div className="hidden lg:flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCols(3)}
                className={`p-1.5 rounded-xs transition-colors ${cols === 3 ? "bg-surface-alt text-brand" : "text-muted hover:text-ink-900"}`}
                aria-label="3 columns"
              >
                <Grid2X2 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setCols(4)}
                className={`p-1.5 rounded-xs transition-colors ${cols === 4 ? "bg-surface-alt text-brand" : "text-muted hover:text-ink-900"}`}
                aria-label="4 columns"
              >
                <Grid3X3 className="size-4" />
              </button>
            </div>
          </div>

          {/* Product Grid / Loading / Empty State */}
          {results.isLoading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              art="basket"
              title={t("empty_title") || "No handmade pieces found"}
              description={t("empty_desc") || "Try removing some filters or search for another craft."}
              action={
                <Button variant="secondary" onClick={clearAllFilters}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <>
              <ProductGrid cards={items} columns={cols} />
              {results.hasNextPage && (
                <div className="mt-8 flex justify-center">
                  <LoadMore
                    current={items.length}
                    total={total}
                    loading={results.isFetchingNextPage}
                    onLoadMore={() => results.fetchNextPage()}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer for Filters */}
      <Drawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        side="bottom"
        title="Filter pieces"
        footer={
          <div className="flex items-center gap-3 w-full">
            <Button
              variant="secondary"
              size="M"
              className="flex-1"
              onClick={() => {
                clearAllFilters();
                setMobileDrawerOpen(false);
              }}
            >
              Clear all
            </Button>
            <Button
              variant="primary"
              size="M"
              className="flex-1"
              onClick={() => setMobileDrawerOpen(false)}
            >
              Show {total} results
            </Button>
          </div>
        }
      >
        <div className="pb-4">{filterContent}</div>
      </Drawer>
    </div>
  );
}
