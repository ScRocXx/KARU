"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminTitle } from "@/components/admin/shell";
import { Card, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { inr } from "@/lib/format";

interface Metrics {
  signups: { total: number; last_7d: number; artisans: number };
  listings: { published: number };
  verification: { completed: number; verified: number; pass_rate: number | null };
  gmv: string;
  payouts_pending: string;
  tinyfish: { calls_today: number; cost_today_inr: number; cost_month_inr: number };
  gemini: { calls_today: number; cost_today_inr: number; cost_month_inr: number };
  open_reports: number;
}

/** S01: signups, listings, verification pass rate, GMV, payouts pending, TinyFish usage and cost. */
export default function AdminDashboard() {
  const { data } = useQuery({ queryKey: ["admin-metrics"], queryFn: () => api<Metrics>("/admin/metrics"), refetchInterval: 30_000 });
  if (!data) return <Skeleton className="h-64" />;
  const tiles = [
    ["Users", `${data.signups.total}`, `+${data.signups.last_7d} this week · ${data.signups.artisans} artisans`],
    ["Published listings", `${data.listings.published}`, ""],
    ["Verification pass rate", data.verification.pass_rate === null ? "—" : `${Math.round(data.verification.pass_rate * 100)}%`, `${data.verification.verified} of ${data.verification.completed} runs`],
    ["GMV", data.gmv, "paid orders"],
    ["Payouts pending", data.payouts_pending, "on hold or awaiting account"],
    ["Open reports", `${data.open_reports}`, ""],
    ["TinyFish today", inr(data.tinyfish.cost_today_inr, { decimals: true }), `${data.tinyfish.calls_today} calls · month ${inr(data.tinyfish.cost_month_inr)}`],
    ["Gemini today", inr(data.gemini.cost_today_inr, { decimals: true }), `${data.gemini.calls_today} calls · month ${inr(data.gemini.cost_month_inr)}`],
  ];
  return (
    <>
      <AdminTitle>Dashboard</AdminTitle>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(([label, value, sub]) => (
          <Card key={label} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">{label}</p>
            <p className="font-display mt-1 text-3xl text-brand">{value}</p>
            {sub && <p className="text-xs text-ink-600">{sub}</p>}
          </Card>
        ))}
      </div>
    </>
  );
}
