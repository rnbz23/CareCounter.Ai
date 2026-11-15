import { FileSearch, Languages, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BrandIntro } from "@/components/layout/BrandIntro";
import { PageShell } from "@/components/layout/PageShell";
import { UploadCard } from "@/components/intake/UploadCard";
import { HowItWorks } from "@/components/marketing/HowItWorks";

const HERO_POINTS = [
  { icon: FileSearch, label: "Plain-language findings" },
  { icon: Languages, label: "English · Español · 中文 · Tagalog" },
  { icon: ShieldCheck, label: "No account needed" },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <BrandIntro />

      <div aria-hidden className="cc-hero-aurora pointer-events-none absolute inset-x-0 top-0 h-[620px]" />
      <div aria-hidden className="cc-hero-grid pointer-events-none absolute inset-0" />

      <div className="relative">
        <AppHeader activeStep="analyze" />

        <PageShell width="wide" className="pb-14 pt-9 lg:pt-14">
          <div className="grid min-w-0 items-start gap-9 lg:grid-cols-[minmax(0,0.96fr)_minmax(420px,1.04fr)] lg:gap-12 xl:gap-16">
            <section className="min-w-0 lg:pt-3">
              <div className="cc-rise inline-flex items-center gap-2 rounded-full border border-[#0b3b3f]/10 bg-white/60 py-1.5 pl-2 pr-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0b4e55] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur">
                <span className="cc-live-dot h-1.5 w-1.5 rounded-full bg-[#0f8f96]" aria-hidden />
                Medical bills, made human
              </div>

              <h1 className="cc-rise cc-delay-1 mt-5 max-w-[13ch] font-display text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.045em] text-navy-950 sm:text-[3.65rem] lg:text-[4.1rem]">
                Your hospital bill,{" "}
                <span className="cc-text-gradient">made easier to understand.</span>
              </h1>

              <p className="cc-rise cc-delay-2 mt-5 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">
                Upload your bill. We&apos;ll help you identify charges worth
                questioning, understand your options, and leave with a clear next
                step — in plain language.
              </p>

              <div className="cc-rise cc-delay-3 mt-7 flex flex-wrap gap-2">
                {HERO_POINTS.map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#0b3b3f]/8 bg-white/55 px-3 py-1.5 text-xs font-medium text-ink-600 backdrop-blur transition-colors duration-300 hover:border-[#0f8f96]/25 hover:bg-white/85 hover:text-navy-950"
                  >
                    <Icon className="h-3.5 w-3.5 text-[#0f8f96]" aria-hidden />
                    {label}
                  </span>
                ))}
              </div>

              <div className="cc-rise cc-delay-4 mt-9 hidden max-w-xl lg:block">
                <HowItWorks />
              </div>
            </section>

            <section className="cc-rise cc-delay-2 relative min-w-0">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 z-0 rounded-[2.8rem] bg-[radial-gradient(circle_at_60%_15%,rgba(15,143,150,0.16),transparent_58%),radial-gradient(circle_at_8%_90%,rgba(228,87,46,0.1),transparent_52%)] blur-2xl"
              />

              <div className="relative z-10 mb-3 flex items-center justify-between px-1">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e4572e]" aria-hidden />
                  Start your review
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-400">
                  PDF · Photo · Text
                </span>
              </div>

              <div className="relative z-10">
                <UploadCard />
              </div>

              <div
                aria-hidden
                className="cc-float absolute -left-5 top-[42%] hidden items-center gap-2 rounded-2xl border border-white/80 bg-white/85 px-3.5 py-2.5 text-xs font-semibold text-navy-900 shadow-lift backdrop-blur xl:flex"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#0f8f96]/10 text-[#0d737a]">
                  <FileSearch className="h-3.5 w-3.5" />
                </span>
                Charge-by-charge review
              </div>

              <div
                aria-hidden
                className="cc-float-slow absolute -right-3 bottom-[22%] hidden items-center gap-2 rounded-2xl border border-white/80 bg-white/85 px-3.5 py-2.5 text-xs font-semibold text-navy-900 shadow-lift backdrop-blur xl:flex"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#e4572e]/10 text-[#c53d1c]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                Questions, not promises
              </div>
            </section>
          </div>

          <div className="cc-rise cc-delay-4 mt-10 lg:hidden">
            <HowItWorks />
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-[#0b3b3f]/10 pt-5 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl leading-relaxed">
              Possible issues to ask about — never confirmed overcharges or
              guaranteed savings.
            </p>
            <p className="inline-flex items-center gap-2 font-medium text-[#0b4e55]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0f8f96]" aria-hidden />
              Private by default · No account required
            </p>
          </div>
        </PageShell>
      </div>
    </div>
  );
}
