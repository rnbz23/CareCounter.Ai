"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { useOptionalDnaRoute } from "@/components/boot/DnaRouteLoader";

type Props = ComponentProps<typeof Link> & {
  dnaLabel?: string;
  /** Skip DNA for same-page / home returns unless forced. */
  withDna?: boolean;
};

export function DnaNavLink({
  href,
  dnaLabel,
  withDna = true,
  onClick,
  children,
  ...rest
}: Props) {
  const dnaRoute = useOptionalDnaRoute();
  const router = useRouter();
  const target = typeof href === "string" ? href : href.pathname ?? "/";

  return (
    <Link
      href={href}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (!withDna || target === "/") return;
        event.preventDefault();
        if (dnaRoute) {
          dnaRoute.navigateWithDna(target, dnaLabel);
          return;
        }
        router.push(target);
      }}
    >
      {children}
    </Link>
  );
}
