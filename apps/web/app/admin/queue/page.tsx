"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { RunDetailSheet } from "@/components/admin/run-detail";
import { AdminTitle, Table } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { date } from "@/lib/format";

interface Run {
  id: string;
  listing_id: string;
  triggered_by: string;
  l1: number | null;
  l2: number | null;
  l3: number | null;
  karu_score: number | null;
  verdict: string | null;
  hard_fail: boolean;
  hard_fail_reason: string | null;
  completed_at: string | null;
}

/** Verification queue (NOW: read-only list of hard fails and borderline runs). */
export default function AdminQueue() {
  const [run, setRun] = useState<string | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["admin-queue"], queryFn: () => api<{ items: Run[]; threshold: number }>("/admin/verification-queue") });
  return (
    <>
      <AdminTitle>Verification queue</AdminTitle>
      <p className="mb-4 text-sm text-ink-600">Hard fails and runs within ±5 of the threshold ({data?.threshold ?? "…"}). A human review flow is planned for later.</p>
      {isLoading ? <Skeleton className="h-64" /> : (
        <Table head={["Completed", "Trigger", "L1", "L2", "L3", "Karu Score", "Verdict", "Hard fail"]}>
          {data?.items.map((r) => (
            <tr key={r.id} className="cursor-pointer hover:bg-khadi-50" onClick={() => setRun(r.id)}>
              <td className="px-3 py-2">{date(r.completed_at)}</td>
              <td className="px-3 py-2">{r.triggered_by}</td>
              {[r.l1, r.l2, r.l3, r.karu_score].map((v, i) => <td key={i} className="px-3 py-2 font-mono">{v === null ? "—" : v.toFixed(1)}</td>)}
              <td className="px-3 py-2">{r.verdict}</td>
              <td className="px-3 py-2 text-danger-600">{r.hard_fail ? r.hard_fail_reason : ""}</td>
            </tr>
          ))}
        </Table>
      )}
      <RunDetailSheet runId={run} onClose={() => setRun(null)} />
    </>
  );
}
