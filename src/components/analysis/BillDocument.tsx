"use client";

import { useEffect, useMemo } from "react";
import type { Analysis, FocusTarget } from "@/types/contracts";
import { formatCents, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TOTAL_ID = "conversation-bill-total";

function lineIdsForFocus(
  analysis: Analysis,
  activeFocus: FocusTarget | null,
): string[] {
  if (!activeFocus) return [];

  if (activeFocus.targetType === "line_item") {
    return [activeFocus.targetId];
  }

  if (activeFocus.targetType === "finding") {
    return (
      analysis.findings.find((finding) => finding.id === activeFocus.targetId)
        ?.lineItemIds ?? []
    );
  }

  return [];
}

/**
 * Reading view of the extracted statement.
 *
 * The upload itself is not kept after extraction, so this reconstructs the
 * bill from the canonical line items. It is deliberately styled as a paper
 * statement so the agent's focus has somewhere physical to point.
 */
export function BillDocument({
  analysis,
  activeFocus,
}: {
  analysis: Analysis;
  activeFocus: FocusTarget | null;
}) {
  const activeLineIds = useMemo(
    () => lineIdsForFocus(analysis, activeFocus),
    [activeFocus, analysis],
  );
  const primaryLineId = activeLineIds[0] ?? null;
  const paymentActive = activeFocus?.targetType === "payment";

  useEffect(() => {
    const targetId = paymentActive
      ? TOTAL_ID
      : primaryLineId
        ? `conversation-bill-${primaryLineId}`
        : null;
    if (!targetId) return;
    document
      .getElementById(targetId)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [paymentActive, primaryLineId]);

  return (
    <section
      aria-label="Your bill, shown beside the guide"
      className="flex h-full min-h-0 flex-col gap-3"
    >
      <div className="flex shrink-0 items-end justify-between gap-4 px-1 text-white">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8ed3d0]">
            Live bill review
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-white">
            Your bill, beside the guide
          </h2>
        </div>
        <p className="hidden max-w-[260px] text-right text-[11px] leading-snug text-white/60 sm:block">
          The highlighted charge follows what the guide is explaining.
        </p>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] bg-[#fffdf8] shadow-[0_30px_90px_rgba(2,10,12,0.35)] ring-1 ring-black/10">
        <div className="h-1.5 shrink-0 bg-[linear-gradient(90deg,#0f8f96_0%,#8dc9be_52%,#e4572e_100%)]" />

        <header className="shrink-0 border-b border-[#e7dfcf] px-5 py-4 sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7d68]">
                Hospital statement
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold tracking-tight text-[#18201f] sm:text-2xl">
                {analysis.hospitalName}
              </h3>
              <p className="mt-1 text-xs text-[#7b7060]">
                Service date {formatDate(analysis.serviceDate)} ·{" "}
                {analysis.inputType.toUpperCase()}
              </p>
            </div>
            <div className="rounded-xl bg-[#0b2630] px-4 py-3 text-white shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                Total billed
              </p>
              <p className="cc-amount mt-0.5 font-display text-lg font-semibold sm:text-xl">
                {formatCents(analysis.totalBilledCents)}
              </p>
            </div>
          </div>
        </header>

        <div className="cc-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#e7dfcf] text-[10px] uppercase tracking-[0.12em] text-[#8a7d68]">
              <tr>
                <th className="px-2 py-2 font-semibold">Service</th>
                <th className="px-2 py-2 font-semibold">Code</th>
                <th className="px-2 py-2 font-semibold">Qty</th>
                <th className="px-2 py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {analysis.lineItems.map((item) => {
                const isActive = activeLineIds.includes(item.id);
                const isPrimary = primaryLineId === item.id;
                return (
                  <tr
                    key={item.id}
                    id={`conversation-bill-${item.id}`}
                    aria-current={isPrimary ? "true" : undefined}
                    className={cn(
                      "relative border-b border-[#eee6d8] transition-[background-color,box-shadow] duration-300",
                      isActive
                        ? "cc-bill-line-active bg-[#0f8f96]/[0.12] shadow-[inset_3px_0_0_#0f8f96]"
                        : "hover:bg-[#f6f0e5]",
                    )}
                  >
                    <td className="px-2 py-3 align-top">
                      <p className="font-medium leading-snug text-[#18201f]">
                        {item.description}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#8a7d68]">
                        {formatDate(item.serviceDate)}
                      </p>
                      {isActive ? (
                        <span
                          className={cn(
                            "mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            isPrimary
                              ? "bg-[#0d737a] text-white"
                              : "bg-white text-[#0d737a] ring-1 ring-[#0f8f96]/20",
                          )}
                        >
                          {isPrimary ? (
                            <span
                              aria-hidden="true"
                              className="cc-speaking-dot h-1.5 w-1.5 rounded-full bg-white"
                            />
                          ) : null}
                          {isPrimary ? "Guide is explaining" : "Related charge"}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-3 align-top text-[#7b7060]">
                      {item.code ?? "—"}
                    </td>
                    <td className="px-2 py-3 align-top text-[#7b7060]">
                      {item.quantity}
                    </td>
                    <td className="cc-amount px-2 py-3 text-right align-top font-semibold text-[#18201f]">
                      {formatCents(item.billedCents)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer
          id={TOTAL_ID}
          className={cn(
            "shrink-0 border-t border-[#e7dfcf] px-5 py-4 transition-[background-color,box-shadow] duration-300 sm:px-7",
            paymentActive
              ? "cc-bill-total-active bg-[#0f8f96]/[0.1] shadow-[inset_3px_0_0_#0f8f96]"
              : "bg-[#faf6ed]",
          )}
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7d68]">
                Total billed
              </p>
              <p className="mt-1 text-[11px] text-[#8a7d68]">
                Rebuilt from the charges read from your upload.
              </p>
            </div>
            <p className="cc-amount font-display text-xl font-semibold text-[#18201f]">
              {formatCents(analysis.totalBilledCents)}
            </p>
          </div>
          {paymentActive ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#0d737a] px-2.5 py-1 text-[10px] font-semibold text-white">
              <span
                aria-hidden="true"
                className="cc-speaking-dot h-1.5 w-1.5 rounded-full bg-white"
              />
              Guide is explaining the payment picture
            </p>
          ) : null}
        </footer>
      </div>
    </section>
  );
}
