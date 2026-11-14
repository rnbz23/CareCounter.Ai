import type { Metadata } from "next";
import { Source_Sans_3, Syne } from "next/font/google";
import "./globals.css";
import { PageTransition } from "@/components/layout/PageTransition";
import { CustomCursor } from "@/components/motion/CustomCursor";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Syne({
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
      <body className={`${sans.variable} ${display.variable} font-sans antialiased text-ink-950`}>
        <CustomCursor />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
