import type { AgentContext, Analysis } from "@/types/contracts";

const FORMATTED_USD = /\$((?:\d{1,3}(?:,\d{3})+|\d+))(?:\.(\d{1,2}))?/g;

/** Convert integer US cents to a plain decimal string with no thousands separators. */
export function usdPlainFromCents(cents: number): string {
  const value = Math.trunc(Math.abs(cents));
  const dollars = Math.floor(value / 100);
  const remainder = value % 100;
  return `${cents < 0 ? "-" : ""}${dollars}.${remainder.toString().padStart(2, "0")}`;
}

/**
 * Replace any display-formatted USD text inside an agent-readable string with
 * plain USD. This is intentionally voice-only; UI formatting stays unchanged.
 */
export function replaceFormattedUsd(text: string): string {
  return text.replace(FORMATTED_USD, (_match, whole: string, fraction?: string) => {
    const dollars = whole.replace(/,/g, "");
    const cents = fraction?.padEnd(2, "0") ?? "00";
    return `${dollars}.${cents} USD`;
  });
}

/** Compact spoken case summary with plain USD and integer cents. */
export function buildVoiceCaseBrief(analysis: Analysis): string {
  const totalUsd = usdPlainFromCents(analysis.totalBilledCents);
  const findingsBrief = analysis.findings
    .slice(0, 3)
    .map((finding, index) => `${index + 1}. ${finding.id}: ${finding.title}`)
    .join(" | ");

  return (
    `${analysis.hospitalName}; service ${analysis.serviceDate ?? "unknown"}; ` +
    `total ${totalUsd} USD (${analysis.totalBilledCents} cents); ` +
    `${analysis.lineItems.length} line items; ${analysis.findings.length} findings` +
    (findingsBrief ? ` (${findingsBrief})` : "")
  );
}

/**
 * Serialize the canonical case context for the voice agent. Integer cent fields
 * stay integer cents, but every string is stripped of comma-formatted currency.
 */
export function serializeVoiceCaseContext(context: AgentContext): string {
  const totalUsd = usdPlainFromCents(context.totalBilledCents);
  const sanitized = JSON.parse(
    JSON.stringify(context, (_key, value) =>
      typeof value === "string" ? replaceFormattedUsd(value) : value,
    ),
  ) as AgentContext;

  return JSON.stringify({
    ...sanitized,
    total_billed: `${totalUsd} USD`,
    total_billed_usd: totalUsd,
    money_reading_rule:
      `All fields ending in Cents are integer US cents, not dollars. ` +
      `totalBilledCents=${context.totalBilledCents} means ${totalUsd} USD. ` +
      `When speaking money, use total_billed_usd or total_billed, which are plain USD. ` +
      `Never drop digits or read cents as dollars. Example: 1758000 cents = 17580.00 USD.`,
  });
}
