import { describe, expect, it } from "vitest";

import { createAnalysis } from "@/lib/analysis/create";
import {
  buildActionPlan,
  buildAssistanceOptions,
} from "@/lib/insurance/logic";
import type { BillExtraction, Evidence, InsuranceProfile } from "@/types/contracts";

const extraction: BillExtraction = {
  hospitalName: "Sharp Memorial Hospital",
  serviceDate: "2026-11-10",
  totalBilledCents: 137_550,
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

const hospitalAid: Evidence = {
  id: "evidence_sharp_financial_assistance",
  kind: "hospital_assistance",
  title: "Sharp HealthCare financial assistance",
  sourceUrl: "https://www.sharp.com/billing/financial-assistance",
  retrievedAt: "2026-11-15T00:00:00.000Z",
  hospitalId: "sharp-memorial-hospital",
  code: null,
  priceType: "not_applicable",
  amountCents: null,
  note: "Sharp describes financial assistance and directs applicants to call 858-499-2400. Eligibility is not established until Sharp reviews an application.",
};

const insurerContact: Evidence = {
  id: "evidence_sharp_health_plan_contact",
  kind: "insurer_contact",
  title: "Sharp Health Plan member contact",
  sourceUrl: "https://www.sharphealthplan.com/members",
  retrievedAt: "2026-11-15T00:00:00.000Z",
  hospitalId: null,
  code: null,
  priceType: "not_applicable",
  amountCents: null,
  note: "Sharp Health Plan directs members to Customer Care at 1-800-359-2002.",
};

function baseAnalysis(insurance?: Partial<InsuranceProfile>) {
  const analysis = createAnalysis({
    extraction,
    inputType: "image",
    hospitalId: "sharp-memorial-hospital",
    id: "analysis_insurance_test",
    now: new Date("2026-11-14T00:00:00.000Z"),
  });
  return {
    ...analysis,
    insurance: {
      ...analysis.insurance,
      ...insurance,
    },
  };
}

describe("buildAssistanceOptions", () => {
  it("marks uninsured hospital aid as possible and never confirms cost", () => {
    const analysis = baseAnalysis({ coverage: "uninsured", state: "CA" });
    const options = buildAssistanceOptions(analysis, [hospitalAid]);

    expect(options).toHaveLength(1);
    expect(options[0]?.kind).toBe("hospital_charity");
    expect(options[0]?.status).toBe("possible");
    expect(options[0]?.confirmedPatientCostCents).toBeNull();
    expect(options[0]?.phone).toBe("858-499-2400");
    expect(options[0]?.explanation).toMatch(/not established|possibility/i);
  });

  it("surfaces insurer contact evidence for insured coverage", () => {
    const analysis = baseAnalysis({
      coverage: "insured",
      insurerName: "Sharp Health Plan",
    });
    const options = buildAssistanceOptions(analysis, [insurerContact, hospitalAid]);

    expect(options.some((option) => option.kind === "insurance_appeal")).toBe(true);
    expect(options.every((option) => option.status !== "confirmed")).toBe(true);
  });
});

describe("buildActionPlan", () => {
  it("labels user-provided EOB amounts without inventing a confirmed minimum", () => {
    const analysis = {
      ...baseAnalysis({
        coverage: "insured",
        eobReceived: "yes",
        eobPatientResponsibilityCents: 25_000,
      }),
      assistanceOptions: buildAssistanceOptions(
        baseAnalysis({ coverage: "insured" }),
        [insurerContact],
      ),
    };

    const plan = buildActionPlan(analysis);

    expect(plan.steps).toHaveLength(3);
    expect(plan.payment.currentKnownResponsibilityCents).toBe(25_000);
    expect(plan.payment.lowestConfirmedResponsibilityCents).toBeNull();
    expect(plan.payment.explanation).toMatch(/user-provided/i);
    expect(plan.steps[0]?.id).toBe("step_1");
  });

  it("keeps uninsured plans free of fabricated savings", () => {
    const analysis = {
      ...baseAnalysis({ coverage: "uninsured", state: "CA" }),
      assistanceOptions: buildAssistanceOptions(
        baseAnalysis({ coverage: "uninsured" }),
        [hospitalAid],
      ),
    };

    const plan = buildActionPlan(analysis);

    expect(plan.payment.currentKnownResponsibilityCents).toBeNull();
    expect(plan.payment.lowestConfirmedResponsibilityCents).toBeNull();
    expect(plan.steps[1]?.title).toMatch(/financial assistance/i);
  });
});
