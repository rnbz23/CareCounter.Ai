"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  Check,
  Copy,
  Globe2,
  HeartHandshake,
  Loader2,
  Mail,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import type {
  Analysis,
  FundraiseDraft,
  FundraiseFormat,
} from "@/types/contracts";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";

type FundraiseCardProps = {
  analysis: Analysis;
  variant?: "rail" | "inline";
};

export function FundraiseCard({
  analysis,
  variant = "rail",
}: FundraiseCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "rail" ? (
        <button
          type="button"
          data-cursor="button"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          className="cc-pressable group flex w-full shrink-0 items-center gap-3 rounded-2xl border border-ink-200/90 bg-white p-3 text-left shadow-panel hover:border-brand-200 hover:bg-brand-50/40"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <HeartHandshake className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-navy-950">
              Raise funds
              <Sparkles className="h-3.5 w-3.5 text-brand-500" aria-hidden />
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-ink-500">
              Draft a donor email or fundraiser page
            </span>
          </span>
          <ArrowUpRight
            className="h-4 w-4 shrink-0 text-ink-400 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600"
            aria-hidden
          />
        </button>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-brand-200/70 bg-[linear-gradient(135deg,#fff7f1_0%,#ffffff_55%,#eef8f5_100%)] p-5 shadow-panel">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-sm">
              <HeartHandshake className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-600">
                Need help covering the bill?
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold text-navy-950">
                Raise funds with a personal ask
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                Generate a donor email or fundraiser-page copy from this bill,
                then review it before sharing.
              </p>
            </div>
          </div>
          <button
            type="button"
            data-cursor="button"
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
            className="cc-pressable mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Start a fundraiser
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </button>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
            AI drafts only. Nothing is sent or published automatically.
          </p>
        </section>
      )}

      <FundraiseDialog
        analysis={analysis}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function defaultGoalCents(analysis: Analysis): number {
  return (
    analysis.actionPlan?.payment.currentKnownResponsibilityCents ??
    analysis.totalBilledCents
  );
}

function centsToInput(cents: number): string {
  return (Math.max(0, cents) / 100).toFixed(2);
}

function draftCopy(draft: FundraiseDraft): string {
  if (draft.format === "email") {
    return `Subject: ${draft.subject ?? ""}\n\n${draft.body}`;
  }

  return [draft.title, draft.body, draft.shareText]
    .filter(Boolean)
    .join("\n\n");
}

function FundraiseDialog({
  analysis,
  open,
  onClose,
}: {
  analysis: Analysis;
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [format, setFormat] = useState<FundraiseFormat>("email");
  const [goal, setGoal] = useState(() =>
    centsToInput(defaultGoalCents(analysis)),
  );
  const [audience, setAudience] = useState("Family & friends");
  const [personalNote, setPersonalNote] = useState("");
  const [draft, setDraft] = useState<FundraiseDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  const goalId = useId();
  const audienceId = useId();
  const noteId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!mounted || !open) return null;

  const changeFormat = (next: FundraiseFormat) => {
    setFormat(next);
    setDraft(null);
    setError(null);
    setCopied(null);
  };

  const generate = async () => {
    const dollars = Number(goal.replace(/,/g, ""));
    const goalCents = Math.round(dollars * 100);

    if (!Number.isFinite(dollars) || goalCents < 100) {
      setError("Enter a fundraising goal of at least $1.");
      return;
    }

    setLoading(true);
    setError(null);
    setCopied(null);

    try {
      const response = await fetch(
        `/api/analyses/${encodeURIComponent(analysis.id)}/fundraise`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            format,
            goalCents,
            audience: audience.trim() || null,
            personalNote: personalNote.trim() || null,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | FundraiseDraft
        | { error?: { message?: string } }
        | null;

      if (!response.ok) {
        const message =
          payload && "error" in payload
            ? payload.error?.message
            : "The fundraiser draft could not be generated.";
        throw new Error(message || "The fundraiser draft could not be generated.");
      }

      if (!payload || !("body" in payload) || !payload.body) {
        throw new Error("The server returned an empty draft. Please try again.");
      }

      setDraft(payload);
      window.setTimeout(() => {
        resultRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }, 40);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The fundraiser draft could not be generated.",
      );
    } finally {
      setLoading(false);
    }
  };

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setError("Copy failed. Select the text and copy it manually.");
    }
  };

  const mailtoHref =
    draft?.format === "email"
      ? `mailto:?subject=${encodeURIComponent(draft.subject ?? "")}&body=${encodeURIComponent(draft.body)}`
      : null;

  return createPortal(
    <div
      className="cc-stage-in fixed inset-0 z-[90] flex items-center justify-center bg-[#071a1d]/70 p-3 backdrop-blur-md sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="cc-scale-in flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.5rem] border border-white/20 bg-paper shadow-lift outline-none"
      >
        <header className="relative overflow-hidden bg-[linear-gradient(135deg,#0e1a2b_0%,#1b2a41_58%,#243752_100%)] px-5 py-5 text-white sm:px-6">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-brand-500/15 blur-2xl" aria-hidden />
          <div className="relative flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#9edbd4] ring-1 ring-white/15">
              <HeartHandshake className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7ec8cc]">
                Fundraising studio
              </p>
              <h2 id={titleId} className="mt-1 font-display text-2xl font-semibold">
                Ask for help with this bill
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-white/65">
                Draft a message from the facts already on this page. Review and
                personalize it before you share.
              </p>
            </div>
            <button
              type="button"
              data-cursor="button"
              onClick={onClose}
              aria-label="Close fundraising studio"
              className="cc-pressable grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-white/75 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto cc-scrollbar px-4 py-5 sm:px-6">
          {error ? (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          {draft ? (
            <div ref={resultRef} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                    Your draft
                  </p>
                  <p className="mt-1 text-sm text-ink-600">
                    Edit freely. The copy buttons use the current text.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(null);
                    setCopied(null);
                    setError(null);
                  }}
                  className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 hover:border-ink-300 hover:text-navy-950"
                >
                  Edit details
                </button>
              </div>

              {draft.format === "email" ? (
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                    Subject
                  </span>
                  <input
                    value={draft.subject ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, subject: event.target.value })
                    }
                    className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-navy-950 outline-none focus:border-[#0f8f96]"
                  />
                </label>
              ) : (
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                    Fundraiser title
                  </span>
                  <input
                    value={draft.title ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, title: event.target.value })
                    }
                    className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-navy-950 outline-none focus:border-[#0f8f96]"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                  {draft.format === "email" ? "Email body" : "Fundraiser story"}
                </span>
                <textarea
                  value={draft.body}
                  onChange={(event) =>
                    setDraft({ ...draft, body: event.target.value })
                  }
                  rows={9}
                  className="cc-scrollbar w-full resize-y rounded-xl border border-ink-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-ink-700 outline-none focus:border-[#0f8f96]"
                />
              </label>

              {draft.format === "campaign" ? (
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                    Share text
                  </span>
                  <textarea
                    value={draft.shareText ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, shareText: event.target.value })
                    }
                    rows={3}
                    className="cc-scrollbar w-full resize-y rounded-xl border border-ink-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-ink-700 outline-none focus:border-[#0f8f96]"
                  />
                </label>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  data-cursor="button"
                  onClick={() => copy(draftCopy(draft), "draft")}
                  className="cc-pressable inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  {copied === "draft" ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden />
                  )}
                  {copied === "draft"
                    ? "Copied"
                    : draft.format === "email"
                      ? "Copy email"
                      : "Copy fundraiser copy"}
                </button>
                {mailtoHref ? (
                  <a
                    href={mailtoHref}
                    data-cursor="button"
                    className="cc-pressable inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 hover:border-[#0f8f96]/40 hover:bg-paper-muted"
                  >
                    <Send className="h-4 w-4" aria-hidden />
                    Open in email app
                  </a>
                ) : null}
                <button
                  type="button"
                  data-cursor="button"
                  onClick={() => void generate()}
                  disabled={loading}
                  className="cc-pressable inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 hover:border-[#0f8f96]/40 hover:bg-paper-muted disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden />
                  )}
                  Generate again
                </button>
              </div>

              <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900">
                Review every amount and detail before sending or publishing.
                Only share what you are comfortable making public. Never include
                account numbers, member IDs, or your SSN.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-2 sm:grid-cols-2">
                <FormatChoice
                  active={format === "email"}
                  icon={<Mail className="h-4 w-4" aria-hidden />}
                  title="Donor email"
                  description="A personal message for people you know"
                  onClick={() => changeFormat("email")}
                />
                <FormatChoice
                  active={format === "campaign"}
                  icon={<Globe2 className="h-4 w-4" aria-hidden />}
                  title="Fundraiser page"
                  description="Story and share text for an online fundraiser"
                  onClick={() => changeFormat("campaign")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={goalId}
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500"
                  >
                    Fundraising goal
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-400">
                      $
                    </span>
                    <input
                      id={goalId}
                      value={goal}
                      onChange={(event) => setGoal(event.target.value)}
                      inputMode="decimal"
                      className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-7 pr-3.5 text-sm font-medium text-navy-950 outline-none focus:border-[#0f8f96]"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink-500">
                    Suggested from this case: {formatCents(defaultGoalCents(analysis))}. You can change it.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor={audienceId}
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500"
                  >
                    Who is this for?
                  </label>
                  <select
                    id={audienceId}
                    value={audience}
                    onChange={(event) => setAudience(event.target.value)}
                    className="cc-select w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-navy-950 outline-none"
                  >
                    <option>Family & friends</option>
                    <option>Community & neighbors</option>
                    <option>Coworkers</option>
                    <option>Social network</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor={noteId}
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500"
                >
                  Anything you want included? <span className="normal-case tracking-normal text-ink-400">(optional)</span>
                </label>
                <textarea
                  id={noteId}
                  value={personalNote}
                  onChange={(event) => setPersonalNote(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="A sentence about why this help matters, in your own words."
                  className="cc-scrollbar w-full resize-y rounded-xl border border-ink-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-ink-700 outline-none placeholder:text-ink-400 focus:border-[#0f8f96]"
                />
                <p className="mt-1 text-right text-[10px] text-ink-400">
                  {personalNote.length}/500
                </p>
              </div>

              <button
                type="button"
                data-cursor="button"
                onClick={() => void generate()}
                disabled={loading}
                className="cc-pressable inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="h-4 w-4" aria-hidden />
                )}
                {loading
                  ? "Drafting your message…"
                  : format === "email"
                    ? "Draft my donor email"
                    : "Draft my fundraiser page"}
              </button>

              <p className="text-center text-[11px] leading-relaxed text-ink-500">
                We use this bill&apos;s hospital, total, and assistance details to
                keep the draft grounded. No medical record is sent.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FormatChoice({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3.5 text-left transition-colors",
        active
          ? "border-[#0f8f96] bg-[#effbf9] shadow-[0_0_0_3px_rgba(15,143,150,0.08)]"
          : "border-ink-200 bg-white hover:border-ink-300 hover:bg-paper-muted/50",
      )}
    >
      <span
        className={cn(
          "flex items-center gap-2 text-sm font-semibold",
          active ? "text-[#0d737a]" : "text-navy-950",
        )}
      >
        {icon}
        {title}
      </span>
      <span className="mt-1 block text-[11px] leading-snug text-ink-500">
        {description}
      </span>
    </button>
  );
}
