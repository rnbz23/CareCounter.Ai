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
    <header className="sticky top-0 z-40 border-b border-ink-200/60 bg-white/85 backdrop-blur-xl">
      <PageShell width="wide" className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <BrandMark size="sm" />
          <span className="font-display text-[1.25rem] font-semibold tracking-tight text-navy-950 transition group-hover:text-[#0d737a]">
            CareCounter
          </span>
        </Link>

        <nav
          aria-label="Application steps"
          className="hidden items-center gap-1 md:flex"
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
                  "relative px-3 py-2 text-sm transition-colors duration-200",
                  isActive
                    ? "font-semibold text-navy-950"
                    : "text-ink-500 hover:text-navy-900",
                )}
              >
                {step.label}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-[0.85rem] h-[2px] origin-left rounded-full bg-[#0f8f96] transition-transform duration-300",
                    isActive ? "scale-x-100" : "scale-x-0",
                  )}
                />
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

        <div className="text-sm text-ink-500">
          <span className="hidden sm:inline">Language · </span>
          <span className="font-medium text-navy-900">{languageLabel}</span>
        </div>
      </PageShell>
    </header>
  );
}
