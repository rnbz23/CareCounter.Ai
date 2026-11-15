"use client";

import { cn } from "@/lib/utils";

export type LanguageOption = {
  code: string;
  label: string;
  /** Used as overrides.agent.firstMessage so the guide starts proactively. */
  firstMessage: string;
  /** True only after real audio has been tested for this language. */
  verified: boolean;
};

/**
 * Single source of truth for the languages exposed by the app.
 *
 * `verified` is deliberately conservative: only English has been exercised
 * with real browser audio. Spanish, Chinese and Tagalog are configured and
 * pass their localized first message, but their voice output is not yet
 * verified against the ElevenLabs agent.
 */
export const SUPPORTED_LANGUAGES = [
  {
    code: "en",
    label: "English",
    firstMessage:
      "Hi, I've reviewed your bill. I'll walk you through anything that may be worth checking, then help you explore coverage or assistance. May I start with the first item?",
    verified: true,
  },
  {
    code: "es",
    label: "Español",
    firstMessage:
      "Hola, he revisado su factura. Le explicaré los puntos que vale la pena revisar y luego le ayudaré a explorar su seguro o la asistencia financiera. ¿Puedo empezar con el primer punto?",
    verified: false,
  },
  {
    code: "zh",
    label: "中文",
    firstMessage:
      "您好，我已经查看了您的账单。我会带您了解可能需要检查的项目，然后帮助您了解保险或经济援助。我可以从第一项开始吗？",
    verified: false,
  },
  {
    code: "tl",
    label: "Tagalog",
    firstMessage:
      "Kumusta, natignan ko na ang inyong bill. Ipapaliwanag ko ang mga bagay na dapat tingnan, at tutulungan ko kayong alamin ang inyong insurance o tulong pinansyal. Maaari bang simulan natin sa unang item?",
    verified: false,
  },
] as const satisfies readonly LanguageOption[];

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

/** Undefined lets the dashboard's default first message apply for other languages. */
export function firstMessageForLanguage(code: string): string | undefined {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code)?.firstMessage;
}

export function isLanguageVerified(code: string): boolean {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code)?.verified === true;
}

export function LanguageSelector({
  value,
  onChange,
  className,
  compact = false,
}: {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <label className={cn("block", className)}>
      {!compact && (
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          Language
        </span>
      )}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as LanguageCode)}
        className={cn(
          "cc-select w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-navy-950 outline-none",
          compact && "py-2",
        )}
        aria-label="Conversation language"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
            {lang.verified ? "" : " (voice unverified)"}
          </option>
        ))}
      </select>
    </label>
  );
}
