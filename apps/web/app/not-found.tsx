import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("errors_page");
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-3xl text-indigo-900">karu</p>
      <h1 className="font-display text-2xl">{t("not_found")}</h1>
      <p className="text-ink-600">{t("not_found_body")}</p>
      <Link href="/" className="rounded-[10px] bg-indigo-900 px-5 py-3 font-semibold text-white">{t("home")}</Link>
    </main>
  );
}
