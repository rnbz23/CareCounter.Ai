import { Readable } from "node:stream";

import { describe, expect, it } from "vitest";

import {
  extractSharpSelectedPrices,
  findSharpMachineReadableFile,
} from "@/lib/data/sharp-prices";

describe("Sharp public price ingestion", () => {
  it("finds the exact hospital file in the official index", () => {
    const index = [
      "location-name: Other Hospital",
      "source-page-url: https://example.test/other",
      "mrf-url: https://example.test/other.csv",
      "location-name: Sharp Memorial Hospital",
      "source-page-url: https://www.sharp.com/billing/estimate",
      "mrf-url: https://downloads.example.test/sharp.csv",
    ].join("\n");

    expect(findSharpMachineReadableFile(index, "Sharp Memorial Hospital")).toEqual({
      locationName: "Sharp Memorial Hospital",
      sourcePageUrl: "https://www.sharp.com/billing/estimate",
      mrfUrl: "https://downloads.example.test/sharp.csv",
    });
  });

  it("streams selected outpatient CPT gross and cash prices with provenance", async () => {
    const csv = [
      "hospital_name,last_updated_on",
      "Sharp Memorial Hospital,4/1/2026",
      "description,code|1,code|1|type,code|2,code|2|type,code|3,code|3|type,setting,standard_charge|gross,standard_charge|discounted_cash",
      '"Chest X-ray, two views",71046,CPT,,,,,Outpatient,950.00,522.50',
      '"Chest X-ray, two views",71046,CPT,,,,,Outpatient,950.00,522.50',
      '"Comprehensive metabolic panel",80053,CPT,,,,,Inpatient,300.00,165.00',
      '"Comprehensive metabolic panel",80053,CPT,,,,,Outpatient,180.00,99.00',
      '"Unselected service",99999,CPT,,,,,Outpatient,100.00,55.00',
    ].join("\n");

    const records = await extractSharpSelectedPrices({
      stream: Readable.from([csv]),
      sourceUrl: "https://downloads.example.test/sharp.csv",
      retrievedAt: "2026-11-14T00:00:00.000Z",
      codes: ["71046", "80053"],
    });

    expect(records).toHaveLength(4);
    expect(
      records.map(({ price }) => ({
        code: price.code,
        priceType: price.priceType,
        amountCents: price.amountCents,
      })),
    ).toEqual([
      { code: "71046", priceType: "discounted_cash", amountCents: 52_250 },
      { code: "71046", priceType: "gross", amountCents: 95_000 },
      { code: "80053", priceType: "discounted_cash", amountCents: 9_900 },
      { code: "80053", priceType: "gross", amountCents: 18_000 },
    ]);
    expect(records[0].evidence).toMatchObject({
      hospitalId: "sharp-memorial-hospital",
      sourceUrl: "https://downloads.example.test/sharp.csv",
      retrievedAt: "2026-11-14T00:00:00.000Z",
    });
  });
});
