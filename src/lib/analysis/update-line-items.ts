import { compareBill } from "@/lib/pricing/compare";
import type { HospitalPriceRow } from "@/lib/db/neon";
import {
  AnalysisSchema,
  BillExtractionSchema,
  type Analysis,
  type Evidence,
  type LineItem,
} from "@/types/contracts";

export function updateAnalysisLineItems(
  analysis: Analysis,
  lineItems: LineItem[],
  priceRows: HospitalPriceRow[] = [],
  sourceEvidence: Evidence[] = [],
): Analysis {
  const totalBilledCents = lineItems.reduce(
    (total, lineItem) => total + lineItem.billedCents,
    0,
  );
  const extraction = BillExtractionSchema.parse({
    hospitalName: analysis.hospitalName,
    serviceDate: analysis.serviceDate,
    totalBilledCents,
    lineItems,
    notes: [],
  });
  const comparison = compareBill(extraction, priceRows, sourceEvidence);

  return AnalysisSchema.parse({
    ...analysis,
    totalBilledCents,
    lineItems,
    findings: comparison.findings,
    evidence: comparison.evidence,
  });
}
