import { DatabaseError, getAnalysis } from "@/lib/db/neon";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ analysisId: string }> },
): Promise<Response> {
  const { analysisId } = await params;

  try {
    const analysis = await getAnalysis(analysisId);

    if (!analysis) {
      return Response.json(
        { error: { code: "ANALYSIS_NOT_FOUND", message: "Analysis not found." } },
        { status: 404 },
      );
    }

    return Response.json(analysis);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: 503 },
      );
    }

    return Response.json(
      { error: { code: "ANALYSIS_READ_FAILED", message: "The analysis could not be loaded." } },
      { status: 500 },
    );
  }
}
