"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/** Search-as-you-type with transliteration-aware suggestions ("banarasi saree" / "बनारसी साड़ी"). */
export function SearchSuggest({ initial }: { initial: string }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [debounced, setDebounced] = useState(initial);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 200);
    return () => clearTimeout(id);
  }, [q]);
  const { data } = useQuery({
    queryKey: ["suggest", debounced],
    queryFn: () => api<{ items: { type: string; slug?: string; code?: string; label: string }[] }>(`/catalog/suggest?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length >= 2,
  });
  const go = (value: string) => router.push(`/search?q=${encodeURIComponent(value)}`);
  return (
    <div className="relative">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setFocused(false);
          go(q.trim());
        }}
      >
        <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-ink-600" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={t("search_placeholder")}
          aria-label={t("search")}
          className="min-h-12 w-full rounded-full border border-ink-300 bg-white ps-12 pe-4 text-base focus:border-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-900/20"
        />
      </form>
      {focused && data && data.items.length > 0 && (
        <ul className="absolute inset-x-0 top-14 z-30 overflow-hidden rounded-[12px] border border-ink-100 bg-white shadow-[var(--shadow-soft)]" role="listbox">
          {data.items.map((s, i) => (
            <li key={i}>
              <Link
                href={s.type === "product" ? `/p/${s.code}` : s.type === "craft" ? `/craft/${s.slug}` : `/c/${s.slug}`}
                className="flex min-h-11 items-center justify-between gap-3 px-4 py-2 hover:bg-indigo-50"
              >
                <span className="truncate">{s.label}</span>
                <span className="shrink-0 text-xs uppercase tracking-wider text-ink-600">{t(`suggest_${s.type}`)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
