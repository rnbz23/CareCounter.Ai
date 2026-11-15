import { cn } from "@/lib/utils";

/** Synthetic hospital statement preview — never a real patient record. */
export function BillPreviewArt({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative mx-auto w-full max-w-md select-none", className)}
      aria-hidden
    >
      <div className="cc-float relative rounded-[1.2rem] border border-ink-200/80 bg-white p-4 shadow-lift">
        <div className="flex items-center justify-between border-b border-dashed border-ink-200 pb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cobalt-600">
              Hospital statement
            </p>
            <p className="mt-1 font-display text-base font-semibold text-navy-950">
              Pacific Coast Medical Center
            </p>
            <p className="mt-0.5 text-[11px] text-ink-500">Service date · sample only</p>
          </div>
          <div className="rounded-xl bg-navy-950 px-2.5 py-1.5 text-right text-white">
            <p className="text-[10px] uppercase tracking-wide text-white/60">Billed</p>
            <p className="cc-amount text-sm font-semibold">$2,110.00</p>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          <Row label="Chest X-ray, 2 views" code="CPT 71046" amount="$950.00" hot />
          <Row label="Metabolic panel" code="CPT 80053" amount="$180.00" />
          <Row label="Metabolic panel" code="CPT 80053" amount="$180.00" hot />
          <Row label="ED facility visit" code="Rev 450" amount="$800.00" />
        </div>

        <div className="mt-3 overflow-hidden rounded-xl bg-cobalt-600 px-3 py-2 text-xs font-medium text-white">
          Guide explaining this line item
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  code,
  amount,
  hot,
}: {
  label: string;
  code: string;
  amount: string;
  hot?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm",
        hot ? "bg-brand-50 ring-1 ring-brand-200" : "bg-paper-muted",
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-ink-900">{label}</p>
        <p className="text-[10px] text-ink-400">{code}</p>
      </div>
      <p className="cc-amount shrink-0 font-semibold text-navy-950">{amount}</p>
    </div>
  );
}
