"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthGate } from "@/components/auth-gate";
import { VerifiedBadge } from "@/components/karu/badges";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { inr } from "@/lib/format";
import type { Card } from "@/lib/types";

interface CartView {
  groups: { maker: Card["maker"]; items: { listing_id: string; qty: number; card: Card; available: boolean; line_total: number }[] }[];
  subtotal_inr: number;
  count: number;
}

/** B08: items grouped by maker, qty, remove, total. */
export default function CartPage() {
  return <AuthGate>{() => <Cart />}</AuthGate>;
}

function Cart() {
  const t = useTranslations("cart");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["cart", "full"], queryFn: () => api<CartView>("/cart/items") });
  const update = async (listingId: string, qty: number | null) => {
    const res =
      qty === null
        ? await api<CartView>(`/cart/items/${listingId}`, { method: "DELETE" })
        : await api<CartView>("/cart/items", { method: "PATCH", body: { listing_id: listingId, qty } });
    qc.setQueryData(["cart", "full"], res);
    qc.invalidateQueries({ queryKey: ["cart"], exact: true });
  };
  if (isLoading) return <Skeleton className="mt-6 h-64" />;
  if (!data || data.count === 0)
    return <EmptyState art="basket" title={t("empty")} body={t("empty_body")} action={<Link href="/" className="font-semibold text-indigo-900 underline">{t("browse")}</Link>} />;
  return (
    <div className="grid gap-8 pt-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-[26px] md:text-4xl">{t("title")}</h1>
        {data.groups.map((g) => (
          <section key={g.maker.handle} className="rounded-[16px] border border-ink-100 bg-white">
            <header className="border-b border-ink-100 px-4 py-3 text-sm">
              {t("from_maker")} <Link href={`/m/${g.maker.handle}`} className="font-semibold text-indigo-900">{g.maker.name}</Link> · {g.maker.place}
            </header>
            <ul className="divide-y divide-ink-100">
              {g.items.map((it) => (
                <li key={it.listing_id} className="flex gap-3 p-4">
                  <Link href={`/p/${it.card.code}`} className="w-20 shrink-0">
                    {it.card.image?.thumb && <img src={it.card.image.thumb} alt="" className="aspect-[4/5] w-full rounded-[8px] object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link href={`/p/${it.card.code}`} className="line-clamp-2 font-medium">{it.card.title}</Link>
                    <VerifiedBadge status={it.card.verification} />
                    {!it.available && <p className="text-sm text-terracotta-600">{t("unavailable")}</p>}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-ink-300">
                        <button className="tap flex items-center justify-center" aria-label={t("less")} onClick={() => update(it.listing_id, Math.max(1, it.qty - 1))}>
                          <Minus className="size-4" />
                        </button>
                        <span className="w-6 text-center font-semibold">{it.qty}</span>
                        <button className="tap flex items-center justify-center" aria-label={t("more")} onClick={() => update(it.listing_id, it.qty + 1)}>
                          <Plus className="size-4" />
                        </button>
                      </div>
                      <span className="font-semibold">{inr(it.line_total)}</span>
                      <button className="tap flex items-center justify-center text-ink-600 hover:text-danger-600" aria-label={t("remove")} onClick={() => update(it.listing_id, null)}>
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <aside className="h-fit rounded-[16px] border border-ink-100 bg-white p-5 lg:sticky lg:top-20">
        <dl className="flex flex-col gap-2 text-[15px]">
          <div className="flex justify-between"><dt>{t("subtotal")}</dt><dd className="font-semibold">{inr(data.subtotal_inr)}</dd></div>
          <div className="flex justify-between text-ink-600"><dt>{t("shipping")}</dt><dd>{t("free")}</dd></div>
        </dl>
        <p className="mt-3 rounded-[10px] bg-peacock-50 p-3 text-sm text-peacock-600">{t("zero_commission")}</p>
        <Link href="/checkout" className="mt-4 flex min-h-12 items-center justify-center rounded-[10px] bg-indigo-900 font-semibold text-white hover:bg-indigo-700">
          {t("checkout")}
        </Link>
        <Button variant="tertiary" block className="mt-2" onClick={() => history.back()}>{t("continue")}</Button>
      </aside>
    </div>
  );
}
