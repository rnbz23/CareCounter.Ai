"use client";

/**
 * Sahil-owned voice shell.
 * Owns placement/language controls; delegates the live session to Sumedh's AgentRuntime.
 */
import { useMemo, useState } from "react";
import type { Analysis, FocusTarget } from "@/types/contracts";
import {
  LanguageSelector,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from "@/components/intake/LanguageSelector";
import { AgentRuntime } from "@/components/voice/AgentRuntime";
import { Pressable } from "@/components/motion/Pressable";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export type VoicePanelProps = {
  analysis: Analysis;
  language: LanguageCode;
  onLanguageChange: (code: LanguageCode) => void;
  onFocus: (focus: FocusTarget) => string;
  onClearFocus?: () => void;
  onUpdated: () => Promise<void> | void;
  onConnectionChange?: (connected: boolean) => void;
  compact?: boolean;
};

export function VoicePanel({
  analysis,
  language,
  onLanguageChange,
  onFocus,
  onClearFocus,
  onUpdated,
  onConnectionChange,
  compact = false,
}: VoicePanelProps) {
  const [expanded, setExpanded] = useState(!compact);

  const languageLabel = useMemo(
    () =>
      SUPPORTED_LANGUAGES.find((item) => item.code === language)?.label ??
      language,
    [language],
  );

  if (compact && !expanded) {
    return (
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <Pressable
          onClick={() => setExpanded(true)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0d737a] px-4 py-3.5 text-sm font-semibold text-white"
        >
          <Radio className="h-4 w-4" aria-hidden />
          Start talking
        </Pressable>
        <button
          type="button"
          data-cursor="button"
          onClick={() => setExpanded(true)}
          className="cc-pressable rounded-2xl border border-ink-200 bg-white px-3 py-3.5 text-sm font-medium text-navy-900"
        >
          Open
        </button>
      </div>
    );
  }

  return (
    <aside
      data-cursor="card"
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] text-navy-950 shadow-lift",
        "bg-[linear-gradient(165deg,#0e1a2b_0%,#1b2a41_55%,#243752_100%)]",
        compact ? "max-h-[70vh]" : "",
      )}
    >
      <div className="relative border-b border-white/10 px-5 py-3.5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7ec8cc]">
              Your Billing Guide
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-white">
              Talk through this bill
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-white/65">
              Start in any language. Switch anytime.
            </p>
          </div>
        </div>

        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
            Language · {languageLabel}
          </p>
          <div className="[&_select]:border-white/15 [&_select]:bg-white/10 [&_select]:text-white [&_select]:focus:border-[#7ec8cc]">
            <LanguageSelector value={language} onChange={onLanguageChange} compact />
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-white/95 p-2 sm:p-3">
        <AgentRuntime
          analysis={analysis}
          language={language}
          onFocus={onFocus}
          onUpdated={onUpdated}
          onClearFocus={onClearFocus}
          onConnectionChange={onConnectionChange}
        />
      </div>

      {compact ? (
        <button
          type="button"
          data-cursor="button"
          onClick={() => setExpanded(false)}
          className="border-t border-white/10 px-5 py-3 text-center text-xs text-white/55"
        >
          Minimize
        </button>
      ) : null}
    </aside>
  );
}
