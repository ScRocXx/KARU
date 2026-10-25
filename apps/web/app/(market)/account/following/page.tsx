"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AuthGate } from "@/components/auth-gate";
import { MakerCard } from "@/components/karu/maker-card";
import { EmptyState, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import type { Maker } from "@/lib/types";

export default function FollowingPage() {
  return <AuthGate>{() => <Following />}</AuthGate>;
}

function Following() {
  const t = useTranslations("account");
  const { data, isLoading } = useQuery({ queryKey: ["following"], queryFn: () => api<{ items: Maker[] }>("/following") });
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 pt-6">
      <h1 className="font-display text-h2 md:text-4xl">{t("following")}</h1>
      {isLoading ? <Skeleton className="h-40" /> : data?.items.length ? data.items.map((m) => <MakerCard key={m.id} maker={{ ...m, following: true }} />) : <EmptyState title={t("following_empty")} />}
    </div>
  );
}
