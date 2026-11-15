import { describe, expect, it } from "vitest";

import { compareBill } from "@/lib/pricing/compare";
import type { HospitalPriceRow } from "@/lib/db/neon";
import type { BillExtraction, Evidence, LineItem } from "@/types/contracts";

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

function grossPrice(overrides: Partial<HospitalPriceRow> = {}): HospitalPriceRow {
  return {
    id: "price_71046_gross",
    hospitalId: "sharp-memorial-hospital",
    code: "71046",
    priceType: "gross",
    amountCents: 71_000,
    unitSemantics: "Outpatient; one listed service",
    evidenceId: "evidence_71046_gross",
    ...overrides,
  };
}

function priceEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: "evidence_71046_gross",
    kind: "hospital_price",
    title: "Sharp Memorial published gross charge",
    sourceUrl: "https://example.test/sharp-prices.csv",
    retrievedAt: "2026-11-15T00:00:00.000Z",
    hospitalId: "sharp-memorial-hospital",
    code: "71046",
    priceType: "gross",
    amountCents: 71_000,
    note: null,
    ...overrides,
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

  it("flags a billed line at least 25% above a grounded gross charge", () => {
    const bill = extraction([
      lineItem({
        id: "li_1",
        code: "71046",
        description: "Chest X-ray, two views",
        billedCents: 95_000,
      }),
    ]);

    const comparison = compareBill(bill, [grossPrice()], [priceEvidence()]);

    expect(comparison.findings).toEqual([
      expect.objectContaining({
        id: "finding_1",
        type: "hospital_price_difference",
        severity: "review",
        lineItemIds: ["li_1"],
        billedCents: 95_000,
        referenceCents: 71_000,
        evidenceIds: ["evidence_71046_gross"],
      }),
    ]);
    expect(comparison.evidence).toEqual([priceEvidence()]);
  });

  it("marks large gaps as priority and uses the lowest grounded amount when several exist", () => {
    const bill = extraction([
      lineItem({
        id: "li_1",
        code: "71046",
        description: "Chest X-ray, two views",
        billedCents: 148_000,
      }),
    ]);
    const higher = grossPrice({
      id: "price_71046_gross_high",
      amountCents: 110_000,
      evidenceId: "evidence_71046_gross_high",
    });
    const higherEvidence = priceEvidence({
      id: "evidence_71046_gross_high",
      amountCents: 110_000,
    });

    const comparison = compareBill(
      bill,
      [higher, grossPrice()],
      [higherEvidence, priceEvidence()],
    );

    expect(comparison.findings).toEqual([
      expect.objectContaining({
        type: "hospital_price_difference",
        severity: "priority",
        billedCents: 148_000,
        referenceCents: 71_000,
        evidenceIds: ["evidence_71046_gross"],
      }),
    ]);
  });

  it("multiplies a one-service reference by bill quantity", () => {
    const bill = extraction([
      lineItem({
        code: "71046",
        description: "Chest X-ray, two views",
        quantity: 2,
        billedCents: 190_000,
      }),
    ]);

    const finding = compareBill(bill, [grossPrice()], [priceEvidence()]).findings[0];

    expect(finding.referenceCents).toBe(142_000);
  });

  it("does not create an ungrounded or category-mismatched price finding", () => {
    const bill = extraction([
      lineItem({
        code: "71046",
        description: "Chest X-ray, two views",
        billedCents: 95_000,
      }),
    ]);
    const cashPrice = grossPrice({
      priceType: "discounted_cash",
      amountCents: 53_250,
    });

    expect(compareBill(bill, [grossPrice()], []).findings).toEqual([]);
    expect(compareBill(bill, [cashPrice], [priceEvidence()]).findings).toEqual([]);
  });

  it("does not flag a difference below the threshold", () => {
    const bill = extraction([
      lineItem({
        code: "71046",
        description: "Chest X-ray, two views",
        billedCents: 88_000,
      }),
    ]);

    expect(compareBill(bill, [grossPrice()], [priceEvidence()]).findings).toEqual([]);
  });
});
