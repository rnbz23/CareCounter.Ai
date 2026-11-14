import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-12 w-12" : size === "sm" ? "h-7 w-7" : "h-8 w-8";

  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex items-center justify-center rounded-[0.9rem] cc-mark-sheen",
        "bg-[linear-gradient(145deg,#1b2a41_0%,#e4572e_78%)]",
        "shadow-[0_10px_24px_rgba(228,87,46,0.28)]",
        "transition-transform duration-300 ease-premium group-hover:rotate-[-4deg] group-hover:scale-105",
        dim,
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="h-[58%] w-[58%] text-white">
        <path
          d="M8 10.5h10.5c3.2 0 5.5 2.1 5.5 5.1S21.7 20.7 18.5 20.7H12.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M12.8 20.7H8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M19.2 10.5v11.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
    </span>
  );
}
