import {
  assistanceEvidenceKindsFor,
  buildAssistanceOptions,
} from "@/lib/insurance/logic";
import {
  DatabaseError,
  getAnalysis,
  getPublicResourceEvidence,
  updateAnalysis,
} from "@/lib/db/neon";
import { AnalysisSchema } from "@/types/contracts";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}

/**
 * Browser-reachable assistance rebuild for voice client tools.
 * Uses Neon public-resource evidence (Bright Data is offline-only).
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ analysisId: string }> },
): Promise<Response> {
  const { analysisId } = await params;

  try {
    const analysis = await getAnalysis(analysisId);
    if (!analysis) {
      return errorResponse("ANALYSIS_NOT_FOUND", "Analysis not found.", 404);
    }

    const evidence = await getPublicResourceEvidence({
      hospitalId: analysis.hospitalId,
      kinds: assistanceEvidenceKindsFor(analysis.insurance.coverage),
    });
    const assistanceOptions = buildAssistanceOptions(analysis, evidence);
    const byId = new Map(analysis.evidence.map((item) => [item.id, item]));
    for (const item of evidence) {
      byId.set(item.id, item);
    }

    const updated = AnalysisSchema.parse({
      ...analysis,
      evidence: [...byId.values()],
      assistanceOptions,
    });
    await updateAnalysis(updated);
    return Response.json(updated);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return errorResponse(error.code, error.message, 503);
    }
    return errorResponse(
      "ASSISTANCE_UPDATE_FAILED",
      "Assistance options could not be generated.",
      500,
    );
  }
}
