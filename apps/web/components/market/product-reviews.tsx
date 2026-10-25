"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Stars } from "@/components/ui/stars";
import { api } from "@/lib/api";
import { date } from "@/lib/format";

interface Review {
  id: string;
  rating: number;
  text: string | null;
  photos: string[];
  buyer: string;
  city?: string;
  product?: string;
  created_at: string;
}

export function ProductReviews({
  code,
  makerHandle,
  summary,
}: {
  code?: string;
  makerHandle?: string;
  summary: { count: number; avg: number | null };
}) {
  const t = useTranslations("reviews");
  const locale = useLocale();
  const [filterWithPhotos, setFilterWithPhotos] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "rating">("recent");

  const endpoint = code
    ? `/catalog/products/${code}/reviews`
    : makerHandle
    ? `/makers/${makerHandle}/reviews`
    : null;

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", code || makerHandle],
    queryFn: () => (endpoint ? api<{ items: Review[] }>(endpoint) : Promise.resolve({ items: [] })),
    enabled: !!endpoint,
  });

  const reviews = data?.items || [];

  const filteredReviews = useMemo(() => {
    let list = [...reviews];
    if (filterWithPhotos) {
      list = list.filter((r) => r.photos && r.photos.length > 0);
    }
    if (sortBy === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [reviews, filterWithPhotos, sortBy]);

  // Histogram calculation (5 -> 1)
  const histogram = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1
    reviews.forEach((r) => {
      const idx = 5 - Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[idx]++;
    });
    const total = reviews.length || 1;
    return counts.map((count, i) => ({
      star: 5 - i,
      count,
      pct: Math.round((count / total) * 100),
    }));
  }, [reviews]);

  return (
    <section aria-labelledby="reviews-heading" className="w-full">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Left Column: 4 cols Summary & Histogram */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div>
            <span className="text-eyebrow text-brand">Buyer Reviews</span>
            <h2 id="reviews-heading" className="font-serif text-h2 text-ink-900 mt-1">
              {t("title")}
            </h2>
          </div>

          {summary.avg !== null ? (
            <div className="rounded-sm border border-line bg-surface-alt p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-5xl font-medium tracking-tight text-ink-900">
                  {summary.avg.toFixed(1)}
                </span>
                <div>
                  <Stars value={summary.avg} size={18} />
                  <p className="text-caption text-muted mt-1">
                    Based on {summary.count} {summary.count === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>

              {/* 5-to-1 Histogram */}
              <div className="flex flex-col gap-2 pt-2 border-t border-line/60">
                {histogram.map((h) => (
                  <div key={h.star} className="flex items-center gap-2.5 text-caption">
                    <span className="w-5 text-muted font-medium">{h.star}★</span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-sand-200">
                      <div
                        className="absolute inset-y-0 start-0 bg-gold-500 rounded-full transition-all duration-300"
                        style={{ width: `${h.pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-end text-muted font-mono">{h.pct}%</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 rounded-xs bg-surface p-2.5 text-caption text-subtle border border-line">
                <ShieldCheck className="size-4 text-verified shrink-0" />
                <span>Only verified buyers who owned this craft can submit reviews.</span>
              </div>
            </div>
          ) : (
            <p className="text-body-s text-muted">{t("none")}</p>
          )}
        </div>

        {/* Right Column: 8 cols Reviews List with Toolbar */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Controls: Photos toggle + Sort */}
          {reviews.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterWithPhotos(!filterWithPhotos)}
                  className={`rounded-xs border px-3 py-1.5 text-caption transition-colors ${
                    filterWithPhotos
                      ? "border-brand bg-brand text-white font-medium"
                      : "border-line bg-surface hover:border-brand/40 text-ink-800"
                  }`}
                >
                  With photos only
                </button>
              </div>

              <div className="flex items-center gap-2 text-caption text-muted">
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "recent" | "rating")}
                  className="rounded-xs border border-line bg-surface px-2.5 py-1 text-caption text-ink-900 focus:outline-none focus:border-brand"
                >
                  <option value="recent">Most recent</option>
                  <option value="rating">Highest rated</option>
                </select>
              </div>
            </div>
          )}

          {/* Review Cards */}
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="rounded-sm border border-line bg-surface p-8 text-center">
              <p className="text-body text-muted">
                {reviews.length === 0 ? t("none") : "No reviews match the selected photo filter."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredReviews.map((r) => (
                <article
                  key={r.id}
                  className="rounded-sm border border-line bg-surface p-5 shadow-xs flex flex-col gap-3 transition-colors hover:border-line-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Stars value={r.rating} size={15} />
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-medium text-body-s text-ink-900">{r.buyer}</span>
                        {r.city && <span className="text-caption text-muted">· {r.city}</span>}
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-verified bg-verified-soft px-1.5 py-0.5 rounded-full">
                          <CheckCircle2 className="size-3" /> {t("verified_purchase")}
                        </span>
                      </div>
                    </div>
                    <time className="text-caption text-muted shrink-0">
                      {date(r.created_at, locale)}
                    </time>
                  </div>

                  {r.product && (
                    <p className="text-caption text-brand font-medium">Piece: {r.product}</p>
                  )}

                  {r.text && (
                    <blockquote className="font-serif italic text-body text-ink-900 leading-relaxed max-w-2xl">
                      &ldquo;{r.text}&rdquo;
                    </blockquote>
                  )}

                  {r.photos && r.photos.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {r.photos.map((photo, i) => (
                        <div
                          key={i}
                          className="size-20 overflow-hidden rounded-xs border border-line bg-sand-100"
                        >
                          <img
                            src={photo}
                            alt="Buyer review photo"
                            className="h-full w-full object-cover transition-transform hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
