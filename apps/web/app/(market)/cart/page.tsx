"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Heart, Lock, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthGate } from "@/components/auth-gate";
import { VerifiedBadge } from "@/components/karu/badges";
import { Avatar } from "@/components/ui/avatar";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { CardSkeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { inr } from "@/lib/format";
import type { Card } from "@/lib/types";

interface CartView {
  groups: {
    maker: Card["maker"];
    items: {
      listing_id: string;
      qty: number;
      card: Card;
      available: boolean;
      line_total: number;
    }[];
  }[];
  subtotal_inr: number;
  count: number;
}

export default function CartPage() {
  return <AuthGate>{() => <Cart />}</AuthGate>;
}

function Cart() {
  const t = useTranslations("cart");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["cart", "full"],
    queryFn: () => api<CartView>("/cart/items"),
  });

  const update = async (listingId: string, qty: number | null) => {
    const res =
      qty === null
        ? await api<CartView>(`/cart/items/${listingId}`, { method: "DELETE" })
        : await api<CartView>("/cart/items", { method: "PATCH", body: { listing_id: listingId, qty } });
    qc.setQueryData(["cart", "full"], res);
    qc.invalidateQueries({ queryKey: ["cart"], exact: true });
  };

  if (isLoading) {
    return (
      <div className="container-page py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="lg:col-span-4">
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.count === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          art="basket"
          title={t("empty") || "Your bag is empty"}
          description={t("empty_body") || "Discover authentic handcrafted pieces verified directly from maker studios across India."}
          action={
            <Link href="/">
              <Button variant="primary" size="L">
                {t("browse") || "Explore verified pieces"}
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 lg:py-12">
      <h1 className="font-serif text-h1 text-ink-900 mb-8">
        Your Bag ({data.count})
      </h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
        {/* Start Column: 8 cols Maker-Grouped Lines */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {data.groups.map((group) => (
            <section
              key={group.maker.handle}
              className="rounded-sm border border-line bg-surface shadow-xs overflow-hidden"
            >
              {/* Maker Header */}
              <header className="flex items-center justify-between border-b border-line bg-surface-alt px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar name={group.maker.name} size={32} />
                  <div>
                    <span className="text-body-s font-medium text-ink-900">
                      From{" "}
                      <Link
                        href={`/m/${group.maker.handle}`}
                        className="font-serif font-semibold text-brand hover:underline"
                      >
                        {group.maker.name}
                      </Link>
                    </span>
                    <span className="text-caption text-muted ms-2">· {group.maker.place}</span>
                  </div>
                </div>
                <span className="hidden sm:inline text-caption text-muted">
                  Ships with unique Karu ID tag
                </span>
              </header>

              {/* Items List */}
              <ul className="divide-y divide-line">
                {group.items.map((it) => (
                  <li key={it.listing_id} className="flex gap-4 p-5 sm:gap-6">
                    {/* 96px Image */}
                    <Link
                      href={`/p/${it.card.code}`}
                      className="size-24 shrink-0 overflow-hidden rounded-xs border border-line bg-sand-100"
                    >
                      {it.card.image?.thumb ? (
                        <img
                          src={it.card.image.thumb}
                          alt=""
                          className={`h-full w-full object-cover ${!it.available ? "grayscale opacity-60" : ""}`}
                        />
                      ) : null}
                    </Link>

                    {/* Content */}
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            href={`/p/${it.card.code}`}
                            className="font-serif text-body font-medium text-ink-900 line-clamp-2 hover:text-brand transition-colors"
                          >
                            {it.card.title}
                          </Link>
                          <span className="font-serif text-body font-semibold text-ink-900 shrink-0">
                            {inr(it.line_total)}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                          <VerifiedBadge status={it.card.verification} />
                          <span className="text-caption text-muted font-mono">
                            {it.card.code}
                          </span>
                        </div>

                        {!it.available && (
                          <div className="mt-2">
                            <Banner tone="warn">
                              {t("unavailable") || "This piece just sold out"}
                            </Banner>
                          </div>
                        )}
                      </div>

                      {/* Actions Row */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60">
                        <QuantityStepper
                          value={it.qty}
                          onChange={(q) => update(it.listing_id, q)}
                          min={1}
                          max={10}
                        />

                        <div className="flex items-center gap-4 text-caption">
                          <button
                            type="button"
                            onClick={() => update(it.listing_id, null)}
                            className="inline-flex items-center gap-1 text-muted hover:text-danger transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                            <span>{t("remove") || "Remove"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* End Column: 4 cols Sticky OrderSummary Card */}
        <aside className="lg:col-span-4 lg:sticky lg:top-28">
          <div className="rounded-sm border border-line bg-surface p-6 shadow-xs flex flex-col gap-5">
            <h2 className="font-serif text-h3 text-ink-900 border-b border-line pb-3">
              Order Summary
            </h2>

            <dl className="flex flex-col gap-3 text-body-s">
              <div className="flex justify-between">
                <dt className="text-muted">{t("subtotal")}</dt>
                <dd className="font-medium text-ink-900">{inr(data.subtotal_inr)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t("shipping")}</dt>
                <dd className="font-medium text-verified">{t("free") || "Free standard shipping"}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-body font-semibold text-ink-900">
                <dt>Total</dt>
                <dd className="font-serif text-price text-ink-900">{inr(data.subtotal_inr)}</dd>
              </div>
            </dl>

            <div className="rounded-xs bg-verified-soft p-3 text-caption text-verified flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0" />
              <span>100% of item price goes directly to makers. Zero commission.</span>
            </div>

            <Link href="/checkout" className="w-full">
              <Button variant="primary" size="L" block iconEnd={<ArrowRight className="size-4" />}>
                {t("checkout") || "Proceed to checkout"}
              </Button>
            </Link>

            <div className="flex items-center justify-center gap-2 text-caption text-muted pt-2 border-t border-line">
              <Lock className="size-3.5" />
              <span>256-bit Encrypted · UPI · Cards · Netbanking</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-line bg-surface/95 px-5 py-3.5 backdrop-blur lg:hidden">
        <div>
          <span className="text-caption text-muted">Total</span>
          <p className="font-serif text-lg font-semibold text-ink-900">{inr(data.subtotal_inr)}</p>
        </div>
        <Link href="/checkout">
          <Button variant="primary" size="M" iconEnd={<ArrowRight className="size-4" />}>
            {t("checkout") || "Checkout"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
