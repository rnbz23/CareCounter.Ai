import { notFound } from "next/navigation";
import { getAnalysisById } from "@/lib/api/analysis";
import { AnalysisWorkspace } from "@/components/analysis/AnalysisWorkspace";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ analysisId: string }>;
}) {
  const { analysisId } = await params;

  let analysis;
  try {
    analysis = await getAnalysisById(analysisId);
  } catch {
    notFound();
  }

  if (!analysis) {
    notFound();
  }

  return <AnalysisWorkspace analysis={analysis} />;
}
