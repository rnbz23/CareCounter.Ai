import { describe, expect, it } from "vitest";

import { compareBill } from "@/lib/pricing/compare";
import type { BillExtraction, LineItem } from "@/types/contracts";

function lineItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: "li_1",
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

function extraction(lineItems: LineItem[]): BillExtraction {
  return {
    hospitalName: "Coastal Demo Hospital",
    serviceDate: "2026-11-10",
    totalBilledCents: lineItems.reduce((total, item) => total + item.billedCents, 0),
    lineItems,
    notes: [],
  };
}

describe("compareBill", () => {
  it("flags the intentional duplicate rows from the synthetic bill", () => {
    const bill = extraction([
      lineItem({
        id: "li_1",
        code: "71046",
        description: "Chest X-ray, two views",
        billedCents: 95_000,
      }),
      lineItem({ id: "li_2" }),
      lineItem({ id: "li_3" }),
      lineItem({
        id: "li_4",
        code: null,
        description: "Facility supplies",
        billedCents: 6_550,
      }),
    ]);

    expect(compareBill(bill)).toEqual({
      findings: [
        expect.objectContaining({
          id: "finding_1",
          type: "possible_duplicate",
          severity: "review",
          lineItemIds: ["li_2", "li_3"],
          billedCents: 18_000,
          referenceCents: null,
          evidenceIds: [],
        }),
      ],
      evidence: [],
    });
  });

  it("does not flag otherwise matching rows from different service dates", () => {
    const bill = extraction([
      lineItem({ id: "li_1", serviceDate: "2026-11-10" }),
      lineItem({ id: "li_2", serviceDate: "2026-11-11" }),
    ]);

    expect(compareBill(bill).findings).toEqual([]);
  });

  it.each([
    ["code", { code: "80048" }],
    ["description", { description: "Basic metabolic panel" }],
    ["quantity", { quantity: 2 }],
    ["amount", { billedCents: 19_000 }],
  ])("does not flag rows with a different %s", (_label, difference) => {
    const bill = extraction([
      lineItem({ id: "li_1" }),
      lineItem({ id: "li_2", ...difference }),
    ]);

    expect(compareBill(bill).findings).toEqual([]);
  });

  it("does not infer a same-day duplicate when service dates are missing", () => {
    const bill = extraction([
      lineItem({ id: "li_1", serviceDate: null }),
      lineItem({ id: "li_2", serviceDate: null }),
    ]);

    expect(compareBill(bill).findings).toEqual([]);
  });

  it("uses deterministic finding IDs in first-appearance order", () => {
    const bill = extraction([
      lineItem({ id: "li_1" }),
      lineItem({ id: "li_2" }),
      lineItem({
        id: "li_3",
        code: null,
        description: "Facility supplies",
        billedCents: 6_550,
      }),
      lineItem({
        id: "li_4",
        code: null,
        description: "Facility supplies",
        billedCents: 6_550,
      }),
    ]);

    expect(compareBill(bill).findings.map(({ id, lineItemIds }) => ({ id, lineItemIds }))).toEqual([
      { id: "finding_1", lineItemIds: ["li_1", "li_2"] },
      { id: "finding_2", lineItemIds: ["li_3", "li_4"] },
    ]);
  });
});
