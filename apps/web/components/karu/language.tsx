"use client";

import { Check, Globe, Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { LOCALE_COOKIE, languageNames, locales, speechTags, type Locale } from "@/i18n/config";
import { api } from "@/lib/api";
import { cx } from "@/lib/format";
import { speak } from "@/lib/speech";

export async function setLocale(locale: Locale, signedIn: boolean) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${365 * 86400}; samesite=lax`;
  if (signedIn) {
    try {
      await api("/me", { method: "PATCH", body: { locale } });
    } catch {
      /* cookie alone is enough for the UI */
    }
  }
}

/** Header language switcher (artisan header / buyer header + footer). */
export function LanguageSwitcher({ signedIn, className }: { signedIn: boolean; className?: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  const router = useRouter();
  return (
    <label className={cx("relative inline-flex items-center gap-1.5 rounded-full border border-ink-300 bg-white ps-2.5 pe-1 text-sm", className)}>
      <Globe className="size-4 text-ink-600" aria-hidden />
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        onChange={async (e) => {
          await setLocale(e.target.value as Locale, signedIn);
          router.refresh();
        }}
        className="min-h-9 appearance-none bg-transparent pe-2 font-medium focus:outline-none"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {languageNames[l].native}
          </option>
        ))}
      </select>
    </label>
  );
}

/** A01: big tiles, name in its own script + English; tapping plays a greeting in that language. */
export function LanguageTiles({ onPick, signedIn }: { onPick: (l: Locale) => void; signedIn: boolean }) {
  const current = useLocale() as Locale;
  const [chosen, setChosen] = useState<Locale | null>(null);
  return (
    <div className="grid grid-cols-2 gap-3">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          dir={l === "ur" ? "rtl" : "ltr"}
          onClick={async () => {
            setChosen(l);
            speak(languageNames[l].greeting, speechTags[l]);
            await setLocale(l, signedIn);
            onPick(l);
          }}
          className={cx(
            "flex min-h-24 flex-col items-start justify-between rounded-[16px] border-2 bg-white p-4 text-start transition-colors",
            (chosen || current) === l ? "border-indigo-900 bg-indigo-50" : "border-ink-100 hover:border-indigo-900/40",
          )}
        >
          <span className="flex w-full items-center justify-between">
            <span className="text-2xl font-semibold text-ink-900">{languageNames[l].native}</span>
            {(chosen || current) === l ? <Check className="size-5 text-indigo-900" /> : <Volume2 className="size-5 text-ink-300" />}
          </span>
          <span className="text-sm text-ink-600" lang="en" dir="ltr">
            {languageNames[l].english}
          </span>
        </button>
      ))}
    </div>
  );
}
