import { describe, expect, it } from "vitest";
import {
  SUPPORTED_LANGUAGES,
  firstMessageForLanguage,
  isLanguageVerified,
} from "./LanguageSelector";

describe("language configuration", () => {
  it("keeps the team's English, Spanish and Chinese options and adds Tagalog", () => {
    expect(SUPPORTED_LANGUAGES.map((language) => language.code)).toEqual([
      "en",
      "es",
      "zh",
      "tl",
    ]);
  });

  it("claims English only as voice-verified", () => {
    expect(isLanguageVerified("en")).toBe(true);
    for (const code of ["es", "zh", "tl"]) {
      expect(isLanguageVerified(code)).toBe(false);
    }
  });

  it("provides a localized first message for every configured language", () => {
    expect(firstMessageForLanguage("en")).toMatch(/^Hi,/);
    expect(firstMessageForLanguage("es")).toMatch(/^Hola,/);
    expect(firstMessageForLanguage("zh")).toMatch(/^您好/);
    expect(firstMessageForLanguage("tl")).toMatch(/^Kumusta,/);
  });

  it("falls back to the dashboard default for an unknown language", () => {
    expect(firstMessageForLanguage("fr")).toBeUndefined();
    expect(isLanguageVerified("fr")).toBe(false);
  });
});
