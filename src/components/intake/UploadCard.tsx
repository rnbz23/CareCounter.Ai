"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, FileText, ImageIcon, Upload } from "lucide-react";
import { submitBillForAnalysis } from "@/lib/api/analysis";
import { LanguageSelector, type LanguageCode } from "./LanguageSelector";
import { DocumentStage } from "./DocumentStage";
import { Pressable } from "@/components/motion/Pressable";
import { cn } from "@/lib/utils";

type Mode = "pdf" | "image" | "text";
type Stage = "idle" | "reading" | "matching" | "preparing";

const ACCEPTED = {
  pdf: { accept: "application/pdf,.pdf" },
  image: {
    accept: "image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp",
  },
} as const;

const MAX_BYTES = 5 * 1024 * 1024;

const STAGE_COPY: Record<Exclude<Stage, "idle">, string> = {
  reading: "Reading your statement…",
  matching: "Checking charges…",
  preparing: "Opening your review…",
};

export function UploadCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [hospitalId, setHospitalId] = useState("auto");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [succeeded, setSucceeded] = useState(false);

  const busy = stage !== "idle";
  const accept = mode === "text" ? undefined : ACCEPTED[mode].accept;

  const validateFile = useCallback(
    (next: File): string | null => {
      if (next.size > MAX_BYTES) return "File must be 5 MB or smaller.";
      if (mode === "pdf" && next.type !== "application/pdf") {
        return "Please upload a PDF file.";
      }
      if (
        mode === "image" &&
        !["image/png", "image/jpeg", "image/webp"].includes(next.type)
      ) {
        return "Please upload a PNG, JPG, or WebP image.";
      }
      return null;
    },
    [mode],
  );

  const onSelectFile = useCallback(
    (next: File | null) => {
      if (!next) {
        setFile(null);
        return;
      }
      const message = validateFile(next);
      if (message) {
        setError(message);
        setFile(null);
        return;
      }
      setError(null);
      setSucceeded(false);
      setFile(next);
    },
    [validateFile],
  );

  const canSubmit = useMemo(() => {
    if (busy) return false;
    if (mode === "text") return text.trim().length >= 20;
    return !!file;
  }, [busy, file, mode, text]);

  const progress =
    stage === "reading" ? 30 : stage === "matching" ? 65 : stage === "preparing" ? 90 : 0;

  async function onAnalyze() {
    setError(null);
    setSucceeded(false);
    try {
      // Visual stages track real in-flight work; navigation only after success.
      setStage("reading");
      const analysisPromise = submitBillForAnalysis(
        mode === "text"
          ? {
              kind: "text",
              text: text.trim(),
              hospitalId: hospitalId === "auto" ? undefined : hospitalId,
            }
          : {
              kind: "file",
              file: file!,
              hospitalId: hospitalId === "auto" ? undefined : hospitalId,
            },
      );

      await tick(420);
      setStage("matching");
      await tick(320);
      setStage("preparing");

      const analysis = await analysisPromise;
      setSucceeded(true);

      window.sessionStorage.setItem("cc_language", language);
      window.sessionStorage.setItem("cc_enter_from", "upload");
      // Navigate immediately after success — do not delay for animation.
      router.push(`/analysis/${analysis.id}`);
    } catch (err) {
      setStage("idle");
      setSucceeded(false);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while analyzing the bill.",
      );
    }
  }

  return (
    <div
      data-cursor="card"
      className="cc-surface relative w-full overflow-hidden rounded-[1.6rem] p-5 transition duration-[220ms] hover:-translate-y-0.5 hover:shadow-lift sm:p-7"
    >
      <div className="relative mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0d737a]">
          Start here
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-navy-950">
          Upload your hospital bill
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          PDF, photo, or paste the printed charges · max 5 MB
        </p>
      </div>

      <div className="relative grid grid-cols-3 gap-1 rounded-2xl bg-paper-muted p-1">
        {(
          [
            ["pdf", "PDF", FileText],
            ["image", "Image", ImageIcon],
            ["text", "Text", Upload],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            data-cursor="button"
            onClick={() => {
              setMode(key);
              setFile(null);
              setError(null);
              setSucceeded(false);
            }}
            className={cn(
              "cc-pressable inline-flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-medium",
              mode === key
                ? "bg-white text-navy-950 shadow-sm"
                : "text-ink-500 hover:text-navy-900",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <LanguageSelector value={language} onChange={setLanguage} />
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Hospital
          </span>
          <select
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
            className="cc-select w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none"
          >
            <option value="auto">Auto-detect</option>
            <option value="hospital_demo_sd_01">Pacific Coast Medical (Demo)</option>
          </select>
        </label>
      </div>

      {mode === "text" ? (
        <div className="mt-5 cc-scale-in">
          <textarea
            id="bill-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Paste hospital name, date, and charges…"
            className="w-full resize-y rounded-2xl border border-ink-200 bg-paper-muted/80 px-4 py-3 text-sm leading-relaxed outline-none transition duration-180 focus:border-[#0f8f96] focus:bg-white focus:ring-2 focus:ring-[#0f8f96]/15"
          />
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) onSelectFile(dropped);
          }}
        >
          <DocumentStage
            fileName={file?.name ?? null}
            fileSizeKb={file ? (file.size / 1024).toFixed(1) : null}
            dragOver={dragOver}
            scanning={busy}
            stage={stage}
            modeLabel={mode === "pdf" ? "PDF" : "image"}
            onChooseFile={() => inputRef.current?.click()}
          />
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => onSelectFile(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      {error ? (
        <div
          role="alert"
          className="cc-tip-enter mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">{error}</p>
            <button
              type="button"
              data-cursor="button"
              className="mt-1 text-xs font-semibold underline"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {busy ? (
        <div
          aria-live="polite"
          className="cc-tip-enter mt-4 rounded-2xl border border-[#0f8f96]/25 bg-[#0f8f96]/08 px-4 py-3.5 text-sm text-navy-950"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">
              {STAGE_COPY[stage as Exclude<Stage, "idle">]}
            </p>
            {succeeded ? (
              <svg
                className="cc-check-draw h-5 w-5 text-[#0d737a]"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-[#0f8f96] transition-all duration-[220ms] ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      <Pressable
        disabled={!canSubmit}
        onClick={onAnalyze}
        className={cn(
          "mt-5 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3.5 text-sm font-semibold text-white",
          canSubmit
            ? "bg-brand-600 hover:bg-brand-700"
            : "bg-ink-300",
        )}
      >
        {canSubmit ? "Analyze my bill" : "Add a bill to continue"}
      </Pressable>
    </div>
  );
}

function tick(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
