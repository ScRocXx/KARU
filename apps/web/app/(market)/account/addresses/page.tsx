"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { AddressForm, type Address } from "@/components/market/address-form";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export default function AddressesPage() {
  return <AuthGate>{() => <Addresses />}</AuthGate>;
}

function Addresses() {
  const t = useTranslations("account");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => api<{ items: Address[] }>("/addresses"),
  });
  const [editing, setEditing] = useState<Address | "new" | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="font-serif text-h2 text-ink-900">{t("addresses") || "Saved Addresses"}</h1>
          <p className="text-body-s text-muted mt-1">
            Manage your delivery destinations for authentic craft shipments.
          </p>
        </div>
        <Button variant="primary" size="M" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>
          {t("add") || "Add address"}
        </Button>
      </div>

      {isLoading ? (
        <CardSkeleton />
      ) : !data?.items.length ? (
        <EmptyState
          title={t("no_addresses") || "No saved addresses"}
          description="Add your shipping address for fast, secure checkouts."
          action={
            <Button variant="primary" size="M" onClick={() => setEditing("new")}>
              {t("add") || "Add address"}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.items.map((a) => (
            <article
              key={a.id}
              className="rounded-sm border border-line bg-surface p-5 shadow-xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className="font-medium text-body-s text-ink-900">{a.name}</h3>
                  {a.is_default && (
                    <span className="rounded-full bg-verified-soft px-2 py-0.5 text-caption font-semibold text-verified">
                      {t("default") || "Default"}
                    </span>
                  )}
                </div>
                <p className="text-caption text-muted">{a.phone}</p>
                <p className="text-body-s text-ink-800 mt-2 leading-relaxed">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pin}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-line">
                <Button size="S" variant="secondary" onClick={() => setEditing(a)}>
                  {t("edit") || "Edit"}
                </Button>
                <Button
                  size="S"
                  variant="ghost"
                  onClick={async () => {
                    await api(`/addresses/${a.id}`, { method: "DELETE" });
                    await refetch();
                  }}
                >
                  {t("delete") || "Delete"}
                </Button>
              </div>
            </article>
          ))}

          <button
            type="button"
            onClick={() => setEditing("new")}
            className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-line bg-surface-alt p-6 text-body-s font-medium text-brand hover:border-brand transition-colors cursor-pointer"
          >
            <Plus className="size-5" />
            <span>{t("add") || "Add another address"}</span>
          </button>
        </div>
      )}

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "new" ? t("add") || "Add Address" : t("edit") || "Edit Address"}
        side="end"
      >
        {editing && (
          <AddressForm
            initial={editing === "new" ? undefined : editing}
            onSaved={async () => {
              await refetch();
              setEditing(null);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}
