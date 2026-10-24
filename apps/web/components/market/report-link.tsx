"use client";

import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useToast } from "@/components/toast";
import { Button, Field, Select, Sheet, Textarea } from "@/components/ui";
import { api } from "@/lib/api";

export function ReportLink({ targetType, targetId }: { targetType: "listing" | "karu_id" | "user" | "review"; targetId: string }) {
  const t = useTranslations("report");
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("suspected_fake");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex w-fit items-center gap-1.5 text-sm text-ink-600 hover:text-danger-600 hover:underline">
        <Flag className="size-4" /> {t("link")}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t("title")}>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api("/reports", { method: "POST", body: { target_type: targetType, target_id: targetId, reason, details: details || null } });
              toast(t("thanks"));
              setOpen(false);
            } catch {
              toast(t("error"), "error");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label={t("reason")} htmlFor="rp-r">
            <Select id="rp-r" value={reason} onChange={(e) => setReason(e.target.value)}>
              {["suspected_fake", "wrong_info", "copyright", "prohibited", "child_labour", "other"].map((r) => (
                <option key={r} value={r}>
                  {t(`reasons.${r}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("details")} htmlFor="rp-d">
            <Textarea id="rp-d" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={2000} />
          </Field>
          <Button type="submit" loading={busy}>
            {t("send")}
          </Button>
        </form>
      </Sheet>
    </>
  );
}
