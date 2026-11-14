import type { Analysis } from "@/types/contracts";
import { AnalysisSchema } from "@/types/contracts";
import { DEMO_ANALYSIS, DEMO_ANALYSIS_ID } from "@/lib/mock/demo-analysis";

const useMock =
  process.env.NEXT_PUBLIC_USE_MOCK_ANALYSIS !== "false";

export type AnalyzeInput =
  | { kind: "file"; file: File; hospitalId?: string }
  | { kind: "text"; text: string; hospitalId?: string };

export async function submitBillForAnalysis(
  input: AnalyzeInput,
): Promise<Analysis> {
  if (useMock) {
    // Simulate Reading → Matching → Preparing latency for demo reliability.
    await delay(900);
    return {
      ...DEMO_ANALYSIS,
      id: DEMO_ANALYSIS_ID,
      inputType:
        input.kind === "text"
          ? "text"
          : input.file.type === "application/pdf"
            ? "pdf"
            : "image",
      createdAt: new Date().toISOString(),
    };
  }

  const form = new FormData();
  if (input.kind === "file") {
    form.append("file", input.file);
  } else {
    form.append("text", input.text);
  }
  if (input.hospitalId) {
    form.append("hospitalId", input.hospitalId);
  }

  const res = await fetch("/api/analyze", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(
      body?.error?.message ?? `Analysis failed (${res.status})`,
    );
  }

  const json = await res.json();
  const parsed = AnalysisSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Analysis response did not match shared contract.");
  }
  return parsed.data;
}

export async function getAnalysisById(analysisId: string): Promise<Analysis> {
  if (useMock || analysisId === DEMO_ANALYSIS_ID) {
    if (analysisId !== DEMO_ANALYSIS_ID && !useMock) {
      // fall through to API when mock is off
    } else {
      await delay(200);
      return { ...DEMO_ANALYSIS, id: analysisId || DEMO_ANALYSIS_ID };
    }
  }

  const res = await fetch(`/api/analyses/${encodeURIComponent(analysisId)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(
      body?.error?.message ?? `Could not load analysis (${res.status})`,
    );
  }

  const json = await res.json();
  const parsed = AnalysisSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Analysis response did not match shared contract.");
  }
  return parsed.data;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeJson(res: Response): Promise<{
  error?: { code?: string; message?: string };
} | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
