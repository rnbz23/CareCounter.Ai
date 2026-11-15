"use client";

/**
 * ElevenLabs conversational runtime (Sumedh).
 *
 * Sahil imports this component and owns `activeFocus`/scroll in `onFocus`.
 * This file never touches the DOM and never infers focus from transcript text.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConversationProvider,
  useConversationClientTool,
  useConversationControls,
  useConversationInput,
  useConversationMode,
  useConversationStatus,
} from "@elevenlabs/react";
import {
  FocusTargetSchema,
  InsuranceProfileSchema,
  type Analysis,
  type FocusTarget,
} from "@/types/contracts";
import { buildAgentContext } from "@/lib/analysis/agent-context";
import { isValidFocusTarget } from "@/lib/analysis/focus";
import { formatCents } from "@/lib/format";
import { SUPPORTED_LANGUAGES, firstMessageForLanguage } from "@/components/intake/LanguageSelector";

/** Matches the master-spec interface exactly (four props). */
export type AgentRuntimeProps = {
  analysis: Analysis;
  language: string;
  onFocus: (p: FocusTarget) => string;
  onUpdated: () => Promise<void> | void;
};

/**
 * Additive, optional extension: the spec requires a clear_focus client tool but
 * its four-prop interface has no clearing callback. Sahil must opt in.
 */
export type AgentRuntimeOptionalProps = { onClearFocus?: () => void };

type TranscriptEntry = { id: string; role: "user" | "agent"; text: string };

/** Structural subset of the SDK's MessagePayload. */
type TranscriptMessage = {
  message: string;
  role: "user" | "agent";
  response_id?: string;
  event_id: number;
};

type StartSessionOptions = NonNullable<
  Parameters<ReturnType<typeof useConversationControls>["startSession"]>[0]
>;
type AgentLanguage = NonNullable<NonNullable<StartSessionOptions["overrides"]>["agent"]>["language"];

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

function toAgentLanguage(code: string): AgentLanguage | undefined {
  const normalized = code.trim().toLowerCase();
  return /^[a-z]{2}(-[a-z]{2})?$/.test(normalized) ? (normalized as AgentLanguage) : undefined;
}

export function AgentRuntime({
  analysis,
  language,
  onFocus,
  onUpdated,
  onClearFocus,
}: AgentRuntimeProps & AgentRuntimeOptionalProps) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback((payload: TranscriptMessage) => {
    const text = payload.message?.trim();
    if (!text) return;
    const role: TranscriptEntry["role"] = payload.role === "user" ? "user" : "agent";
    const id = payload.response_id ?? `event_${payload.event_id}`;

    setTranscript((previous) => {
      const last = previous[previous.length - 1];
      // Streamed parts of one agent response share a response_id: replace.
      if (last && last.role === role && last.id === id) {
        if (last.text === text) return previous;
        return [...previous.slice(0, -1), { ...last, text }];
      }
      // Tentative + final duplicate text without an id.
      if (last && last.role === role && last.text === text) return previous;
      return [...previous.slice(-60), { id, role, text }];
    });
  }, []);

  const handleError = useCallback((message: string) => {
    const detail = message?.trim();
    if (!detail) {
      setError("The voice connection reported an error. Check your network and press Start again.");
      return;
    }
    if (/missing required dynamic variables/i.test(detail)) {
      setError(
        "The voice agent is missing the analysis_id dynamic variable. Reload the case, then press Start again.",
      );
      return;
    }
    setError(detail);
  }, []);

  return (
    <ConversationProvider key={language} onMessage={handleMessage} onError={handleError} onConnect={() => setError(null)}>
      <AgentRuntimeControls
        analysis={analysis}
        language={language}
        onFocus={onFocus}
        onUpdated={onUpdated}
        onClearFocus={onClearFocus}
        transcript={transcript}
        error={error}
        setError={setError}
        setTranscript={setTranscript}
      />
    </ConversationProvider>
  );
}

type ControlsProps = AgentRuntimeProps &
  AgentRuntimeOptionalProps & {
  transcript: TranscriptEntry[];
  error: string | null;
  setError: (message: string | null) => void;
  setTranscript: (entries: TranscriptEntry[]) => void;
};

function AgentRuntimeControls({
  analysis,
  language,
  onFocus,
  onUpdated,
  onClearFocus,
  transcript,
  error,
  setError,
  setTranscript,
}: ControlsProps) {
  const { startSession, endSession, sendUserMessage } = useConversationControls();
  const { status, message: statusMessage } = useConversationStatus();
  const { isSpeaking, isListening } = useConversationMode();
  const { isMuted, setMuted } = useConversationInput();

  const [starting, setStarting] = useState(false);
  const [input, setInput] = useState("");
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Keep tool handlers on the latest analysis without requiring a session restart.
  const analysisRef = useRef(analysis);
  const onFocusRef = useRef(onFocus);
  const onUpdatedRef = useRef(onUpdated);
  const onClearFocusRef = useRef(onClearFocus);
  useEffect(() => {
    analysisRef.current = analysis;
  }, [analysis]);
  useEffect(() => {
    onFocusRef.current = onFocus;
  }, [onFocus]);
  useEffect(() => {
    onUpdatedRef.current = onUpdated;
  }, [onUpdated]);
  useEffect(() => {
    onClearFocusRef.current = onClearFocus;
  }, [onClearFocus]);

  /**
   * Client tools run in the browser. Prefer these over ElevenLabs server/webhook
   * tools for local demos — cloud webhooks cannot reach localhost.
   * Bright Data is offline-only; case context comes from the loaded Analysis / Neon.
   */
  useConversationClientTool("get_case_context", () => {
    try {
      const context = buildAgentContext(analysisRef.current);
      return JSON.stringify(context);
    } catch {
      return JSON.stringify({
        error: "case_context_unavailable",
        message: "The current bill context could not be built in the browser.",
      });
    }
  });

  useConversationClientTool("focus_target", (params: Record<string, unknown>) => {
    // Reject malformed payloads AND IDs that are not in the current analysis
    // (stale IDs from a previous case are never focusable).
    const current = analysisRef.current;
    const parsed = FocusTargetSchema.safeParse(params);
    if (!parsed.success || !isValidFocusTarget(current, parsed.data)) {
      return "unknown_target";
    }
    try {
      return onFocusRef.current(parsed.data);
    } catch {
      return "unknown_target";
    }
  });

  useConversationClientTool("clear_focus", () => {
    if (!onClearFocusRef.current) return "unsupported";
    onClearFocusRef.current();
    return "cleared";
  });

  useConversationClientTool("refresh_case", async () => {
    try {
      await onUpdatedRef.current();
      return "updated";
    } catch {
      return "refresh_failed";
    }
  });

  useConversationClientTool("save_insurance_profile", async (params: Record<string, unknown>) => {
    const current = analysisRef.current;
    const parsed = InsuranceProfileSchema.safeParse(
      "insurance" in params ? params.insurance : params,
    );
    if (!parsed.success) {
      return JSON.stringify({
        error: "invalid_insurance_profile",
        message: "Send a valid insurance profile.",
      });
    }
    try {
      const res = await fetch(
        `/api/analyses/${encodeURIComponent(current.id)}/insurance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      if (!res.ok) {
        return JSON.stringify({
          error: "save_failed",
          message: "Insurance profile could not be saved.",
        });
      }
      await onUpdatedRef.current();
      return JSON.stringify({ ok: true, analysisId: current.id });
    } catch {
      return JSON.stringify({
        error: "save_failed",
        message: "Insurance profile could not be saved.",
      });
    }
  });

  useConversationClientTool("get_assistance_options", async () => {
    const current = analysisRef.current;
    try {
      const res = await fetch(
        `/api/analyses/${encodeURIComponent(current.id)}/assistance`,
        { method: "POST" },
      );
      if (!res.ok) {
        return JSON.stringify({
          error: "assistance_failed",
          message: "Assistance options could not be loaded from stored public resources.",
        });
      }
      const updated = (await res.json()) as Analysis;
      await onUpdatedRef.current();
      return JSON.stringify({
        ok: true,
        assistanceOptions: updated.assistanceOptions,
        note: "These are possibilities from stored public evidence, not confirmed eligibility.",
      });
    } catch {
      return JSON.stringify({
        error: "assistance_failed",
        message: "Assistance options could not be loaded.",
      });
    }
  });

  useConversationClientTool("generate_action_plan", async () => {
    const current = analysisRef.current;
    try {
      const res = await fetch(
        `/api/analyses/${encodeURIComponent(current.id)}/action-plan`,
        { method: "POST" },
      );
      if (!res.ok) {
        return JSON.stringify({
          error: "action_plan_failed",
          message: "The action plan could not be generated.",
        });
      }
      const updated = (await res.json()) as Analysis;
      await onUpdatedRef.current();
      return JSON.stringify({
        ok: true,
        actionPlan: updated.actionPlan,
      });
    } catch {
      return JSON.stringify({
        error: "action_plan_failed",
        message: "The action plan could not be generated.",
      });
    }
  });

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ block: "end" });
  }, [transcript]);

  const start = useCallback(async () => {
    if (status === "connected" || status === "connecting") return;
    setError(null);

    const analysisId = analysis.id?.trim();
    if (!analysisId) {
      setError("This case has no analysis_id, so the voice agent cannot load it. Reload the case and try again.");
      return;
    }

    setStarting(true);
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not expose a microphone API. Open the app over HTTPS or localhost.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch((caught: unknown) => {
        const name = caught instanceof DOMException ? caught.name : "";
        if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          throw new Error("No microphone was found. Connect a microphone, then press Start again.");
        }
        if (name === "NotReadableError" || name === "TrackStartError") {
          throw new Error("Your microphone is busy in another app. Close it, then press Start again.");
        }
        if (name === "AbortError") {
          throw new Error("Microphone access was interrupted. Press Start and allow the microphone prompt.");
        }
        throw caught;
      });
      stream.getTracks().forEach((track) => track.stop());

      const current = analysisRef.current;
      const findingsBrief = current.findings
        .slice(0, 3)
        .map((finding, index) => `${index + 1}. ${finding.id}: ${finding.title}`)
        .join(" | ");
      const caseBrief =
        `${current.hospitalName}; service ${current.serviceDate ?? "unknown"}; ` +
        `total ${formatCents(current.totalBilledCents)}; ` +
        `${current.lineItems.length} line items; ${current.findings.length} findings` +
        (findingsBrief ? ` (${findingsBrief})` : "");

      const overrides: StartSessionOptions["overrides"] = {
        agent: {
          language: toAgentLanguage(language),
          firstMessage: firstMessageForLanguage(language),
        },
      };
      // Keep dynamic vars compact. Full JSON is available via client tool get_case_context.
      const dynamicVariables = {
        analysis_id: analysisId,
        hospital_name: current.hospitalName,
        hospital_id: current.hospitalId ?? "",
        service_date: current.serviceDate ?? "",
        total_billed: formatCents(current.totalBilledCents),
        finding_count: String(current.findings.length),
        case_brief: caseBrief,
      };

      setTranscript([]);

      if (!AGENT_ID) {
        throw new Error("Voice is not configured. Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID.");
      }
      startSession({ agentId: AGENT_ID, overrides, dynamicVariables });
    } catch (caught) {
      const name = caught instanceof DOMException ? caught.name : "";
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? `Microphone permission was blocked. Allow microphone access for ${window.location.origin}, then press Start again.`
          : caught instanceof Error
            ? caught.message
            : "Could not start the conversation. Check your network and press Start again.",
      );
    } finally {
      setStarting(false);
    }
  }, [analysis.id, language, setError, setTranscript, startSession, status]);

  const end = useCallback(() => {
    try {
      endSession();
    } catch {
      // already disconnected
    }
  }, [endSession]);

  const sendTyped = useCallback(() => {
    const text = input.trim();
    if (!text || status !== "connected") return;
    sendUserMessage(text);
    setInput("");
  }, [input, sendUserMessage, status]);

  const languageLabel =
    SUPPORTED_LANGUAGES.find((option) => option.code === language)?.label ?? language.toUpperCase();
  const isBusy = starting || status === "connecting";
  const isConnected = status === "connected";
  const connectionLabel = isConnected
    ? isSpeaking
      ? "Speaking"
      : isListening
        ? "Listening"
        : "Connected"
    : isBusy
      ? "Connecting…"
      : status === "error"
        ? "Connection error"
        : "Ready";

  return (
    <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Your billing guide</p>
            <h2 className="text-base font-semibold text-slate-900">{languageLabel}</h2>
            <p className="text-xs text-slate-500">{analysis.hospitalName}</p>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
              isConnected
                ? "bg-teal-50 text-teal-800"
                : status === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-slate-100 text-slate-600"
            }`}
            aria-live="polite"
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                isConnected ? "bg-teal-500" : status === "error" ? "bg-red-500" : "bg-slate-400"
              }`}
            />
            {connectionLabel}
          </span>
        </div>
        {status === "connected" && isMuted ? (
          <p className="mt-2 text-xs font-medium text-amber-700">Microphone muted</p>
        ) : null}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite" aria-label="Live transcript">
        {transcript.length === 0 ? (
          <p className="text-sm text-slate-500">
            The guide starts speaking in {languageLabel} after you press Start. It will call{" "}
            <code className="rounded bg-slate-100 px-1">focus_target</code> so the matching charge is
            highlighted on the left.
          </p>
        ) : (
          transcript.map((entry) => (
            <div
              key={`${entry.id}-${entry.text.slice(0, 12)}`}
              className={`max-w-[92%] rounded-xl px-3 py-2 text-sm ${
                entry.role === "agent"
                  ? "bg-slate-100 text-slate-800"
                  : "ml-auto bg-teal-700 text-white"
              }`}
            >
              <span className="sr-only">{entry.role === "agent" ? "Guide: " : "You: "}</span>
              {entry.text}
            </div>
          ))
        )}
        <div ref={transcriptEndRef} />
      </div>

      {error ? (
        <div className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700" role="alert">
          {error}
          {statusMessage && statusMessage !== error ? ` (${statusMessage})` : ""}
        </div>
      ) : null}

      {!AGENT_ID ? (
        <p className="mx-4 mb-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
          No <code>NEXT_PUBLIC_ELEVENLABS_AGENT_ID</code> is set, so voice is disabled. See{" "}
          <code>docs/ELEVENLABS_LANGUAGES.md</code>.
        </p>
      ) : null}

      <footer className="space-y-3 border-t border-slate-200 p-4">
        <div className="flex flex-wrap gap-2">
          {!isConnected && !isBusy ? (
            <button
              type="button"
              onClick={start}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            >
              Start conversation
            </button>
          ) : null}

          {isBusy ? (
            <button
              type="button"
              disabled
              className="cursor-wait rounded-lg bg-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Connecting…
            </button>
          ) : null}

          {isConnected ? (
            <>
              <button
                type="button"
                onClick={() => setMuted(!isMuted)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                aria-pressed={isMuted}
              >
                {isMuted ? "Unmute" : "Mute"}
              </button>
              <button
                type="button"
                onClick={end}
                className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                End
              </button>
            </>
          ) : null}
        </div>

        <div className="flex gap-2">
          <label className="sr-only" htmlFor="typed-question">
            Type a question
          </label>
          <input
            id="typed-question"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                sendTyped();
              }
            }}
            placeholder={isConnected ? "Type a question" : "Start the conversation to type"}
            disabled={!isConnected}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button
            type="button"
            onClick={sendTyped}
            disabled={!isConnected || input.trim().length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 enabled:hover:bg-slate-50 disabled:text-slate-400"
          >
            Send
          </button>
        </div>

        <p className="text-[11px] leading-snug text-slate-500">
          CareCounter does not call the hospital or your insurer. Unverified price differences are questions
          to ask, not confirmed overcharges. Never share account numbers, member IDs or your SSN.
        </p>
      </footer>
    </div>
  );
}
