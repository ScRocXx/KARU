"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Skeleton, Stars } from "@/components/ui";
import { api } from "@/lib/api";
import { date } from "@/lib/format";

interface Review {
  id: string;
  rating: number;
  text: string | null;
  photos: string[];
  buyer: string;
  created_at: string;
}

export function ProductReviews({ code, summary }: { code: string; summary: { count: number; avg: number | null } }) {
  const t = useTranslations("reviews");
  const locale = useLocale();
  const { data, isLoading } = useQuery({ queryKey: ["reviews", code], queryFn: () => api<{ items: Review[] }>(`/catalog/products/${code}/reviews`) });
  return (
    <section aria-labelledby="rev-h">
      <div className="mb-4 flex items-end justify-between">
        <h2 id="rev-h" className="font-display text-2xl">
          {t("title")}
        </h2>
        {summary.avg !== null && (
          <span className="flex items-center gap-2 text-sm text-ink-600">
            <Stars value={summary.avg} label={`${summary.avg} / 5`} /> {summary.avg} · {t("count", { n: summary.count })}
          </span>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="h-24" />
      ) : !data?.items.length ? (
        <p className="text-ink-600">{t("none")}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.items.map((r) => (
            <li key={r.id} className="rounded-[12px] border border-ink-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} label={`${r.rating} / 5`} />
                <span className="text-xs text-ink-600">{date(r.created_at, locale)}</span>
              </div>
              {r.text && <p className="mt-2 text-[15px]">{r.text}</p>}
              {r.photos.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {r.photos.map((p) => (
                    <img key={p} src={p} alt="" className="size-16 rounded-[8px] object-cover" loading="lazy" />
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs font-semibold text-ink-600">
                {r.buyer} · {t("verified_purchase")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
