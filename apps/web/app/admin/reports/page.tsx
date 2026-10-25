"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminTitle, Table, useReason } from "@/components/admin/shell";
import { useToast } from "@/components/toast";
import { Button, Select, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { date } from "@/lib/format";

interface Report {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  source: string;
  created_at: string;
  resolution_note: string | null;
}

/** S04: buyer reports, system hard-fail flags, IP/copyright complaints, child-labour reviews. */
export default function AdminReports() {
  const [status, setStatus] = useState("open");
  const toast = useToast();
  const reason = useReason();
  const { data, isLoading, refetch } = useQuery({ queryKey: ["admin-reports", status], queryFn: () => api<{ items: Report[] }>(`/admin/reports?status=${status}`) });
  const resolve = async (id: string, next: string) => {
    const note = await reason(`Mark as ${next}. Note (saved to audit log):`);
    await api(`/admin/reports/${id}`, { method: "PATCH", body: { status: next, resolution_note: note } });
    toast("Saved");
    void refetch();
  };
  return (
    <>
      <AdminTitle actions={<Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">{["open", "confirmed", "dismissed", "actioned", ""].map((s) => <option key={s} value={s}>{s || "all"}</option>)}</Select>}>Reports & takedowns</AdminTitle>
      {isLoading ? <Skeleton className="h-64" /> : (
        <Table head={["When", "Source", "Target", "Reason", "Details", "Status", "Actions"]}>
          {data?.items.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2">{date(r.created_at)}</td>
              <td className="px-3 py-2">{r.source}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.target_type}<br />{r.target_id}</td>
              <td className="px-3 py-2 font-semibold">{r.reason}</td>
              <td className="max-w-xs px-3 py-2">{r.details}</td>
              <td className="px-3 py-2">{r.status}{r.resolution_note && <p className="text-xs text-ink-600">{r.resolution_note}</p>}</td>
              <td className="px-3 py-2">
                {r.status === "open" && (
                  <div className="flex flex-wrap gap-1">
                    <Button size="S" variant="danger" onClick={() => resolve(r.id, "confirmed")}>Confirm</Button>
                    <Button size="S" variant="secondary" onClick={() => resolve(r.id, "actioned")}>Actioned</Button>
                    <Button size="S" variant="tertiary" onClick={() => resolve(r.id, "dismissed")}>Dismiss</Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
