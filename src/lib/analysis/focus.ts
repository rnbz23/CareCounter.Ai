import type { Analysis, FocusTarget } from "@/types/contracts";

export function targetDomId(targetId: string): string {
  return `target-${targetId}`;
}

export function isValidFocusTarget(
  analysis: Analysis,
  focus: FocusTarget,
): boolean {
  switch (focus.targetType) {
    case "line_item":
      return analysis.lineItems.some((item) => item.id === focus.targetId);
    case "finding":
      return analysis.findings.some((finding) => finding.id === focus.targetId);
    case "assistance":
      return analysis.assistanceOptions.some(
        (option) => option.id === focus.targetId,
      );
    case "step":
      return (
        analysis.actionPlan?.steps.some((step) => step.id === focus.targetId) ??
        false
      );
    case "payment":
      return focus.targetId === "payment" && analysis.actionPlan !== null;
    default:
      return false;
  }
}

/**
 * Validate a FocusTarget against the current Analysis.
 * Returns "focused" | "cleared" | "unknown_target" for Sumedh's AgentRuntime.
 */
export function applyFocusTarget(
  analysis: Analysis,
  focus: FocusTarget | null,
  setActiveFocus: (next: FocusTarget | null) => void,
  options?: { scroll?: boolean },
): "focused" | "cleared" | "unknown_target" {
  if (focus === null) {
    setActiveFocus(null);
    return "cleared";
  }

  if (!isValidFocusTarget(analysis, focus)) {
    return "unknown_target";
  }

  setActiveFocus(focus);

  if (options?.scroll !== false && typeof document !== "undefined") {
    const el = document.getElementById(targetDomId(focus.targetId));
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  return "focused";
}
