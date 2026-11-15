"use client";

/**
 * PLACEHOLDER for Sumedh.
 * Replace this file with the real ElevenLabs ConversationProvider + client tools.
 * Do not rewrite VoicePanel layout when integrating — compose this inside VoicePanel.
 */
import type { Analysis, FocusTarget } from "@/types/contracts";

export type AgentRuntimeProps = {
  analysis: Analysis;
  language: string;
  onFocus: (focus: FocusTarget) => string;
  onUpdated: () => Promise<void> | void;
};

export function AgentRuntime(props: AgentRuntimeProps) {
  void props;
  return (
    <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50 px-3 py-2 text-xs text-ink-600">
      AgentRuntime placeholder — Sumedh owns ElevenLabs integration.
    </div>
  );
}
