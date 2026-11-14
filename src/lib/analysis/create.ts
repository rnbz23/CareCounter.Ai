import { randomUUID } from "node:crypto";

import {
  AnalysisSchema,
  EMPTY_INSURANCE,
  type Analysis,
  type BillExtraction,
} from "@/types/contracts";

export interface CreateAnalysisInput {
  extraction: BillExtraction;
  inputType: Analysis["inputType"];
  hospitalId?: string | null;
  now?: Date;
  id?: string;
}

export function createAnalysis({
  extraction,
  inputType,
  hospitalId = null,
  now = new Date(),
  id = `analysis_${randomUUID()}`,
}: CreateAnalysisInput): Analysis {
  return AnalysisSchema.parse({
    id,
    hospitalId,
    hospitalName: extraction.hospitalName,
    inputType,
    currency: "USD",
    serviceDate: extraction.serviceDate,
    totalBilledCents: extraction.totalBilledCents,
    lineItems: extraction.lineItems,
    findings: [],
    evidence: [],
    insurance: EMPTY_INSURANCE,
    assistanceOptions: [],
    actionPlan: null,
    createdAt: now.toISOString(),
  });
}
