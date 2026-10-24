"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminTitle, Table, useReason } from "@/components/admin/shell";
import { useToast } from "@/components/toast";
import { Button, Input, Select, Skeleton } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { date } from "@/lib/format";

interface AdminUser {
  id: string;
  display_name: string | null;
  email: string | null;
  roles: string[];
  status: string;
  created_at: string;
  artisan: { id: string; public_name: string; handle: string; district: string | null; state: string | null; aadhaar: string; pehchan: string; payout: string; passport: { id: string; code: string; state: string } | null } | null;
}

/** S02: search users, suspend/restore, passport overrides with a reason (audited). */
export default function AdminUsers() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [query, setQuery] = useState({ q: "", role: "" });
  const reason = useReason();
  const toast = useToast();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", query],
    queryFn: () => api<{ items: AdminUser[] }>(`/admin/users?q=${encodeURIComponent(query.q)}&role=${query.role}`),
  });
  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      toast("Saved");
      void refetch();
    } catch (e) {
      toast(e instanceof ApiError ? e.code : "Error", "error");
    }
  };
  return (
    <>
      <AdminTitle>Users</AdminTitle>
      <form className="mb-4 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); setQuery({ q, role }); }}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, handle or full phone" className="max-w-sm" />
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-40">
          <option value="">All roles</option>
          {["artisan", "buyer", "admin", "moderator", "ops"].map((r) => <option key={r}>{r}</option>)}
        </Select>
        <Button type="submit">Search</Button>
      </form>
      {isLoading ? <Skeleton className="h-64" /> : (
        <Table head={["User", "Roles", "Artisan", "Passport", "Status", "Actions"]}>
          {data?.items.map((u) => (
            <tr key={u.id}>
              <td className="px-3 py-2"><p className="font-semibold">{u.display_name || "—"}</p><p className="text-xs text-ink-600">{u.email} · {date(u.created_at)}</p></td>
              <td className="px-3 py-2">{u.roles.join(", ")}</td>
              <td className="px-3 py-2">{u.artisan ? <><a href={`/m/${u.artisan.handle}`} className="text-indigo-900 underline">{u.artisan.public_name}</a><p className="text-xs text-ink-600">{u.artisan.district}, {u.artisan.state} · Aadhaar {u.artisan.aadhaar} · Pehchan {u.artisan.pehchan} · payout {u.artisan.payout}</p></> : "—"}</td>
              <td className="px-3 py-2">{u.artisan?.passport ? <><span className="font-mono">{u.artisan.passport.code}</span><p className="text-xs">{u.artisan.passport.state}</p></> : "—"}</td>
              <td className="px-3 py-2">{u.status}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {u.status === "suspended" ? (
                    <Button size="S" variant="secondary" onClick={() => { const r = reason("Restore user"); if (r) void act(() => api(`/admin/users/${u.id}/restore`, { method: "POST", body: { reason: r } })); }}>Restore</Button>
                  ) : (
                    <Button size="S" variant="danger" onClick={() => { const r = reason("Suspend user (hides listings, holds payouts)"); if (r) void act(() => api(`/admin/users/${u.id}/suspend`, { method: "POST", body: { reason: r } })); }}>Suspend</Button>
                  )}
                  {u.artisan?.passport && (
                    <Select
                      className="!min-h-9 w-36 py-1 text-xs"
                      value=""
                      onChange={(e) => {
                        const state = e.target.value;
                        const r = state && reason(`Set passport to ${state}`);
                        if (r) void act(() => api(`/admin/passports/${u.artisan!.passport!.id}/state`, { method: "POST", body: { state, reason: r } }));
                      }}
                    >
                      <option value="">Passport…</option>
                      <option value="verified">Verify</option>
                      <option value="unverified">Unverify</option>
                      <option value="suspended">Suspend</option>
                    </Select>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
