"use client";

/**
 * Sahil-owned voice shell.
 * Sumedh owns AgentRuntime — pass audioActive when a real session is speaking/listening.
 */
import { useMemo, useState } from "react";
import { Mic, MicOff, PhoneOff, Radio } from "lucide-react";
import type { Analysis, FocusTarget } from "@/types/contracts";
import {
  LanguageSelector,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from "@/components/intake/LanguageSelector";
import { Pressable } from "@/components/motion/Pressable";
import { cn } from "@/lib/utils";

export type VoicePanelProps = {
  analysis: Analysis;
  language: LanguageCode;
  onLanguageChange: (code: LanguageCode) => void;
  onFocus: (focus: FocusTarget) => string;
  onClearFocus?: () => void;
  onUpdated?: () => Promise<void> | void;
  compact?: boolean;
  audioActive?: boolean;
  sessionStatus?: "idle" | "connecting" | "speaking" | "listening" | "ended" | "error";
};

const SUGGESTIONS = [
  { label: "Why is this charge high?", target: "finding_1" as const },
  { label: "What is a duplicate charge?", target: "finding_2" as const },
  { label: "What should I ask the hospital?", target: "finding_1" as const },
];

export function VoicePanel({
  analysis,
  language,
  onLanguageChange,
  onFocus,
  onClearFocus,
  onUpdated,
  compact = false,
  audioActive = false,
  sessionStatus = "idle",
}: VoicePanelProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [muted, setMuted] = useState(false);
  const [note, setNote] = useState(
    "I can walk you through your bill and help you decide what to ask next.",
  );

  const languageLabel = useMemo(
    () =>
      SUPPORTED_LANGUAGES.find((item) => item.code === language)?.label ??
      language,
    [language],
  );

  const findings = analysis.findings.slice(0, 2);
  const live = sessionStatus !== "idle" && sessionStatus !== "ended";
  const showWave =
    audioActive &&
    (sessionStatus === "speaking" || sessionStatus === "listening");

  const statusLabel =
    sessionStatus === "connecting"
      ? "Connecting"
      : sessionStatus === "speaking"
        ? "Explaining"
        : sessionStatus === "listening"
          ? "Listening"
          : sessionStatus === "error"
            ? "Something went wrong"
            : sessionStatus === "ended"
              ? "Conversation ended"
              : "Ready to help";

  function previewHighlights() {
    setNote(`Okay — let's look at the first finding together (${languageLabel}).`);
    onFocus({ targetType: "finding", targetId: "finding_1" });
    window.setTimeout(() => {
      onFocus({ targetType: "finding", targetId: "finding_2" });
      setNote("Those are the main charges to ask about. Tap any finding for details.");
      void onUpdated?.();
    }, 900);
  }

  if (compact && !expanded) {
    return (
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <Pressable
          onClick={previewHighlights}
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
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] text-white shadow-lift",
        "bg-[linear-gradient(165deg,#0e1a2b_0%,#1b2a41_55%,#243752_100%)]",
        compact ? "max-h-[70vh]" : "",
      )}
    >
      <div className="relative border-b border-white/10 px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7ec8cc]">
              Your Billing Guide
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
              I&apos;m here to help
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              I can walk you through your bill, explain anything confusing, and help
              you decide what to ask next.
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80">
            {statusLabel}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <div
            className={cn(
              "relative flex h-16 w-16 items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/5 transition duration-[200ms]",
              showWave && "scale-105 ring-2 ring-[#0f8f96]/50",
            )}
            aria-hidden
          >
            {showWave ? <Waveform /> : <Radio className="h-6 w-6 text-[#7ec8cc]" />}
          </div>
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-white/80">{note}</p>
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
            Language
          </p>
          <div className="[&_select]:border-white/15 [&_select]:bg-white/10 [&_select]:text-white [&_select]:focus:border-[#7ec8cc]">
            <LanguageSelector value={language} onChange={onLanguageChange} compact />
          </div>
        </div>
      </div>

      <div className="relative flex-1 space-y-4 overflow-y-auto cc-scrollbar px-5 py-4 sm:px-6">
        <div aria-live="polite" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7ec8cc]">
            Conversation
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/90">
            {live
              ? sessionStatus === "speaking"
                ? "I'm explaining a charge from your bill…"
                : sessionStatus === "listening"
                  ? "I'm listening — ask me anything about these charges."
                  : sessionStatus === "connecting"
                    ? "Connecting to your guide…"
                    : "Session active."
              : "When you're ready, start talking or tap a suggestion below. I'll highlight the matching charge on the left."}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7ec8cc]">
            Try asking
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {SUGGESTIONS.map((item) => (
              <button
                key={item.label}
                type="button"
                data-cursor="finding"
                onClick={() => {
                  setNote(item.label);
                  onFocus({ targetType: "finding", targetId: item.target });
                }}
                className="cc-pressable rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-sm text-white/90 transition hover:bg-white/10"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7ec8cc]">
            Charges to review
          </p>
          <div className="mt-2 space-y-2">
            {findings.map((finding, index) => (
              <button
                key={finding.id}
                type="button"
                data-cursor="finding"
                onClick={() =>
                  onFocus({ targetType: "finding", targetId: finding.id })
                }
                className="cc-pressable w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:translate-x-0.5 hover:bg-white/10"
              >
                <p className="text-[11px] font-semibold text-[#7ec8cc]">
                  Finding {index + 1}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-white/85">
                  {finding.title}
                </p>
              </button>
            ))}
            <button
              type="button"
              data-cursor="button"
              onClick={() => onClearFocus?.()}
              className="text-xs text-white/50 hover:text-white"
            >
              Clear highlight
            </button>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 px-5 py-4 sm:px-6">
        {!live ? (
          <Pressable
            onClick={previewHighlights}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f8f96] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#0d737a]"
          >
            <Radio className="h-4 w-4" aria-hidden />
            Start talking
          </Pressable>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              data-cursor="button"
              onClick={() => setMuted((m) => !m)}
              className="cc-pressable inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white"
            >
              {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {muted ? "Unmute" : "Mute"}
            </button>
            <button
              type="button"
              data-cursor="button"
              className="cc-pressable inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-navy-950"
            >
              <PhoneOff className="h-4 w-4" />
              End
            </button>
          </div>
        )}
        {compact ? (
          <button
            type="button"
            data-cursor="button"
            onClick={() => setExpanded(false)}
            className="mt-3 w-full text-center text-xs text-white/55"
          >
            Minimize
          </button>
        ) : null}
      </div>
    </aside>
  );
}

function Waveform() {
  return (
    <div className="relative flex h-9 items-end gap-1">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="cc-wave-bar w-1.5 rounded-full bg-[#7ec8cc]"
          style={{
            height: `${12 + ((i * 9) % 22)}px`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
