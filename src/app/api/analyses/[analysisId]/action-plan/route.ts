import { buildActionPlan } from "@/lib/insurance/logic";
import {
  DatabaseError,
  getAnalysis,
  updateAnalysis,
} from "@/lib/db/neon";
import { AnalysisSchema } from "@/types/contracts";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}

/** Browser-reachable action-plan generation for voice client tools. */
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

    const actionPlan = buildActionPlan(analysis);
    const updated = AnalysisSchema.parse({
      ...analysis,
      actionPlan,
    });
    await updateAnalysis(updated);
    return Response.json(updated);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return errorResponse(error.code, error.message, 503);
    }
    return errorResponse(
      "ACTION_PLAN_FAILED",
      "The action plan could not be generated.",
      500,
    );
  }
}
