import type {
  ActionPlan,
  Analysis,
  AssistanceOption,
  Evidence,
} from "@/types/contracts";

const ASSISTANCE_KINDS = [
  "hospital_assistance",
  "insurer_contact",
  "insurer_policy",
  "government_program",
  "nonprofit_program",
] as const;

export type PublicResourceKind = (typeof ASSISTANCE_KINDS)[number];

export function assistanceEvidenceKindsFor(
  coverage: Analysis["insurance"]["coverage"],
): PublicResourceKind[] {
  if (coverage === "insured") {
    return ["insurer_contact", "insurer_policy", "hospital_assistance"];
  }
  if (coverage === "uninsured") {
    return ["hospital_assistance", "government_program", "nonprofit_program"];
  }
  return [...ASSISTANCE_KINDS];
}

/**
 * Build assistance possibilities from stored public evidence only.
 * Never claims eligibility, savings, or confirmed patient cost.
 */
export function buildAssistanceOptions(
  analysis: Analysis,
  publicResourceRows: Evidence[],
): AssistanceOption[] {
  const options: AssistanceOption[] = [];
  let aidIndex = 1;

  const relevant = publicResourceRows.filter((row) =>
    ASSISTANCE_KINDS.includes(row.kind as PublicResourceKind),
  );

  for (const evidence of relevant) {
    const option = optionFromEvidence(analysis, evidence, `aid_${aidIndex}`);
    if (option) {
      options.push(option);
      aidIndex += 1;
    }
  }

  if (analysis.insurance.coverage === "insured" && options.length === 0) {
    options.push({
      id: `aid_${aidIndex}`,
      kind: "insurance_appeal",
      title: "Check your insurer member portal or ID card",
      status: "needs_information",
      explanation:
        "No official insurer contact evidence is stored for this case yet. Use the phone number and portal on your insurance card, then ask about claim status and any appeal options. CareCounter does not invent insurer phone numbers.",
      evidenceIds: [],
      contactName: analysis.insurance.insurerName,
      contactUrl: null,
      phone: null,
      confirmedPatientCostCents: null,
    });
  }

  return options;
}

function optionFromEvidence(
  analysis: Analysis,
  evidence: Evidence,
  id: string,
): AssistanceOption | null {
  const phone = extractPhone(evidence.note) ?? extractPhone(evidence.title);

  if (evidence.kind === "hospital_assistance") {
    return {
      id,
      kind: "hospital_charity",
      title: evidence.title,
      status: "possible",
      explanation: withPossibilityGuard(
        evidence.note ??
          "This hospital publishes a financial-assistance program. Eligibility is not established until the hospital reviews an application.",
      ),
      evidenceIds: [evidence.id],
      contactName: analysis.hospitalName,
      contactUrl: evidence.sourceUrl,
      phone,
      confirmedPatientCostCents: null,
    };
  }

  if (evidence.kind === "government_program") {
    return {
      id,
      kind: "medicaid",
      title: evidence.title,
      status: "possible",
      explanation: withPossibilityGuard(
        evidence.note ??
          "A government coverage program may apply depending on state rules and household circumstances. CareCounter does not determine eligibility.",
      ),
      evidenceIds: [evidence.id],
      contactName: null,
      contactUrl: evidence.sourceUrl,
      phone,
      confirmedPatientCostCents: null,
    };
  }

  if (evidence.kind === "nonprofit_program") {
    return {
      id,
      kind: "nonprofit",
      title: evidence.title,
      status: "possible",
      explanation: withPossibilityGuard(
        evidence.note ??
          "A nonprofit may be able to help with coverage or medical-debt questions. Confirm availability directly with the organization.",
      ),
      evidenceIds: [evidence.id],
      contactName: null,
      contactUrl: evidence.sourceUrl,
      phone,
      confirmedPatientCostCents: null,
    };
  }

  if (evidence.kind === "insurer_contact" || evidence.kind === "insurer_policy") {
    return {
      id,
      kind: "insurance_appeal",
      title: evidence.title,
      status: analysis.insurance.coverage === "insured" ? "possible" : "needs_information",
      explanation: withPossibilityGuard(
        evidence.note ??
          "Use this official insurer resource to ask about claim status, network rules, or appeals. Prefer the contact details on your member ID card when available.",
      ),
      evidenceIds: [evidence.id],
      contactName: analysis.insurance.insurerName,
      contactUrl: evidence.sourceUrl,
      phone,
      confirmedPatientCostCents: null,
    };
  }

  return null;
}

function withPossibilityGuard(text: string): string {
  const trimmed = text.trim();
  if (/eligibility is not|does not determine|must be confirmed|not established/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed} This is a possibility to explore, not a confirmed eligibility decision.`;
}

/** Only surface phones already printed in stored public evidence text. */
function extractPhone(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(
    /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/,
  );
  return match?.[0]?.trim() ?? null;
}

/**
 * Deterministic three-step plan grounded in bill findings, insurance answers,
 * and evidence-backed assistance options. Never invents a minimum payment.
 */
export function buildActionPlan(analysis: Analysis): ActionPlan {
  const eobCents = analysis.insurance.eobPatientResponsibilityCents;
  const userProvidedEob =
    analysis.insurance.coverage === "insured" &&
    analysis.insurance.eobReceived === "yes" &&
    typeof eobCents === "number";

  const firstFinding = analysis.findings[0] ?? null;
  const firstAid = analysis.assistanceOptions[0] ?? null;

  const steps = [
    {
      id: "step_1",
      priority: "now" as const,
      title: firstFinding
        ? `Ask about: ${firstFinding.title}`
        : "Ask the hospital to itemize unclear charges",
      instruction: firstFinding
        ? firstFinding.questionToAsk
        : "Request a plain-language itemized bill and written explanations for any charge you do not recognize.",
      evidenceIds: firstFinding?.evidenceIds ?? [],
      contactUrl: null,
      phone: null,
    },
    {
      id: "step_2",
      priority: "next" as const,
      title:
        analysis.insurance.coverage === "insured"
          ? "Confirm claim status with your insurer"
          : "Explore hospital financial assistance",
      instruction:
        analysis.insurance.coverage === "insured"
          ? userProvidedEob
            ? `You reported an EOB patient responsibility of $${(eobCents / 100).toFixed(2)} (user-provided, not verified claims data). Ask your insurer to confirm claim status, network rules, and whether an appeal or review is available.`
            : "Ask your insurer whether a claim was filed, what remains patient responsibility, and whether an appeal or review is available. Prefer the phone number on your ID card."
          : firstAid
            ? `${firstAid.explanation} Use the linked official source before applying.`
            : "Ask the hospital billing office which financial-assistance or self-pay discount applications are available for your dates of service. Do not assume approval.",
      evidenceIds: firstAid?.evidenceIds ?? [],
      contactUrl: firstAid?.contactUrl ?? null,
      phone: firstAid?.phone ?? null,
    },
    {
      id: "step_3",
      priority: "later" as const,
      title: "Keep written records before you pay",
      instruction:
        "Save the bill, any EOB, and written answers from the hospital or insurer. Do not share Social Security numbers, member IDs, or account passwords with CareCounter.",
      evidenceIds: [],
      contactUrl: null,
      phone: null,
    },
  ];

  return {
    payment: {
      currentKnownResponsibilityCents: userProvidedEob ? eobCents : null,
      lowestConfirmedResponsibilityCents: null,
      savingsPossibleButUnverified: analysis.findings.some(
        (finding) =>
          finding.type === "hospital_price_difference" ||
          finding.type === "possible_duplicate",
      ),
      explanation: userProvidedEob
        ? `The only patient-responsibility figure currently available is the $${(eobCents / 100).toFixed(2)} user-provided amount from an EOB. CareCounter has not verified that amount against insurer claims data, and no confirmed minimum payment is established.`
        : "No confirmed patient-responsibility minimum is available yet. Public price differences and assistance programs are leads to investigate, not guaranteed savings.",
    },
    steps,
  };
}
