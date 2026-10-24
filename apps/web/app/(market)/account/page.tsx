"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ChevronRight, Heart, Package, Store, Users } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatTile } from "@/components/ui/stat-tile";
import { api } from "@/lib/api";
import { inr } from "@/lib/format";
import type { Me } from "@/lib/types";

export default function AccountOverviewPage() {
  return <AuthGate>{(me) => <AccountOverview me={me} />}</AuthGate>;
}

function AccountOverview({ me }: { me: Me }) {
  const t = useTranslations("account");
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState(me.display_name || "");
  const [saving, setSaving] = useState(false);

  // Fetch count of orders, wishlist items, following
  const { data: orders } = useQuery({
    queryKey: ["orders", "recent"],
    queryFn: () => api<{ items: { id: string; order_number: string; status: string; total_inr: number; items: { title: string; image?: { thumb?: string } }[] }[] }>("/orders?limit=2"),
  });

  const { data: wishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => api<{ items: unknown[]; total: number }>("/wishlist"),
  });

  const { data: following } = useQuery({
    queryKey: ["following"],
    queryFn: () => api<{ items: unknown[]; total: number }>("/me/following"),
  });

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const u = await api<Me>("/me", { method: "PATCH", body: { display_name: name } });
      qc.setQueryData(["me"], u);
      toast(t("saved") || "Profile updated");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting Header */}
      <div>
        <span className="text-eyebrow text-brand">Patron Dashboard</span>
        <h1 className="font-serif text-h1 text-ink-900 mt-1">
          Welcome back, {me.display_name?.split(" ")[0] || "Patron"}
        </h1>
        <p className="text-body-s text-muted mt-1">
          Tracking your certified handmade collections and verified artisan connections.
        </p>
      </div>

      {/* StatTiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile label="Orders" value={orders?.items.length ?? 0} />
        <StatTile label="Saved in Wishlist" value={wishlist?.total ?? 0} />
        <StatTile label="Makers Followed" value={following?.total ?? 0} />
      </div>

      {/* Recent Orders Section */}
      <section className="rounded-sm border border-line bg-surface p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
          <h2 className="font-serif text-h3 text-ink-900">Recent Orders</h2>
          <Link
            href="/account/orders"
            className="text-caption text-brand underline underline-offset-4 hover:text-brand-hover flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {!orders || orders.items.length === 0 ? (
          <p className="text-body-s text-muted py-4">No recent orders yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {orders.items.map((ord) => (
              <div key={ord.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {ord.items.slice(0, 2).map((it, i) => (
                      <div key={i} className="size-12 rounded-xs border border-line overflow-hidden bg-sand-100">
                        {it.image?.thumb && <img src={it.image.thumb} alt="" className="h-full w-full object-cover" />}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-body-s font-medium text-ink-900">Order #{ord.order_number}</p>
                    <p className="text-caption text-muted">{ord.items.length} items · {inr(ord.total_inr)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-caption font-medium capitalize text-ink-800">
                    {ord.status.replace("_", " ")}
                  </span>
                  <Link href={`/account/orders/${ord.id}`}>
                    <Button variant="secondary" size="S">
                      Track
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Profile Name Settings */}
      <section className="rounded-sm border border-line bg-surface p-6 shadow-xs">
        <h2 className="font-serif text-h3 text-ink-900 mb-4">Profile Settings</h2>
        <form onSubmit={saveProfile} className="flex flex-col gap-4 max-w-md">
          <label className="flex flex-col gap-1.5 text-body-s font-medium text-ink-900">
            <span>{t("your_name") || "Display name"}</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              maxLength={120}
            />
          </label>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" size="M" loading={saving}>
              {t("save") || "Save changes"}
            </Button>
          </div>
        </form>
      </section>

      {/* Mobile-Only Navigation Links List */}
      <div className="flex flex-col divide-y divide-line rounded-sm border border-line bg-surface lg:hidden">
        <Link href="/account/orders" className="flex items-center justify-between p-4 text-body-s font-medium text-ink-900">
          <span>My Orders</span>
          <ChevronRight className="size-4 text-muted" />
        </Link>
        <Link href="/account/wishlist" className="flex items-center justify-between p-4 text-body-s font-medium text-ink-900">
          <span>Wishlist</span>
          <ChevronRight className="size-4 text-muted" />
        </Link>
        <Link href="/account/following" className="flex items-center justify-between p-4 text-body-s font-medium text-ink-900">
          <span>Makers Following</span>
          <ChevronRight className="size-4 text-muted" />
        </Link>
        <Link href="/account/addresses" className="flex items-center justify-between p-4 text-body-s font-medium text-ink-900">
          <span>Saved Addresses</span>
          <ChevronRight className="size-4 text-muted" />
        </Link>
        <Link href="/account/settings" className="flex items-center justify-between p-4 text-body-s font-medium text-ink-900">
          <span>Account Settings</span>
          <ChevronRight className="size-4 text-muted" />
        </Link>
      </div>
    </div>
  );
}
