import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";

export default function AnalysisNotFound() {
  return (
    <div className="min-h-screen">
      <AppHeader activeStep="understand" />
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink-950">
          Analysis not found
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          This case ID is missing or expired. Upload a bill to start again.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Back to upload
        </Link>
      </main>
    </div>
  );
}
