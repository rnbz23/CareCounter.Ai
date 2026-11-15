import { describe, expect, it } from "vitest";

import { createAnalysis } from "@/lib/analysis/create";
import { updateAnalysisInsurance } from "@/lib/analysis/update-insurance";
import type {
  AssistanceOption,
  BillExtraction,
  InsuranceProfile,
} from "@/types/contracts";

const extraction: BillExtraction = {
  hospitalName: "Coastal Demo Hospital",
  serviceDate: "2026-11-10",
  totalBilledCents: 95_000,
  lineItems: [
    {
      id: "li_1",
      code: "71046",
      description: "Chest X-ray, two views",
      serviceDate: "2026-11-10",
      quantity: 1,
      billedCents: 95_000,
      anchor: null,
      extractionConfidence: "high",
    },
  ],
  notes: [],
};

const insuredProfile: InsuranceProfile = {
  coverage: "insured",
  insurerName: "Demo Health Plan",
  planName: "Demo Silver",
  planTier: "silver",
  networkStatus: "in_network",
  eobReceived: "yes",
  eobPatientResponsibilityCents: 25_000,
  state: "CA",
  householdSize: 2,
  incomeBand: "$50,000-$75,000",
};

function analysis() {
  return createAnalysis({
    extraction,
    inputType: "pdf",
    hospitalId: "coastal-demo-hospital",
    id: "analysis_test",
    now: new Date("2026-11-14T00:00:00.000Z"),
  });
}

describe("updateAnalysisInsurance", () => {
  it("replaces the insurance profile and preserves bill data", () => {
    const original = analysis();

    const updated = updateAnalysisInsurance(original, insuredProfile);

    expect(updated.insurance).toEqual(insuredProfile);
    expect(updated.id).toBe(original.id);
    expect(updated.lineItems).toEqual(original.lineItems);
    expect(updated.totalBilledCents).toBe(original.totalBilledCents);
    expect(updated.createdAt).toBe(original.createdAt);
  });

  it("clears assistance results that may be stale after an insurance change", () => {
    const assistance: AssistanceOption = {
      id: "aid_1",
      kind: "insurance_appeal",
      title: "Appeal the claim",
      status: "possible",
      explanation: "Synthetic option",
      evidenceIds: [],
      contactName: null,
      contactUrl: null,
      phone: null,
      confirmedPatientCostCents: null,
    };
    const original = {
      ...analysis(),
      assistanceOptions: [assistance],
      actionPlan: {
        payment: {
          currentKnownResponsibilityCents: 95_000,
          lowestConfirmedResponsibilityCents: null,
          savingsPossibleButUnverified: true,
          explanation: "Synthetic plan",
        },
        steps: [],
      },
    };

    const updated = updateAnalysisInsurance(original, insuredProfile);

    expect(updated.assistanceOptions).toEqual([]);
    expect(updated.actionPlan).toBeNull();
  });
});
