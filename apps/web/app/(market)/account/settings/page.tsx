"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { LanguageSwitcher } from "@/components/karu/language";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import type { Me } from "@/lib/types";

export default function SettingsPage() {
  return <AuthGate>{(me) => <BuyerSettings me={me} />}</AuthGate>;
}

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
    <div className="flex flex-col gap-6">
      <div className="border-b border-line pb-4">
        <h1 className="font-serif text-h2 text-ink-900">{t("title") || "Account Settings"}</h1>
        <p className="text-body-s text-muted mt-1">
          Notification channels, language preferences, and personal data controls.
        </p>
      </div>

      {/* Notifications Card */}
      <section className="rounded-sm border border-line bg-surface p-6 shadow-xs flex flex-col gap-4">
        <h2 className="font-serif text-h3 text-ink-900 border-b border-line pb-2.5">
          {t("notifications") || "Notification Channels"}
        </h2>
        {(["whatsapp", "sms", "email", "in_app", "followed_makers"] as const).map((k) => (
          <Switch
            key={k}
            checked={!!prefs[k]}
            onChange={(v) => save({ ...prefs, [k]: v })}
            label={t(`channel.${k}`) || k.replace("_", " ")}
          />
        ))}
      </section>

      {/* Language Card */}
      <section className="rounded-sm border border-line bg-surface p-6 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="font-serif text-h3 text-ink-900">{t("language") || "Language"}</h2>
          <p className="text-caption text-muted mt-0.5">Switch interface between 8 official Indian languages</p>
        </div>
        <LanguageSwitcher signedIn />
      </section>

      {/* DPDP Compliance Card */}
      <section className="rounded-sm border border-line bg-surface p-6 shadow-xs flex flex-col gap-3">
        <h2 className="font-serif text-h3 text-ink-900 border-b border-line pb-2.5">
          {t("your_data") || "Data & Privacy"}
        </h2>
        <p className="text-body-s text-muted leading-relaxed">
          {t("your_data_body") || "Under the Digital Personal Data Protection Act, you can export your activity record or delete your profile permanently."}
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/v1/me/export"
            className="text-body-s font-medium text-brand underline underline-offset-4 hover:text-brand-hover"
          >
            {t("export") || "Download my data (JSON)"}
          </a>
          <Button variant="danger" size="S" onClick={() => setConfirm(true)}>
            {t("delete") || "Delete account"}
          </Button>
        </div>
      </section>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirm} onClose={() => setConfirm(false)} title={t("delete") || "Delete Account"}>
        <div className="flex flex-col gap-4">
          <p className="text-body-s text-ink-800 leading-relaxed">
            {t("delete_confirm") || "Are you sure? This will permanently delete your orders history, saved addresses, and profile."}
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" size="M" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="M"
              onClick={async () => {
                await api("/me", { method: "DELETE" });
                qc.clear();
                toast(t("deleted") || "Account deleted");
                router.replace("/");
              }}
            >
              {t("delete_yes") || "Yes, delete everything"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
