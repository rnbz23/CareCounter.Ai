/** CareCounter v1: canonical cross-team contract. Do not independently rename fields. */
import { z } from "zod";

export const Id = z.string().min(1);
export const MoneyCents = z.number().int().nonnegative();
export const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();

export const SourceAnchorSchema = z.object({
  page: z.number().int().positive().nullable(),
  quote: z.string().nullable(),
  /** Normalized 0..1 coordinates, only when vision confidently returned them. */
  box: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).nullable(),
});
export type SourceAnchor = z.infer<typeof SourceAnchorSchema>;

export const LineItemSchema = z.object({
  id: Id, // stable: li_1, li_2 ... retained after review
  code: z.string().nullable(), // CPT/HCPCS if printed; no invented code
  description: z.string().min(1),
  serviceDate: ISODate,
  quantity: z.number().int().positive(),
  billedCents: MoneyCents, // total line charge, not per-unit unless explicitly printed
  anchor: SourceAnchorSchema.nullable(),
  extractionConfidence: z.enum(["high", "medium", "low"]),
});
export type LineItem = z.infer<typeof LineItemSchema>;

export const EvidenceSchema = z.object({
  id: Id,
  kind: z.enum(["hospital_price", "medicare_benchmark", "hospital_assistance", "insurer_policy", "insurer_contact", "government_program", "nonprofit_program"]),
  title: z.string(),
  sourceUrl: z.string().url(),
  retrievedAt: z.string(), // ISO timestamp
  hospitalId: z.string().nullable(),
  code: z.string().nullable(),
  priceType: z.enum(["gross", "discounted_cash", "payer_negotiated", "medicare", "not_applicable"]).nullable(),
  amountCents: MoneyCents.nullable(),
  note: z.string().nullable(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const FindingSchema = z.object({
  id: Id, // stable: finding_1; same ID used in voice client tool
  type: z.enum(["possible_duplicate", "hospital_price_difference", "medicare_context", "eob_mismatch", "unverified_code"]),
  severity: z.enum(["info", "review", "priority"]),
  lineItemIds: z.array(Id).min(1),
  title: z.string(),
  explanation: z.string(),
  billedCents: MoneyCents.nullable(),
  referenceCents: MoneyCents.nullable(),
  evidenceIds: z.array(Id),
  questionToAsk: z.string(),
});
export type Finding = z.infer<typeof FindingSchema>;

export const InsuranceProfileSchema = z.object({
  coverage: z.enum(["unknown", "insured", "uninsured"]),
  insurerName: z.string().nullable(),
  planName: z.string().nullable(),
  planTier: z.string().nullable(),
  networkStatus: z.enum(["unknown", "in_network", "out_of_network"]).nullable(),
  eobReceived: z.enum(["unknown", "yes", "no"]).nullable(),
  eobPatientResponsibilityCents: MoneyCents.nullable(),
  state: z.string().nullable(),
  householdSize: z.number().int().positive().nullable(),
  incomeBand: z.string().nullable(), // do not ask exact income in demo
});
export type InsuranceProfile = z.infer<typeof InsuranceProfileSchema>;

export const AssistanceOptionSchema = z.object({
  id: Id, // aid_1 etc; also a valid voice highlight target
  kind: z.enum(["hospital_charity", "self_pay_discount", "medicaid", "nonprofit", "insurance_appeal", "other"]),
  title: z.string(),
  status: z.enum(["possible", "needs_information", "confirmed"]),
  explanation: z.string(),
  evidenceIds: z.array(Id),
  contactName: z.string().nullable(),
  contactUrl: z.string().url().nullable(),
  phone: z.string().nullable(),
  confirmedPatientCostCents: MoneyCents.nullable(),
});
export type AssistanceOption = z.infer<typeof AssistanceOptionSchema>;

export const ActionStepSchema = z.object({
  id: Id, // step_1 ... highlight target
  priority: z.enum(["now", "next", "later"]),
  title: z.string(),
  instruction: z.string(),
  evidenceIds: z.array(Id),
  contactUrl: z.string().url().nullable(),
  phone: z.string().nullable(),
});
export type ActionStep = z.infer<typeof ActionStepSchema>;

export const PaymentSummarySchema = z.object({
  currentKnownResponsibilityCents: MoneyCents.nullable(),
  lowestConfirmedResponsibilityCents: MoneyCents.nullable(),
  savingsPossibleButUnverified: z.boolean(),
  explanation: z.string(),
});
export type PaymentSummary = z.infer<typeof PaymentSummarySchema>;

export const ActionPlanSchema = z.object({
  payment: PaymentSummarySchema,
  steps: z.array(ActionStepSchema),
});
export type ActionPlan = z.infer<typeof ActionPlanSchema>;

export const AnalysisSchema = z.object({
  id: Id, // analysis_... or uuid; treat as opaque
  hospitalId: z.string().nullable(),
  hospitalName: z.string(),
  inputType: z.enum(["pdf", "image", "text"]),
  currency: z.literal("USD"),
  serviceDate: ISODate,
  totalBilledCents: MoneyCents,
  lineItems: z.array(LineItemSchema),
  findings: z.array(FindingSchema),
  evidence: z.array(EvidenceSchema),
  insurance: InsuranceProfileSchema,
  assistanceOptions: z.array(AssistanceOptionSchema),
  actionPlan: ActionPlanSchema.nullable(),
  createdAt: z.string(),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export const BillExtractionSchema = z.object({
  hospitalName: z.string(),
  serviceDate: ISODate,
  totalBilledCents: MoneyCents,
  lineItems: z.array(LineItemSchema),
  notes: z.array(z.string()),
});
export type BillExtraction = z.infer<typeof BillExtractionSchema>;

export const FocusTargetSchema = z.object({
  targetType: z.enum(["line_item", "finding", "assistance", "step", "payment"]),
  targetId: z.string(),
});
export type FocusTarget = z.infer<typeof FocusTargetSchema>;

export const AgentToolRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("get_case_context"), analysisId: Id }),
  z.object({ action: z.literal("save_insurance_profile"), analysisId: Id, insurance: InsuranceProfileSchema }),
  z.object({ action: z.literal("get_assistance_options"), analysisId: Id }),
  z.object({ action: z.literal("generate_action_plan"), analysisId: Id }),
]);
export type AgentToolRequest = z.infer<typeof AgentToolRequestSchema>;

export const EMPTY_INSURANCE: InsuranceProfile = {
  coverage: "unknown", insurerName: null, planName: null, planTier: null,
  networkStatus: null, eobReceived: null, eobPatientResponsibilityCents: null,
  state: null, householdSize: null, incomeBand: null,
};
