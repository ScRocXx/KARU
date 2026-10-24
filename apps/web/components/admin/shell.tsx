"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, ClipboardList, Coins, Flag, Gauge, ListChecks, Package2, Settings2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Wordmark } from "@/components/karu/badges";
import { Banner, Button, Card, Input, Spinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { cx } from "@/lib/format";
import type { Me } from "@/lib/types";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: Package2 },
  { href: "/admin/queue", label: "Verification queue", icon: ListChecks },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/bulk", label: "Bulk requests", icon: ClipboardList },
  { href: "/admin/config", label: "Config", icon: Settings2 },
  { href: "/admin/costs", label: "TinyFish & AI costs", icon: Coins },
  { href: "/admin/audit", label: "Audit log", icon: BarChart3 },
];

/** Staff console shell: staff role + TOTP 2FA required for every page (Part 2 §11.1). */
export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { data: me, isLoading, refetch } = useQuery({
    queryKey: ["me", "admin"],
    queryFn: async () => {
      try {
        return await api<Me>("/me");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
  });
  useEffect(() => {
    if (!isLoading && !me) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [isLoading, me, router, path]);
  if (isLoading || !me) return <div className="flex min-h-dvh items-center justify-center"><Spinner /></div>;
  if (!me.is_staff) return <p className="p-10 text-center">Staff only.</p>;
  if (!me.amr?.includes("totp")) return <TotpGate me={me} onDone={() => refetch()} />;
  return (
    <div className="min-h-dvh bg-khadi-50 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-ink-100 bg-white lg:min-h-dvh lg:border-b-0 lg:border-e">
        <div className="flex items-center gap-2 p-4">
          <Wordmark />
          <span className="rounded-full bg-terracotta-600 px-2 text-xs font-bold text-white">STAFF</span>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:overflow-visible">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cx("flex min-h-10 items-center gap-2 whitespace-nowrap rounded-[8px] px-3 text-sm font-medium", (href === "/admin" ? path === href : path.startsWith(href)) ? "bg-indigo-900 text-white" : "hover:bg-indigo-50")}>
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
        <p className="hidden px-4 py-3 text-xs text-ink-600 lg:block">{me.display_name || me.email} · {me.roles.filter((r) => r !== "buyer").join(", ")}</p>
      </aside>
      <main className="min-w-0 p-4 lg:p-8">{children}</main>
    </div>
  );
}

function TotpGate({ me, onDone }: { me: Me; onDone: () => void }) {
  const qc = useQueryClient();
  const [setup, setSetup] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <Wordmark />
      <h1 className="font-display text-2xl">Two-step verification</h1>
      <p className="text-ink-600">The staff console needs a code from your authenticator app.</p>
      {!me.totp_enabled && !setup && (
        <Button onClick={async () => setSetup(await api("/auth/totp/setup", { method: "POST" }))}>Set up authenticator</Button>
      )}
      {setup && (
        <Card className="flex flex-col gap-2 p-4 text-sm">
          <p>Add this key to Google Authenticator, Authy or 1Password:</p>
          <code className="break-all rounded bg-ink-100 p-2 font-mono">{setup.secret}</code>
          <a href={setup.otpauth_url} className="font-semibold text-indigo-900 underline">Open in authenticator app</a>
        </Card>
      )}
      {error && <Banner tone="danger">{error}</Banner>}
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            await api("/auth/totp/verify", { method: "POST", body: { code } });
            await qc.invalidateQueries({ queryKey: ["me"] });
            onDone();
          } catch {
            setError("That code didn't work. Check the time on your phone and try again.");
          }
        }}
      >
        <Input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" className="font-mono text-xl tracking-widest" />
        <Button type="submit" disabled={code.length !== 6}>Verify</Button>
      </form>
    </div>
  );
}

export function AdminTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-display text-3xl">{children}</h1>
      {actions}
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[12px] border border-ink-100 bg-white">
      <table className="w-full text-start text-sm">
        <thead className="bg-khadi-50 text-xs uppercase tracking-wider text-ink-600">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2 text-start font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-ink-100">{children}</tbody>
      </table>
    </div>
  );
}

export function useReason(): (label: string) => string | null {
  return (label: string) => {
    const r = window.prompt(`${label}\n\nReason (required, saved to the audit log):`);
    return r && r.trim().length >= 3 ? r.trim() : null;
  };
}
