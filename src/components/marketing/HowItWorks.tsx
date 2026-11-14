const STEPS = [
  {
    title: "Upload your bill",
    body: "Send a PDF, photo, or pasted charges. No account needed.",
  },
  {
    title: "See what to question",
    body: "We flag charges that look unusual — clearly marked as things to check, not proven errors.",
  },
  {
    title: "Talk through next steps",
    body: "A billing guide can explain findings in plain language and help you decide what to ask.",
  },
];

/** Explicitly illustrative — never looks like the patient's live bill. */
export function HowItWorks() {
  return (
    <div className="rounded-[1.5rem] border border-ink-200/80 bg-white/80 p-5 shadow-sm sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0d737a]">
        How CareCounter helps
      </p>
      <ol className="mt-4 space-y-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0d737a] text-sm font-semibold text-white">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-navy-950">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-5 rounded-xl bg-paper-muted px-3 py-2.5 text-xs leading-relaxed text-ink-500">
        Demo tip: sample amounts you may see later are synthetic examples, not your
        personal bill.
      </p>
    </div>
  );
}
