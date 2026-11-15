import { updateAnalysisInsurance } from "@/lib/analysis/update-insurance";
import {
  DatabaseError,
  getAnalysis,
  updateAnalysis,
} from "@/lib/db/neon";
import { InsuranceProfileSchema } from "@/types/contracts";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ analysisId: string }> },
): Promise<Response> {
  const { analysisId } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Send a valid JSON request body.", 400);
  }

  const parsed = InsuranceProfileSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      "INVALID_INSURANCE_PROFILE",
      "Send a valid insurance profile.",
      422,
    );
  }

  try {
    const analysis = await getAnalysis(analysisId);

    if (!analysis) {
      return errorResponse("ANALYSIS_NOT_FOUND", "Analysis not found.", 404);
    }

    const updated = updateAnalysisInsurance(analysis, parsed.data);
    await updateAnalysis(updated);
    return Response.json(updated);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return errorResponse(error.code, error.message, 503);
    }

    return errorResponse(
      "INSURANCE_UPDATE_FAILED",
      "The insurance profile could not be updated.",
      500,
    );
  }
}
