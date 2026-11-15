"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DnaHelix } from "@/components/motion/DnaHelix";

/** Medical bill-review stages — not generic brand adjectives. */
const WORDS = ["Reading charges", "Checking prices", "Preparing questions"];

/**
 * One-shot boot screen for the medical bill assistant.
 * Uses the same DNA helix as route transitions.
 */
export function SiteLoader() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    let reduceMotion = false;
    let force = false;
    try {
      reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      force = new URLSearchParams(window.location.search).get("loader") === "1";
      const played = window.sessionStorage.getItem("cc_loader_played") === "1";
      if (reduceMotion || (played && !force)) {
        setVisible(false);
        return;
      }
    } catch {
      // play loader
    }

    setVisible(true);
    document.documentElement.classList.add("cc-intro-lock");

    const duration = 2600;
    const doneTimer = window.setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      setExiting(true);
      window.setTimeout(() => {
        try {
          window.sessionStorage.setItem("cc_loader_played", "1");
        } catch {
          // ignore
        }
        document.documentElement.classList.remove("cc-intro-lock");
        setVisible(false);
      }, 420);
    }, duration);

    const wordTimer = window.setInterval(() => {
      setWordIndex((value) => Math.min(WORDS.length - 1, value + 1));
    }, 780);

    return () => {
      window.clearTimeout(doneTimer);
      window.clearInterval(wordTimer);
      document.documentElement.classList.remove("cc-intro-lock");
    };
  }, []);

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100000] flex flex-col items-center justify-center overflow-hidden bg-[#f4f8f6] ${
        exiting ? "cc-site-loader-exit" : ""
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading CareCounter bill review"
      style={{ opacity: exiting ? undefined : 1 }}
    >
      <div aria-hidden className="cc-intro-backdrop absolute inset-0" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        <div className="relative flex items-center justify-center">
          <div
            aria-hidden
            className="cc-intro-halo absolute h-[300px] w-[300px] rounded-full"
          />
          <div
            aria-hidden
            className="absolute h-[270px] w-[270px] rounded-full border border-cobalt-500/15"
          />
          <DnaHelix caption={WORDS[wordIndex] ?? "Reading charges"} />
        </div>

        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-navy-950/45">
            CareCounter
          </p>
          <p className="mt-2 text-sm font-medium text-navy-950/55">
            Preparing your hospital statement guide
          </p>
        </div>
      </div>

      <p className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.24em] text-navy-950/45">
        Clarity for the cost of care
      </p>
    </div>,
    document.body,
  );
}
