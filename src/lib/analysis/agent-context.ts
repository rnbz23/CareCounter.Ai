import {
  AgentContextSchema,
  type AgentContext,
  type Analysis,
} from "@/types/contracts";

export function buildAgentContext(analysis: Analysis): AgentContext {
  const publicPriceEvidenceAvailable = analysis.evidence.some((evidence) =>
    ["hospital_price", "medicare_benchmark"].includes(evidence.kind),
  );

  return AgentContextSchema.parse({
    analysisId: analysis.id,
    hospitalId: analysis.hospitalId,
    hospitalName: analysis.hospitalName,
    serviceDate: analysis.serviceDate,
    currency: analysis.currency,
    totalBilledCents: analysis.totalBilledCents,
    lineItems: analysis.lineItems.map((lineItem) => ({
      id: lineItem.id,
      code: lineItem.code,
      description: lineItem.description,
      serviceDate: lineItem.serviceDate,
      quantity: lineItem.quantity,
      billedCents: lineItem.billedCents,
    })),
    findings: analysis.findings,
    evidence: analysis.evidence,
    insurance: analysis.insurance,
    assistanceOptions: analysis.assistanceOptions,
    actionPlan: analysis.actionPlan,
    grounding: {
      publicPriceEvidenceAvailable,
      eobPatientResponsibilitySource:
        analysis.insurance.eobPatientResponsibilityCents === null
          ? "not_provided"
          : "user_provided",
      confirmedMinimumAvailable:
        analysis.actionPlan?.payment.lowestConfirmedResponsibilityCents !== null &&
        analysis.actionPlan?.payment.lowestConfirmedResponsibilityCents !== undefined,
    },
  });
}
