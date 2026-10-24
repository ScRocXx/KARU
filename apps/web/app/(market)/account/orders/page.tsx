"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AuthGate } from "@/components/auth-gate";
import type { OrderView } from "@/components/market/order-types";
import { EmptyState, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { date, inr } from "@/lib/format";

export default function OrdersPage() {
  return <AuthGate>{() => <Orders />}</AuthGate>;
}

function Orders() {
  const t = useTranslations("orders");
  const locale = useLocale();
  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: () => api<{ items: OrderView[] }>("/orders") });
  if (isLoading) return <Skeleton className="mt-6 h-64" />;
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 pt-6">
      <h1 className="font-display text-[26px] md:text-4xl">{t("title")}</h1>
      {!data?.items.length ? (
        <EmptyState art="basket" title={t("empty")} action={<Link href="/" className="font-semibold text-indigo-900 underline">{t("browse")}</Link>} />
      ) : (
        data.items.map((o) => (
          <Link key={o.id} href={`/account/orders/${o.id}`} className="flex flex-col gap-3 rounded-[16px] border border-ink-100 bg-white p-4 hover:border-indigo-900/30">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">{o.order_number}</span>
              <span className="text-ink-600">{date(o.created_at, locale)}</span>
            </div>
            <div className="flex gap-2">
              {o.items.slice(0, 4).map((i) => i.image?.thumb && <img key={i.id} src={i.image.thumb} alt="" className="aspect-[4/5] w-14 rounded-[6px] object-cover" />)}
            </div>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-sm font-semibold text-indigo-900">{t(`status.${o.items[0]?.status || o.status}`)}</span>
              <span className="font-semibold">{inr(o.total_inr)}</span>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
