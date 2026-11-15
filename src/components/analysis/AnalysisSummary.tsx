"use client";

import { useEffect, useState } from "react";
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
    <section className="cc-fade-up min-w-0 overflow-hidden rounded-[1.5rem] border border-ink-200 bg-white p-5 shadow-panel sm:p-7">
      <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0d737a]">
            Your bill review
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-navy-950 sm:text-[2.1rem]">
            {analysis.hospitalName}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Bill date {formatDate(analysis.serviceDate)}
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-700">
            {reviewSummary(analysis.findings.length, analysis.lineItems.length)}
          </p>
        </div>

        <div className="shrink-0 rounded-2xl bg-navy-950 px-5 py-4 text-white sm:min-w-[220px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
            Hospital bill total
          </p>
          <p className="cc-amount mt-1 font-display text-3xl font-semibold">
            {formatCents(shownCents)}
          </p>
          <p className="mt-2 text-xs leading-snug text-white/60">
            This is what the hospital billed — not necessarily what you personally owe.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-paper-rule pt-5 sm:grid-cols-4">
        <Meta label="Charges reviewed" value={`${analysis.lineItems.length}`} />
        <Meta label="Findings" value={`${analysis.findings.length}`} />
        <Meta
          label="Worth checking first"
          value={`${analysis.findings.filter((f) => f.severity === "priority").length}`}
        />
        <Meta
          label="Assistance ideas"
          value={`${analysis.assistanceOptions.length}`}
        />
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-paper-muted px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-semibold text-navy-950">{value}</p>
    </div>
  );
}
