"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Full-bleed muted ambient loop with CSS atmosphere fallback if media fails.
 */
export function AmbientVideo({
  src = "/media/hero-ambient.mp4",
  className,
  overlayClassName,
}: {
  src?: string;
  className?: string;
  overlayClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden>
      {!failed ? (
        <video
          className="h-full w-full scale-105 object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : (
        <div className="cc-video-fallback h-full w-full" />
      )}
      <div
        className={cn(
          "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,13,0.55)_0%,rgba(5,8,13,0.72)_48%,rgba(5,8,13,0.92)_100%)]",
          overlayClassName,
        )}
      />
      <div className="cc-video-sheen pointer-events-none absolute inset-0" />
    </div>
  );
}
