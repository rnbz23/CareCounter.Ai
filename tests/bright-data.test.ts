import { describe, expect, it, vi } from "vitest";

import {
  BrightDataConfigurationError,
  BrightDataRequestError,
  fetchPublicPageWithBrightData,
} from "@/lib/data/bright-data";

describe("fetchPublicPageWithBrightData", () => {
  it("sends the documented Web Unlocker request without exposing credentials", async () => {
    const fetchImplementation = vi.fn(async () => new Response("official page", { status: 200 }));

    const result = await fetchPublicPageWithBrightData("https://example.test/prices", {
      apiKey: "secret-key",
      zone: "carecounter-zone",
      fetchImplementation,
      now: () => new Date("2026-11-14T00:00:00.000Z"),
    });

    expect(fetchImplementation).toHaveBeenCalledWith(
      "https://api.brightdata.com/request",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer secret-key",
        },
        body: JSON.stringify({
          zone: "carecounter-zone",
          url: "https://example.test/prices",
          format: "raw",
        }),
      }),
    );
    expect(result).toEqual({
      sourceUrl: "https://example.test/prices",
      retrievedAt: "2026-11-14T00:00:00.000Z",
      status: 200,
      content: "official page",
    });
  });

  it("fails clearly when credentials are missing", async () => {
    await expect(
      fetchPublicPageWithBrightData("https://example.test/prices", {
        apiKey: "",
        zone: "",
      }),
    ).rejects.toBeInstanceOf(BrightDataConfigurationError);
  });

  it("reports provider status without including the response body", async () => {
    const fetchImplementation = vi.fn(
      async () => new Response("sensitive provider detail", { status: 407 }),
    );

    await expect(
      fetchPublicPageWithBrightData("https://example.test/prices", {
        apiKey: "secret-key",
        zone: "carecounter-zone",
        fetchImplementation,
      }),
    ).rejects.toMatchObject<Partial<BrightDataRequestError>>({
      message: "Bright Data returned HTTP 407.",
      status: 407,
    });
  });
});
