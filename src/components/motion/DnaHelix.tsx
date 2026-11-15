"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

const RUNGS = Array.from({ length: 11 }, (_, index) => {
  const bend = Math.sin((index / 10) * Math.PI * 2.6) * 32;
  return {
    y: 26 + index * 20.5,
    x1: 64 + bend,
    x2: 176 - bend,
  };
});

export function DnaHelix({
  caption = "Reading the bill",
  className,
  size = "lg",
}: {
  caption?: string;
  className?: string;
  size?: "md" | "lg";
}) {
  const uid = useId().replace(/:/g, "");
  const strokeId = `cc-dna-stroke-${uid}`;
  const glowId = `cc-dna-glow-${uid}`;
  const frame =
    size === "md"
      ? "h-[220px] w-[220px]"
      : "h-[300px] w-[300px]";
  const svg =
    size === "md"
      ? "h-[200px] w-[172px]"
      : "h-[280px] w-[240px]";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        frame,
        className,
      )}
    >
      <svg
        viewBox="0 0 240 280"
        className={cn("cc-helix-sway overflow-visible", svg)}
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient
            id={strokeId}
            x1="48"
            y1="20"
            x2="192"
            y2="260"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#3b5fff" />
            <stop offset="0.5" stopColor="#1a3df5" />
            <stop offset="1" stopColor="#e4572e" stopOpacity="0.76" />
          </linearGradient>
          <filter id={glowId} x="-30%" y="-10%" width="160%" height="120%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M64 18C124 54 4 98 64 134C124 170 4 214 64 250"
          stroke={`url(#${strokeId})`}
          strokeWidth="2.6"
          strokeLinecap="round"
          pathLength={1}
          className="cc-dna-strand"
          filter={`url(#${glowId})`}
        />
        <path
          d="M176 18C116 54 236 98 176 134C116 170 236 214 176 250"
          stroke={`url(#${strokeId})`}
          strokeWidth="2.6"
          strokeLinecap="round"
          pathLength={1}
          className="cc-dna-strand cc-dna-strand-delayed"
          filter={`url(#${glowId})`}
        />

        {RUNGS.map((rung, index) => (
          <g key={rung.y}>
            <line
              x1={rung.x1}
              y1={rung.y}
              x2={rung.x2}
              y2={rung.y}
              stroke="#3b5fff"
              strokeWidth="1.4"
              strokeLinecap="round"
              className="cc-dna-rung"
              style={{ animationDelay: `${index * 85}ms` }}
            />
            <circle
              cx={rung.x1}
              cy={rung.y}
              r="2.1"
              fill="#3b5fff"
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
        className="cc-dna-scan pointer-events-none absolute inset-x-12 h-20 rounded-full bg-[linear-gradient(180deg,transparent,rgba(59,95,255,0.13),transparent)]"
      />

      {caption ? (
        <p className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.32em] text-navy-950/42">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
