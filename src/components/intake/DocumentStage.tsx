"use client";

import { cn } from "@/lib/utils";

type Stage = "idle" | "reading" | "matching" | "preparing";

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
        "relative mt-5 overflow-hidden rounded-[1.35rem] border px-4 py-8 transition-all duration-[180ms] ease-out",
        dragOver
          ? "scale-[1.015] border-[#0f8f96] bg-[#0f8f96]/08"
          : "border-dashed border-ink-300 bg-paper-muted/40 hover:border-[#0f8f96]/50",
      )}
    >
      {/* Layered paper stack */}
      <div className="relative mx-auto h-44 w-full max-w-[240px]">
        <div
          aria-hidden
          className="absolute inset-x-6 top-4 h-36 rotate-[-6deg] rounded-xl bg-navy-100/80 shadow-sm"
        />
        <div
          aria-hidden
          className="absolute inset-x-4 top-2 h-36 rotate-[3deg] rounded-xl border border-ink-100 bg-white shadow-sm"
        />
        <div
          className={cn(
            "absolute inset-x-2 top-0 h-40 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-panel transition duration-300",
            fileName && "cc-doc-selected",
            dragOver && "-translate-y-1",
          )}
        >
          {/* Corner fold */}
          <div
            aria-hidden
            className="absolute right-0 top-0 h-0 w-0 border-l-[28px] border-t-[28px] border-l-transparent border-t-[#d7ecec]"
          />
          <div className="space-y-2 p-4 pt-5">
            <div className="h-2 w-24 rounded bg-ink-100" />
            <div className="h-2 w-36 rounded bg-ink-100" />
            <div className="mt-4 space-y-1.5">
              <div className="h-1.5 w-full rounded bg-paper-muted" />
              <div className="h-1.5 w-[88%] rounded bg-paper-muted" />
              <div className="h-1.5 w-[72%] rounded bg-paper-muted" />
              <div className="h-1.5 w-[80%] rounded bg-[#0f8f96]/25" />
            </div>
          </div>

          {/* Scan line only while analysis is in progress */}
          {scanning ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="cc-scan-line absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-[#0f8f96]/35 to-transparent" />
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 mt-5 text-center">
        {fileName ? (
          <div className="cc-scale-in mx-auto max-w-sm rounded-xl border border-[#0f8f96]/30 bg-[#0f8f96]/08 px-3 py-2.5 text-left">
            <p className="truncate text-sm font-semibold text-navy-950">{fileName}</p>
            <p className="text-xs text-ink-500">
              {fileSizeKb} KB
              {scanning
                ? ` · ${stage === "reading" ? "Scanning" : stage === "matching" ? "Matching" : "Preparing"}`
                : " · Ready"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-navy-950">
              Drop your {modeLabel} statement here
            </p>
            <p className="mt-1 text-xs text-ink-500">or choose a file to begin</p>
          </>
        )}

        <button
          type="button"
          data-cursor="button"
          onClick={(e) => {
            e.stopPropagation();
            onChooseFile();
          }}
          className="cc-pressable mt-4 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-navy-900 transition duration-150 hover:border-[#0f8f96] hover:text-[#0d737a]"
        >
          Choose file
        </button>
      </div>
    </div>
  );
}
