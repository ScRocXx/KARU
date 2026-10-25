"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { RunDetailSheet } from "@/components/admin/run-detail";
import { AdminTitle, Table, useReason } from "@/components/admin/shell";
import { VerifiedBadge } from "@/components/karu/badges";
import { useToast } from "@/components/toast";
import { Button, Input, Select, Skeleton } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { inr } from "@/lib/format";
import type { ImageSet, VerificationStatus } from "@/lib/types";

interface AdminListing {
  id: string;
  code: string;
  title: string;
  status: string;
  hidden: boolean;
  verification: VerificationStatus;
  image: ImageSet | null;
  maker: { name: string; handle: string };
  price_inr: number;
  run: { id: string; score: number | null; l1: number | null; l2: number | null; l3: number | null; hard_fail: boolean; status: string } | null;
}

/** S03: search listings, hide/unhide, verification run details, revoke. */
export default function AdminListings() {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ q: "", status: "", verification: "" });
  const [run, setRun] = useState<string | null>(null);
  const reason = useReason();
  const toast = useToast();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-listings", filters],
    queryFn: () => api<{ items: AdminListing[] }>(`/admin/listings?q=${encodeURIComponent(filters.q)}&status=${filters.status}&verification=${filters.verification}`),
  });
  const act = async (path: string, label: string) => {
    const r = await reason(label);
    if (!r) return;
    try {
      await api(path, { method: "POST", body: { reason: r } });
      toast("Saved");
      void refetch();
    } catch (e) {
      toast(e instanceof ApiError ? e.code : "Error", "error");
    }
  };
  return (
    <>
      <AdminTitle>Listings</AdminTitle>
      <form className="mb-4 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); setFilters({ ...filters, q }); }}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Text or short code" className="max-w-xs" />
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-40">
          <option value="">Any status</option>
          {["draft", "published", "paused", "deleted"].map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select value={filters.verification} onChange={(e) => setFilters({ ...filters, verification: e.target.value })} className="w-44">
          <option value="">Any verification</option>
          {["verified", "not_verified", "checking", "revoked", "none"].map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Button type="submit">Filter</Button>
      </form>
      {isLoading ? <Skeleton className="h-64" /> : (
        <Table head={["Listing", "Maker", "Price", "Status", "Verification", "Scores (L1/L2/L3 → Karu)", "Actions"]}>
          {data?.items.map((l) => (
            <tr key={l.id}>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {l.image?.thumb && <img src={l.image.thumb} alt="" className="h-12 w-10 rounded object-cover" />}
                  <div><a href={`/p/${l.code}`} target="_blank" rel="noreferrer" className="font-semibold underline">{l.title}</a><p className="font-mono text-xs">{l.code}</p></div>
                </div>
              </td>
              <td className="px-3 py-2"><a href={`/m/${l.maker.handle}`} className="underline">{l.maker.name}</a></td>
              <td className="px-3 py-2">{inr(l.price_inr)}</td>
              <td className="px-3 py-2">{l.status}{l.hidden && <span className="ms-1 rounded bg-danger-600 px-1 text-xs text-white">hidden</span>}</td>
              <td className="px-3 py-2"><VerifiedBadge status={l.verification} /></td>
              <td className="px-3 py-2 font-mono text-xs">
                {l.run ? (
                  <button className="underline" onClick={() => setRun(l.run!.id)}>
                    {[l.run.l1, l.run.l2, l.run.l3].map((x) => (x === null ? "—" : Math.round(x))).join(" / ")} → {l.run.score === null ? "—" : l.run.score.toFixed(1)} {l.run.hard_fail && "⚠"}
                  </button>
                ) : "—"}
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {l.hidden ? <Button size="S" variant="secondary" onClick={() => act(`/admin/listings/${l.id}/unhide`, "Unhide listing")}>Unhide</Button> : <Button size="S" variant="secondary" onClick={() => act(`/admin/listings/${l.id}/hide`, "Hide listing")}>Hide</Button>}
                  {l.verification === "verified" && <Button size="S" variant="danger" onClick={() => act(`/admin/listings/${l.id}/revoke-verification`, "Revoke verification")}>Revoke</Button>}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
      <RunDetailSheet runId={run} onClose={() => setRun(null)} />
    </>
  );
}
