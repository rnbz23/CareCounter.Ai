/**
 * Shared CareCounter demo fixture.
 * Frontend and voice work against this until /api/analyze returns the same shape.
 * Synthetic price difference is labeled illustrative; evidence stays empty (no fake URLs).
 */
import type { Analysis } from "@/types/contracts";
import { EMPTY_INSURANCE } from "@/types/contracts";

export const DEMO_ANALYSIS_ID = "analysis_demo_sandiego_001";

export const DEMO_ANALYSIS: Analysis = {
  id: DEMO_ANALYSIS_ID,
  hospitalId: "hospital_demo_sd_01",
  hospitalName: "Pacific Coast Medical Center (Demo)",
  inputType: "pdf",
  currency: "USD",
  serviceDate: "2025-09-12",
  totalBilledCents: 211000,
  lineItems: [
    {
      id: "li_1",
      code: "71046",
      description: "Chest X-ray, 2 views",
      serviceDate: "2025-09-12",
      quantity: 1,
      billedCents: 95000,
      anchor: {
        page: 1,
        quote: "Chest X-ray, 2 views — $950.00",
        box: null,
      },
      extractionConfidence: "high",
    },
    {
      id: "li_2",
      code: "80053",
      description: "Comprehensive metabolic panel",
      serviceDate: "2025-09-12",
      quantity: 1,
      billedCents: 18000,
      anchor: {
        page: 1,
        quote: "Comprehensive metabolic panel — $180.00",
        box: null,
      },
      extractionConfidence: "high",
    },
    {
      id: "li_3",
      code: "80053",
      description: "Comprehensive metabolic panel",
      serviceDate: "2025-09-12",
      quantity: 1,
      billedCents: 18000,
      anchor: {
        page: 1,
        quote: "Comprehensive metabolic panel — $180.00",
        box: null,
      },
      extractionConfidence: "high",
    },
    {
      id: "li_4",
      code: null,
      description: "Emergency department visit",
      serviceDate: "2025-09-12",
      quantity: 1,
      billedCents: 80000,
      anchor: {
        page: 1,
        quote: "Emergency department visit — $800.00",
        box: null,
      },
      extractionConfidence: "medium",
    },
  ],
  findings: [
    {
      id: "finding_1",
      type: "hospital_price_difference",
      severity: "priority",
      lineItemIds: ["li_1"],
      title: "Chest X-ray may be higher than a public reference",
      explanation:
        "Your bill lists $950.00 for a chest X-ray (2 views). An illustrative hospital reference for a similar code is $350.00. This is a demo comparison only — not a confirmed overcharge. Ask the hospital how this charge was priced.",
      billedCents: 95000,
      referenceCents: 35000,
      evidenceIds: [],
      questionToAsk:
        "Can you explain how the $950 chest X-ray charge was calculated, and whether a cash or self-pay rate applies?",
    },
    {
      id: "finding_2",
      type: "possible_duplicate",
      severity: "review",
      lineItemIds: ["li_2", "li_3"],
      title: "Possible duplicate metabolic panel",
      explanation:
        "Two identical comprehensive metabolic panel charges ($180.00 each) appear on the same service date with the same code. They may be legitimate separate draws, or one may be a duplicate. Worth confirming with the billing office.",
      billedCents: 36000,
      referenceCents: null,
      evidenceIds: [],
      questionToAsk:
        "Were two comprehensive metabolic panels performed on 2025-09-12, or is one charge a duplicate?",
    },
  ],
  evidence: [],
  insurance: { ...EMPTY_INSURANCE },
  assistanceOptions: [
    {
      id: "aid_1",
      kind: "hospital_charity",
      title: "Hospital financial assistance (possible)",
      status: "needs_information",
      explanation:
        "Many hospitals publish charity-care or financial-assistance policies for uninsured or underinsured patients. Eligibility depends on household size and income band. Confirm details on the hospital's official assistance page once insurance status is known.",
      evidenceIds: [],
      contactName: "Patient Financial Services",
      contactUrl: null,
      phone: null,
      confirmedPatientCostCents: null,
    },
    {
      id: "aid_2",
      kind: "self_pay_discount",
      title: "Self-pay / prompt-pay discount (possible)",
      status: "possible",
      explanation:
        "If you are uninsured or paying cash, ask whether a self-pay or prompt-pay discount applies before arranging payment.",
      evidenceIds: [],
      contactName: null,
      contactUrl: null,
      phone: null,
      confirmedPatientCostCents: null,
    },
  ],
  actionPlan: {
    payment: {
      currentKnownResponsibilityCents: 211000,
      lowestConfirmedResponsibilityCents: null,
      savingsPossibleButUnverified: true,
      explanation:
        "Current known billed total is $2,110.00. A lower confirmed patient responsibility has not been established yet. Possible reductions depend on insurance, EOB details, and assistance eligibility.",
    },
    steps: [
      {
        id: "step_1",
        priority: "now",
        title: "Ask about the X-ray price and possible duplicate lab",
        instruction:
          "Call or message hospital billing with the two questions listed on your findings. Request an itemized review before paying the full balance.",
        evidenceIds: [],
        contactUrl: null,
        phone: null,
      },
      {
        id: "step_2",
        priority: "next",
        title: "Confirm insurance and EOB status",
        instruction:
          "Tell your billing guide whether you have insurance and if you received an Explanation of Benefits. That determines insurer contacts vs. assistance pathways.",
        evidenceIds: [],
        contactUrl: null,
        phone: null,
      },
      {
        id: "step_3",
        priority: "later",
        title: "Ask about financial assistance options",
        instruction:
          "If uninsured or facing a high balance, request the hospital financial-assistance application and any self-pay discount policy.",
        evidenceIds: [],
        contactUrl: null,
        phone: null,
      },
    ],
  },
  createdAt: "2025-11-14T18:00:00.000Z",
};
