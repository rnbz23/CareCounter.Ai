import { KNOWN_HOSPITALS } from "@/lib/data/hospitals";
import { getHospitalPrices, getSourceEvidence } from "@/lib/db/neon";
import type { HospitalPriceRow } from "@/lib/db/neon";
import type { Evidence, LineItem } from "@/types/contracts";

export interface GrossPriceReferences {
  priceRows: HospitalPriceRow[];
  evidence: Evidence[];
}

/**
 * Prefer the bill's hospital snapshot. When the hospital is unknown / unmatched
 * (or a code is missing there), fall back to the first known ingested hospital
 * (Sharp Memorial) so CPT codes can still be compared to a public gross-charge
 * snapshot. Findings stay questions to ask — not confirmed overcharges.
 */
export async function getGrossPriceReferences(
  hospitalId: string | null,
  lineItems: LineItem[],
): Promise<GrossPriceReferences> {
  const codes = [
    ...new Set(
      lineItems
        .map((lineItem) => lineItem.code?.trim())
        .filter((code): code is string => Boolean(code)),
    ),
  ];
  if (codes.length === 0) {
    return { priceRows: [], evidence: [] };
  }

  const primaryId = hospitalId;
  const fallbackId =
    KNOWN_HOSPITALS.find((hospital) => hospital.id !== primaryId)?.id ??
    KNOWN_HOSPITALS[0]?.id ??
    null;
  const lookupIds = [...new Set([primaryId, fallbackId].filter(Boolean))] as string[];

  if (lookupIds.length === 0) {
    return { priceRows: [], evidence: [] };
  }

  const groups = await Promise.all(
    lookupIds.flatMap((id) =>
      codes.map((code) => getHospitalPrices(id, code, "gross")),
    ),
  );
  let priceRows = groups.flat();

  // Prefer rows from the bill hospital when both exist for the same code.
  if (primaryId) {
    const primaryCodes = new Set(
      priceRows.filter((row) => row.hospitalId === primaryId).map((row) => row.code),
    );
    priceRows = priceRows.filter(
      (row) => row.hospitalId === primaryId || !primaryCodes.has(row.code),
    );
  }

  const evidenceIds = [...new Set(priceRows.map((price) => price.evidenceId))];
  const evidence = await getSourceEvidence(evidenceIds);

  return { priceRows, evidence };
}
