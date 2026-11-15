import type { HospitalPriceRow } from "@/lib/db/neon";
import type { BillExtraction, Evidence, Finding, LineItem } from "@/types/contracts";

export interface BillComparison {
  findings: Finding[];
  evidence: Evidence[];
}

const PRICE_DIFFERENCE_THRESHOLD = 0.25;

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

function priceDifferenceFindings(
  lineItems: LineItem[],
  priceRows: HospitalPriceRow[],
  sourceEvidence: Evidence[],
  startingIndex: number,
): { findings: Finding[]; evidence: Evidence[] } {
  const evidenceById = new Map(sourceEvidence.map((evidence) => [evidence.id, evidence]));
  const findings: Finding[] = [];
  const usedEvidence = new Map<string, Evidence>();

  for (const lineItem of lineItems) {
    if (!lineItem.code) continue;

    const candidates = priceRows.filter(
      (price) =>
        price.code === lineItem.code &&
        price.priceType === "gross" &&
        price.unitSemantics?.includes("one listed service"),
    );
    const distinctAmounts = [...new Set(candidates.map((price) => price.amountCents))];

    // Multiple gross amounts can represent different settings or units. Without
    // a unique comparable amount, do not select a convenient reference.
    if (distinctAmounts.length !== 1) continue;

    const price = candidates.find((candidate) => candidate.amountCents === distinctAmounts[0]);
    if (!price) continue;

    const evidence = evidenceById.get(price.evidenceId);
    if (
      !evidence ||
      evidence.kind !== "hospital_price" ||
      evidence.hospitalId !== price.hospitalId ||
      evidence.code !== price.code ||
      evidence.priceType !== price.priceType ||
      evidence.amountCents !== price.amountCents
    ) {
      continue;
    }

    const referenceCents = price.amountCents * lineItem.quantity;
    if (!Number.isSafeInteger(referenceCents) || referenceCents <= 0) continue;

    const differenceCents = lineItem.billedCents - referenceCents;
    if (differenceCents <= 0) continue;

    const relativeDifference = differenceCents / referenceCents;
    if (relativeDifference < PRICE_DIFFERENCE_THRESHOLD) continue;

    findings.push({
      id: `finding_${startingIndex + findings.length + 1}`,
      type: "hospital_price_difference",
      severity: "review",
      lineItemIds: [lineItem.id],
      title: "Billed amount differs from published gross charge",
      explanation:
        "The billed amount is at least 25% above the hospital's published gross charge for the same printed code and quantity. This is not proof of an error, but it is worth asking the billing office to explain the difference.",
      billedCents: lineItem.billedCents,
      referenceCents,
      evidenceIds: [evidence.id],
      questionToAsk:
        "Can you explain why this billed amount is higher than the published gross charge for the same code?",
    });
    usedEvidence.set(evidence.id, evidence);
  }

  return { findings, evidence: [...usedEvidence.values()] };
}

/**
 * Compares extracted bill lines with grounded reference data.
 *
 * Duplicate and public-price checks are deterministic. Price findings require a
 * single comparable gross amount and matching stored evidence.
 */
export function compareBill(
  extraction: BillExtraction,
  priceRows: HospitalPriceRow[] = [],
  sourceEvidence: Evidence[] = [],
): BillComparison {
  const duplicates = duplicateFindings(extraction.lineItems);
  const priceDifferences = priceDifferenceFindings(
    extraction.lineItems,
    priceRows,
    sourceEvidence,
    duplicates.length,
  );

  return {
    findings: [...duplicates, ...priceDifferences.findings],
    evidence: priceDifferences.evidence,
  };
}
