"use client";

import { useQueryClient } from "@tanstack/react-query";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/karu/badges";
import { DeckleEdge, Emblem } from "@/components/karu/ornaments";
import { OtpLogin } from "@/components/otp-login";
import { Tabs } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { usePublicConfig } from "@/lib/hooks";
import type { Me } from "@/lib/types";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (o: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
        };
      };
    };
  }
}

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
    <div className="min-h-[85vh] grid grid-cols-1 lg:grid-cols-2 items-stretch bg-surface-alt">
      {/* 50% Start Column: Artisan Hands & Quote Scrim (Hidden on mobile or short banner) */}
      <div className="relative h-48 sm:h-64 lg:h-full min-h-[300px] overflow-hidden bg-surface-deep">
        <img
          src="/images/craft-loom.jpg"
          alt="Artisan hands weaving traditional handloom"
          className="size-full object-cover opacity-60 mix-blend-luminosity scale-105"
          onError={(e) => {
            // Graceful fallback if static asset not present
            (e.target as HTMLElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-deep via-surface-deep/40 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-between p-8 sm:p-12 text-khadi-100 z-10">
          <div className="flex items-center gap-2">
            <Emblem className="size-8 text-gold-400" />
            <span className="font-serif text-lg tracking-wider">karu</span>
          </div>

          <div className="max-w-md">
            <blockquote className="font-serif italic text-h3 sm:text-h2 text-khadi-100 leading-snug">
              "When you purchase authentic handmade craft, you preserve ancestral culture and honour living hands."
            </blockquote>
            <p className="mt-3 text-caption text-gold-300 uppercase tracking-widest font-mono">
              Certified Physical Origin · Zero Pixel Hallucination
            </p>
          </div>
        </div>
      </div>

      {/* 50% End Column: Centered Login Card */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-[420px] rounded-sm border border-line bg-surface p-8 shadow-xs flex flex-col gap-6">
          <div className="text-center">
            <Wordmark className="text-2xl justify-center" />
            <h1 className="font-serif text-h2 text-ink-900 mt-3">
              {t("title") || "Welcome to Karu"}
            </h1>
            <p className="text-body-s text-muted mt-1">
              {t("subtitle") || "Sign in or create your account with a single code."}
            </p>
          </div>

          <div className="flex border-b border-line">
            <button
              type="button"
              onClick={() => setMode("phone")}
              className={`flex-1 py-2 text-center text-caption font-semibold uppercase tracking-wider transition-colors ${
                mode === "phone" ? "border-b-2 border-brand text-brand" : "text-muted hover:text-ink-900"
              }`}
            >
              {t("tab_phone") || "Phone Number"}
            </button>
            <button
              type="button"
              onClick={() => setMode("email")}
              className={`flex-1 py-2 text-center text-caption font-semibold uppercase tracking-wider transition-colors ${
                mode === "email" ? "border-b-2 border-brand text-brand" : "text-muted hover:text-ink-900"
              }`}
            >
              {t("tab_email") || "Email"}
            </button>
          </div>

          <OtpLogin key={mode} mode={mode} onDone={done} />

          <GoogleButton onDone={done} />

          <p className="text-center text-[11px] text-muted leading-relaxed pt-2 border-t border-line">
            {t("terms_note") || "By signing in, you agree to Karu's Terms of Service and Privacy Policy under DPDP compliance."}
          </p>
        </div>
      </div>
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
      <div className="my-2 flex items-center gap-3 text-caption text-muted">
        <span className="h-px flex-1 bg-line" /> {t("or") || "or continue with"} <span className="h-px flex-1 bg-line" />
      </div>
      <div ref={ref} className="flex justify-center" />
    </>
  );
}
