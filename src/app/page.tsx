import { ClipboardList, MessageCircle, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BrandIntro } from "@/components/layout/BrandIntro";
import { PageShell } from "@/components/layout/PageShell";
import { UploadCard } from "@/components/intake/UploadCard";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { AmbientVideo } from "@/components/media/AmbientVideo";
import { BillPreviewArt } from "@/components/marketing/BillPreviewArt";

const TRUST = [
  { icon: ClipboardList, label: "Line-item bill review" },
  { icon: MessageCircle, label: "Ask about any charge" },
  { icon: ShieldCheck, label: "No account required" },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-paper">
      <BrandIntro />
      {/* Medical statement hero — brand first, clinical context clear */}
      <section className="relative isolate flex min-h-[100svh] flex-col">
        <AmbientVideo
          overlayClassName="bg-[linear-gradient(105deg,rgba(5,8,13,0.78)_0%,rgba(5,8,13,0.62)_42%,rgba(5,8,13,0.88)_100%)]"
        />
        <div className="relative z-10">
          <AppHeader activeStep="analyze" tone="night" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-end gap-10 px-5 pb-12 pt-10 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:pb-16">
          <div className="max-w-2xl">
            <p className="cc-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden />
              Hospital bill assistant
            </p>
            <p className="cc-rise cc-delay-1 mt-5 font-display text-[clamp(3rem,9vw,5.75rem)] font-semibold leading-[0.92] tracking-[-0.04em] text-white">
              CareCounter
            </p>
            <h1 className="cc-rise cc-delay-2 mt-5 max-w-[18ch] font-display text-[clamp(1.55rem,2.8vw,2.35rem)] font-medium leading-[1.15] tracking-[-0.02em] text-white/92">
              Understand every charge on your hospital statement.
            </h1>
            <p className="cc-rise cc-delay-3 mt-4 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Upload a medical bill. We flag line items worth questioning, compare
              public hospital prices where available, and walk you through the
              statement in plain language — before you call billing.
            </p>
            <div className="cc-rise cc-delay-4 mt-8">
              <a
                href="#start-review"
                className="cc-pressable inline-flex items-center justify-center rounded-2xl bg-brand-500 px-9 py-4 text-base font-semibold text-white shadow-signal hover:bg-brand-400 sm:px-11 sm:py-5 sm:text-lg"
              >
                Review my hospital bill
              </a>
            </div>
            <ul className="cc-rise cc-delay-4 mt-7 flex flex-wrap gap-2">
              {TRUST.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur"
                >
                  <Icon className="h-3.5 w-3.5 text-cobalt-300" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="cc-rise cc-delay-3 hidden w-full max-w-sm lg:block">
            <div className="rounded-[1.4rem] border border-white/15 bg-night/45 p-3 shadow-lift backdrop-blur-md">
              <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
                Example statement preview
              </p>
              <BillPreviewArt />
              <p className="mt-2 px-2 text-[11px] leading-relaxed text-white/50">
                Synthetic demo charges — never your personal medical record.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="start-review"
        className="relative scroll-mt-20 border-t border-ink-200/80 bg-[linear-gradient(180deg,#f7f9fc_0%,#eef2f7_100%)]"
      >
        <PageShell
          width="wide"
          className="grid gap-10 py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-start lg:gap-14"
        >
          <div className="cc-rise">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cobalt-600">
              Patient bill intake
            </p>
            <h2 className="mt-3 max-w-[16ch] font-display text-3xl font-semibold tracking-tight text-navy-950 sm:text-4xl">
              Send the statement. Keep the medical questions.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-600">
              Choose a language, attach your hospital bill, and we prepare a
              charge-by-charge review you can discuss with the billing guide on
              the next screen.
            </p>
            <div className="mt-8 hidden lg:block">
              <HowItWorks />
            </div>
          </div>

          <div className="cc-rise cc-delay-2 relative min-w-0">
            <UploadCard />
          </div>

          <div className="cc-rise cc-delay-3 lg:hidden">
            <HowItWorks />
          </div>
        </PageShell>

        <PageShell width="wide" className="border-t border-ink-200/60 pb-12 pt-6">
          <div className="flex flex-col gap-3 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl leading-relaxed">
              We surface possible billing questions — never confirmed overcharges
              or guaranteed savings. This is not medical or legal advice.
            </p>
            <p className="inline-flex items-center gap-2 font-medium text-cobalt-700">
              <span className="h-1.5 w-1.5 rounded-full bg-cobalt-500" aria-hidden />
              Private by default · No patient account required
            </p>
          </div>
        </PageShell>
      </section>
    </div>
  );
}
