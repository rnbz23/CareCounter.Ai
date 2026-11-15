import { fetchPublicPageWithBrightData } from "@/lib/data/bright-data";
import { EvidenceSchema, type Evidence } from "@/types/contracts";

export const PUBLIC_RESOURCE_DEFINITIONS = [
  {
    id: "evidence_sharp_financial_assistance",
    kind: "hospital_assistance",
    title: "Sharp HealthCare financial assistance",
    sourceUrl: "https://www.sharp.com/billing/financial-assistance",
    hospitalId: "sharp-memorial-hospital",
    note:
      "Sharp describes financial assistance for qualifying emergency or medically necessary hospital care and directs applicants to call 858-499-2400. Eligibility is not established until Sharp reviews an application.",
    markers: ["financial assistance", "858-499-2400"],
  },
  {
    id: "evidence_sharp_health_plan_contact",
    kind: "insurer_contact",
    title: "Sharp Health Plan member contact",
    sourceUrl: "https://www.sharphealthplan.com/members",
    hospitalId: null,
    note:
      "Sharp Health Plan directs members to Customer Care at 1-800-359-2002 or 1-858-499-8300. Members should use the contact information on their ID card when available.",
    markers: ["Sharp Health Plan", "1-800-359-2002"],
  },
  {
    id: "evidence_sharp_health_plan_grievance",
    kind: "insurer_policy",
    title: "Sharp Health Plan complaint and appeal process",
    sourceUrl: "https://www.sharphealthplan.com/how-to-file-a-complaint",
    hospitalId: null,
    note:
      "Sharp Health Plan provides a formal grievance and appeal process. The correct process depends on how the member enrolled and the type of plan.",
    markers: ["complaint", "grievance"],
  },
  {
    id: "evidence_california_medi_cal_apply",
    kind: "government_program",
    title: "Covered California Medi-Cal information",
    sourceUrl: "https://www.coveredca.com/health/medi-cal/",
    hospitalId: null,
    note:
      "Covered California is an official state application partner for Medi-Cal and explains how to apply. CareCounter does not determine eligibility.",
    markers: ["Medi-Cal", "Apply"],
  },
  {
    id: "evidence_health_consumer_alliance",
    kind: "nonprofit_program",
    title: "Health Consumer Alliance",
    sourceUrl: "https://healthconsumer.org/",
    hospitalId: null,
    note:
      "Health Consumer Alliance offers free help to Californians with health coverage and medical-debt problems. Availability and case acceptance must be confirmed with the organization.",
    markers: ["Health Consumer Alliance"],
  },
] as const;

type PublicPageFetcher = typeof fetchPublicPageWithBrightData;

export async function fetchPublicResourceEvidence(
  fetchPage: PublicPageFetcher = fetchPublicPageWithBrightData,
): Promise<Evidence[]> {
  return Promise.all(
    PUBLIC_RESOURCE_DEFINITIONS.map(async (definition) => {
      const result = await fetchPage(definition.sourceUrl);
      const normalizedContent = result.content.toLowerCase();
      const missingMarkers = definition.markers.filter(
        (marker) => !normalizedContent.includes(marker.toLowerCase()),
      );

      if (missingMarkers.length > 0) {
        throw new Error(
          `Public resource validation failed for ${definition.id}: ${missingMarkers.join(", ")}`,
        );
      }

      return EvidenceSchema.parse({
        id: definition.id,
        kind: definition.kind,
        title: definition.title,
        sourceUrl: result.sourceUrl,
        retrievedAt: result.retrievedAt,
        hospitalId: definition.hospitalId,
        code: null,
        priceType: "not_applicable",
        amountCents: null,
        note: definition.note,
      });
    }),
  );
}
