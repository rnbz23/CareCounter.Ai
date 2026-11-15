import { describe, expect, it } from "vitest";

import { buildAgentContext } from "@/lib/analysis/agent-context";
import { createAnalysis } from "@/lib/analysis/create";
import { compareBill } from "@/lib/pricing/compare";
import type { Analysis, BillExtraction, Evidence } from "@/types/contracts";

function analysis(): Analysis {
  const extraction: BillExtraction = {
    hospitalName: "Coastal Demo Hospital",
    serviceDate: "2026-11-10",
    totalBilledCents: 36_000,
    lineItems: [
      {
        id: "li_1",
        code: "80053",
        description: "Comprehensive metabolic panel",
        serviceDate: "2026-11-10",
        quantity: 1,
        billedCents: 18_000,
        anchor: {
          page: 1,
          quote: "Comprehensive metabolic panel",
          box: { x: 0.3, y: 0.4, w: 0.2, h: 0.02 },
        },
        extractionConfidence: "high",
      },
      {
        id: "li_2",
        code: "80053",
        description: "Comprehensive metabolic panel",
        serviceDate: "2026-11-10",
        quantity: 1,
        billedCents: 18_000,
        anchor: null,
        extractionConfidence: "high",
      },
    ],
    notes: [],
  };
  const comparison = compareBill(extraction);

  return createAnalysis({
    extraction,
    inputType: "pdf",
    hospitalId: "coastal-demo-hospital",
    findings: comparison.findings,
    evidence: comparison.evidence,
    id: "analysis_test",
    now: new Date("2026-11-14T00:00:00.000Z"),
  });
}

describe("buildAgentContext", () => {
  it("returns compact case data with stable IDs and no PDF geometry", () => {
    const context = buildAgentContext(analysis());

    expect(context.analysisId).toBe("analysis_test");
    expect(context.lineItems).toHaveLength(2);
    expect(context.lineItems[0]).toEqual({
      id: "li_1",
      code: "80053",
      description: "Comprehensive metabolic panel",
      serviceDate: "2026-11-10",
      quantity: 1,
      billedCents: 18_000,
    });
    expect(context.lineItems[0]).not.toHaveProperty("anchor");
    expect(context.lineItems[0]).not.toHaveProperty("extractionConfidence");
    expect(context.findings[0]).toMatchObject({
      id: "finding_1",
      lineItemIds: ["li_1", "li_2"],
    });
  });

  it("labels EOB responsibility as user-provided", () => {
    const original = analysis();
    const context = buildAgentContext({
      ...original,
      insurance: {
        ...original.insurance,
        coverage: "insured",
        eobReceived: "yes",
        eobPatientResponsibilityCents: 25_000,
      },
    });

    expect(context.grounding.eobPatientResponsibilitySource).toBe("user_provided");
  });

  it("only reports public price grounding when matching evidence exists", () => {
    const original = analysis();
    expect(buildAgentContext(original).grounding.publicPriceEvidenceAvailable).toBe(false);

    const evidence: Evidence = {
      id: "evidence_1",
      kind: "hospital_price",
      title: "Hospital price file",
      sourceUrl: "https://example.test/prices",
      retrievedAt: "2026-11-14T00:00:00.000Z",
      hospitalId: "coastal-demo-hospital",
      code: "80053",
      priceType: "discounted_cash",
      amountCents: 10_000,
      note: null,
    };
    const context = buildAgentContext({ ...original, evidence: [evidence] });

    expect(context.grounding.publicPriceEvidenceAvailable).toBe(true);
    expect(context.evidence).toEqual([evidence]);
  });
});
