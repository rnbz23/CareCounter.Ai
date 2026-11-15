import { describe, expect, it } from "vitest";

import { createAnalysis } from "@/lib/analysis/create";
import { updateAnalysisLineItems } from "@/lib/analysis/update-line-items";
import { compareBill } from "@/lib/pricing/compare";
import type { BillExtraction, LineItem } from "@/types/contracts";

function lineItem(id: string, overrides: Partial<LineItem> = {}): LineItem {
  return {
    id,
    code: "80053",
    description: "Comprehensive metabolic panel",
    serviceDate: "2026-11-10",
    quantity: 1,
    billedCents: 18_000,
    anchor: null,
    extractionConfidence: "high",
    ...overrides,
  };
}

function analysisWithDuplicates() {
  const extraction: BillExtraction = {
    hospitalName: "Coastal Demo Hospital",
    serviceDate: "2026-11-10",
    totalBilledCents: 36_000,
    lineItems: [lineItem("li_1"), lineItem("li_2")],
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

describe("updateAnalysisLineItems", () => {
  it("removes a duplicate finding and recalculates the total", () => {
    const original = analysisWithDuplicates();

    const updated = updateAnalysisLineItems(original, [original.lineItems[0]]);

    expect(updated.totalBilledCents).toBe(18_000);
    expect(updated.findings).toEqual([]);
    expect(updated.lineItems.map(({ id }) => id)).toEqual(["li_1"]);
  });

  it("recomputes duplicate findings after an edit", () => {
    const original = analysisWithDuplicates();
    const editedItems = [
      original.lineItems[0],
      lineItem("li_2", { code: "80048", billedCents: 9_000 }),
    ];

    const withoutDuplicate = updateAnalysisLineItems(original, editedItems);
    expect(withoutDuplicate.findings).toEqual([]);
    expect(withoutDuplicate.totalBilledCents).toBe(27_000);

    const duplicateAgain = updateAnalysisLineItems(withoutDuplicate, [
      withoutDuplicate.lineItems[0],
      lineItem("li_2"),
    ]);
    expect(duplicateAgain.findings).toHaveLength(1);
    expect(duplicateAgain.findings[0].lineItemIds).toEqual(["li_1", "li_2"]);
    expect(duplicateAgain.totalBilledCents).toBe(36_000);
  });

  it("preserves case metadata and insurance details", () => {
    const original = {
      ...analysisWithDuplicates(),
      insurance: {
        ...analysisWithDuplicates().insurance,
        coverage: "insured" as const,
        insurerName: "Demo Health Plan",
      },
    };

    const updated = updateAnalysisLineItems(original, original.lineItems);

    expect(updated.id).toBe(original.id);
    expect(updated.createdAt).toBe(original.createdAt);
    expect(updated.hospitalId).toBe(original.hospitalId);
    expect(updated.insurance).toEqual(original.insurance);
  });
});
