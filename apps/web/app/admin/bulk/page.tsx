"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminTitle } from "@/components/admin/shell";
import { useToast } from "@/components/toast";
import { Button, Card, EmptyState, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { date, inr } from "@/lib/format";

interface Bulk {
  id: string;
  org_name: string;
  contact: { name: string; phone: string; email: string };
  category: string | null;
  product_type: string;
  description: string | null;
  quantity: number;
  target_price_inr: number | null;
  deadline: string | null;
  status: string;
  created_at: string;
  opportunity_id: string | null;
  responses: { id: string; maker: string; handle: string; quantity_offered: number; can_meet_deadline: boolean; note: string | null; status: string }[];
}

/** S05: incoming requests → publish opportunity → interested artisans → close (F9). */
export default function AdminBulk() {
  const toast = useToast();
  const { data, isLoading, refetch } = useQuery({ queryKey: ["admin-bulk"], queryFn: () => api<{ items: Bulk[] }>("/admin/bulk-requests") });
  if (isLoading) return <Skeleton className="h-64" />;
  return (
    <>
      <AdminTitle>Bulk requests</AdminTitle>
      {!data?.items.length ? <EmptyState title="No bulk requests yet" body="They arrive from the 'For businesses' form." /> : (
        <div className="flex flex-col gap-3">
          {data.items.map((b) => (
            <Card key={b.id} className="flex flex-col gap-2 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-base font-semibold">{b.org_name} — {b.product_type}</p>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-900">{b.status}</span>
              </div>
              <p>{b.quantity} units {b.target_price_inr ? `· target ${inr(b.target_price_inr)}` : ""} {b.deadline ? `· by ${date(b.deadline)}` : ""} {b.category ? `· ${b.category}` : ""}</p>
              {b.description && <p className="text-ink-600">{b.description}</p>}
              <p className="text-ink-600">Contact: {b.contact.name} · {b.contact.phone} · {b.contact.email} · received {date(b.created_at)}</p>
              {b.responses.length > 0 && (
                <ul className="mt-1 divide-y divide-ink-100 rounded-[10px] border border-ink-100">
                  {b.responses.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                      <a href={`/m/${r.handle}`} className="flex-1 underline">{r.maker}</a>
                      <span>{r.quantity_offered} units {r.can_meet_deadline ? "" : "(needs more time)"}</span>
                      <span className="text-xs">{r.status}</span>
                      <Button size="S" variant="secondary" onClick={async () => { await api(`/admin/bulk-responses/${r.id}/status`, { method: "POST", body: { status: "confirmed" } }); void refetch(); }}>Confirm</Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                {b.status === "new" && (
                  <Button size="S" onClick={async () => { const r = await api<{ notified: number }>(`/admin/bulk-requests/${b.id}/publish`, { method: "POST" }); toast(`Published · ${r.notified} verified artisans notified`); void refetch(); }}>
                    Publish opportunity
                  </Button>
                )}
                {b.status !== "closed" && <Button size="S" variant="tertiary" onClick={async () => { await api(`/admin/bulk-requests/${b.id}/close`, { method: "POST" }); void refetch(); }}>Close</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
