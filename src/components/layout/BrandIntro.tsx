"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BrandMark } from "@/components/layout/BrandMark";

type Phase = "idle" | "dna" | "mark" | "fly" | "reveal" | "done";

const MARK_SIZE = 96;

// Survives client-side route changes, resets on a full page load so the
// landing animation still plays when someone opens or reloads the site.
let hasPlayedIntro = false;

const RUNGS = Array.from({ length: 11 }, (_, index) => {
  const bend = Math.sin((index / 10) * Math.PI * 2.6) * 32;
  return {
    y: 26 + index * 20.5,
    x1: 64 + bend,
    x2: 176 - bend,
  };
});

/**
 * One-time landing sequence: DNA helix -> CareCounter mark -> fly to the
 * actual header logo. The real header mark is the landing target, so the
 * handoff stays aligned at any viewport size.
 */
export function BrandIntro() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [flight, setFlight] = useState({ x: 0, y: 0, scale: 0.3 });

  const finish = useCallback(() => {
    hasPlayedIntro = true;
    setPhase("done");
  }, []);

  useEffect(() => {
    let reduceMotion = false;
    let forceIntro = false;
    try {
      reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      forceIntro = new URLSearchParams(window.location.search).get("intro") === "1";
    } catch {
      // fall through and play the intro
    }

    if (reduceMotion || (hasPlayedIntro && !forceIntro)) {
      setPhase("done");
      return;
    }

    // A restored scroll position would put the header target off-screen.
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setPhase("dna");
  }, []);

  useEffect(() => {
    const active = phase !== "idle" && phase !== "done";
    if (!active) return;

    const root = document.documentElement;
    root.classList.add("cc-intro-lock");
    return () => root.classList.remove("cc-intro-lock");
  }, [phase]);

  useEffect(() => {
    if (phase !== "dna" && phase !== "mark" && phase !== "fly" && phase !== "reveal") {
      return;
    }

    let timer: number | undefined;

    if (phase === "dna") {
      timer = window.setTimeout(() => setPhase("mark"), 1450);
    }

    if (phase === "mark") {
      timer = window.setTimeout(() => {
        const target = document.getElementById("cc-brand-mark");
        if (target) {
          const rect = target.getBoundingClientRect();
          setFlight({
            x: rect.left + rect.width / 2 - window.innerWidth / 2,
            y: rect.top + rect.height / 2 - window.innerHeight / 2,
            scale: rect.width / MARK_SIZE,
          });
        } else {
          setFlight({
            x: 44 - window.innerWidth / 2,
            y: 32 - window.innerHeight / 2,
            scale: 0.3,
          });
        }
        setPhase("fly");
      }, 760);
    }

    if (phase === "fly") {
      timer = window.setTimeout(() => setPhase("reveal"), 940);
    }

    if (phase === "reveal") {
      timer = window.setTimeout(finish, 460);
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

  if (phase === "idle" || phase === "done" || typeof document === "undefined") {
    return null;
  }

  const isDna = phase === "dna";
  const isFlying = phase === "fly" || phase === "reveal";
  const isRevealing = phase === "reveal";

  return createPortal(
    <div
      className="cc-intro fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      data-phase={phase}
      role="presentation"
      aria-label="CareCounter intro"
    >
      <div
        aria-hidden
        className={`cc-intro-backdrop absolute inset-0 transition-opacity duration-500 ease-out ${
          isRevealing ? "opacity-0" : "opacity-100"
        }`}
      />

      <div className="relative flex h-[340px] w-[340px] items-center justify-center">
        <div
          aria-hidden
          className={`cc-intro-halo absolute h-[300px] w-[300px] rounded-full transition-all duration-700 ease-premium ${
            isDna ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
        />
        <div
          aria-hidden
          className={`absolute h-[270px] w-[270px] rounded-full border border-[#0f8f96]/15 transition-all duration-700 ${
            isDna ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
        />

        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-premium ${
            isDna ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
        >
          <DnaStage />
        </div>

        {phase !== "dna" ? (
          <div
            className={`absolute left-1/2 top-1/2 -ml-12 -mt-12 h-24 w-24 will-change-transform ${
              phase === "mark" ? "cc-mark-arrive" : ""
            }`}
            style={{
              transform: isFlying
                ? `translate3d(${flight.x}px, ${flight.y}px, 0) scale(${flight.scale})`
                : "translate3d(0, 0, 0) scale(1)",
              transition: isFlying
                ? "transform 940ms cubic-bezier(0.22, 1, 0.36, 1)"
                : undefined,
              transformOrigin: "center center",
            }}
          >
            <BrandMark size="xl" className="h-24 w-24" />
          </div>
        ) : null}

        {phase === "mark" ? (
          <p className="cc-intro-word absolute left-1/2 top-[calc(50%+72px)] -translate-x-1/2 whitespace-nowrap font-display text-[15px] font-semibold uppercase tracking-[0.3em] text-[#0b3b3f]">
            CareCounter
          </p>
        ) : null}
      </div>

      <p
        className={`absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#0b3b3f]/45 transition-opacity duration-300 ${
          isRevealing ? "opacity-0" : "opacity-100"
        }`}
      >
        Clarity for the cost of care
      </p>

      <button
        type="button"
        onClick={finish}
        className={`absolute bottom-6 right-6 rounded-full border border-[#0b3b3f]/10 bg-white/70 px-3.5 py-2 text-xs font-semibold text-[#0b3b3f]/70 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-[#0b3b3f] ${
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

function DnaStage() {
  return (
    <div className="relative flex h-[300px] w-[300px] items-center justify-center">
      <svg
        viewBox="0 0 240 280"
        className="cc-helix-sway h-[280px] w-[240px] overflow-visible"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="cc-dna-stroke" x1="48" y1="20" x2="192" y2="260" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0f8f96" />
            <stop offset="0.5" stopColor="#0b666d" />
            <stop offset="1" stopColor="#e4572e" stopOpacity="0.76" />
          </linearGradient>
          <filter id="cc-dna-glow" x="-30%" y="-10%" width="160%" height="120%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M64 18C124 54 4 98 64 134C124 170 4 214 64 250"
          stroke="url(#cc-dna-stroke)"
          strokeWidth="2.6"
          strokeLinecap="round"
          pathLength={1}
          className="cc-dna-strand"
          filter="url(#cc-dna-glow)"
        />
        <path
          d="M176 18C116 54 236 98 176 134C116 170 236 214 176 250"
          stroke="url(#cc-dna-stroke)"
          strokeWidth="2.6"
          strokeLinecap="round"
          pathLength={1}
          className="cc-dna-strand cc-dna-strand-delayed"
          filter="url(#cc-dna-glow)"
        />

        {RUNGS.map((rung, index) => (
          <g key={rung.y}>
            <line
              x1={rung.x1}
              y1={rung.y}
              x2={rung.x2}
              y2={rung.y}
              stroke="#0f8f96"
              strokeWidth="1.4"
              strokeLinecap="round"
              className="cc-dna-rung"
              style={{ animationDelay: `${index * 85}ms` }}
            />
            <circle
              cx={rung.x1}
              cy={rung.y}
              r="2.1"
              fill="#0f8f96"
              className="cc-dna-node"
              style={{ animationDelay: `${index * 85}ms` }}
            />
            <circle
              cx={rung.x2}
              cy={rung.y}
              r="2.1"
              fill="#e4572e"
              opacity="0.8"
              className="cc-dna-node"
              style={{ animationDelay: `${index * 85 + 160}ms` }}
            />
          </g>
        ))}
      </svg>

      <div
        aria-hidden
        className="cc-dna-scan pointer-events-none absolute inset-x-12 h-20 rounded-full bg-[linear-gradient(180deg,transparent,rgba(15,143,150,0.13),transparent)]"
      />

      <p className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.32em] text-[#0b3b3f]/42">
        Reading the bill
      </p>
    </div>
  );
}
