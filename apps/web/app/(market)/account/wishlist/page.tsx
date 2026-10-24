"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthGate } from "@/components/auth-gate";
import { ProductGrid } from "@/components/karu/product-card";
import { EmptyState, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import type { Card } from "@/lib/types";

export default function WishlistPage() {
  return <AuthGate>{() => <Wishlist />}</AuthGate>;
}

function Wishlist() {
  const t = useTranslations("account");
  const { data, isLoading } = useQuery({ queryKey: ["wishlist"], queryFn: () => api<{ items: Card[] }>("/wishlist") });
  return (
    <div className="flex flex-col gap-5 pt-6">
      <h1 className="font-display text-[26px] md:text-4xl">{t("wishlist")}</h1>
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : data?.items.length ? (
        <ProductGrid cards={data.items} />
      ) : (
        <EmptyState art="thread" title={t("wishlist_empty")} action={<Link href="/" className="font-semibold text-indigo-900 underline">{t("browse")}</Link>} />
      )}
    </div>
  );
}
