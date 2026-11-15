import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnalysis } from "@/lib/db/neon";
import { formatCents, formatDate } from "@/lib/format";
import {
  assistanceStatusLabel,
  assistanceWhoItHelps,
  formatConfirmedResponsibility,
  formatKnownResponsibility,
  patientAskAction,
  patientFindingTitle,
  patientFindingWhy,
  patientPaymentBody,
  patientPaymentHeadline,
  severityLabel,
} from "@/lib/copy/patient";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { WorkflowPath } from "@/components/motion/WorkflowPath";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ analysisId: string }>;
}) {
  const { analysisId } = await params;

  let analysis;
  try {
    analysis = await getAnalysis(analysisId);
  } catch {
    notFound();
  }

  if (!analysis?.actionPlan) {
    notFound();
  }

  const { actionPlan } = analysis;
  const topFindings = analysis.findings.slice(0, 3);

  return (
    <div className="min-h-screen pb-16">
      <AppHeader activeStep="plan" analysisId={analysis.id} />

      <PageShell width="content" className="py-8 sm:py-10">
        <header className="cc-fade-up min-w-0">
          <WorkflowPath active="action" className="mb-6" />
          <h1 className="font-display text-4xl font-semibold tracking-tight text-navy-950 sm:text-5xl">
            Your next steps
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg">
            Here&apos;s what we found and what you can do to understand — or
            potentially reduce — your bill.
          </p>
          <p className="mt-2 text-sm text-ink-500">
            {analysis.hospitalName} · {formatDate(analysis.serviceDate)}
          </p>
        </header>

        {/* A. Understand your bill */}
        <section className="cc-fade-up-delay mt-8 min-w-0 rounded-[1.5rem] border border-ink-200 bg-white p-5 shadow-panel sm:p-7">
          <h2 className="font-display text-2xl font-semibold text-navy-950">
            Understand your bill
          </h2>
          <p className="mt-2 text-base leading-relaxed text-ink-700">
            {patientPaymentHeadline(actionPlan.payment)}.{" "}
            {patientPaymentBody(actionPlan.payment, analysis.totalBilledCents)}
          </p>

          <div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-3">
            <SummaryStat
              label="Hospital bill total"
              value={formatCents(analysis.totalBilledCents)}
              hint="What the hospital billed"
              emphasis
            />
            <SummaryStat
              label="Amount currently shown as your share"
              value={formatKnownResponsibility(
                actionPlan.payment.currentKnownResponsibilityCents,
              )}
              hint="May still change"
            />
            <SummaryStat
              label="Confirmed amount you owe"
              value={formatConfirmedResponsibility(
                actionPlan.payment.lowestConfirmedResponsibilityCents,
              )}
              hint="Only shown when verified"
            />
          </div>
        </section>

        {/* B. What we found */}
        <section className="mt-6 min-w-0 rounded-[1.5rem] border border-ink-200 bg-white p-5 shadow-panel sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold text-navy-950">
                What we found
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Possible issues to ask about — not confirmed mistakes.
              </p>
            </div>
            <Link
              href={`/analysis/${analysis.id}`}
              className="text-sm font-semibold text-[#0d737a] hover:underline"
            >
              Review on analysis screen
            </Link>
          </div>

          <ul className="mt-5 space-y-4">
            {topFindings.map((finding, index) => (
              <li
                key={finding.id}
                className="rounded-2xl border border-paper-rule bg-paper-muted/60 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0d737a] text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="text-[11px] font-semibold text-[#0d737a]">
                    {severityLabel(finding.severity)}
                  </span>
                </div>
                <p className="mt-2 font-display text-lg font-semibold text-navy-950">
                  {patientFindingTitle(finding, analysis.lineItems)}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  <span className="font-semibold text-navy-950">Why it matters: </span>
                  {patientFindingWhy(finding, analysis.lineItems)}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">
                  <span className="font-semibold text-navy-950">Ask: </span>
                  {patientAskAction(finding)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* C. Ways to reduce */}
        <section className="mt-6 min-w-0 rounded-[1.5rem] border border-ink-200 bg-white p-5 shadow-panel sm:p-7">
          <h2 className="font-display text-2xl font-semibold text-navy-950">
            Ways you may be able to reduce your bill
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Possible opportunities only. We do not promise eligibility or savings.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {analysis.assistanceOptions.map((option) => (
              <article
                key={option.id}
                className="rounded-2xl border border-paper-rule p-4 transition hover:border-[#0f8f96]/40"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0d737a]">
                  {assistanceStatusLabel(option.status)}
                </p>
                <h3 className="mt-2 font-semibold text-navy-950">{option.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {option.explanation}
                </p>
                <p className="mt-3 text-sm text-ink-700">
                  <span className="font-semibold">Who it may help: </span>
                  {assistanceWhoItHelps(option)}
                </p>
                {option.contactUrl || option.phone || option.contactName ? (
                  <div className="mt-3 text-sm text-ink-600">
                    {option.contactName ? <p>{option.contactName}</p> : null}
                    {option.phone ? <p>{option.phone}</p> : null}
                    {option.contactUrl ? (
                      <a
                        href={option.contactUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[#0d737a] hover:underline"
                      >
                        Official source
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-ink-500">
                    Ask the hospital billing office for the official application details.
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* D. Action checklist */}
        <section className="mt-6 min-w-0 rounded-[1.5rem] border border-ink-200 bg-white p-5 shadow-panel sm:p-7">
          <h2 className="font-display text-2xl font-semibold text-navy-950">
            Your action checklist
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Three prioritized steps you can take now.
          </p>

          <ol className="mt-6 space-y-4">
            {actionPlan.steps.map((step, index) => (
              <li
                key={step.id}
                className="relative rounded-2xl border border-paper-rule bg-paper-muted/40 p-4 pl-5 sm:p-5"
              >
                <div className="absolute bottom-5 left-0 top-5 w-1 rounded-r-full bg-[#0f8f96]" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                    {step.priority === "now"
                      ? "Do now"
                      : step.priority === "next"
                        ? "Do next"
                        : "Do later"}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold text-navy-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">
                  <span className="font-semibold text-navy-950">What to do: </span>
                  {step.instruction}
                </p>
                {(step.contactUrl || step.phone) && (
                  <div className="mt-3 text-sm">
                    {step.phone ? <p className="text-ink-600">{step.phone}</p> : null}
                    {step.contactUrl ? (
                      <a
                        href={step.contactUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[#0d737a] hover:underline"
                      >
                        Open official link
                      </a>
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* E. Continue with guide */}
        <section className="mt-6 flex min-w-0 flex-col gap-4 rounded-[1.5rem] bg-navy-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Have questions about your plan?
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Ask your Billing Guide to explain any step in plain language.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/analysis/${analysis.id}`}
              className="inline-flex rounded-2xl bg-[#0f8f96] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0d737a]"
            >
              Ask your Billing Guide
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-2xl border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              Analyze another bill
            </Link>
          </div>
        </section>
      </PageShell>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string;
  value: string;
  hint: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? "rounded-2xl bg-navy-950 px-4 py-4 text-white"
          : "rounded-2xl bg-paper-muted px-4 py-4"
      }
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${
          emphasis ? "text-white/55" : "text-ink-500"
        }`}
      >
        {label}
      </p>
      <p
        className={`cc-amount mt-2 font-display text-2xl font-semibold ${
          emphasis ? "text-white" : "text-navy-950"
        }`}
      >
        {value}
      </p>
      <p className={`mt-1 text-xs ${emphasis ? "text-white/55" : "text-ink-500"}`}>
        {hint}
      </p>
    </div>
  );
}
