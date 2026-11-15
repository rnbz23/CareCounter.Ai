"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BrandMark } from "@/components/layout/BrandMark";
import { DnaHelix } from "@/components/motion/DnaHelix";

type Phase = "idle" | "dna" | "fly" | "reveal" | "done";

// Survives client-side route changes; resets on full page load.
let hasPlayedIntro = false;

/**
 * Home boot: DNA helix with CareCounter mark + name below, then the mark
 * slides into the real header logo slot.
 */
export function BrandIntro() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [flight, setFlight] = useState({ x: 0, y: 0, scale: 1 });
  const [mounted, setMounted] = useState(false);
  const markRef = useRef<HTMLDivElement>(null);

  const finish = useCallback(() => {
    hasPlayedIntro = true;
    setPhase("done");
    document.documentElement.classList.remove("cc-intro-active");
    document.documentElement.classList.remove("cc-intro-lock");
  }, []);

  useEffect(() => {
    setMounted(true);
    let reduceMotion = false;
    let forceIntro = false;
    try {
      reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      forceIntro = new URLSearchParams(window.location.search).get("intro") === "1";
    } catch {
      // play intro
    }

    if (reduceMotion || (hasPlayedIntro && !forceIntro)) {
      setPhase("done");
      return;
    }

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.documentElement.classList.add("cc-intro-active");
    document.documentElement.classList.add("cc-intro-lock");
    setPhase("dna");
  }, []);

  useEffect(() => {
    if (phase !== "dna" && phase !== "fly" && phase !== "reveal") return;

    let timer: number | undefined;

    if (phase === "dna") {
      timer = window.setTimeout(() => {
        const source = markRef.current?.getBoundingClientRect();
        const target = document.getElementById("cc-brand-mark")?.getBoundingClientRect();

        if (source && target) {
          const sourceCx = source.left + source.width / 2;
          const sourceCy = source.top + source.height / 2;
          const targetCx = target.left + target.width / 2;
          const targetCy = target.top + target.height / 2;
          setFlight({
            x: targetCx - sourceCx,
            y: targetCy - sourceCy,
            scale: target.width / source.width,
          });
        } else {
          setFlight({ x: -window.innerWidth * 0.42, y: -window.innerHeight * 0.42, scale: 0.32 });
        }
        setPhase("fly");
      }, 2200);
    }

    if (phase === "fly") {
      timer = window.setTimeout(() => setPhase("reveal"), 980);
    }

    if (phase === "reveal") {
      timer = window.setTimeout(finish, 380);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [finish, phase]);

  useEffect(() => {
    if (phase === "idle" || phase === "done") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finish, phase]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove("cc-intro-active");
      document.documentElement.classList.remove("cc-intro-lock");
    };
  }, []);

  if (!mounted || phase === "idle" || phase === "done") {
    return null;
  }

  const isDna = phase === "dna";
  const isFlying = phase === "fly" || phase === "reveal";
  const isRevealing = phase === "reveal";

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center overflow-hidden bg-[#f4f8f6]"
      data-phase={phase}
      role="presentation"
      aria-label="CareCounter intro"
      style={{ opacity: 1 }}
    >
      <div
        aria-hidden
        className={`cc-intro-backdrop absolute inset-0 transition-opacity duration-500 ease-out ${
          isRevealing ? "opacity-0" : "opacity-100"
        }`}
      />

      <div className="relative flex w-full max-w-[420px] flex-col items-center px-6">
        <div
          className={`relative flex h-[280px] w-[280px] items-center justify-center transition-all duration-500 ease-premium ${
            isDna ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"
          }`}
        >
          <div aria-hidden className="cc-intro-halo absolute h-[280px] w-[280px] rounded-full" />
          <div
            aria-hidden
            className="absolute h-[250px] w-[250px] rounded-full border border-cobalt-500/15"
          />
          <DnaHelix caption="" size="md" />
        </div>

        <div className="mt-5 flex flex-col items-center gap-3">
          <div
            ref={markRef}
            className="will-change-transform"
            style={{
              transform: isFlying
                ? `translate3d(${flight.x}px, ${flight.y}px, 0) scale(${flight.scale})`
                : "translate3d(0, 0, 0) scale(1)",
              transition: isFlying
                ? "transform 980ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease"
                : undefined,
              opacity: isRevealing ? 0 : 1,
              transformOrigin: "center center",
            }}
          >
            <BrandMark size="xl" className="h-[88px] w-[88px]" />
          </div>
          <p
            className={`font-display text-[1.35rem] font-semibold tracking-[0.22em] text-navy-950 transition-opacity duration-300 ${
              isFlying || isRevealing ? "opacity-0" : "opacity-100"
            }`}
          >
            CARECOUNTER
          </p>
        </div>
      </div>

      <p
        className={`absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.24em] text-navy-950/45 transition-opacity duration-300 ${
          isRevealing || isFlying ? "opacity-0" : "opacity-100"
        }`}
      >
        Clarity for the cost of care
      </p>

      <button
        type="button"
        onClick={finish}
        className={`absolute bottom-6 right-6 rounded-full border border-ink-200/80 bg-white/70 px-3.5 py-2 text-xs font-semibold text-navy-950/70 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-navy-950 ${
          isRevealing ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        Skip intro
      </button>

      <span className="sr-only">Loading CareCounter</span>
    </div>,
    document.body,
  );
}
