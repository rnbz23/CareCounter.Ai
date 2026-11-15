export function BillPreviewArt() {
  return (
    <div className="relative mx-auto mt-8 w-full max-w-md select-none" aria-hidden>
      <div className="cc-float-slow absolute -left-6 top-6 h-28 w-28 rounded-full bg-brand-300/35 blur-3xl" />
      <div className="cc-float absolute -right-4 bottom-4 h-24 w-24 rounded-full bg-navy-400/25 blur-3xl" />

      <div className="cc-float relative -rotate-2 rounded-[1.4rem] border border-ink-200/80 bg-white p-5 shadow-lift transition duration-500 hover:rotate-0 hover:scale-[1.02]">
        <div className="flex items-center justify-between border-b border-dashed border-ink-200 pb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
              Statement
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-navy-950">
              Pacific Coast Medical
            </p>
          </div>
          <div className="rounded-xl bg-navy-950 px-2.5 py-1.5 text-right text-white">
            <p className="text-[10px] uppercase tracking-wide text-white/60">Total</p>
            <p className="cc-amount text-sm font-semibold">$2,110.00</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Row label="Chest X-ray" amount="$950.00" hot />
          <Row label="Metabolic panel" amount="$180.00" />
          <Row label="Metabolic panel" amount="$180.00" hot />
          <Row label="ED visit" amount="$800.00" />
        </div>

        <div className="mt-4 overflow-hidden rounded-xl bg-brand-500 px-3 py-2.5 text-xs font-medium text-white">
          <div className="relative">
            Guide is explaining this charge
            <span className="absolute inset-0 cc-shimmer opacity-30" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  amount,
  hot,
}: {
  label: string;
  amount: string;
  hot?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition duration-300 ${
        hot
          ? "bg-brand-50 ring-1 ring-brand-200"
          : "bg-paper-muted hover:bg-navy-50"
      }`}
    >
      <p className="font-medium text-ink-900">{label}</p>
      <p className="cc-amount font-semibold text-navy-950">{amount}</p>
    </div>
  );
}
