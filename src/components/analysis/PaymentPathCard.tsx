import type { ActionPlan, FocusTarget } from "@/types/contracts";
import { formatCents } from "@/lib/format";
import { HighlightableTarget } from "./HighlightableTarget";

export function PaymentPathCard({
  plan,
  activeFocus,
  onActivate,
}: {
  plan: ActionPlan;
  activeFocus: FocusTarget | null;
  onActivate?: (focus: FocusTarget) => void;
}) {
  return (
    <div className="space-y-3">
      <HighlightableTarget
        targetType="payment"
        targetId="payment"
        activeFocus={activeFocus}
        onActivate={onActivate}
        className="p-5"
      >
        <h3 className="font-display text-xl font-semibold text-navy-950">
          Payment summary
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          {plan.payment.explanation}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-paper-muted px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              Known now
            </p>
            <p className="cc-amount mt-1.5 font-display text-xl font-semibold text-navy-950">
              {formatCents(plan.payment.currentKnownResponsibilityCents)}
            </p>
          </div>
          <div className="rounded-xl bg-paper-muted px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              Lowest confirmed
            </p>
            <p className="cc-amount mt-1.5 font-display text-xl font-semibold text-navy-950">
              {formatCents(plan.payment.lowestConfirmedResponsibilityCents)}
            </p>
          </div>
        </div>
      </HighlightableTarget>

      {plan.steps.map((step, index) => (
        <HighlightableTarget
          key={step.id}
          targetType="step"
          targetId={step.id}
          activeFocus={activeFocus}
          onActivate={onActivate}
          className="p-5"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {index + 1}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-500">
              {step.priority}
            </span>
          </div>
          <h4 className="mt-3 font-display text-lg font-semibold text-navy-950">
            {step.title}
          </h4>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
            {step.instruction}
          </p>
        </HighlightableTarget>
      ))}
    </div>
  );
}
