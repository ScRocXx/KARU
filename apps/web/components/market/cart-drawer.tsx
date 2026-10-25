"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { VerifiedBadge } from "@/components/karu/badges";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
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

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("cart");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["cart", "full"],
    queryFn: () => api<CartView>("/cart/items"),
    enabled: open,
  });

  const update = async (listingId: string, qty: number | null) => {
    const res =
      qty === null
        ? await api<CartView>(`/cart/items/${listingId}`, { method: "DELETE" })
        : await api<CartView>("/cart/items", { method: "PATCH", body: { listing_id: listingId, qty } });
    qc.setQueryData(["cart", "full"], res);
    qc.invalidateQueries({ queryKey: ["cart"], exact: true });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="end"
      title={`Your Bag ${data?.count ? `(${data.count})` : ""}`}
      footer={
        data && data.count > 0 ? (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center justify-between text-body font-semibold text-ink-900 border-b border-line pb-2">
              <span>{t("subtotal")}</span>
              <span className="font-serif text-lg">{inr(data.subtotal_inr)}</span>
            </div>
            <p className="rounded-xs bg-verified-soft p-2 text-center text-caption font-medium text-verified">
              Direct from artisan clusters. Your payment goes directly to the makers.
            </p>
            <div className="flex gap-2.5">
              <Link href="/cart" onClick={onClose} className="flex-1">
                <Button variant="secondary" size="M" block>
                  {t("title") || "View bag"}
                </Button>
              </Link>
              <Link href="/checkout" onClick={onClose} className="flex-1">
                <Button variant="primary" size="M" block iconEnd={<ArrowRight className="size-4" />}>
                  {t("checkout") || "Checkout"}
                </Button>
              </Link>
            </div>
          </div>
        ) : null
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : !data || data.count === 0 ? (
          <EmptyState
            art="basket"
            title={t("empty") || "Your bag is empty"}
            description={t("empty_body") || "Discover authentic handcrafted pieces verified directly from maker studios."}
            action={
              <Button variant="secondary" size="S" onClick={onClose}>
                {t("browse") || "Start exploring"}
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {data.groups.map((group) => (
              <div key={group.maker.handle} className="py-3.5 flex flex-col gap-3">
                <div className="flex items-center justify-between text-caption text-muted">
                  <span className="font-medium text-ink-900">
                    From {group.maker.name}
                  </span>
                  <span>{group.maker.place}</span>
                </div>

                <div className="flex flex-col gap-3">
                  {group.items.map((it) => (
                    <div key={it.listing_id} className="flex gap-3 items-start">
                      <Link
                        href={`/p/${it.card.code}`}
                        onClick={onClose}
                        className="size-18 shrink-0 overflow-hidden rounded-xs border border-line bg-sand-100"
                      >
                        {it.card.image?.thumb && (
                          <img
                            src={it.card.image.thumb}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </Link>

                      <div className="min-w-0 flex-1 flex flex-col gap-1">
                        <Link
                          href={`/p/${it.card.code}`}
                          onClick={onClose}
                          className="font-serif text-body-s font-medium text-ink-900 line-clamp-1 hover:text-brand"
                        >
                          {it.card.title}
                        </Link>
                        <div className="flex items-center gap-2">
                          <VerifiedBadge status={it.card.verification} />
                          <span className="text-body-s font-semibold text-ink-900">
                            {inr(it.line_total)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <QuantityStepper
                            value={it.qty}
                            onChange={(q) => update(it.listing_id, q)}
                            min={1}
                            max={10}
                          />
                          <button
                            type="button"
                            onClick={() => update(it.listing_id, null)}
                            className="text-muted hover:text-danger p-1 transition-colors"
                            aria-label={t("remove")}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
