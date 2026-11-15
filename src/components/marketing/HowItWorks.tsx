import { CheckCircle2, Sparkles } from "lucide-react";

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
    <div className="cc-glass relative overflow-hidden rounded-[1.6rem] p-5 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#0f8f96]/10 blur-2xl"
      />
      <div className="relative flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0f8f96]/10 text-[#0d737a]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d737a]">
          How CareCounter helps
        </p>
      </div>

      <ol className="relative mt-5 space-y-5">
        <span
          aria-hidden
          className="absolute bottom-5 left-4 top-5 w-px bg-gradient-to-b from-[#0f8f96]/45 via-[#0f8f96]/18 to-transparent"
        />
        {STEPS.map((step, index) => (
          <li key={step.title} className="group relative flex gap-4">
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#0f8f96,#0b666d)] text-xs font-semibold text-white shadow-[0_6px_16px_rgba(15,143,150,0.28)] ring-4 ring-[#f7fbfa] transition-transform duration-300 group-hover:scale-110">
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="font-semibold text-navy-950">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="relative mt-5 flex items-start gap-2 rounded-xl border border-[#0b3b3f]/8 bg-white/55 px-3 py-2.5 text-xs leading-relaxed text-ink-500">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0f8f96]" aria-hidden />
        Demo tip: sample amounts you may see later are synthetic examples, not your
        personal bill.
      </p>
    </div>
  );
}
