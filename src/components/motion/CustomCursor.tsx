"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type CursorMode = "default" | "button" | "card" | "upload" | "finding" | "hidden";

function canUseCustomCursor() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (!window.matchMedia("(pointer: fine)").matches) return false;
  if (window.matchMedia("(hover: none)").matches) return false;
  return true;
}

function resolveMode(target: EventTarget | null): CursorMode {
  if (!(target instanceof Element)) return "default";

  const editable = target.closest(
    "input, textarea, select, [contenteditable='true'], [contenteditable='']",
  );
  if (editable) return "hidden";

  const tagged = target.closest<HTMLElement>("[data-cursor]");
  if (tagged) {
    const value = tagged.dataset.cursor;
    if (
      value === "button" ||
      value === "card" ||
      value === "upload" ||
      value === "finding"
    ) {
      return value;
    }
  }

  if (target.closest("button, a, [role='button'], label, summary")) {
    return "button";
  }

  return "default";
}

/**
 * Desktop-only CareCounter cursor: teal ring + center dot.
 * Native caret preserved on form fields; disabled on touch / reduced-motion.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<CursorMode>("default");
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const drawn = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const sync = () => setEnabled(canUseCustomCursor());
    sync();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(pointer: fine)");
    motion.addEventListener("change", sync);
    pointer.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      pointer.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove("cc-cursor-on");
      return;
    }

    document.documentElement.classList.add("cc-cursor-on");

    const onMove = (event: PointerEvent) => {
      pos.current = { x: event.clientX, y: event.clientY };
      setVisible(true);
      setMode(resolveMode(event.target));
    };

    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    const tick = () => {
      // Light lerp keeps motion smooth without noticeable lag.
      drawn.current.x += (pos.current.x - drawn.current.x) * 0.42;
      drawn.current.y += (pos.current.y - drawn.current.y) * 0.42;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${drawn.current.x}px, ${drawn.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    raf.current = requestAnimationFrame(tick);

    return () => {
      document.documentElement.classList.remove("cc-cursor-on");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ringRef}
      aria-hidden
      className={cn(
        "pointer-events-none fixed left-0 top-0 z-[9999] mix-blend-normal will-change-transform",
        "transition-[width,height,opacity,background-color,border-color] duration-150 ease-out",
        visible && mode !== "hidden" ? "opacity-100" : "opacity-0",
      )}
      style={{ width: 0, height: 0 }}
    >
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full border-[1.5px] border-[#0f8f96] bg-[#0f8f96]/12 transition-all duration-150 ease-out",
          mode === "default" && "h-4 w-4",
          mode === "button" && "h-9 w-9 bg-[#0f8f96]/18",
          mode === "card" && "h-8 w-8",
          mode === "upload" && "h-10 w-10 border-dashed",
          mode === "finding" && "h-9 w-9 border-[#0d737a] bg-[#0f8f96]/22",
          pressed && "scale-75",
        )}
      >
        <span className="h-1 w-1 rounded-full bg-[#0d737a]" />
        {mode === "upload" ? (
          <span className="absolute -bottom-5 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.14em] text-[#0d737a]">
            Upload
          </span>
        ) : null}
        {mode === "finding" ? (
          <span className="absolute -bottom-5 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.14em] text-[#0d737a]">
            Focus
          </span>
        ) : null}
      </div>
    </div>
  );
}
