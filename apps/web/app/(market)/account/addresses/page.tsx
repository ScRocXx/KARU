"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { AddressForm, type Address } from "@/components/market/address-form";
import { Button, Card, EmptyState, Sheet, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";

export default function AddressesPage() {
  return <AuthGate>{() => <Addresses />}</AuthGate>;
}

function Addresses() {
  const t = useTranslations("account");
  const { data, isLoading, refetch } = useQuery({ queryKey: ["addresses"], queryFn: () => api<{ items: Address[] }>("/addresses") });
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[26px] md:text-4xl">{t("addresses")}</h1>
        <Button onClick={() => setEditing("new")}>{t("add")}</Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : !data?.items.length ? (
        <EmptyState title={t("no_addresses")} />
      ) : (
        data.items.map((a) => (
          <Card key={a.id} className="flex items-start justify-between gap-3 p-4">
            <div className="text-[15px]">
              <p className="font-semibold">
                {a.name} {a.is_default && <span className="ms-2 rounded-full bg-indigo-50 px-2 text-xs text-indigo-900">{t("default")}</span>}
              </p>
              <p>{a.phone}</p>
              <p className="text-ink-600">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pin}</p>
            </div>
            <div className="flex gap-1">
              <Button size="S" variant="tertiary" onClick={() => setEditing(a)}>{t("edit")}</Button>
              <Button
                size="S"
                variant="tertiary"
                onClick={async () => {
                  await api(`/addresses/${a.id}`, { method: "DELETE" });
                  await refetch();
                }}
              >
                {t("delete")}
              </Button>
            </div>
          </Card>
        ))
      )}
      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? t("add") : t("edit")}>
        {editing && (
          <AddressForm
            initial={editing === "new" ? undefined : editing}
            onSaved={async () => {
              await refetch();
              setEditing(null);
            }}
          />
        )}
      </Sheet>
    </div>
  );
}
