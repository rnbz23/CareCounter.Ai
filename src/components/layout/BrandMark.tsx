import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  size = "md",
  id,
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  id?: string;
}) {
  const dim =
    size === "xl"
      ? "h-24 w-24 rounded-[1.9rem]"
      : size === "lg"
        ? "h-12 w-12 rounded-[1.15rem]"
        : size === "sm"
          ? "h-7 w-7 rounded-[0.65rem]"
          : "h-8 w-8 rounded-[0.75rem]";

  return (
    <span
      id={id}
      aria-hidden
      className={cn(
        "cc-brand-mark relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        "bg-[radial-gradient(circle_at_28%_18%,#13838b_0%,#0c4b55_46%,#082a33_100%)]",
        "shadow-[0_8px_20px_rgba(8,72,80,0.28),inset_0_1px_0_rgba(255,255,255,0.18)]",
        "ring-1 ring-inset ring-white/15",
        "transition-transform duration-300 ease-premium group-hover:rotate-[-4deg] group-hover:scale-105",
        dim,
        className,
      )}
    >
      <span
        aria-hidden
        className="cc-mark-sheen pointer-events-none absolute inset-0 opacity-40"
      />
      <svg
        viewBox="0 0 32 32"
        className="relative h-[64%] w-[64%] text-white"
        fill="none"
      >
        <path
          d="M24.6 9.1a10.2 10.2 0 1 0 .1 13.8"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          opacity="0.92"
        />
        <path
          d="M8.2 16.1h3.6l1.8-4.1 2.9 8.4 1.8-4.3h5.4"
          stroke="#ffd6c4"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="25.4" cy="16.1" r="1.5" fill="#ff9b73" />
      </svg>
    </span>
  );
}
