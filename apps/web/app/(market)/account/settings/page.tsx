"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { LanguageSwitcher } from "@/components/karu/language";
import { useToast } from "@/components/toast";
import { Button, Card, Sheet, Switch } from "@/components/ui";
import { api } from "@/lib/api";
import type { Me } from "@/lib/types";

export default function SettingsPage() {
  return <AuthGate>{(me) => <BuyerSettings me={me} />}</AuthGate>;
}

/** Buyer settings: notifications, language, DPDP data export and account deletion. */
function BuyerSettings({ me }: { me: Me }) {
  const t = useTranslations("settings");
  const qc = useQueryClient();
  const toast = useToast();
  const router = useRouter();
  const [prefs, setPrefs] = useState(me.notification_prefs);
  const [confirm, setConfirm] = useState(false);
  const save = async (next: Record<string, boolean>) => {
    setPrefs(next);
    const u = await api<Me>("/me", { method: "PATCH", body: { notification_prefs: next } });
    qc.setQueryData(["me"], u);
  };
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 pt-6">
      <h1 className="font-display text-[26px] md:text-4xl">{t("title")}</h1>
      <Card className="flex flex-col gap-5 p-5">
        <h2 className="font-semibold">{t("notifications")}</h2>
        {(["whatsapp", "sms", "email", "in_app", "followed_makers"] as const).map((k) => (
          <Switch key={k} checked={!!prefs[k]} onChange={(v) => save({ ...prefs, [k]: v })} label={t(`channel.${k}`)} />
        ))}
      </Card>
      <Card className="flex items-center justify-between p-5">
        <span className="font-semibold">{t("language")}</span>
        <LanguageSwitcher signedIn />
      </Card>
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="font-semibold">{t("your_data")}</h2>
        <p className="text-sm text-ink-600">{t("your_data_body")}</p>
        {/* API download (JSON attachment), not a page — a plain link is intended. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/api/v1/me/export" className="w-fit font-semibold text-indigo-900 underline">{t("export")}</a>
        <Button variant="danger" className="w-fit" onClick={() => setConfirm(true)}>{t("delete")}</Button>
      </Card>
      <Sheet open={confirm} onClose={() => setConfirm(false)} title={t("delete")}>
        <p className="mb-4">{t("delete_confirm")}</p>
        <Button
          variant="danger"
          block
          onClick={async () => {
            await api("/me", { method: "DELETE" });
            qc.clear();
            toast(t("deleted"));
            router.replace("/");
          }}
        >
          {t("delete_yes")}
        </Button>
      </Sheet>
    </div>
  );
}
