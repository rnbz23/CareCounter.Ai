"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Analysis, FocusTarget } from "@/types/contracts";
import { applyFocusTarget } from "@/lib/analysis/focus";
import { getAnalysisById } from "@/lib/api/analysis";
import { DnaNavLink } from "@/components/boot/DnaNavLink";
import {
  LanguageSelector,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from "@/components/intake/LanguageSelector";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { AnalysisSummary } from "./AnalysisSummary";
import { FindingCard } from "./FindingCard";
import { LineItemsTable } from "./LineItemsTable";
import { AssistanceCard } from "./AssistanceCard";
import { FundraiseCard } from "./FundraiseCard";
import { VoicePanel } from "@/components/voice/VoicePanel";
import { cn } from "@/lib/utils";

type MobileTab = "findings" | "document" | "aid";

/**
 * Stable two-column review: left scrolls the statement findings,
 * right keeps the billing guide fixed. No fullscreen layout swap on connect.
 */
export function AnalysisWorkspace({ analysis: initialAnalysis }: { analysis: Analysis }) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [activeFocus, setActiveFocus] = useState<FocusTarget | null>(null);
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [mobileTab, setMobileTab] = useState<MobileTab>("findings");
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    setAnalysis(initialAnalysis);
  }, [initialAnalysis]);

  useEffect(() => {
    const saved = window.sessionStorage.getItem("cc_language");
    const savedLanguage = SUPPORTED_LANGUAGES.find((item) => item.code === saved);
    if (savedLanguage) {
      setLanguage(savedLanguage.code);
    }
  }, []);

  const languageLabel =
    SUPPORTED_LANGUAGES.find((item) => item.code === language)?.label ??
    "English";

  const handleFocus = useCallback(
    (focus: FocusTarget): string => {
      const result = applyFocusTarget(analysis, focus, setActiveFocus);
      if (result === "focused") {
        if (focus.targetType === "assistance" || focus.targetType === "step") {
          setMobileTab("aid");
        } else if (focus.targetType === "line_item") {
          setMobileTab("document");
        } else if (focus.targetType === "payment") {
          setMobileTab("aid");
        } else {
          setMobileTab("findings");
        }
      }
      return result;
    },
    [analysis],
  );

  const clearFocus = useCallback(() => {
    applyFocusTarget(analysis, null, setActiveFocus);
  }, [analysis]);

  const refreshAnalysis = useCallback(async () => {
    try {
      const next = await getAnalysisById(analysis.id);
      setAnalysis(next);
      setRefreshError(null);
    } catch (error) {
      setRefreshError(
        error instanceof Error
          ? error.message
          : "Could not refresh this case from the server.",
      );
    }
  }, [analysis.id]);

  const relatedLineIds = useMemo(() => {
    if (!activeFocus || activeFocus.targetType !== "finding") return [];
    const finding = analysis.findings.find((f) => f.id === activeFocus.targetId);
    return finding?.lineItemIds ?? [];
  }, [activeFocus, analysis.findings]);

  const sortedFindings = useMemo(() => {
    const rank = { priority: 0, review: 1, info: 2 } as const;
    return [...analysis.findings].sort(
      (a, b) => rank[a.severity] - rank[b.severity],
    );
  }, [analysis.findings]);

  return (
    <div className="relative flex min-h-screen flex-col bg-[linear-gradient(180deg,#f7f9fc_0%,#eef2f7_100%)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(860px_300px_at_10%_-8%,rgba(59,95,255,0.09),transparent_58%),radial-gradient(640px_240px_at_94%_0%,rgba(242,74,29,0.06),transparent_55%)]"
      />

      <AppHeader
        activeStep="understand"
        analysisId={analysis.id}
        languageLabel={languageLabel}
      />

      <PageShell
        width="wide"
        className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 py-4 lg:h-[calc(100dvh-4rem)] lg:max-h-[calc(100dvh-4rem)] lg:overflow-hidden lg:py-5"
      >
        {refreshError ? (
          <p
            className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            role="status"
          >
            Voice update could not refresh this case: {refreshError}. Text findings remain available.
          </p>
        ) : null}

        <div className="grid min-h-0 min-w-0 flex-1 items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] lg:gap-6">
          <section
            id="cc-bill-scrollport"
            className="min-h-0 min-w-0 space-y-5 overflow-y-auto pb-28 lg:pb-6 cc-scrollbar"
          >
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <LanguageSelector
                value={language}
                onChange={setLanguage}
                compact
                className="max-w-[180px]"
              />
              <button
                type="button"
                onClick={clearFocus}
                className="text-xs font-medium text-ink-500 transition-colors hover:text-navy-950"
              >
                Clear highlight
              </button>
            </div>

            <AnalysisSummary analysis={analysis} />

            <div className="flex gap-1 rounded-xl bg-white/90 p-1 shadow-sm ring-1 ring-ink-200/70 backdrop-blur lg:hidden">
              {(
                [
                  ["findings", "Findings"],
                  ["document", "Charges"],
                  ["aid", "Help"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMobileTab(key)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    mobileTab === key
                      ? "bg-navy-950 text-white"
                      : "text-ink-600 hover:bg-paper-muted hover:text-navy-950",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              className={cn(
                "space-y-4",
                mobileTab !== "findings" && "hidden lg:block",
              )}
            >
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cobalt-600">
                    On this statement
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-navy-950">
                    Charges worth checking
                  </h2>
                  <p className="mt-1 text-sm text-ink-500">
                    Possible billing questions — not confirmed medical or billing errors.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearFocus}
                  className="hidden text-xs font-medium text-ink-500 transition-colors hover:text-navy-950 lg:inline"
                >
                  Clear highlight
                </button>
              </div>

              <div className="space-y-4">
                {sortedFindings.map((finding, index) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    lineItems={analysis.lineItems}
                    evidence={analysis.evidence}
                    activeFocus={activeFocus}
                    onActivate={handleFocus}
                    index={index}
                  />
                ))}
              </div>
            </div>

            <div
              className={cn(mobileTab !== "document" && "hidden lg:block")}
            >
              <LineItemsTable
                lineItems={analysis.lineItems}
                activeFocus={activeFocus}
                onActivate={handleFocus}
                highlightedIds={relatedLineIds}
              />
            </div>

            <div
              className={cn(
                "space-y-4",
                mobileTab !== "aid" && "hidden lg:block",
              )}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cobalt-600">
                  After the review
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-navy-950">
                  Ways you may be able to get help
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                  Financial assistance ideas from public hospital resources — never a promise of eligibility.
                </p>
              </div>
              <div className="space-y-3.5">
                {analysis.assistanceOptions.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-ink-200 bg-white/70 px-4 py-5 text-sm text-ink-500">
                    Assistance options appear after insurance answers are saved and public resources are loaded.
                  </p>
                ) : (
                  analysis.assistanceOptions.map((option) => (
                    <AssistanceCard
                      key={option.id}
                      option={option}
                      activeFocus={activeFocus}
                      onActivate={handleFocus}
                    />
                  ))
                )}
              </div>

              <div className="lg:hidden">
                <FundraiseCard analysis={analysis} variant="inline" />
              </div>

              <DnaNavLink
                href={`/analysis/${analysis.id}/plan`}
                dnaLabel="Preparing your plan"
                data-cursor="button"
                onClick={() => {
                  window.sessionStorage.setItem("cc_enter_from", "analysis");
                }}
                className="cc-pressable inline-flex rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                See my next steps
              </DnaNavLink>
            </div>
          </section>

          <aside className="hidden min-h-0 min-w-0 lg:flex lg:flex-col lg:gap-3">
            <div className="min-h-0 flex-1">
              <VoicePanel
                analysis={analysis}
                language={language}
                onLanguageChange={setLanguage}
                onFocus={handleFocus}
                onClearFocus={clearFocus}
                onUpdated={refreshAnalysis}
              />
            </div>
            <div className="shrink-0">
              <FundraiseCard analysis={analysis} />
            </div>
          </aside>
        </div>
      </PageShell>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200/80 bg-white/95 p-3 backdrop-blur-xl lg:hidden">
        <VoicePanel
          analysis={analysis}
          language={language}
          onLanguageChange={setLanguage}
          onFocus={handleFocus}
          onClearFocus={clearFocus}
          onUpdated={refreshAnalysis}
          compact
        />
      </div>
    </div>
  );
}
