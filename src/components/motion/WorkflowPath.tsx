import { cn } from "@/lib/utils";

const STEPS = [
  { key: "understand", label: "Understand your bill" },
  { key: "verify", label: "Check your options" },
  { key: "action", label: "Take action" },
] as const;

export type WorkflowStep = (typeof STEPS)[number]["key"];

export function WorkflowPath({
  active,
  className,
}: {
  active: WorkflowStep;
  className?: string;
}) {
  const activeIndex = STEPS.findIndex((step) => step.key === active);

  return (
    <ol
      aria-label="Your progress"
      className={cn(
        "flex flex-wrap items-center gap-y-2 text-[11px] font-semibold uppercase tracking-[0.1em]",
        className,
      )}
    >
      {STEPS.map((step, index) => {
        const done = index < activeIndex;
        const current = index === activeIndex;
        return (
          <li key={step.key} className="flex items-center gap-2">
            {index > 0 ? (
              <span
                aria-hidden
                className={cn(
                  "mx-1 hidden h-px w-8 sm:block",
                  done || current ? "bg-cobalt-500" : "bg-ink-200",
                )}
              />
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-all duration-200",
                current && "bg-cobalt-500/12 text-cobalt-700",
                done && !current && "text-cobalt-700",
                !done && !current && "text-ink-400",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                  current || done
                    ? "bg-cobalt-700 text-white"
                    : "bg-ink-100 text-ink-500",
                )}
              >
                {index + 1}
              </span>
              <span className="normal-case tracking-normal">{step.label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
