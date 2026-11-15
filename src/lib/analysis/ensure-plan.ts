import {
  assistanceEvidenceKindsFor,
  buildActionPlan,
  buildAssistanceOptions,
} from "@/lib/insurance/logic";
import {
  getPublicResourceEvidence,
  updateAnalysis,
} from "@/lib/db/neon";
import { AnalysisSchema, type Analysis } from "@/types/contracts";

/**
 * Plan page needs an actionPlan (and preferably assistance options).
 * Fresh analyzes store those as null until a voice tool or this helper fills them.
 */
export async function ensureAnalysisPlanReady(
  analysis: Analysis,
): Promise<Analysis> {
  let next = analysis;
  let dirty = false;

  if (next.assistanceOptions.length === 0) {
    const evidence = await getPublicResourceEvidence({
      hospitalId: next.hospitalId,
      kinds: assistanceEvidenceKindsFor(next.insurance.coverage),
    });
    const assistanceOptions = buildAssistanceOptions(next, evidence);
    const byId = new Map(next.evidence.map((item) => [item.id, item]));
    for (const item of evidence) {
      byId.set(item.id, item);
    }
    next = AnalysisSchema.parse({
      ...next,
      evidence: [...byId.values()],
      assistanceOptions,
    });
    dirty = true;
  }

  if (!next.actionPlan) {
    next = AnalysisSchema.parse({
      ...next,
      actionPlan: buildActionPlan(next),
    });
    dirty = true;
  }

  if (dirty) {
    try {
      await updateAnalysis(next);
    } catch {
      // Still return the in-memory plan so the page can render offline of Neon.
    }
  }

  return next;
}
