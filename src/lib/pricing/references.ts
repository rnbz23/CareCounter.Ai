import { getHospitalPrices, getSourceEvidence } from "@/lib/db/neon";
import type { HospitalPriceRow } from "@/lib/db/neon";
import type { Evidence, LineItem } from "@/types/contracts";

export interface GrossPriceReferences {
  priceRows: HospitalPriceRow[];
  evidence: Evidence[];
}

export async function getGrossPriceReferences(
  hospitalId: string | null,
  lineItems: LineItem[],
): Promise<GrossPriceReferences> {
  if (!hospitalId) {
    return { priceRows: [], evidence: [] };
  }

  const codes = [
    ...new Set(
      lineItems
        .map((lineItem) => lineItem.code?.trim())
        .filter((code): code is string => Boolean(code)),
    ),
  ];
  const groups = await Promise.all(
    codes.map((code) => getHospitalPrices(hospitalId, code, "gross")),
  );
  const priceRows = groups.flat();
  const evidenceIds = [...new Set(priceRows.map((price) => price.evidenceId))];
  const evidence = await getSourceEvidence(evidenceIds);

  return { priceRows, evidence };
}
