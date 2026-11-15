import type { Evidence } from "@/types/contracts";
import { formatCents } from "@/lib/format";
import { ExternalLink } from "lucide-react";

export function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const retrieved = new Date(evidence.retrievedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-xl border border-ink-200 bg-white px-3.5 py-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-navy-950">{evidence.title}</p>
          <p className="mt-1 text-xs text-ink-500">
            Source checked {retrieved}
            {evidence.amountCents !== null
              ? ` · Reference amount ${formatCents(evidence.amountCents)}`
              : ""}
          </p>
          <p className="mt-1 text-xs text-ink-600">
            This supports a comparison only. It is not a guaranteed price you should have received.
          </p>
          {evidence.note ? (
            <p className="mt-1 text-xs text-ink-600">{evidence.note}</p>
          ) : null}
        </div>
        <a
          href={evidence.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-cobalt-700 hover:underline"
        >
          View source
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}
