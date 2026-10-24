"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Banner, Button, Field, Input } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { cx } from "@/lib/format";
import type { Me } from "@/lib/types";

interface SendResult {
  sent: boolean;
  channel: "sms" | "email";
  resend_after_s: number;
  dev_code?: string;
}

/** A02/A03 and B13: phone (+91 default) or email → 6-digit code; Web OTP autofill on Android. */
export function OtpLogin({ mode = "phone", big, onDone }: { mode?: "phone" | "email"; big?: boolean; onDone: (r: { user: Me; is_new: boolean }) => void }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const qc = useQueryClient();
  const [step, setStep] = useState<"dest" | "code">("dest");
  const [dest, setDest] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const body = () => (mode === "phone" ? { phone: dest.startsWith("+") ? dest : `+91${dest.replace(/\D/g, "")}` } : { email: dest.trim() });

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<SendResult>("/auth/otp/send", { method: "POST", body: { ...body(), locale } });
      setStep("code");
      setWait(r.resend_after_s);
      setDevCode(r.dev_code || null);
      setTimeout(() => codeRef.current?.focus(), 50);
      if (mode === "phone" && "OTPCredential" in window) {
        const ac = new AbortController();
        setTimeout(() => ac.abort(), 120_000);
        navigator.credentials
          .get({ otp: { transport: ["sms"] }, signal: ac.signal } as CredentialRequestOptions)
          .then((cred) => {
            const c = (cred as unknown as { code?: string })?.code;
            if (c) {
              setCode(c);
              void verify(c);
            }
          })
          .catch(() => undefined);
      }
    } catch (e) {
      setError(t(`errors.${e instanceof ApiError ? mapError(e.code) : "generic"}`));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ user: Me; is_new: boolean }>("/auth/otp/verify", { method: "POST", body: { ...body(), code: value, locale } });
      qc.setQueryData(["me"], r.user);
      onDone(r);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "generic";
      const left = e instanceof ApiError ? (e.details.attempts_left as number | undefined) : undefined;
      setError(code === "otp_wrong_code" && left !== undefined ? t("errors.wrong_code_left", { n: left }) : t(`errors.${mapError(code)}`));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const size = big ? "L" : "M";
  return (
    <div className="flex flex-col gap-4">
      {error && <Banner tone="danger">{error}</Banner>}
      {step === "dest" ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          {mode === "phone" ? (
            <Field label={t("phone_label")} htmlFor="otp-phone" hint={t("phone_hint")}>
              <div className="flex gap-2" dir="ltr">
                <span className={cx("flex items-center rounded-[8px] border border-ink-300 bg-ink-100 px-3 font-semibold", big ? "text-xl" : "")}>+91</span>
                <Input
                  id="otp-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  required
                  value={dest}
                  onChange={(e) => setDest(e.target.value.replace(/\D/g, ""))}
                  className={big ? "text-2xl tracking-widest" : "text-lg tracking-wider"}
                  placeholder="98765 43210"
                />
              </div>
            </Field>
          ) : (
            <Field label={t("email_label")} htmlFor="otp-email">
              <Input id="otp-email" type="email" autoComplete="email" required value={dest} onChange={(e) => setDest(e.target.value)} />
            </Field>
          )}
          <Button type="submit" size={size} loading={busy} disabled={mode === "phone" ? dest.length !== 10 : !dest.includes("@")}>
            {t("send_code")}
          </Button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
        >
          <p className="text-ink-600">{t("code_sent_to", { dest: mode === "phone" ? `+91 ${dest}` : dest })}</p>
          {devCode && (
            <Banner tone="warn" action={<Button size="S" variant="secondary" onClick={() => { setCode(devCode); void verify(devCode); }}>{t("use_code")}</Button>}>
              {t("dev_code", { code: devCode })}
            </Banner>
          )}
          <Field label={t("code_label")} htmlFor="otp-code">
            <Input
              id="otp-code"
              ref={codeRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              dir="ltr"
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
                if (v.length === 6) void verify(v);
              }}
              className="text-center font-mono text-3xl tracking-[0.5em]"
            />
          </Field>
          <Button type="submit" size={size} loading={busy} disabled={code.length !== 6}>
            {t("verify")}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" className="font-semibold text-indigo-900 underline" onClick={() => setStep("dest")}>
              {t("change")}
            </button>
            <button type="button" className="font-semibold text-indigo-900 underline disabled:text-ink-300 disabled:no-underline" disabled={wait > 0 || busy} onClick={() => void send()}>
              {wait > 0 ? t("resend_in", { s: wait }) : t("resend")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function mapError(code: string): string {
  const known = ["invalid_phone", "invalid_email", "otp_rate_limited", "resend_too_soon", "otp_expired", "otp_too_many_attempts", "otp_not_found", "account_suspended", "account_deleted", "otp_wrong_code"];
  return known.includes(code) ? code : "generic";
}
