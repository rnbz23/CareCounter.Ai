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

const SPOTLIGHT_MS = 3200;

/**
 * Smooth-scroll a target into the nearest scrollport (the bill column beside
 * the fixed chat) and restart a spotlight pulse so re-focus always animates.
 */
function scrollAndSpotlight(targetId: string) {
  if (typeof document === "undefined") return;

  const el = document.getElementById(targetDomId(targetId));
  if (!el) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "center",
    inline: "nearest",
  });

  try {
    el.focus({ preventScroll: true });
  } catch {
    // non-focusable targets are fine
  }

  el.classList.remove("cc-spotlight-active");
  // Force reflow so re-adding the class restarts the CSS animation.
  void el.offsetWidth;
  el.classList.add("cc-spotlight-active");
  el.setAttribute("data-spotlight", "true");

  window.setTimeout(() => {
    el.classList.remove("cc-spotlight-active");
    el.removeAttribute("data-spotlight");
  }, SPOTLIGHT_MS);
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

  if (options?.scroll !== false) {
    // Defer one frame so mobile tab switches can mount the target first.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => scrollAndSpotlight(focus.targetId));
    });
  }

  return "focused";
}
