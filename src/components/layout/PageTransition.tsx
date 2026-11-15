"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Route motif transitions — visual only, never delays navigation.
 * upload → analysis: document-to-data entrance
 * analysis → plan: guided progress entrance
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [motif, setMotif] = useState<"default" | "doc" | "plan">("default");

  useEffect(() => {
    const from = window.sessionStorage.getItem("cc_enter_from");
    if (pathname.startsWith("/analysis/") && pathname.endsWith("/plan")) {
      setMotif("plan");
      window.sessionStorage.setItem("cc_enter_from", "plan");
    } else if (pathname.startsWith("/analysis/") && from === "upload") {
      setMotif("doc");
      window.sessionStorage.removeItem("cc_enter_from");
    } else if (pathname.startsWith("/analysis/")) {
      setMotif("doc");
    } else {
      setMotif("default");
    }
  }, [pathname]);

  return (
    <div
      key={pathname}
      className={cn(
        "relative min-h-screen",
        motif === "doc" ? "cc-doc-enter" : "animate-page-in",
        motif !== "plan" && "cc-page-sweep",
      )}
    >
      {children}
    </div>
  );
}
