import { describe, expect, it } from "vitest";

import { buildAgentContext } from "@/lib/analysis/agent-context";
import { DEMO_ANALYSIS } from "@/lib/mock/demo-analysis";
import {
  buildVoiceCaseBrief,
  replaceFormattedUsd,
  serializeVoiceCaseContext,
  usdPlainFromCents,
} from "@/lib/voice/money";

describe("voice money formatting", () => {
  it("formats the regression amount without thousands separators", () => {
    expect(usdPlainFromCents(1_758_000)).toBe("17580.00");
    expect(usdPlainFromCents(211_000)).toBe("2110.00");
  });

  it("strips comma-formatted dollars from agent-readable text", () => {
    expect(
      replaceFormattedUsd(
        "Total: $17,580.00; line item: $950.00; reference: $350",
      ),
    ).toBe("Total: 17580.00 USD; line item: 950.00 USD; reference: 350.00 USD");
  });

  it("serializes integer cents and adds the voice money rule", () => {
    const analysis = {
      ...DEMO_ANALYSIS,
      totalBilledCents: 1_758_000,
    };
    const serialized = serializeVoiceCaseContext(buildAgentContext(analysis));
    const parsed = JSON.parse(serialized) as {
      totalBilledCents: number;
      total_billed: string;
      total_billed_usd: string;
      money_reading_rule: string;
      findings: Array<{ explanation: string }>;
    };

    expect(parsed.totalBilledCents).toBe(1_758_000);
    expect(parsed.total_billed).toBe("17580.00 USD");
    expect(parsed.total_billed_usd).toBe("17580.00");
    expect(parsed.money_reading_rule).toContain(
      "totalBilledCents=1758000 means 17580.00 USD",
    );
    expect(serialized).not.toContain("$17,580.00");
    expect(serialized).toContain("17580.00 USD");
    expect(parsed.findings[0]?.explanation).not.toContain("$");
  });

  it("builds a case brief with the plain total and integer cents", () => {
    const brief = buildVoiceCaseBrief({
      ...DEMO_ANALYSIS,
      totalBilledCents: 1_758_000,
    });

    expect(brief).toContain("total 17580.00 USD (1758000 cents)");
    expect(brief).not.toContain("$");
    expect(brief).not.toContain("17,580");
  });
});
