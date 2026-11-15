import { describe, expect, it, vi } from "vitest";

import {
  fetchPublicResourceEvidence,
  PUBLIC_RESOURCE_DEFINITIONS,
} from "@/lib/data/public-resources";

describe("fetchPublicResourceEvidence", () => {
  it("creates contract-valid evidence from verified official pages", async () => {
    const fetchPage = vi.fn(async (sourceUrl: string) => {
      const definition = PUBLIC_RESOURCE_DEFINITIONS.find(
        (resource) => resource.sourceUrl === sourceUrl,
      );
      if (!definition) throw new Error("Unexpected source");

      return {
        sourceUrl,
        retrievedAt: "2026-11-15T00:00:00.000Z",
        status: 200,
        content: definition.markers.join(" "),
      };
    });

    const evidence = await fetchPublicResourceEvidence(fetchPage);

    expect(evidence).toHaveLength(PUBLIC_RESOURCE_DEFINITIONS.length);
    expect(evidence.map(({ kind }) => kind)).toEqual([
      "hospital_assistance",
      "insurer_contact",
      "insurer_policy",
      "government_program",
      "nonprofit_program",
    ]);
    expect(evidence.every(({ sourceUrl }) => sourceUrl.startsWith("https://"))).toBe(true);
    expect(evidence.every(({ priceType }) => priceType === "not_applicable")).toBe(true);
    expect(evidence.every(({ amountCents }) => amountCents === null)).toBe(true);
  });

  it("rejects a page that no longer contains its expected identity markers", async () => {
    const fetchPage = vi.fn(async (sourceUrl: string) => ({
      sourceUrl,
      retrievedAt: "2026-11-15T00:00:00.000Z",
      status: 200,
      content: "Unexpected login or error page",
    }));

    await expect(fetchPublicResourceEvidence(fetchPage)).rejects.toThrow(
      "Public resource validation failed",
    );
  });
});
