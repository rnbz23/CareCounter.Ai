import type { AssistanceOption, FocusTarget } from "@/types/contracts";
import { formatCents } from "@/lib/format";
import {
  assistanceStatusLabel,
  assistanceWhoItHelps,
} from "@/lib/copy/patient";
import { HighlightableTarget } from "./HighlightableTarget";

export function AssistanceCard({
  option,
  activeFocus,
  onActivate,
}: {
  option: AssistanceOption;
  activeFocus: FocusTarget | null;
  onActivate?: (focus: FocusTarget) => void;
}) {
  return (
    <HighlightableTarget
      targetType="assistance"
      targetId={option.id}
      activeFocus={activeFocus}
      onActivate={onActivate}
      className="p-5"
    >
      <span className="rounded-md bg-cobalt-500/12 px-2 py-0.5 text-[11px] font-semibold text-cobalt-700">
        {assistanceStatusLabel(option.status)}
      </span>
      <h3 className="mt-3 font-display text-lg font-semibold text-navy-950">
        {option.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        {option.explanation}
      </p>
      <p className="mt-3 text-sm text-ink-700">
        <span className="font-semibold text-navy-950">Who it may help: </span>
        {assistanceWhoItHelps(option)}
      </p>
      <p className="mt-2 text-sm text-ink-500">
        Confirmed patient cost:{" "}
        <span className="font-semibold text-navy-950">
          {formatCents(option.confirmedPatientCostCents)}
        </span>
      </p>
      {(option.contactName || option.contactUrl || option.phone) && (
        <div className="mt-3 border-t border-paper-rule pt-3 text-sm text-ink-700">
          {option.contactName ? <p>{option.contactName}</p> : null}
          {option.phone ? <p>{option.phone}</p> : null}
          {option.contactUrl ? (
            <a
              href={option.contactUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-cobalt-700 hover:underline"
            >
              Official program link
            </a>
          ) : null}
        </div>
      )}
    </HighlightableTarget>
  );
}
