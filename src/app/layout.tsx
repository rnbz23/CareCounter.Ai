import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { PageTransition } from "@/components/layout/PageTransition";
import { DnaRouteLoader } from "@/components/boot/DnaRouteLoader";

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareCounter — Understand your hospital bill",
  description:
    "Multilingual AI medical billing assistant. Review charges, ask questions, and find your next step.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sans.variable} ${display.variable} font-sans antialiased text-ink-950`}
      >
        <DnaRouteLoader>
          <PageTransition>{children}</PageTransition>
        </DnaRouteLoader>
      </body>
    </html>
  );
}
