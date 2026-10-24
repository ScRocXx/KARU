"use client";

// Rendered outside the intl provider when a segment crashes, so copy is bilingual and static.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-3xl text-indigo-900">karu</p>
      <h1 className="font-display text-2xl">Something went wrong · कुछ गड़बड़ हो गई</h1>
      <p className="text-ink-600">Please try again. If you were listing a product, it is saved on your phone.</p>
      <button onClick={reset} className="min-h-12 rounded-[10px] bg-indigo-900 px-5 font-semibold text-white">
        Try again · फिर से कोशिश करें
      </button>
    </main>
  );
}
