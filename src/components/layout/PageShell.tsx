import { cn } from "@/lib/utils";

/** Shared width shell — keeps desktop layouts using the viewport effectively. */
export function PageShell({
  children,
  className,
  width = "wide",
}: {
  children: React.ReactNode;
  className?: string;
  width?: "wide" | "content" | "full";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-8",
        width === "wide" && "max-w-[1600px]",
        width === "content" && "max-w-[1120px]",
        width === "full" && "max-w-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
