import { buildAgentContext } from "@/lib/analysis/agent-context";
import { DatabaseError, getAnalysis } from "@/lib/db/neon";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ analysisId: string }> },
): Promise<Response> {
  const { analysisId } = await params;

  try {
    const analysis = await getAnalysis(analysisId);

    if (!analysis) {
      return errorResponse("ANALYSIS_NOT_FOUND", "Analysis not found.", 404);
    }

    return Response.json(buildAgentContext(analysis));
  } catch (error) {
    if (error instanceof DatabaseError) {
      return errorResponse(error.code, error.message, 503);
    }

    return errorResponse(
      "AGENT_CONTEXT_FAILED",
      "The agent context could not be loaded.",
      500,
    );
  }
}
