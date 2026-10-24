"use client";

import { useQuery } from "@tanstack/react-query";
import { Sheet, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { date } from "@/lib/format";

interface RunDetail {
  id: string;
  version: number;
  triggered_by: string;
  status: string;
  l1: number | null;
  l2: number | null;
  l3: number | null;
  l2_mode: string | null;
  karu_score: number | null;
  verdict: string | null;
  hard_fail: boolean;
  hard_fail_reason: string | null;
  deferred: string[];
  created_at: string;
  config: Record<string, unknown>;
  tips: string[];
  layers: { layer: string; score: number | null; sub_scores: Record<string, unknown>; evidence: Record<string, unknown>; models: Record<string, unknown> }[];
  matches: { url: string; domain: string; similarity: number; own: boolean }[];
  error: string | null;
}

/** S03: every layer score, sub-score, evidence and raw model summary (staff see all numbers). */
export function RunDetailSheet({ runId, onClose }: { runId: string | null; onClose: () => void }) {
  const { data } = useQuery({ queryKey: ["run", runId], queryFn: () => api<RunDetail>(`/admin/verification-runs/${runId}`), enabled: !!runId });
  return (
    <Sheet open={!!runId} onClose={onClose} title="Verification run" wide>
      {!data ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[["L1", data.l1], ["L2", data.l2], ["L3", data.l3], ["Karu Score", data.karu_score]].map(([k, v]) => (
              <div key={k as string} className="rounded-[10px] bg-khadi-50 p-3"><p className="text-xs text-ink-600">{k}</p><p className="text-xl font-semibold">{v === null ? "—" : Number(v).toFixed(1)}</p></div>
            ))}
            <div className="rounded-[10px] bg-khadi-50 p-3"><p className="text-xs text-ink-600">Verdict</p><p className="text-xl font-semibold">{data.verdict || data.status}</p></div>
          </div>
          <p>Version {data.version} · {data.triggered_by} · {date(data.created_at)} · L2 mode {data.l2_mode}</p>
          {data.hard_fail && <p className="rounded-xs bg-danger-50 p-3 font-semibold text-danger">Hard fail: {data.hard_fail_reason}</p>}
          {data.deferred.length > 0 && <p className="rounded-[10px] bg-haldi-100 p-3">Deferred by budget breaker: {data.deferred.join(", ")} (originality penalty 0, re-queued)</p>}
          {data.error && <p className="text-danger-600">{data.error}</p>}
          {data.layers.map((l) => (
            <details key={l.layer} className="rounded-[10px] border border-ink-100 p-3" open>
              <summary className="cursor-pointer font-semibold">{l.layer} — {l.score === null ? "—" : l.score.toFixed(1)}</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">{JSON.stringify({ sub_scores: l.sub_scores, evidence: l.evidence, models: l.models }, null, 2)}</pre>
            </details>
          ))}
          {data.matches.length > 0 && (
            <div>
              <p className="mb-1 font-semibold">Image matches</p>
              <ul className="flex flex-col gap-1">
                {data.matches.map((m, i) => <li key={i}>{m.own ? "✓ own channel" : "⚠"} {m.domain} · similarity {m.similarity} · <a href={m.url} className="underline" target="_blank" rel="noreferrer">link</a></li>)}
              </ul>
            </div>
          )}
          <details className="rounded-[10px] border border-ink-100 p-3"><summary className="cursor-pointer font-semibold">Config snapshot</summary><pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify(data.config, null, 2)}</pre></details>
        </div>
      )}
    </Sheet>
  );
}
