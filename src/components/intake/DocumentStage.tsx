"use client";

import { FileText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type Stage = "idle" | "reading" | "matching" | "preparing";

/** Hospital-statement dropzone — browse button always present (a11y). */
export function DocumentStage({
  fileName,
  fileSizeKb,
  dragOver,
  scanning,
  stage,
  modeLabel,
  onChooseFile,
}: {
  fileName: string | null;
  fileSizeKb: string | null;
  dragOver: boolean;
  scanning: boolean;
  stage: Stage;
  modeLabel: string;
  onChooseFile: () => void;
}) {
  return (
    <div
      data-cursor="upload"
      className={cn(
        "relative mt-5 overflow-hidden rounded-[1.35rem] border-2 border-dashed px-4 py-7 transition-all duration-[180ms] ease-out",
        dragOver
          ? "scale-[1.01] border-cobalt-500 bg-cobalt-50"
          : "border-ink-300/90 bg-[linear-gradient(180deg,#ffffff_0%,#f3f6fb_100%)] hover:border-cobalt-400/60",
      )}
    >
      <div className="relative mx-auto flex w-full max-w-[280px] flex-col items-center">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-xl border border-ink-200 bg-white shadow-panel",
            dragOver && "-translate-y-0.5",
          )}
        >
          <div className="flex items-center justify-between border-b border-dashed border-ink-200 bg-paper-muted/80 px-3 py-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt-600">
                Hospital statement
              </p>
              <p className="text-[11px] font-medium text-navy-950">
                {fileName ? "Ready to review" : "Awaiting upload"}
              </p>
            </div>
            <span className="rounded-lg bg-navy-950 px-2 py-1 text-[10px] font-semibold text-white">
              {modeLabel.toUpperCase()}
            </span>
          </div>
          <div className="space-y-2 p-3">
            <div className="h-1.5 w-20 rounded bg-ink-100" />
            <div className="h-1.5 w-32 rounded bg-ink-100" />
            <div className="mt-3 space-y-1.5">
              <div className="h-1.5 w-full rounded bg-paper-muted" />
              <div className="h-1.5 w-[90%] rounded bg-paper-muted" />
              <div className="h-1.5 w-[70%] rounded bg-brand-200/70" />
              <div className="h-1.5 w-[78%] rounded bg-cobalt-200/80" />
            </div>
          </div>
          {scanning ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="cc-scan-line absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-cobalt-500/35 to-transparent" />
            </div>
          ) : null}
        </div>

        <div className="relative z-10 mt-5 w-full text-center">
          {fileName ? (
            <div className="cc-scale-in rounded-xl border border-cobalt-500/25 bg-cobalt-50 px-3 py-2.5 text-left">
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-cobalt-600" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy-950">{fileName}</p>
                  <p className="text-xs text-ink-500">
                    {fileSizeKb} KB
                    {scanning
                      ? ` · ${stage === "reading" ? "Reading charges" : stage === "matching" ? "Checking prices" : "Preparing review"}`
                      : " · Ready to analyze"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-navy-950">
                Drop your medical bill {modeLabel} here
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Or browse — PDF / photo of the printed statement
              </p>
            </>
          )}

          <button
            type="button"
            data-cursor="button"
            onClick={(e) => {
              e.stopPropagation();
              onChooseFile();
            }}
            className="cc-pressable mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-cobalt-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cobalt-700"
          >
            <Upload className="h-4 w-4" aria-hidden />
            {fileName ? "Replace file" : "Browse files"}
          </button>
        </div>
      </div>
    </div>
  );
}
