"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, ClipboardList, Coins, Flag, Gauge, ListChecks, Package2, Settings2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Wordmark } from "@/components/karu/badges";
import { Emblem } from "@/components/karu/ornaments";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/button";
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

/** Staff console shell: olive-900 sidebar, gold STAFF tag, TOTP 2FA required (spec §6.5 & §7.3). */
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

  if (isLoading || !me) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <Spinner className="size-8 text-brand" />
      </div>
    );
  }

  if (!me.is_staff) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg p-10 text-center">
        <p className="font-serif text-h3 text-ink-900">Restricted Area. Karu Staff only.</p>
      </div>
    );
  }

  if (!me.amr?.includes("totp")) {
    return <TotpGate me={me} onDone={() => refetch()} />;
  }

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[240px_1fr]">
      {/* Sidebar: surface-deep (olive-900) with on-dark text */}
      <aside className="border-b border-white/10 bg-surface-deep text-khadi-100 lg:min-h-dvh lg:border-b-0 lg:border-e flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 p-4 border-b border-white/10">
            <Wordmark tone="light" />
            <span className="rounded-full bg-gold-500/20 border border-gold-500/60 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-gold-300">
              STAFF
            </span>
          </div>

          <nav className="no-scrollbar flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = href === "/admin" ? path === href : path.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cx(
                    "flex min-h-10 items-center gap-2.5 whitespace-nowrap rounded-xs px-3 text-body-s font-medium transition-colors",
                    active
                      ? "bg-olive-800 text-gold-300 font-semibold border-s-2 border-gold-400"
                      : "text-sand-300 hover:bg-olive-800/60 hover:text-white"
                  )}
                >
                  <Icon className={cx("size-4", active ? "text-gold-400" : "text-sand-400")} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden border-t border-white/10 p-4 text-caption text-sand-400 lg:block">
          <p className="font-medium text-khadi-100 truncate">{me.display_name || me.email}</p>
          <p className="text-[11px] font-mono mt-0.5 capitalize">{me.roles.filter((r) => r !== "buyer").join(" · ")}</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 p-4 lg:p-8 text-ink-900">{children}</main>
    </div>
  );
}

function TotpGate({ me, onDone }: { me: Me; onDone: () => void }) {
  const qc = useQueryClient();
  const [setup, setSetup] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 p-6 bg-bg">
      <div className="flex items-center gap-3">
        <Emblem className="size-8 text-brand" />
        <span className="font-serif text-2xl font-medium tracking-wide text-ink-900">karu</span>
        <span className="rounded-full bg-gold-500/20 border border-gold-500/60 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-gold-700">
          STAFF 2FA
        </span>
      </div>

      <div>
        <h1 className="font-serif text-h2 text-ink-900">Two-Step Verification</h1>
        <p className="text-body-s text-muted mt-1">
          Staff operations require a time-based 6-digit code from your authenticator app.
        </p>
      </div>

      {!me.totp_enabled && !setup && (
        <Button variant="primary" size="M" onClick={async () => setSetup(await api("/auth/totp/setup", { method: "POST" }))}>
          Set up authenticator
        </Button>
      )}

      {setup && (
        <Card className="flex flex-col gap-2 p-4 text-body-s bg-surface border border-line">
          <p className="text-caption text-muted">Add this key to Google Authenticator or 1Password:</p>
          <code className="break-all rounded-xs bg-surface-alt p-2.5 font-mono text-caption text-brand border border-line">{setup.secret}</code>
          <a href={setup.otpauth_url} className="font-semibold text-brand underline underline-offset-4 text-caption mt-1">
            Open in authenticator app
          </a>
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
        <Input
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          className="font-mono text-xl tracking-widest text-center"
        />
        <Button type="submit" variant="primary" size="L" disabled={code.length !== 6}>
          Verify
        </Button>
      </form>
    </div>
  );
}

export function AdminTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
      <h1 className="font-serif text-h1 text-ink-900">{children}</h1>
      {actions}
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-sm border border-line bg-surface shadow-xs">
      <table className="w-full text-start text-body-s">
        <thead className="border-b border-line bg-surface-alt text-caption font-semibold uppercase tracking-wider text-muted">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 text-start font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
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
