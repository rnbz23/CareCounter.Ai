import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { UploadCard } from "@/components/intake/UploadCard";
import { HowItWorks } from "@/components/marketing/HowItWorks";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <AppHeader activeStep="analyze" />

      <PageShell width="wide" className="pb-16 pt-8 lg:pt-10">
        <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-10 xl:gap-14">
          <section className="cc-fade-up min-w-0">
            <h1 className="max-w-xl font-display text-[2.35rem] font-semibold leading-[1.1] tracking-tight text-navy-950 sm:text-5xl">
              Your hospital bill, made easier to understand.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-600 sm:text-lg">
              Upload your bill. We&apos;ll help you identify charges to question,
              understand your options, and figure out what to do next.
            </p>

            <div className="mt-8 hidden lg:block">
              <HowItWorks />
            </div>
          </section>

          <section className="cc-fade-up-delay min-w-0">
            <UploadCard />
          </section>
        </div>

        <div className="mt-8 lg:hidden">
          <HowItWorks />
        </div>
      </PageShell>
    </div>
  );
}
