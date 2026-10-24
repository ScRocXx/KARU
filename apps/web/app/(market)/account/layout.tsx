"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Bell, Heart, LogOut, MapPin, MessageSquareText, Package, Repeat, Settings, Store, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthGate } from "@/components/auth-gate";
import { Avatar } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { cx } from "@/lib/format";
import type { Me } from "@/lib/types";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      {(me) => <AccountShell me={me}>{children}</AccountShell>}
    </AuthGate>
  );
}

function AccountShell({ me, children }: { me: Me; children: React.ReactNode }) {
  const t = useTranslations("account");
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();

  const navItems = [
    { href: "/account", label: "Overview", icon: User, exact: true },
    { href: "/account/orders", label: t("orders") || "Orders", icon: Package },
    { href: "/account/wishlist", label: t("wishlist") || "Wishlist", icon: Heart },
    { href: "/account/following", label: t("following") || "Makers Following", icon: Users },
    { href: "/account/requests", label: t("requests") || "Custom Requests", icon: Repeat },
    { href: "/account/addresses", label: t("addresses") || "Saved Addresses", icon: MapPin },
    { href: "/account/reviews", label: t("reviews") || "My Reviews", icon: MessageSquareText },
    { href: "/account/notifications", label: t("notifications") || "Notifications", icon: Bell },
    { href: "/account/settings", label: t("settings") || "Settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await api("/auth/logout", { method: "POST" });
    qc.clear();
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="container-page py-8 lg:py-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
        {/* Desktop 3-col Sidebar */}
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-28 rounded-sm border border-line bg-surface p-6 shadow-xs flex flex-col gap-6">
            {/* User Profile Summary */}
            <div className="flex items-center gap-3.5 border-b border-line pb-5">
              <Avatar name={me.display_name || "User"} size={56} />
              <div className="min-w-0 flex-1">
                <p className="font-serif text-h4 text-ink-900 truncate">
                  {me.display_name || "Artisan Patron"}
                </p>
                <p className="text-caption text-muted truncate">
                  {me.phone_masked || me.email}
                </p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "flex items-center gap-3 rounded-xs px-3 py-2.5 text-body-s font-medium transition-colors",
                      active
                        ? "bg-surface-alt text-brand font-semibold border-s-2 border-brand"
                        : "text-ink-800 hover:bg-surface-alt hover:text-ink-900"
                    )}
                  >
                    <item.icon className={cx("size-4", active ? "text-brand" : "text-muted")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="my-2 border-t border-line" />

              <Link
                href={me.has_artisan_profile ? "/sell" : "/sell/start"}
                className="flex items-center gap-3 rounded-xs px-3 py-2.5 text-body-s font-medium text-verified hover:bg-surface-alt transition-colors"
              >
                <Store className="size-4" />
                <span>{me.has_artisan_profile ? t("artisan_dashboard") || "Seller Studio" : t("start_selling") || "Sell on Karu"}</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-xs px-3 py-2.5 text-body-s font-medium text-muted hover:text-danger hover:bg-surface-alt transition-colors mt-2 text-start cursor-pointer"
              >
                <LogOut className="size-4" />
                <span>{t("logout") || "Sign out"}</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* 9-col Content Area */}
        <div className="lg:col-span-9 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
