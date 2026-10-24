"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronRight, Heart, LogOut, MapPin, MessageSquareText, Package, Repeat, Settings, Store, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { useToast } from "@/components/toast";
import { Button, Input } from "@/components/ui";
import { api } from "@/lib/api";
import type { Me } from "@/lib/types";

export default function AccountPage() {
  return <AuthGate>{(me) => <Account me={me} />}</AuthGate>;
}

function Account({ me }: { me: Me }) {
  const t = useTranslations("account");
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState(me.display_name || "");
  const links = [
    { href: "/account/orders", icon: Package, label: t("orders") },
    { href: "/account/notifications", icon: Bell, label: t("notifications") },
    { href: "/account/wishlist", icon: Heart, label: t("wishlist") },
    { href: "/account/following", icon: Users, label: t("following") },
    { href: "/account/requests", icon: Repeat, label: t("requests") },
    { href: "/account/addresses", icon: MapPin, label: t("addresses") },
    { href: "/account/reviews", icon: MessageSquareText, label: t("reviews") },
    { href: "/account/settings", icon: Settings, label: t("settings") },
  ];
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 pt-6">
      <h1 className="font-display text-[26px] md:text-4xl">{t("title")}</h1>
      <form
        className="flex items-end gap-2 rounded-[16px] border border-ink-100 bg-white p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const u = await api<Me>("/me", { method: "PATCH", body: { display_name: name } });
          qc.setQueryData(["me"], u);
          toast(t("saved"));
        }}
      >
        <label className="flex flex-1 flex-col gap-1 text-sm font-semibold">
          {t("your_name")}
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </label>
        <Button type="submit">{t("save")}</Button>
      </form>
      <p className="text-sm text-ink-600">{me.phone_masked || me.email}</p>
      <ul className="divide-y divide-ink-100 rounded-[16px] border border-ink-100 bg-white">
        {links.map(({ href, icon: Icon, label }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-14 items-center gap-3 px-4 hover:bg-khadi-50">
              <Icon className="size-5 text-indigo-900" /> <span className="flex-1 font-medium">{label}</span> <ChevronRight className="flip-rtl size-5 text-ink-300" />
            </Link>
          </li>
        ))}
        <li>
          <Link href={me.has_artisan_profile ? "/sell" : "/sell/start"} className="flex min-h-14 items-center gap-3 px-4 hover:bg-khadi-50">
            <Store className="size-5 text-peacock-600" />
            <span className="flex-1 font-medium">{me.has_artisan_profile ? t("artisan_dashboard") : t("start_selling")}</span>
            <ChevronRight className="flip-rtl size-5 text-ink-300" />
          </Link>
        </li>
        {me.is_staff && (
          <li>
            <Link href="/admin" className="flex min-h-14 items-center gap-3 px-4 hover:bg-khadi-50">
              <Settings className="size-5" /> <span className="flex-1 font-medium">{t("staff_console")}</span>
            </Link>
          </li>
        )}
      </ul>
      <Button
        variant="tertiary"
        icon={<LogOut className="size-5" />}
        onClick={async () => {
          await api("/auth/logout", { method: "POST" });
          qc.clear();
          router.replace("/");
          router.refresh();
        }}
      >
        {t("logout")}
      </Button>
    </div>
  );
}
