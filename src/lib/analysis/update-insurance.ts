import { AnalysisSchema, type Analysis, type InsuranceProfile } from "@/types/contracts";

export function updateAnalysisInsurance(
  analysis: Analysis,
  insurance: InsuranceProfile,
): Analysis {
  return AnalysisSchema.parse({
    ...analysis,
    insurance,
    // These depend on the insurance answers and must be regenerated.
    assistanceOptions: [],
    actionPlan: null,
  });
}
