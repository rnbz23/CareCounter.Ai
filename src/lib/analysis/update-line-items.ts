import { compareBill } from "@/lib/pricing/compare";
import {
  AnalysisSchema,
  BillExtractionSchema,
  type Analysis,
  type LineItem,
} from "@/types/contracts";

export function updateAnalysisLineItems(
  analysis: Analysis,
  lineItems: LineItem[],
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
  const comparison = compareBill(extraction);

  return AnalysisSchema.parse({
    ...analysis,
    totalBilledCents,
    lineItems,
    findings: comparison.findings,
    evidence: comparison.evidence,
  });
}
