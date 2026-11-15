import { readFile } from "node:fs/promises";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { AnalysisSchema, type BillExtraction } from "@/types/contracts";

const mocks = vi.hoisted(() => ({
  extractBill: vi.fn(),
  getAnalysis: vi.fn(),
  getGrossPriceReferences: vi.fn(),
  saveAnalysis: vi.fn(),
}));

vi.mock("@/lib/gemini/extract", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/gemini/extract")>();
  return { ...actual, extractBill: mocks.extractBill };
});

vi.mock("@/lib/db/neon", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/db/neon")>();
  return {
    ...actual,
    getAnalysis: mocks.getAnalysis,
    saveAnalysis: mocks.saveAnalysis,
  };
});

vi.mock("@/lib/pricing/references", () => ({
  getGrossPriceReferences: mocks.getGrossPriceReferences,
}));

import { GET } from "@/app/api/analyses/[analysisId]/route";
import { POST } from "@/app/api/analyze/route";
import { DatabaseError } from "@/lib/db/neon";

const extraction: BillExtraction = {
  hospitalName: "Coastal Demo Hospital",
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
    {
      id: "li_2",
      code: null,
      description: "Facility supplies",
      serviceDate: "2026-11-10",
      quantity: 1,
      billedCents: 42_550,
      anchor: null,
      extractionConfidence: "high",
    },
  ],
  notes: [],
};

async function pdfRequest(): Promise<Request> {
  const bytes = await readFile("sampledata/carecounter-synthetic-bill.pdf");
  const form = new FormData();
  form.set("file", new File([bytes], "synthetic-bill.pdf", { type: "application/pdf" }));
  return new Request("http://localhost/api/analyze", { method: "POST", body: form });
}

describe("analysis API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.extractBill.mockResolvedValue(extraction);
    mocks.getGrossPriceReferences.mockResolvedValue({ priceRows: [], evidence: [] });
    mocks.saveAnalysis.mockImplementation(async (analysis) => analysis);
  });

  it("accepts a synthetic PDF and returns the identical stored analysis", async () => {
    const postResponse = await POST(await pdfRequest());
    expect(postResponse.status).toBe(201);

    const created = AnalysisSchema.parse(await postResponse.json());
    expect(created.inputType).toBe("pdf");
    expect(created.lineItems[1]?.code).toBeNull();
    expect(mocks.saveAnalysis).toHaveBeenCalledWith(created);

    mocks.getAnalysis.mockResolvedValue(created);
    const getResponse = await GET(new Request(`http://localhost/api/analyses/${created.id}`), {
      params: Promise.resolve({ analysisId: created.id }),
    });

    expect(getResponse.status).toBe(200);
    expect(await getResponse.json()).toEqual(created);
  });

  it("returns stable 503 JSON when persistence is unavailable", async () => {
    mocks.saveAnalysis.mockRejectedValue(
      new DatabaseError("The database is temporarily unavailable."),
    );

    const response = await POST(await pdfRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "The database is temporarily unavailable.",
      },
    });
  });
});
