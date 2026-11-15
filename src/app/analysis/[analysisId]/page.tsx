import { notFound } from "next/navigation";
import { ensureAnalysisFindingsReady } from "@/lib/analysis/ensure-findings";
import { loadAnalysisForPage } from "@/lib/analysis/load";
import { AnalysisWorkspace } from "@/components/analysis/AnalysisWorkspace";

export const runtime = "nodejs";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ analysisId: string }>;
}) {
  const { analysisId } = await params;

  let analysis;
  try {
    analysis = await loadAnalysisForPage(analysisId);
  } catch {
    notFound();
  }

  if (!analysis) {
    notFound();
  }

  try {
    analysis = await ensureAnalysisFindingsReady(analysis);
  } catch {
    // Keep the stored analysis if price refresh fails.
  }

  return <AnalysisWorkspace analysis={analysis} />;
}
