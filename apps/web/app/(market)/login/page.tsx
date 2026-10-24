"use client";

import { useQueryClient } from "@tanstack/react-query";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/karu/badges";
import { OtpLogin } from "@/components/otp-login";
import { Tabs } from "@/components/ui";
import { api } from "@/lib/api";
import { usePublicConfig } from "@/lib/hooks";
import type { Me } from "@/lib/types";

declare global {
  interface Window {
    google?: { accounts: { id: { initialize: (o: Record<string, unknown>) => void; renderButton: (el: HTMLElement, o: Record<string, unknown>) => void } } };
  }
}

/** B13: phone OTP, email OTP, Google. */
export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}

function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

function Login() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const done = (r: { user: Me }) => {
    if (r.user.is_staff && next.startsWith("/admin")) router.replace("/admin");
    else router.replace(next);
  };
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-10">
      <div className="text-center">
        <Wordmark className="text-3xl" />
        <h1 className="font-display mt-4 text-3xl">{t("title")}</h1>
        <p className="text-ink-600">{t("subtitle")}</p>
      </div>
      <div className="rounded-[16px] border border-ink-100 bg-white p-5">
        <Tabs
          className="mb-5"
          value={mode}
          onChange={setMode}
          tabs={[
            { value: "phone", label: t("tab_phone") },
            { value: "email", label: t("tab_email") },
          ]}
        />
        <OtpLogin key={mode} mode={mode} onDone={done} />
        <GoogleButton onDone={done} />
      </div>
      <p className="text-center text-xs text-ink-600">{t("terms_note")}</p>
    </div>
  );
}

function GoogleButton({ onDone }: { onDone: (r: { user: Me }) => void }) {
  const t = useTranslations("auth");
  const { data: config } = usePublicConfig();
  const ref = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const qc = useQueryClient();
  const [loaded, setLoaded] = useState(false);
  const clientId = config?.google_client_id;
  useEffect(() => {
    if (!loaded || !clientId || !window.google || !ref.current) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (resp: { credential: string }) => {
        const r = await api<{ user: Me }>("/auth/google", { method: "POST", body: { id_token: resp.credential, locale } });
        qc.setQueryData(["me"], r.user);
        onDone(r);
      },
    });
    window.google.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", width: 320, locale });
  }, [loaded, clientId, locale, onDone, qc]);
  if (!clientId) return null;
  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setLoaded(true)} />
      <div className="my-5 flex items-center gap-3 text-xs text-ink-600">
        <span className="h-px flex-1 bg-ink-100" /> {t("or")} <span className="h-px flex-1 bg-ink-100" />
      </div>
      <div ref={ref} className="flex justify-center" />
    </>
  );
}
