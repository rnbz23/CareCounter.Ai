import { z } from "zod";

import { updateAnalysisLineItems } from "@/lib/analysis/update-line-items";
import {
  DatabaseError,
  getAnalysis,
  updateAnalysis,
} from "@/lib/db/neon";
import { LineItemSchema } from "@/types/contracts";

export const runtime = "nodejs";

const LineItemsUpdateSchema = z
  .object({
    lineItems: z.array(LineItemSchema),
  })
  .strict()
  .superRefine(({ lineItems }, context) => {
    const seenIds = new Set<string>();

    lineItems.forEach((lineItem, index) => {
      if (seenIds.has(lineItem.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate line-item ID: ${lineItem.id}`,
          path: ["lineItems", index, "id"],
        });
      }
      seenIds.add(lineItem.id);
    });
  });

function errorResponse(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}

export async function PATCH(
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

  const parsed = LineItemsUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      "INVALID_LINE_ITEMS",
      "Send a lineItems array containing valid, uniquely identified line items.",
      422,
    );
  }

  try {
    const analysis = await getAnalysis(analysisId);

    if (!analysis) {
      return errorResponse("ANALYSIS_NOT_FOUND", "Analysis not found.", 404);
    }

    const updated = updateAnalysisLineItems(analysis, parsed.data.lineItems);
    await updateAnalysis(updated);
    return Response.json(updated);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return errorResponse(error.code, error.message, 503);
    }

    return errorResponse(
      "ANALYSIS_UPDATE_FAILED",
      "The analysis could not be updated.",
      500,
    );
  }
}
