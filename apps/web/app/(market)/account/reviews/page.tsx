"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AuthGate } from "@/components/auth-gate";
import { Card, EmptyState, Skeleton, Stars } from "@/components/ui";
import { api } from "@/lib/api";
import { date } from "@/lib/format";

export default function MyReviewsPage() {
  return <AuthGate>{() => <MyReviews />}</AuthGate>;
}

function MyReviews() {
  const t = useTranslations("account");
  const locale = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ["my-reviews"],
    queryFn: () => api<{ items: { id: string; rating: number; text: string | null; product: string; code: string; created_at: string }[] }>("/me/reviews"),
  });
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 pt-6">
      <h1 className="font-display text-h2 md:text-4xl">{t("reviews")}</h1>
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : !data?.items.length ? (
        <EmptyState title={t("no_reviews")} />
      ) : (
        data.items.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-center justify-between">
              <Link href={`/p/${r.code}`} className="font-semibold hover:underline">{r.product}</Link>
              <span className="text-xs text-ink-600">{date(r.created_at, locale)}</span>
            </div>
            <Stars value={r.rating} label={`${r.rating} / 5`} />
            {r.text && <p className="mt-1">{r.text}</p>}
          </Card>
        ))
      )}
    </div>
  );
}
