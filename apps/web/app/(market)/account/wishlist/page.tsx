"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthGate } from "@/components/auth-gate";
import { ProductGrid } from "@/components/karu/product-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { Card } from "@/lib/types";

export default function WishlistPage() {
  return <AuthGate>{() => <Wishlist />}</AuthGate>;
}

function Wishlist() {
  const t = useTranslations("account");
  const { data, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => api<{ items: Card[] }>("/wishlist"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-line pb-4">
        <h1 className="font-serif text-h2 text-ink-900">{t("wishlist") || "My Wishlist"}</h1>
        <p className="text-body-s text-muted mt-1">
          Handcrafted pieces you&apos;ve bookmarked for your home and wardrobe.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : data?.items.length ? (
        <ProductGrid cards={data.items} columns={3} />
      ) : (
        <EmptyState
          art="thread"
          title={t("wishlist_empty") || "Your wishlist is empty"}
          description="Save authentic pieces you love as you explore regional craft clusters."
          action={
            <Link href="/">
              <Button variant="primary" size="M">
                {t("browse") || "Discover crafts"}
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
