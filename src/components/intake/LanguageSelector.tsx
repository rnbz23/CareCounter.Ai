"use client";

import { cn } from "@/lib/utils";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

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
          </option>
        ))}
      </select>
    </label>
  );
}
