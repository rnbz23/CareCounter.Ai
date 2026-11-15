import type { Evidence, Finding, FocusTarget, LineItem } from "@/types/contracts";
import { formatCents } from "@/lib/format";
import {
  patientAskAction,
  patientFindingTitle,
  patientFindingWhy,
  severityLabel,
} from "@/lib/copy/patient";
import { HighlightableTarget } from "./HighlightableTarget";
import { EvidenceCard } from "./EvidenceCard";

export function FindingCard({
  finding,
  lineItems,
  evidence,
  activeFocus,
  onActivate,
  index = 0,
}: {
  finding: Finding;
  lineItems: LineItem[];
  evidence: Evidence[];
  activeFocus: FocusTarget | null;
  onActivate?: (focus: FocusTarget) => void;
  index?: number;
}) {
  const relatedLines = lineItems.filter((item) =>
    finding.lineItemIds.includes(item.id),
  );
  const relatedEvidence = evidence.filter((item) =>
    finding.evidenceIds.includes(item.id),
  );
  const isIllustrative =
    finding.type === "hospital_price_difference" &&
    finding.evidenceIds.length === 0;
  const isActive =
    activeFocus?.targetType === "finding" &&
    activeFocus.targetId === finding.id;

  const title = patientFindingTitle(finding, lineItems);
  const why = patientFindingWhy(finding, lineItems);
  const ask = patientAskAction(finding);

  return (
    <HighlightableTarget
      targetType="finding"
      targetId={finding.id}
      activeFocus={activeFocus}
      onActivate={onActivate}
      className="p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d737a] text-sm font-semibold text-white">
          {index + 1}
        </span>
        <span className="rounded-md bg-[#0f8f96]/12 px-2 py-0.5 text-[11px] font-semibold text-[#0d737a]">
          {severityLabel(finding.severity)}
        </span>
        {isIllustrative ? (
          <span className="rounded-md bg-paper-muted px-2 py-0.5 text-[11px] font-medium text-ink-500">
            Demo reference
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-navy-950 sm:text-[1.35rem]">
        {title}
      </h3>

      {finding.billedCents !== null ? (
        <p className="cc-amount mt-2 text-sm font-semibold text-navy-900">
          Amount involved: {formatCents(finding.billedCents)}
          {finding.referenceCents !== null
            ? ` · Public reference: ${formatCents(finding.referenceCents)}`
            : ""}
        </p>
      ) : null}

      <div className="mt-4 rounded-xl bg-paper-muted px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
          Why we&apos;re showing this
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{why}</p>
      </div>

      <div className="mt-4 rounded-xl border border-[#0f8f96]/25 bg-[#0f8f96]/06 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0d737a]">
          What you can ask
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-navy-950">{ask}</p>
      </div>

      {relatedLines.length > 0 ? (
        <ul className="mt-4 space-y-1.5 text-sm text-ink-600">
          {relatedLines.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>{item.description}</span>
              <span className="cc-amount shrink-0 font-semibold text-navy-950">
                {formatCents(item.billedCents)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        data-cursor="finding"
        className="cc-pressable mt-5 inline-flex rounded-xl bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-900"
        onClick={(event) => {
          event.stopPropagation();
          onActivate?.({ targetType: "finding", targetId: finding.id });
        }}
      >
        Understand this charge
      </button>

      {isActive ? (
        <div className="cc-evidence-open mt-5 border-t border-paper-rule pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0d737a]">
            Supporting information
          </p>
          {relatedEvidence.length > 0 ? (
            <div className="mt-3 space-y-2">
              {relatedEvidence.map((item) => (
                <EvidenceCard key={item.id} evidence={item} />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-500">
              {isIllustrative
                ? "This demo uses an illustrative reference. A public source link is not attached yet."
                : "No public source is attached yet."}
            </p>
          )}
        </div>
      ) : null}
    </HighlightableTarget>
  );
}
