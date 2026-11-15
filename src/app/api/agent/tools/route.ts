import { timingSafeEqual } from "node:crypto";

import { buildAgentContext } from "@/lib/analysis/agent-context";
import { updateAnalysisInsurance } from "@/lib/analysis/update-insurance";
import {
  DatabaseError,
  getAnalysis,
  getPublicResourceEvidence,
  updateAnalysis,
} from "@/lib/db/neon";
import {
  assistanceEvidenceKindsFor,
  buildActionPlan,
  buildAssistanceOptions,
} from "@/lib/insurance/logic";
import {
  AgentToolRequestSchema,
  AnalysisSchema,
  type Analysis,
} from "@/types/contracts";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}

function ok<T>(data: T): Response {
  return Response.json({ ok: true, data });
}

function secretsMatch(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.ELEVENLABS_TOOL_SECRET?.trim() ?? "";
  if (!expected) {
    return errorResponse(
      "AGENT_TOOLS_NOT_CONFIGURED",
      "Agent tools are not configured on this server.",
      503,
    );
  }

  if (!secretsMatch(request.headers.get("x-agent-tool-secret"), expected)) {
    return errorResponse("UNAUTHORIZED", "Invalid agent tool secret.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Send a valid JSON request body.", 400);
  }

  const parsed = AgentToolRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "INVALID_TOOL_REQUEST",
      "Unsupported or invalid agent tool request.",
      422,
    );
  }

  const requestBody = parsed.data;

  try {
    const analysis = await getAnalysis(requestBody.analysisId);
    if (!analysis) {
      return errorResponse("ANALYSIS_NOT_FOUND", "Analysis not found.", 404);
    }

    switch (requestBody.action) {
      case "get_case_context":
        return ok(buildAgentContext(analysis));

      case "save_insurance_profile": {
        const updated = updateAnalysisInsurance(analysis, requestBody.insurance);
        await updateAnalysis(updated);
        return ok(updated);
      }

      case "get_assistance_options": {
        const evidence = await getPublicResourceEvidence({
          hospitalId: analysis.hospitalId,
          kinds: assistanceEvidenceKindsFor(analysis.insurance.coverage),
        });
        const assistanceOptions = buildAssistanceOptions(analysis, evidence);
        const mergedEvidence = mergeEvidence(analysis.evidence, evidence);
        const updated = AnalysisSchema.parse({
          ...analysis,
          evidence: mergedEvidence,
          assistanceOptions,
        });
        await updateAnalysis(updated);
        return ok(updated);
      }

      case "generate_action_plan": {
        const withOptions =
          analysis.assistanceOptions.length > 0
            ? analysis
            : await attachAssistance(analysis);
        const actionPlan = buildActionPlan(withOptions);
        const updated = AnalysisSchema.parse({
          ...withOptions,
          actionPlan,
        });
        await updateAnalysis(updated);
        return ok(updated);
      }

      default:
        return errorResponse("UNSUPPORTED_ACTION", "Unsupported agent tool action.", 422);
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      return errorResponse(error.code, error.message, 503);
    }

    console.error("[agent/tools] failed", {
      action: requestBody.action,
      analysisId: requestBody.analysisId,
      name: error instanceof Error ? error.name : "unknown",
    });

    return errorResponse(
      "AGENT_TOOL_FAILED",
      "The agent tool request could not be completed.",
      500,
    );
  }
}

async function attachAssistance(analysis: Analysis): Promise<Analysis> {
  const evidence = await getPublicResourceEvidence({
    hospitalId: analysis.hospitalId,
    kinds: assistanceEvidenceKindsFor(analysis.insurance.coverage),
  });
  const assistanceOptions = buildAssistanceOptions(analysis, evidence);
  return AnalysisSchema.parse({
    ...analysis,
    evidence: mergeEvidence(analysis.evidence, evidence),
    assistanceOptions,
  });
}

function mergeEvidence(
  existing: Analysis["evidence"],
  incoming: Analysis["evidence"],
): Analysis["evidence"] {
  const byId = new Map(existing.map((item) => [item.id, item]));
  for (const item of incoming) {
    byId.set(item.id, item);
  }
  return [...byId.values()];
}
