import type { FocusTarget, LineItem } from "@/types/contracts";
import { formatCents, formatDate } from "@/lib/format";
import { HighlightableTarget } from "./HighlightableTarget";
import { cn } from "@/lib/utils";

export function LineItemsTable({
  lineItems,
  activeFocus,
  onActivate,
  highlightedIds = [],
}: {
  lineItems: LineItem[];
  activeFocus: FocusTarget | null;
  onActivate?: (focus: FocusTarget) => void;
  highlightedIds?: string[];
}) {
  return (
    <div className="min-w-0 space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold text-navy-950">
          Charges on your bill
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          These are the line items we read from your statement.
        </p>
      </div>

      <div className="hidden min-w-0 overflow-x-auto rounded-2xl border border-ink-200 bg-white md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-paper-rule bg-paper-muted text-[11px] uppercase tracking-[0.12em] text-ink-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Service</th>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Qty</th>
              <th className="px-4 py-3 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => {
              const focused =
                activeFocus?.targetType === "line_item" &&
                activeFocus.targetId === item.id;
              const related = highlightedIds.includes(item.id);
              return (
                <tr
                  key={item.id}
                  id={`target-${item.id}`}
                  data-target-id={item.id}
                  data-cursor="finding"
                  onClick={() =>
                    onActivate?.({ targetType: "line_item", targetId: item.id })
                  }
                  className={cn(
                    "cursor-pointer border-t border-paper-rule transition-[background-color,box-shadow] duration-[180ms] ease-out",
                    focused
                      ? "bg-[#0f8f96]/12 shadow-[inset_3px_0_0_#0f8f96]"
                      : related
                        ? "bg-[#0f8f96]/06 shadow-[inset_3px_0_0_rgba(15,143,150,0.35)]"
                        : "hover:bg-[#0f8f96]/[0.055] hover:shadow-[inset_3px_0_0_rgba(15,143,150,0.35)]",
                  )}
                >
                  <td className="px-4 py-3.5 font-medium text-navy-950">
                    {item.description}
                    {related && !focused ? (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-[#0d737a]">
                        Related finding
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5 text-ink-600">{item.code ?? "—"}</td>
                  <td className="px-4 py-3.5 text-ink-600">
                    {formatDate(item.serviceDate)}
                  </td>
                  <td className="px-4 py-3.5 text-ink-600">{item.quantity}</td>
                  <td className="cc-amount px-4 py-3.5 text-right font-semibold text-navy-950">
                    {formatCents(item.billedCents)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 md:hidden">
        {lineItems.map((item) => (
          <HighlightableTarget
            key={item.id}
            targetType="line_item"
            targetId={item.id}
            activeFocus={activeFocus}
            onActivate={onActivate}
            className="p-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-navy-950">{item.description}</p>
                <p className="mt-1 text-xs text-ink-500">
                  {item.code ?? "No code"} · {formatDate(item.serviceDate)} · Qty{" "}
                  {item.quantity}
                </p>
              </div>
              <p className="cc-amount font-semibold text-navy-950">
                {formatCents(item.billedCents)}
              </p>
            </div>
          </HighlightableTarget>
        ))}
      </div>
    </div>
  );
}
