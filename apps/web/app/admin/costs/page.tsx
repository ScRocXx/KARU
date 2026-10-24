"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminTitle, Table } from "@/components/admin/shell";
import { Card, Select, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { inr } from "@/lib/format";

interface Costs {
  by_operation: { provider: string; operation: string; calls: number; cost_inr: number; avg_latency_ms: number; errors: number }[];
  daily: ({ date: string } & Record<string, number | string>)[];
  total_inr: number;
  per_listing_inr: number | null;
  per_verified_inr: number | null;
  budgets: Record<string, number>;
}

const PROVIDERS = ["tinyfish", "gemini", "stt", "razorpay", "sms", "whatsapp", "email"];
const COLORS: Record<string, string> = { tinyfish: "#1F2A6B", gemini: "#E3A72F", stt: "#11756B", razorpay: "#B9532E", sms: "#7A736B", whatsapp: "#2F3E94", email: "#BDB5AA" };

/** S07: TinyFish/AI usage and cost per day, per operation, per listing and per verified product. */
export default function AdminCosts() {
  const [days, setDays] = useState(30);
  const { data } = useQuery({ queryKey: ["admin-costs", days], queryFn: () => api<Costs>(`/admin/costs?days=${days}`) });
  if (!data) return <Skeleton className="h-64" />;
  const max = Math.max(0.01, ...data.daily.map((d) => PROVIDERS.reduce((s, p) => s + Number(d[p] || 0), 0)));
  return (
    <>
      <AdminTitle actions={<Select value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-36">{[7, 30, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}</Select>}>TinyFish & AI costs</AdminTitle>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs uppercase text-ink-600">Total</p><p className="font-display text-3xl">{inr(data.total_inr, { decimals: true })}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-ink-600">Per published listing</p><p className="font-display text-3xl">{data.per_listing_inr === null ? "—" : inr(data.per_listing_inr, { decimals: true })}</p><p className="text-xs text-ink-600">target &lt; ₹15</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-ink-600">Per verified product</p><p className="font-display text-3xl">{data.per_verified_inr === null ? "—" : inr(data.per_verified_inr, { decimals: true })}</p></Card>
      </div>
      <Card className="mb-4 p-4">
        <p className="mb-3 text-sm font-semibold">Daily spend (INR) · budgets: TinyFish {inr(data.budgets.tinyfish_daily_inr)}/day, Gemini {inr(data.budgets.gemini_daily_inr)}/day</p>
        <div className="flex h-40 items-end gap-1" role="img" aria-label="Daily cost by provider">
          {data.daily.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col-reverse" title={`${d.date}: ${PROVIDERS.map((p) => (d[p] ? `${p} ₹${d[p]}` : "")).filter(Boolean).join(", ")}`}>
              {PROVIDERS.map((p) => (d[p] ? <div key={p} style={{ height: `${(Number(d[p]) / max) * 150}px`, background: COLORS[p] }} /> : null))}
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs">{PROVIDERS.map((p) => <span key={p} className="inline-flex items-center gap-1"><span className="size-3 rounded-sm" style={{ background: COLORS[p] }} />{p}</span>)}</div>
      </Card>
      <Table head={["Provider", "Operation", "Calls", "Errors", "Avg latency", "Cost"]}>
        {data.by_operation.map((r) => (
          <tr key={`${r.provider}-${r.operation}`}>
            <td className="px-3 py-2">{r.provider}</td>
            <td className="px-3 py-2 font-mono text-xs">{r.operation}</td>
            <td className="px-3 py-2">{r.calls}</td>
            <td className="px-3 py-2">{r.errors}</td>
            <td className="px-3 py-2">{r.avg_latency_ms} ms</td>
            <td className="px-3 py-2">{inr(r.cost_inr, { decimals: true })}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
