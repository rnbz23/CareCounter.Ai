"use client";

import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import type { Analysis } from "@/types/contracts";
import { formatCents, formatDate } from "@/lib/format";
import { reviewSummary } from "@/lib/copy/patient";

export function AnalysisSummary({ analysis }: { analysis: Analysis }) {
  const [shownCents, setShownCents] = useState(0);

  useEffect(() => {
    const target = analysis.totalBilledCents;
    const start = performance.now();
    const duration = 750;
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShownCents(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [analysis.totalBilledCents]);

  return (
    <section className="cc-fade-up relative min-w-0 overflow-hidden rounded-[1.5rem] border border-ink-200/90 bg-white/95 p-5 shadow-panel sm:p-7">
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-[linear-gradient(180deg,#3b5fff_0%,#f24a1d_100%)]"
      />
      <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1 pl-2">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cobalt-700">
            <ClipboardList className="h-3.5 w-3.5" aria-hidden />
            Hospital statement review
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-navy-950 sm:text-[2.1rem]">
            {analysis.hospitalName}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Service date {formatDate(analysis.serviceDate)} · patient bill guide
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-700">
            {reviewSummary(analysis.findings.length, analysis.lineItems.length)}
          </p>
        </div>

        <div className="shrink-0 rounded-2xl bg-navy-950 px-5 py-4 text-white sm:min-w-[220px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
            Hospital billed total
          </p>
          <p className="cc-amount mt-1 font-display text-3xl font-semibold">
            {formatCents(shownCents)}
          </p>
          <p className="mt-2 text-xs leading-snug text-white/60">
            What the hospital billed — not necessarily what you personally owe.
          </p>
        </div>
      </div>
    </section>
  );
}
