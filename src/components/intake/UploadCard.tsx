"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, FileText, ImageIcon, Lock, Upload } from "lucide-react";
import { submitBillForAnalysis } from "@/lib/api/analysis";
import { AUTO_HOSPITAL_ID, KNOWN_HOSPITALS } from "@/lib/data/hospitals";
import { useOptionalDnaRoute } from "@/components/boot/DnaRouteLoader";
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
  const dnaRoute = useOptionalDnaRoute();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [hospitalId, setHospitalId] = useState(AUTO_HOSPITAL_ID);
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
              hospitalId,
            }
          : {
              kind: "file",
              file: file!,
              hospitalId,
            },
      );

      await tick(420);
      setStage("matching");
      await tick(320);
      setStage("preparing");
      // Bring up DNA before the analyze call resolves so the transition is visible.
      dnaRoute?.showDna("Opening your review");

      const analysis = await analysisPromise;
      setSucceeded(true);

      window.sessionStorage.setItem("cc_language", language);
      window.sessionStorage.setItem("cc_enter_from", "upload");
      const href = `/analysis/${analysis.id}`;
      if (dnaRoute) {
        dnaRoute.navigateWithDna(href, "Opening your review");
      } else {
        router.push(href);
      }
    } catch (err) {
      dnaRoute?.hideDna();
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
      className="cc-upload-card relative w-full rounded-[1.6rem] p-5 transition duration-[220ms] hover:-translate-y-0.5 hover:shadow-lift sm:p-7"
    >
      <div className="relative mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cobalt-700">
          Patient bill intake
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-navy-950">
          Upload your hospital statement
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
          Attach the itemized medical bill (PDF or photo) or paste the printed
          charges. Max 5 MB · one file.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cobalt-50 px-2.5 py-1 text-[11px] font-medium text-cobalt-800 ring-1 ring-cobalt-500/15">
          <Lock className="h-3 w-3" aria-hidden />
          Used for this review only · no patient account required
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
            <option value={AUTO_HOSPITAL_ID}>Auto-detect from bill</option>
            {KNOWN_HOSPITALS.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.label}
              </option>
            ))}
          </select>
          <span className="mt-1.5 block text-[10px] leading-snug text-ink-400">
            Price comparison is available for supported hospitals only.
          </span>
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
            className="w-full resize-y rounded-2xl border border-ink-200 bg-paper-muted/80 px-4 py-3 text-sm leading-relaxed outline-none transition duration-180 focus:border-cobalt-500 focus:bg-white focus:ring-2 focus:ring-cobalt-500/15"
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
          className="cc-tip-enter mt-4 rounded-2xl border border-cobalt-500/25 bg-cobalt-500/08 px-4 py-3.5 text-sm text-navy-950"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">
              {STAGE_COPY[stage as Exclude<Stage, "idle">]}
            </p>
            {succeeded ? (
              <svg
                className="cc-check-draw h-5 w-5 text-cobalt-700"
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
              className="h-full rounded-full bg-cobalt-500 transition-all duration-[220ms] ease-out"
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
            ? "cc-primary"
            : "bg-ink-300",
        )}
      >
        {canSubmit ? "Analyze my hospital bill" : "Add a statement to continue"}
      </Pressable>
    </div>
  );
}

function tick(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
