"use client";

import type { FocusTarget } from "@/types/contracts";
import { targetDomId } from "@/lib/analysis/focus";
import { cn } from "@/lib/utils";

export function HighlightableTarget({
  targetType,
  targetId,
  activeFocus,
  onActivate,
  children,
  className,
}: {
  targetType: FocusTarget["targetType"];
  targetId: string;
  activeFocus: FocusTarget | null;
  onActivate?: (focus: FocusTarget) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const isActive =
    activeFocus?.targetType === targetType &&
    activeFocus?.targetId === targetId;

  const cursor =
    targetType === "finding"
      ? "finding"
      : onActivate
        ? "card"
        : undefined;

  return (
    <div
      id={targetDomId(targetId)}
      data-target-id={targetId}
      data-target-type={targetType}
      data-cursor={cursor}
      tabIndex={onActivate ? 0 : undefined}
      role={onActivate ? "button" : undefined}
      aria-pressed={onActivate ? isActive : undefined}
      onClick={
        onActivate
          ? () => onActivate({ targetType, targetId })
          : undefined
      }
      onKeyDown={
        onActivate
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onActivate({ targetType, targetId });
              }
            }
          : undefined
      }
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white p-4 transition-all duration-[200ms] ease-out",
        isActive
          ? "cc-active-card z-[1] -translate-y-1 border-[#0f8f96] bg-[#0f8f96]/08"
          : "border-ink-200/90 hover:-translate-y-1 hover:border-[#0f8f96]/45 hover:shadow-panel",
        onActivate &&
          "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f8f96]",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-3 left-0 w-1 rounded-r-full transition-all duration-[180ms]",
          isActive ? "bg-[#0f8f96]" : "bg-transparent group-hover:bg-[#0f8f96]/40",
        )}
      />
      {isActive ? (
        <div className="cc-tip-enter mb-3 inline-flex items-center gap-2 rounded-lg bg-[#0d737a] px-2.5 py-1 text-[11px] font-semibold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white cc-speaking-dot" />
          Guide is explaining this
        </div>
      ) : null}
      {children}
    </div>
  );
}
