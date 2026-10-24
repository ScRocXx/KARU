"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminTitle } from "@/components/admin/shell";
import { useToast } from "@/components/toast";
import { Banner, Button, Card, Skeleton, Tabs, Textarea } from "@/components/ui";
import { ApiError, api } from "@/lib/api";

const KEYS = ["verification.v1", "pricing.v1", "commerce.v1", "limits.v1", "budgets.v1", "costs.v1", "passport.v1", "flags", "categories.v1"];

/** S06: verification weights/thresholds, new-artisan L2 constant, price bands, flags; re-score without new AI calls. */
export default function AdminConfig() {
  const [key, setKey] = useState("verification.v1");
  const toast = useToast();
  const { data, refetch } = useQuery({ queryKey: ["admin-config", key], queryFn: () => api<{ key: string; value: unknown; default: unknown }>(`/admin/config/${key}`) });
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rescore, setRescore] = useState<{ changes: { code: string; old: { score: number; verdict: string }; new: { score: number; verdict: string } }[]; evaluated: number; applied: boolean } | null>(null);
  const value = text ?? (data ? JSON.stringify(data.value, null, 2) : "");
  return (
    <>
      <AdminTitle>Config</AdminTitle>
      <Tabs className="mb-4" value={key} onChange={(k) => { setKey(k); setText(null); setError(null); setRescore(null); }} tabs={KEYS.map((k) => ({ value: k, label: k }))} />
      {!data ? <Skeleton className="h-64" /> : (
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Card className="flex flex-col gap-3 p-4">
            {error && <Banner tone="danger">{error}</Banner>}
            <Textarea value={value} onChange={(e) => setText(e.target.value)} className="min-h-[420px] font-mono text-xs" spellCheck={false} />
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  setError(null);
                  let parsed: unknown;
                  try {
                    parsed = JSON.parse(value);
                  } catch {
                    return setError("Not valid JSON");
                  }
                  const reason = window.prompt("Reason for this change (audit log):");
                  if (!reason || reason.trim().length < 3) return;
                  try {
                    await api(`/admin/config/${key}`, { method: "PUT", body: { value: parsed, reason } });
                    toast("Saved");
                    setText(null);
                    void refetch();
                  } catch (e) {
                    setError(e instanceof ApiError ? e.code : "Error");
                  }
                }}
              >
                Save
              </Button>
              <Button variant="tertiary" onClick={() => setText(JSON.stringify(data.default, null, 2))}>Load defaults</Button>
            </div>
          </Card>
          {key === "verification.v1" && (
            <Card className="flex flex-col gap-3 p-4 text-sm">
              <h2 className="font-semibold">Re-score with current config</h2>
              <p className="text-ink-600">Uses stored layer scores (no new AI calls). Changing config doesn&apos;t re-verify automatically.</p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={async () => setRescore(await api("/admin/config/verification/rescore", { method: "POST", body: { apply: false } }))}>Preview</Button>
                <Button
                  variant="danger"
                  onClick={async () => {
                    const reason = window.prompt("Apply new verdicts? Reason:");
                    if (reason) setRescore(await api("/admin/config/verification/rescore", { method: "POST", body: { apply: true, reason } }));
                  }}
                >
                  Apply
                </Button>
              </div>
              {rescore && (
                <div>
                  <p>{rescore.evaluated} listings evaluated · {rescore.changes.length} verdict changes {rescore.applied ? "(applied)" : "(preview)"}</p>
                  <ul className="mt-2 flex flex-col gap-1 font-mono text-xs">
                    {rescore.changes.map((c) => <li key={c.code}>{c.code}: {c.old.verdict} {c.old.score} → {c.new.verdict} {c.new.score}</li>)}
                  </ul>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </>
  );
}
