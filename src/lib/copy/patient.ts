import type {
  AssistanceOption,
  Finding,
  LineItem,
  PaymentSummary,
} from "@/types/contracts";
import { formatCents } from "@/lib/format";

/** Plain-language presentation helpers. Do not invent facts or confirm uncertain findings. */

export function severityLabel(severity: Finding["severity"]): string {
  switch (severity) {
    case "priority":
      return "Worth checking first";
    case "review":
      return "Worth checking";
    default:
      return "For your information";
  }
}

export function assistanceStatusLabel(status: AssistanceOption["status"]): string {
  switch (status) {
    case "confirmed":
      return "Confirmed option";
    case "needs_information":
      return "Needs more information";
    default:
      return "Possible option";
  }
}

export function patientFindingTitle(
  finding: Finding,
  lineItems: LineItem[],
): string {
  const related = lineItems.find((item) => finding.lineItemIds.includes(item.id));
  const service = related?.description?.toLowerCase() ?? "this charge";

  switch (finding.type) {
    case "hospital_price_difference":
      return `Your ${service} looks higher than a public reference price`;
    case "possible_duplicate":
      return `We found two similar charges that may be duplicates`;
    case "medicare_context":
      return `This charge may be useful to compare with Medicare pricing context`;
    case "eob_mismatch":
      return `Something on this bill may not match an Explanation of Benefits`;
    case "unverified_code":
      return `We couldn't fully verify a billing code on this charge`;
    default:
      return finding.title;
  }
}

export function patientFindingWhy(
  finding: Finding,
  lineItems: LineItem[],
): string {
  const related = lineItems.filter((item) =>
    finding.lineItemIds.includes(item.id),
  );

  switch (finding.type) {
    case "hospital_price_difference": {
      const billed = formatCents(finding.billedCents);
      const reference =
        finding.referenceCents === null
          ? null
          : formatCents(finding.referenceCents);
      if (reference) {
        return `Your bill shows ${billed}. We found a public reference around ${reference}. Prices can vary, so this is something to ask about — not proof the hospital made a mistake.`;
      }
      return `This charge stands out compared with public pricing information. Ask the hospital how it was calculated. This is not proof of an incorrect charge.`;
    }
    case "possible_duplicate": {
      const names = related.map((item) => item.description).join(" / ");
      return `Both charges appear to describe a similar service${related[0]?.serviceDate ? " on the same date" : ""}${names ? ` (${names})` : ""}. They may be legitimate separate services — or one may be a duplicate. Ask the hospital to confirm.`;
    }
    default:
      return finding.explanation;
  }
}

export function patientAskAction(finding: Finding): string {
  return finding.questionToAsk;
}

export function formatKnownResponsibility(cents: number | null): string {
  if (cents === null) return "Not confirmed yet";
  return formatCents(cents);
}

export function formatConfirmedResponsibility(cents: number | null): string {
  if (cents === null) return "Not established yet";
  return formatCents(cents);
}

export function reviewSummary(findingCount: number, lineCount: number): string {
  if (findingCount === 0) {
    return `We reviewed ${lineCount} charge${lineCount === 1 ? "" : "s"} on your bill.`;
  }
  return `We reviewed your bill and found ${findingCount} charge${findingCount === 1 ? "" : "s"} worth checking.`;
}

export function patientPaymentHeadline(payment: PaymentSummary): string {
  return payment.lowestConfirmedResponsibilityCents === null
    ? "We haven't confirmed how much you personally need to pay yet"
    : "Here's what we know about what you may owe";
}

export function patientPaymentBody(
  payment: PaymentSummary,
  totalBilledCents: number,
): string {
  if (payment.lowestConfirmedResponsibilityCents === null) {
    return `Your hospital bill total is ${formatCents(totalBilledCents)}. That is what the hospital billed — not necessarily what you personally owe. Insurance details or an Explanation of Benefits (EOB) can help clarify your share.`;
  }
  return payment.explanation;
}

export function assistanceWhoItHelps(option: AssistanceOption): string {
  switch (option.kind) {
    case "hospital_charity":
      return "May help if you are uninsured or have trouble paying the full bill.";
    case "self_pay_discount":
      return "May help if you are paying without insurance or paying promptly.";
    case "medicaid":
      return "May help if you qualify for state or federal coverage support.";
    case "nonprofit":
      return "May help through community or nonprofit billing assistance programs.";
    case "insurance_appeal":
      return "May help if you believe an insurer decision should be reviewed.";
    default:
      return "May help depending on your situation.";
  }
}
