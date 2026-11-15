"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal, flushSync } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { DnaHelix } from "@/components/motion/DnaHelix";

type DnaNavPayload = {
  to: string;
  label: string;
  startedAt: number;
};

type DnaRouteContextValue = {
  navigateWithDna: (href: string, label?: string) => void;
  /** Show the DNA overlay without navigating (e.g. while upload finishes). */
  showDna: (label?: string) => void;
  hideDna: () => void;
};

const DnaRouteContext = createContext<DnaRouteContextValue | null>(null);

const STORAGE_KEY = "cc_dna_nav";
const MIN_VISIBLE_MS = 1600;
const NAV_DELAY_MS = 120;
const MAX_VISIBLE_MS = 10000;
const EXIT_MS = 380;

function labelForRoute(href: string): string {
  if (href.includes("/plan")) return "Preparing your plan";
  if (href.startsWith("/analysis/")) return "Opening your review";
  return "Loading CareCounter";
}

function readPending(): DnaNavPayload | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DnaNavPayload;
    if (!parsed?.to || !parsed.startedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePending(payload: DnaNavPayload | null) {
  try {
    if (!payload) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
}

function pathsMatch(current: string, target: string) {
  if (current === target) return true;
  const normalize = (value: string) =>
    value.replace(/\/$/, "").split("?")[0] ?? value;
  return normalize(current) === normalize(target);
}

export function useDnaRoute() {
  const ctx = useContext(DnaRouteContext);
  if (!ctx) {
    throw new Error("useDnaRoute must be used within DnaRouteLoader");
  }
  return ctx;
}

export function useOptionalDnaRoute() {
  return useContext(DnaRouteContext);
}

export function DnaRouteLoader({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [label, setLabel] = useState("Loading CareCounter");
  const [target, setTarget] = useState<string | null>(null);
  const startedAtRef = useRef<number>(0);
  const arrivedRef = useRef(false);
  const hideTimer = useRef<number | null>(null);
  const exitTimer = useRef<number | null>(null);
  const navTimer = useRef<number | null>(null);
  const pathnameRef = useRef(pathname);

  pathnameRef.current = pathname;

  const clearTimers = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    if (exitTimer.current) window.clearTimeout(exitTimer.current);
    if (navTimer.current) window.clearTimeout(navTimer.current);
    hideTimer.current = null;
    exitTimer.current = null;
    navTimer.current = null;
  }, []);

  const hideOverlay = useCallback(() => {
    clearTimers();
    setExiting(true);
    exitTimer.current = window.setTimeout(() => {
      setVisible(false);
      setExiting(false);
      setTarget(null);
      arrivedRef.current = false;
      writePending(null);
      document.documentElement.classList.remove("cc-intro-lock");
    }, EXIT_MS);
  }, [clearTimers]);

  const scheduleHide = useCallback(() => {
    const elapsed = Date.now() - startedAtRef.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(hideOverlay, wait);
  }, [hideOverlay]);

  const showOverlay = useCallback(
    (nextLabel: string, nextTarget: string | null, startedAt = Date.now()) => {
      clearTimers();
      arrivedRef.current = false;
      startedAtRef.current = startedAt;
      // Force a paint before any following router.push / heavy work.
      flushSync(() => {
        setLabel(nextLabel);
        setTarget(nextTarget);
        setExiting(false);
        setVisible(true);
      });
      document.documentElement.classList.add("cc-intro-lock");
      hideTimer.current = window.setTimeout(hideOverlay, MAX_VISIBLE_MS);
    },
    [clearTimers, hideOverlay],
  );

  const showDna = useCallback(
    (nextLabel = "Loading CareCounter") => {
      showOverlay(nextLabel, null);
    },
    [showOverlay],
  );

  const hideDna = useCallback(() => {
    hideOverlay();
  }, [hideOverlay]);

  const navigateWithDna = useCallback(
    (href: string, customLabel?: string) => {
      const nextLabel = customLabel ?? labelForRoute(href);
      const startedAt = Date.now();
      const payload: DnaNavPayload = {
        to: href,
        label: nextLabel,
        startedAt,
      };
      writePending(payload);
      showOverlay(nextLabel, href, startedAt);

      // Let the browser paint the DNA overlay before starting the route change.
      navTimer.current = window.setTimeout(() => {
        if (pathsMatch(pathnameRef.current, href)) {
          arrivedRef.current = true;
          scheduleHide();
          return;
        }
        router.push(href);
      }, NAV_DELAY_MS);
    },
    [router, scheduleHide, showOverlay],
  );

  useEffect(() => {
    setMounted(true);
    const pending = readPending();
    if (!pending) return;
    showOverlay(pending.label, pending.to, pending.startedAt);
    if (pathsMatch(window.location.pathname, pending.to)) {
      arrivedRef.current = true;
      scheduleHide();
    }
    // Only restore a mid-navigation overlay once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount restore
  }, []);

  useEffect(() => {
    if (!visible || !target) return;
    if (!pathsMatch(pathname, target)) return;
    if (arrivedRef.current) return;
    arrivedRef.current = true;
    scheduleHide();
  }, [pathname, scheduleHide, target, visible]);

  useEffect(() => {
    return () => {
      clearTimers();
      document.documentElement.classList.remove("cc-intro-lock");
    };
  }, [clearTimers]);

  const value = useMemo(
    () => ({ navigateWithDna, showDna, hideDna }),
    [hideDna, navigateWithDna, showDna],
  );

  return (
    <DnaRouteContext.Provider value={value}>
      {children}
      {mounted && visible
        ? createPortal(
            <div
              className={`cc-dna-route fixed inset-0 z-[100000] flex items-center justify-center overflow-hidden bg-[#f4f8f6] ${
                exiting ? "cc-site-loader-exit" : ""
              }`}
              role="status"
              aria-live="polite"
              aria-label={label}
              data-dna-route="1"
              style={{ opacity: exiting ? undefined : 1 }}
            >
              <div aria-hidden className="cc-intro-backdrop absolute inset-0" />
              <div className="relative flex flex-col items-center">
                <div
                  aria-hidden
                  className="cc-intro-halo absolute h-[300px] w-[300px] rounded-full"
                />
                <div
                  aria-hidden
                  className="absolute h-[270px] w-[270px] rounded-full border border-cobalt-500/15"
                />
                <DnaHelix caption={label} />
              </div>
              <p className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.24em] text-navy-950/45">
                Clarity for the cost of care
              </p>
            </div>,
            document.body,
          )
        : null}
    </DnaRouteContext.Provider>
  );
}
