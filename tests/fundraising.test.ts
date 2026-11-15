import { describe, expect, it, vi } from "vitest";

import {
  FundraiseGenerationError,
  type FundraiseGenerateContent,
  buildFundraisePrompt,
  generateFundraiseDraft,
} from "@/lib/fundraising/generate";
import { DEMO_ANALYSIS } from "@/lib/mock/demo-analysis";

const request = {
  format: "email" as const,
  goalCents: 50000,
  audience: "Family & friends",
  personalNote: "I am asking for help while I review the bill.",
};

describe("fundraiser content generation", () => {
  it("grounds the prompt in this bill and distinguishes the goal from an amount owed", () => {
    const prompt = buildFundraisePrompt(DEMO_ANALYSIS, request);

    expect(prompt).toContain("Pacific Coast Medical Center (Demo)");
    expect(prompt).toContain("$2,110.00");
    expect(prompt).toContain("$500.00");
    expect(prompt).toContain("amount currently shown as the patient's share");
    expect(prompt).toContain("Call this a goal, never an amount owed");
    expect(prompt).toContain("I am asking for help while I review the bill.");
  });

  it("parses an email draft and normalizes campaign-only fields away", async () => {
    const generateContent: FundraiseGenerateContent = vi.fn(async () => ({
      text: JSON.stringify({
        format: "email",
        subject: "  Help with my hospital bill  ",
        title: " ignored ",
        body: "  Thank you for considering a contribution.  ",
        shareText: " ignored ",
      }),
    }));

    const result = await generateFundraiseDraft(DEMO_ANALYSIS, request, {
      generateContent,
    });

    expect(result).toEqual({
      format: "email",
      subject: "Help with my hospital bill",
      title: null,
      body: "Thank you for considering a contribution.",
      shareText: null,
    });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("rejects a draft that does not match the expected schema", async () => {
    const generateContent: FundraiseGenerateContent = vi.fn(async () => ({
      text: JSON.stringify({ format: "email", body: "" }),
    }));

    await expect(
      generateFundraiseDraft(DEMO_ANALYSIS, request, { generateContent }),
    ).rejects.toBeInstanceOf(FundraiseGenerationError);
  });
});
