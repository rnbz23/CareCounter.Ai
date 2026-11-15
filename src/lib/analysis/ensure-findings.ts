import { updateAnalysis } from "@/lib/db/neon";
import { compareBill } from "@/lib/pricing/compare";
import { getGrossPriceReferences } from "@/lib/pricing/references";
import { AnalysisSchema, BillExtractionSchema, type Analysis } from "@/types/contracts";

/**
 * Recompute duplicate + public-price findings for a saved analysis.
 *
 * Older cases created before the Sharp fallback (or before more CPT codes were
 * ingested) may only show duplicates. Refreshing on page load surfaces
 * overpriced-line findings without requiring a full re-upload.
 */
export async function ensureAnalysisFindingsReady(
  analysis: Analysis,
): Promise<Analysis> {
  try {
    const references = await getGrossPriceReferences(
      analysis.hospitalId,
      analysis.lineItems,
    );
    if (references.priceRows.length === 0) {
      return analysis;
    }

    const extraction = BillExtractionSchema.parse({
      hospitalName: analysis.hospitalName,
      serviceDate: analysis.serviceDate,
      totalBilledCents: analysis.totalBilledCents,
      lineItems: analysis.lineItems,
      notes: [],
    });
    const comparison = compareBill(
      extraction,
      references.priceRows,
      references.evidence,
    );

    const previousFindingKey = JSON.stringify(
      analysis.findings.map((finding) => [
        finding.type,
        finding.lineItemIds,
        finding.billedCents,
        finding.referenceCents,
      ]),
    );
    const nextFindingKey = JSON.stringify(
      comparison.findings.map((finding) => [
        finding.type,
        finding.lineItemIds,
        finding.billedCents,
        finding.referenceCents,
      ]),
    );

    if (previousFindingKey === nextFindingKey) {
      return analysis;
    }

    const evidenceById = new Map(analysis.evidence.map((item) => [item.id, item]));
    for (const item of comparison.evidence) {
      evidenceById.set(item.id, item);
    }

    const next = AnalysisSchema.parse({
      ...analysis,
      findings: comparison.findings,
      evidence: [...evidenceById.values()],
    });

    try {
      await updateAnalysis(next);
    } catch {
      // Still return recomputed findings if Neon write fails.
    }

    return next;
  } catch {
    return analysis;
  }
}
