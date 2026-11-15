import { CheckCircle2, Sparkles } from "lucide-react";

const STEPS = [
  {
    title: "Upload your hospital statement",
    body: "PDF, photo, or pasted line items from the medical bill. No patient account needed.",
  },
  {
    title: "Review flagged charges",
    body: "We mark line items that look unusual or high versus public hospital prices — as questions to ask, not proven errors.",
  },
  {
    title: "Talk with the billing guide",
    body: "Ask about an X-ray, lab, or facility fee. The guide highlights that charge and suggests what to ask billing.",
  },
];

/** Explicitly illustrative — never looks like the patient's live bill. */
export function HowItWorks() {
  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-ink-200/80 bg-white/70 p-5 shadow-panel backdrop-blur sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-cobalt-500/10 blur-2xl"
      />
      <div className="relative flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cobalt-500/10 text-cobalt-700">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cobalt-700">
          How the bill review works
        </p>
      </div>

      <ol className="relative mt-5 space-y-5">
        <span
          aria-hidden
          className="absolute bottom-5 left-4 top-5 w-px bg-gradient-to-b from-cobalt-500/45 via-cobalt-500/18 to-transparent"
        />
        {STEPS.map((step, index) => (
          <li key={step.title} className="group relative flex gap-4">
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#3b5fff,#1a3df5)] text-xs font-semibold text-white shadow-[0_6px_16px_rgba(59,95,255,0.28)] ring-4 ring-[#f7f9fc] transition-transform duration-300 group-hover:scale-110">
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="font-semibold text-navy-950">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="relative mt-5 flex items-start gap-2 rounded-xl border border-ink-200/70 bg-white/70 px-3 py-2.5 text-xs leading-relaxed text-ink-500">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cobalt-600" aria-hidden />
        Demo tip: sample amounts you may see later are synthetic examples, not your
        personal bill.
      </p>
    </div>
  );
}
