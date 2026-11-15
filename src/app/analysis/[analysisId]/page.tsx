import { notFound } from "next/navigation";
import { DatabaseError, getAnalysis } from "@/lib/db/neon";
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
    analysis = await getAnalysis(analysisId);
  } catch (error) {
    if (error instanceof DatabaseError) {
      notFound();
    }
    notFound();
  }

  if (!analysis) {
    notFound();
  }

  return <AnalysisWorkspace analysis={analysis} />;
}
