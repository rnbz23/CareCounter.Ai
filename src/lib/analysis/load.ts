import { getAnalysis } from "@/lib/db/neon";
import { DEMO_ANALYSIS, DEMO_ANALYSIS_ID } from "@/lib/mock/demo-analysis";
import type { Analysis } from "@/types/contracts";

const useMockAnalysis = process.env.NEXT_PUBLIC_USE_MOCK_ANALYSIS !== "false";

/**
 * Server-side analysis loader for pages.
 *
 * The browser adapter falls back to the demo fixture when mock mode is on, so
 * the RSC pages must use the same source instead of requiring Neon.
 */
export async function loadAnalysisForPage(
  analysisId: string,
): Promise<Analysis | null> {
  if (useMockAnalysis || analysisId === DEMO_ANALYSIS_ID) {
    return { ...DEMO_ANALYSIS, id: analysisId || DEMO_ANALYSIS_ID };
  }

  return getAnalysis(analysisId);
}
