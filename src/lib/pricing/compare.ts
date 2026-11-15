import type { HospitalPriceRow } from "@/lib/db/neon";
import type { BillExtraction, Evidence, Finding, LineItem } from "@/types/contracts";

export interface BillComparison {
  findings: Finding[];
  evidence: Evidence[];
}

function normalizedDescription(description: string): string {
  return description.trim().replace(/\s+/g, " ").toLowerCase();
}

function duplicateKey(lineItem: LineItem): string | null {
  if (!lineItem.serviceDate) {
    return null;
  }

  return JSON.stringify([
    lineItem.serviceDate,
    lineItem.code?.trim().toLowerCase() ?? null,
    normalizedDescription(lineItem.description),
    lineItem.quantity,
    lineItem.billedCents,
  ]);
}

function duplicateFindings(lineItems: LineItem[]): Finding[] {
  const groups = new Map<string, LineItem[]>();

  for (const lineItem of lineItems) {
    const key = duplicateKey(lineItem);

    if (!key) {
      continue;
    }

    const group = groups.get(key) ?? [];
    group.push(lineItem);
    groups.set(key, group);
  }

  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group, index) => {
      const first = group[0];
      const possibleExtraChargeCents = first.billedCents * (group.length - 1);

      return {
        id: `finding_${index + 1}`,
        type: "possible_duplicate",
        severity: "review",
        lineItemIds: group.map((lineItem) => lineItem.id),
        title: "Possible duplicate charge",
        explanation: `${first.description} appears ${group.length} times with the same service date, code, quantity, and billed amount.`,
        billedCents: possibleExtraChargeCents,
        referenceCents: null,
        evidenceIds: [],
        questionToAsk: `Can you confirm whether each ${first.description} charge was billed for a separate service?`,
      } satisfies Finding;
    });
}

/**
 * Compares extracted bill lines with grounded reference data.
 *
 * Step one intentionally implements only conservative duplicate detection.
 * Price rows and source evidence are accepted now so future price comparisons
 * can extend this function without changing its cross-team API.
 */
export function compareBill(
  extraction: BillExtraction,
  _priceRows: HospitalPriceRow[] = [],
  _sourceEvidence: Evidence[] = [],
): BillComparison {
  return {
    findings: duplicateFindings(extraction.lineItems),
    evidence: [],
  };
}
