"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AuthGate } from "@/components/auth-gate";
import type { OrderView } from "@/components/market/order-types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { date, inr } from "@/lib/format";

export default function OrdersPage() {
  return <AuthGate>{() => <Orders />}</AuthGate>;
}

function Orders() {
  const t = useTranslations("orders");
  const locale = useLocale();

  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api<{ items: OrderView[] }>("/orders"),
  });

  if (isLoading) return <CardSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-line pb-4">
        <h1 className="font-serif text-h2 text-ink-900">{t("title") || "My Orders"}</h1>
        <p className="text-body-s text-muted mt-1">
          Review provenance certificates and track orders shipped directly from maker workshops.
        </p>
      </div>

      {!data?.items.length ? (
        <EmptyState
          art="basket"
          title={t("empty") || "No orders yet"}
          description="When you purchase handcrafted items, they will appear here with their unique Karu ID certificates."
          action={
            <Link href="/">
              <Button variant="primary" size="M">
                {t("browse") || "Explore verified pieces"}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {data.items.map((o) => (
            <Link
              key={o.id}
              href={`/account/orders/${o.id}`}
              className="rounded-sm border border-line bg-surface p-5 shadow-xs transition-colors hover:border-line-strong flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 text-body-s">
                <span className="font-semibold text-ink-900 font-mono">Order #{o.order_number}</span>
                <span className="text-caption text-muted">{date(o.created_at, locale)}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex gap-2.5">
                  {o.items.slice(0, 4).map((i) =>
                    i.image?.thumb ? (
                      <div key={i.id} className="size-16 rounded-xs border border-line overflow-hidden bg-sand-100 shrink-0">
                        <img src={i.image.thumb} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : null
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-body-s font-medium text-ink-900 truncate">
                    {o.items[0]?.title} {o.items.length > 1 ? `+ ${o.items.length - 1} more` : ""}
                  </p>
                  <p className="text-caption text-muted">
                    {o.items[0]?.maker?.name ? `From ${o.items[0].maker.name}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-line/60">
                <span className="rounded-full bg-verified-soft px-2.5 py-0.5 text-caption font-semibold text-verified uppercase tracking-wider">
                  {t(`status.${o.items[0]?.status || o.status}`) || o.status.replace("_", " ")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-body font-semibold text-ink-900">{inr(o.total_inr)}</span>
                  <ChevronRight className="size-4 text-muted" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
