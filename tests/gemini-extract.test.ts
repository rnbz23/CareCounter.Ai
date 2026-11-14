import { describe, expect, it, vi } from "vitest";

import {
  BillExtractionError,
  extractBill,
  type GeminiGenerateContent,
} from "@/lib/gemini/extract";

const syntheticBillText = `Coastal Demo Hospital
Service date: 2026-11-14
71046 Chest X-ray, quantity 1, $950.00
Basic metabolic panel, quantity 1, $180.00
Total: $1,130.00`;

const validGeminiResponse = {
  hospitalName: "Coastal Demo Hospital",
  serviceDate: "2026-11-14",
  totalBilledCents: 113000,
  lineItems: [
    {
      code: "71046",
      description: "Chest X-ray",
      serviceDate: "2026-11-14",
      quantity: 1,
      billedCents: 95000,
      anchor: { page: 1, quote: "71046 Chest X-ray $950.00", box: null },
      extractionConfidence: "high",
    },
    {
      code: null,
      description: "Basic metabolic panel",
      serviceDate: "2026-11-14",
      quantity: 1,
      billedCents: 18000,
      anchor: { page: 1, quote: "Basic metabolic panel $180.00", box: null },
      extractionConfidence: "high",
    },
  ],
  notes: [],
};

function mockGenerator(...responses: string[]): GeminiGenerateContent {
  const generate = vi.fn(async () => ({ text: responses.shift() ?? "" }));
  return generate;
}

describe("extractBill", () => {
  it("validates a synthetic bill, preserves null codes, and assigns stable IDs", async () => {
    const result = await extractBill(
      { inputType: "text", text: syntheticBillText },
      { generateContent: mockGenerator(JSON.stringify(validGeminiResponse)) },
    );

    expect(result.lineItems.map((item) => item.id)).toEqual(["li_1", "li_2"]);
    expect(result.lineItems[1]?.code).toBeNull();
    expect(result.totalBilledCents).toBe(113000);
  });

  it("retries once when Gemini returns invalid JSON", async () => {
    const generateContent = mockGenerator(
      "not-json",
      JSON.stringify(validGeminiResponse),
    );

    const result = await extractBill(
      { inputType: "text", text: syntheticBillText },
      { generateContent },
    );

    expect(result.hospitalName).toBe("Coastal Demo Hospital");
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("fails after the single repair attempt", async () => {
    const generateContent = mockGenerator("{}", "{}");

    await expect(
      extractBill(
        { inputType: "text", text: syntheticBillText },
        { generateContent },
      ),
    ).rejects.toBeInstanceOf(BillExtractionError);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("reconciles a mismatched printed total with a visible warning", async () => {
    const mismatch = { ...validGeminiResponse, totalBilledCents: 99999 };

    const result = await extractBill(
      { inputType: "text", text: syntheticBillText },
      { generateContent: mockGenerator(JSON.stringify(mismatch)) },
    );

    expect(result.totalBilledCents).toBe(113000);
    expect(result.notes.at(-1)).toContain("differed from the extracted line-item sum");
  });

  it("drops pixel bounding boxes that violate the normalized anchor contract", async () => {
    const pixelBoxResponse = {
      ...validGeminiResponse,
      lineItems: validGeminiResponse.lineItems.map((lineItem, index) =>
        index === 0
          ? {
              ...lineItem,
              anchor: {
                page: 1,
                quote: "Chest X-ray, two views",
                box: { x: 319, y: 435, w: 180, h: 12 },
              },
            }
          : lineItem,
      ),
    };

    const result = await extractBill(
      { inputType: "text", text: syntheticBillText },
      { generateContent: mockGenerator(JSON.stringify(pixelBoxResponse)) },
    );

    expect(result.lineItems[0]?.anchor?.box).toBeNull();
  });
});
