"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AuthGate } from "@/components/auth-gate";
import { Card, EmptyState, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { date, inr } from "@/lib/format";

interface Req {
  id: string;
  title: string;
  code: string;
  quantity: number;
  needed_by: string | null;
  status: string;
  reply: { price_inr?: number; ready_in_days?: number; message?: string; declined?: boolean } | null;
  created_at: string;
}

export default function MyRequestsPage() {
  return <AuthGate>{() => <MyRequests />}</AuthGate>;
}

function MyRequests() {
  const t = useTranslations("account");
  const locale = useLocale();
  const { data, isLoading } = useQuery({ queryKey: ["my-requests"], queryFn: () => api<{ items: Req[] }>("/me/requests") });
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 pt-6">
      <h1 className="font-display text-h2 md:text-4xl">{t("requests")}</h1>
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : !data?.items.length ? (
        <EmptyState title={t("no_requests")} body={t("no_requests_body")} />
      ) : (
        data.items.map((r) => (
          <Card key={r.id} className="flex flex-col gap-1 p-4">
            <Link href={`/p/${r.code}`} className="font-semibold hover:underline">{r.title}</Link>
            <p className="text-sm text-ink-600">
              {t("req_qty", { n: r.quantity })} · {date(r.created_at, locale)}
            </p>
            <p className="text-sm font-semibold">{t(`req_status.${r.status}`)}</p>
            {r.reply && !r.reply.declined && (
              <p className="rounded-sm bg-peacock-50 p-3 text-sm text-peacock-600">
                {[r.reply.price_inr ? inr(r.reply.price_inr) : null, r.reply.ready_in_days ? t("ready_in", { n: r.reply.ready_in_days }) : null, r.reply.message]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
