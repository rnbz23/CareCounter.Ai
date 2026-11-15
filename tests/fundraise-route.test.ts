import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateFundraiseDraft: vi.fn(),
}));

vi.mock("@/lib/fundraising/generate", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/fundraising/generate")>();
  return {
    ...actual,
    generateFundraiseDraft: mocks.generateFundraiseDraft,
  };
});

import { POST } from "@/app/api/analyses/[analysisId]/fundraise/route";
import { DEMO_ANALYSIS_ID } from "@/lib/mock/demo-analysis";

describe("fundraiser API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generateFundraiseDraft.mockResolvedValue({
      format: "email",
      subject: "A little help with my hospital bill",
      title: null,
      body: "Thank you for reading. I am asking for help while I review this bill.",
      shareText: null,
    });
  });

  it("validates the request and returns the generated draft", async () => {
    const response = await POST(
      new Request(`http://localhost/api/analyses/${DEMO_ANALYSIS_ID}/fundraise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "email",
          goalCents: 50000,
          audience: "Family & friends",
          personalNote: null,
        }),
      }),
      { params: Promise.resolve({ analysisId: DEMO_ANALYSIS_ID }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      format: "email",
      subject: "A little help with my hospital bill",
    });
    expect(mocks.generateFundraiseDraft).toHaveBeenCalledOnce();
  });

  it("rejects an invalid format before generation", async () => {
    const response = await POST(
      new Request(`http://localhost/api/analyses/${DEMO_ANALYSIS_ID}/fundraise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "phone-call",
          goalCents: 50000,
          audience: null,
          personalNote: null,
        }),
      }),
      { params: Promise.resolve({ analysisId: DEMO_ANALYSIS_ID }) },
    );

    expect(response.status).toBe(400);
    expect(mocks.generateFundraiseDraft).not.toHaveBeenCalled();
  });
});
