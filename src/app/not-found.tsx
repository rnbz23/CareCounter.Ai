import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
          CareCounter
        </p>
        <h1 className="mt-3 font-display text-3xl font-medium text-ink-950">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          That route does not exist. Return to upload a bill.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-2xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Back to upload
        </Link>
      </main>
    </div>
  );
}
