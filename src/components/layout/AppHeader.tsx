"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useOptionalDnaRoute } from "@/components/boot/DnaRouteLoader";
import { BrandMark } from "./BrandMark";
import { PageShell } from "./PageShell";

type Step = "analyze" | "understand" | "plan";

const STEPS: { key: Step; label: string }[] = [
  { key: "analyze", label: "Analyze" },
  { key: "understand", label: "Understand" },
  { key: "plan", label: "Plan" },
];

function dnaLabelForHref(href: string): string {
  if (href.includes("/plan")) return "Preparing your plan";
  if (href.startsWith("/analysis/")) return "Opening your billing guide";
  return "Returning home";
}

export function AppHeader({
  activeStep = "analyze",
  analysisId,
  languageLabel = "English",
  tone = "day",
}: {
  activeStep?: Step;
  analysisId?: string;
  languageLabel?: string;
  tone?: "day" | "night";
}) {
  const night = tone === "night";
  const dnaRoute = useOptionalDnaRoute();

  function onStepNavigate(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    if (!dnaRoute || href === "/") return;
    event.preventDefault();
    dnaRoute.navigateWithDna(href, dnaLabelForHref(href));
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 backdrop-blur-xl",
        night
          ? "border-b border-white/10 bg-night/35"
          : "border-b border-ink-200/70 bg-[#f7f9fc]/85 shadow-[0_1px_0_rgba(255,255,255,0.7)]",
      )}
    >
      <PageShell width="wide" className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="CareCounter home"
          data-brand-home
          className={cn(
            "group flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2",
            night ? "focus-visible:ring-white/40" : "focus-visible:ring-cobalt-500/40",
          )}
        >
          <BrandMark id="cc-brand-mark" size="sm" />
          <span
            data-brand-word
            className={cn(
              "font-display text-[1.25rem] font-semibold tracking-tight transition-colors duration-300",
              night
                ? "text-white group-hover:text-white/85"
                : "text-navy-950 group-hover:text-cobalt-700",
            )}
          >
            CareCounter
          </span>
        </Link>

        <nav
          aria-label="Application steps"
          className={cn(
            "hidden items-center gap-1 rounded-full p-1 md:flex",
            night
              ? "border border-white/15 bg-white/10"
              : "border border-ink-200/80 bg-white/70 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]",
          )}
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
                    ? night
                      ? "bg-white font-semibold text-night"
                      : "bg-navy-950 font-semibold text-white shadow-[0_4px_12px_rgba(14,26,43,0.18)]"
                    : night
                      ? "font-medium text-white/65 hover:bg-white/10 hover:text-white"
                      : "font-medium text-ink-500 hover:bg-white hover:text-navy-950",
                )}
              >
                {step.label}
              </span>
            );
            return href ? (
              <Link
                key={step.key}
                href={href}
                onClick={(event) => {
                  if (isActive) {
                    event.preventDefault();
                    return;
                  }
                  onStepNavigate(event, href);
                }}
              >
                {content}
              </Link>
            ) : (
              <span key={step.key}>{content}</span>
            );
          })}
        </nav>

        <div
          className={cn(
            "flex items-center gap-2 text-sm",
            night ? "text-white/60" : "text-ink-500",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              night ? "bg-brand-400" : "bg-cobalt-500",
            )}
            aria-hidden
          />
          <span className="hidden sm:inline">Language · </span>
          <span className={cn("font-medium", night ? "text-white" : "text-navy-900")}>
            {languageLabel}
          </span>
        </div>
      </PageShell>
    </header>
  );
}
