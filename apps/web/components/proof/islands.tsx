"use client";

// Tiny client islands for the QR proof page: no React Query, no client i18n bundle — strings come as props.
import { useEffect, useRef, useState } from "react";
import { languageNames, locales, LOCALE_COOKIE, type Locale } from "@/i18n/config";

export function ScanBeacon({ type, code }: { type: "karu_id" | "listing"; code: string }) {
  useEffect(() => {
    const body = JSON.stringify({ type, code });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/v1/scans", new Blob([body], { type: "application/json" }));
    else void fetch("/api/v1/scans", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  }, [type, code]);
  return null;
}

/** "Owned by you since …" needs the viewer's session; the cached page stays anonymous. */
export function OwnedByYou({ code, label }: { code: string; label: string }) {
  const [owned, setOwned] = useState(false);
  useEffect(() => {
    if (!document.cookie.includes("karu_csrf")) return;
    fetch(`/api/v1/karu-ids/${code}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.owned_by_viewer) return;
        setOwned(true);
        // The cached page is anonymous; the owner doesn't need the "already sold" warning.
        document.getElementById("kid-sold-notice")?.setAttribute("hidden", "");
      })
      .catch(() => undefined);
  }, [code]);
  if (!owned) return null;
  return <p className="mt-3 rounded-[10px] bg-peacock-50 px-3 py-2 text-sm font-semibold text-peacock-600">{label}</p>;
}

export function TapToPlayVideo({ url, poster, label }: { url: string; poster: string | null; label: string }) {
  const [play, setPlay] = useState(false);
  if (play) return <video src={url} poster={poster || undefined} controls autoPlay playsInline className="aspect-video w-full rounded-[12px] bg-black" />;
  return (
    <button
      type="button"
      onClick={() => setPlay(true)}
      className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[12px] bg-indigo-900 text-white"
    >
      {poster && <img src={poster} alt="" className="absolute inset-0 size-full object-cover opacity-70" loading="lazy" />}
      <span className="relative flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 font-semibold">▶ {label}</span>
    </button>
  );
}

export function VoiceClip({ url, label }: { url: string; label: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => (ref.current?.paused ? void ref.current.play() : ref.current?.pause())}
        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-indigo-50 px-4 text-sm font-semibold text-indigo-900"
      >
        {playing ? "❚❚" : "▶"} {label}
      </button>
      <audio ref={ref} src={url} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
    </>
  );
}

export function LangLinks({ current }: { current: string }) {
  return (
    <select
      aria-label="Language"
      value={current}
      onChange={(e) => {
        document.cookie = `${LOCALE_COOKIE}=${e.target.value}; path=/; max-age=31536000; samesite=lax`;
        window.location.reload();
      }}
      className="min-h-9 rounded-full border border-white/40 bg-transparent px-3 text-sm text-white"
    >
      {locales.map((l: Locale) => (
        <option key={l} value={l} className="text-ink-900">
          {languageNames[l].native}
        </option>
      ))}
    </select>
  );
}

export function ReportButton({ code, labels }: { code: string; labels: { link: string; sent: string; prompt: string } }) {
  const [sent, setSent] = useState(false);
  if (sent) return <p className="text-sm text-ink-600">{labels.sent}</p>;
  return (
    <button
      type="button"
      className="text-sm text-ink-600 underline hover:text-danger-600"
      onClick={async () => {
        const details = window.prompt(labels.prompt) || "";
        await fetch("/api/v1/reports", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": document.cookie.match(/karu_csrf=([^;]+)/)?.[1] || "" },
          body: JSON.stringify({ target_type: "karu_id", target_id: code, reason: "suspected_fake", details }),
        }).catch(() => undefined);
        setSent(true);
      }}
    >
      {labels.link}
    </button>
  );
}
