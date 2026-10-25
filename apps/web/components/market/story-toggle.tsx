"use client";

import { useState } from "react";
import { languageNames, type Locale } from "@/i18n/config";
import type { Localized } from "@/lib/types";

/** "Translated from Maithili · Show original" (Part 1 §8.2). */
export function StoryToggle({ localized, labels }: { localized: Localized; labels: { translated: string; show_original: string; show_translation: string } }) {
  const [original, setOriginal] = useState(false);
  const text = original && localized.original ? localized.original : localized.text;
  const lang = original ? localized.source_lang : localized.lang;
  const sourceName = languageNames[localized.source_lang as Locale]?.native || localized.source_lang;
  return (
    <div>
      <p className="whitespace-pre-line text-body leading-relaxed text-ink-900" lang={lang}>
        {text}
      </p>
      {localized.translated && localized.original && (
        <p className="mt-2 text-sm text-ink-600">
          {labels.translated.replace("{lang}", sourceName)} ·{" "}
          <button type="button" onClick={() => setOriginal(!original)} className="font-semibold text-brand hover:underline">
            {original ? labels.show_translation : labels.show_original}
          </button>
        </p>
      )}
    </div>
  );
}
