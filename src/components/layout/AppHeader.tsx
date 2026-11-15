import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandMark } from "./BrandMark";
import { PageShell } from "./PageShell";

type Step = "analyze" | "understand" | "plan";

const STEPS: { key: Step; label: string }[] = [
  { key: "analyze", label: "Analyze" },
  { key: "understand", label: "Understand" },
  { key: "plan", label: "Plan" },
];

export function AppHeader({
  activeStep = "analyze",
  analysisId,
  languageLabel = "English",
}: {
  activeStep?: Step;
  analysisId?: string;
  languageLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#0b3b3f]/10 bg-[#f7fbfa]/85 shadow-[0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
      <PageShell width="wide" className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="CareCounter home"
          className="group flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f8f96]/40"
        >
          <BrandMark id="cc-brand-mark" size="sm" />
          <span className="font-display text-[1.25rem] font-semibold tracking-tight text-navy-950 transition-colors duration-300 group-hover:text-[#0d737a]">
            CareCounter
          </span>
        </Link>

        <nav
          aria-label="Application steps"
          className="hidden items-center gap-1 rounded-full border border-[#0b3b3f]/10 bg-white/55 p-1 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] md:flex"
        >
          {STEPS.map((step) => {
            const href =
              step.key === "analyze"
                ? "/"
                : analysisId
                  ? step.key === "plan"
                    ? `/analysis/${analysisId}/plan`
                    : `/analysis/${analysisId}`
                  : undefined;
            const isActive = step.key === activeStep;
            const content = (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm transition-all duration-300",
                  isActive
                    ? "bg-navy-950 font-semibold text-white shadow-[0_4px_12px_rgba(14,26,43,0.18)]"
                    : "font-medium text-ink-500 hover:bg-white hover:text-navy-950",
                )}
              >
                {step.label}
              </span>
            );
            return href ? (
              <Link key={step.key} href={href}>
                {content}
              </Link>
            ) : (
              <span key={step.key}>{content}</span>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 text-sm text-ink-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0f8f96] shadow-[0_0_0_3px_rgba(15,143,150,0.12)]" aria-hidden />
          <span className="hidden sm:inline">Language · </span>
          <span className="font-medium text-navy-900">{languageLabel}</span>
        </div>
      </PageShell>
    </header>
  );
}
