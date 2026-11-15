import {
  FundraiseConfigurationError,
  FundraiseGenerationError,
  FundraiseProviderError,
  generateFundraiseDraft,
} from "@/lib/fundraising/generate";
import { DatabaseError, getAnalysis } from "@/lib/db/neon";
import { DEMO_ANALYSIS, DEMO_ANALYSIS_ID } from "@/lib/mock/demo-analysis";
import { FundraiseRequestSchema } from "@/types/contracts";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ analysisId: string }> },
): Promise<Response> {
  const { analysisId } = await params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(
      "INVALID_JSON",
      "Send a JSON body with the fundraiser format and goal.",
      400,
    );
  }

  const parsed = FundraiseRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse(
      "INVALID_FUNDRAISE_REQUEST",
      "Choose a donor email or fundraiser page and enter a valid fundraising goal.",
      400,
    );
  }

  try {
    const analysis =
      process.env.NEXT_PUBLIC_USE_MOCK_ANALYSIS !== "false" &&
      analysisId === DEMO_ANALYSIS_ID
        ? DEMO_ANALYSIS
        : await getAnalysis(analysisId);

    if (!analysis) {
      return errorResponse("ANALYSIS_NOT_FOUND", "Analysis not found.", 404);
    }

    const draft = await generateFundraiseDraft(analysis, parsed.data);
    return Response.json(draft, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof FundraiseConfigurationError) {
      return errorResponse(
        "GEMINI_NOT_CONFIGURED",
        "Fundraiser drafting is not configured on this server. Add GEMINI_API_KEY and restart the app.",
        503,
      );
    }

    if (error instanceof FundraiseProviderError) {
      return errorResponse("FUNDRAISE_PROVIDER_FAILED", error.message, 502);
    }

    if (error instanceof FundraiseGenerationError) {
      return errorResponse("FUNDRAISE_DRAFT_INVALID", error.message, 502);
    }

    if (error instanceof DatabaseError) {
      return errorResponse(error.code, error.message, 503);
    }

    return errorResponse(
      "FUNDRAISE_FAILED",
      "The fundraiser draft could not be generated. Please try again.",
      500,
    );
  }
}
