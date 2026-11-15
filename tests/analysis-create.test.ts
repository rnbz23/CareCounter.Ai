import { describe, expect, it } from "vitest";

import { createAnalysis } from "@/lib/analysis/create";
import { compareBill } from "@/lib/pricing/compare";
import type { BillExtraction } from "@/types/contracts";

describe("createAnalysis", () => {
  it("includes comparison findings in the analysis contract", () => {
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
          anchor: null,
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

    const analysis = createAnalysis({
      extraction,
      inputType: "text",
      hospitalId: "coastal-demo-hospital",
      findings: comparison.findings,
      evidence: comparison.evidence,
      id: "analysis_test",
      now: new Date("2026-11-14T00:00:00.000Z"),
    });

    expect(analysis.findings).toHaveLength(1);
    expect(analysis.findings[0]).toMatchObject({
      id: "finding_1",
      type: "possible_duplicate",
      lineItemIds: ["li_1", "li_2"],
      billedCents: 18_000,
    });
    expect(analysis.evidence).toEqual([]);
  });
});
