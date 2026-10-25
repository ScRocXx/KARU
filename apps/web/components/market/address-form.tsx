"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Banner, Button, Field, Input } from "@/components/ui";
import { ApiError, api } from "@/lib/api";

export interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pin: string;
  country: string;
  is_default: boolean;
}

export function AddressForm({ initial, onSaved }: { initial?: Address; onSaved: (a: Address) => void }) {
  const t = useTranslations("address");
  const [f, setF] = useState({
    name: initial?.name || "", phone: initial?.phone || "", line1: initial?.line1 || "", line2: initial?.line2 || "",
    city: initial?.city || "", state: initial?.state || "", pin: initial?.pin || "", country: initial?.country || "IN",
    is_default: initial?.is_default || false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const saved = initial
            ? await api<Address>(`/addresses/${initial.id}`, { method: "PATCH", body: f })
            : await api<Address>("/addresses", { method: "POST", body: f });
          onSaved(saved);
        } catch (err) {
          setError(err instanceof ApiError ? t(`errors.${err.code === "invalid_pin" || err.code === "invalid_phone" ? err.code : "generic"}`) : t("errors.generic"));
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && <Banner tone="danger">{error}</Banner>}
      <Field label={t("name")} htmlFor="a-name"><Input id="a-name" required value={f.name} onChange={set("name")} autoComplete="name" /></Field>
      <Field label={t("phone")} htmlFor="a-phone"><Input id="a-phone" required inputMode="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" /></Field>
      <Field label={t("line1")} htmlFor="a-l1"><Input id="a-l1" required value={f.line1} onChange={set("line1")} autoComplete="address-line1" /></Field>
      <Field label={t("line2")} htmlFor="a-l2"><Input id="a-l2" value={f.line2} onChange={set("line2")} autoComplete="address-line2" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("city")} htmlFor="a-city"><Input id="a-city" required value={f.city} onChange={set("city")} autoComplete="address-level2" /></Field>
        <Field label={t("pin")} htmlFor="a-pin"><Input id="a-pin" required inputMode="numeric" value={f.pin} onChange={set("pin")} autoComplete="postal-code" /></Field>
      </div>
      <Field label={t("state")} htmlFor="a-state"><Input id="a-state" required value={f.state} onChange={set("state")} autoComplete="address-level1" /></Field>
      <label className="flex items-center gap-2 text-body-s">
        <input type="checkbox" className="size-5 accent-brand" checked={f.is_default} onChange={(e) => setF({ ...f, is_default: e.target.checked })} />
        {t("default")}
      </label>
      <Button type="submit" size="L" loading={busy}>{t("save")}</Button>
    </form>
  );
}
