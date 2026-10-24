"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminTitle, Table } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui";
import { api } from "@/lib/api";

interface Entry {
  id: string;
  at: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  reason: string | null;
  before: unknown;
  after: unknown;
  actor: string | null;
}

/** S08: every admin action. */
export default function AdminAudit() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-audit"], queryFn: () => api<{ items: Entry[] }>("/admin/audit-log?limit=300") });
  return (
    <>
      <AdminTitle>Audit log</AdminTitle>
      {isLoading ? <Skeleton className="h-64" /> : (
        <Table head={["When (IST)", "Actor", "Action", "Target", "Reason", "Change"]}>
          {data?.items.map((e) => (
            <tr key={e.id}>
              <td className="whitespace-nowrap px-3 py-2">{new Date(e.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
              <td className="px-3 py-2">{e.actor || "—"}</td>
              <td className="px-3 py-2 font-semibold">{e.action}</td>
              <td className="px-3 py-2 font-mono text-xs">{e.target_type} {e.target_id}</td>
              <td className="max-w-xs px-3 py-2">{e.reason}</td>
              <td className="max-w-sm px-3 py-2 font-mono text-xs">{e.after ? JSON.stringify(e.after).slice(0, 160) : ""}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
