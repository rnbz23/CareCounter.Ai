import { describe, expect, it } from "vitest";
import {
  SUPPORTED_LANGUAGES,
  firstMessageForLanguage,
  isLanguageVerified,
  switchInstructionForLanguage,
} from "./LanguageSelector";

describe("language configuration", () => {
  it("exposes the supported starting languages", () => {
    expect(SUPPORTED_LANGUAGES.map((language) => language.code)).toEqual([
      "en",
      "es",
      "zh",
      "fil",
      "hi",
      "vi",
      "ko",
      "ar",
      "fr",
      "pt",
    ]);
  });

  it("claims English only as voice-verified", () => {
    expect(isLanguageVerified("en")).toBe(true);
    for (const code of ["es", "zh", "fil", "hi", "vi", "ko", "ar", "fr", "pt"]) {
      expect(isLanguageVerified(code)).toBe(false);
    }
  });

  it("provides a localized first message for every configured language", () => {
    expect(firstMessageForLanguage("en")).toMatch(/^Hi,/);
    expect(firstMessageForLanguage("es")).toMatch(/^Hola,/);
    expect(firstMessageForLanguage("zh")).toMatch(/^您好/);
    expect(firstMessageForLanguage("fil")).toMatch(/^Kumusta,/);
    expect(firstMessageForLanguage("hi")).toMatch(/^नमस्ते/);
    expect(firstMessageForLanguage("vi")).toMatch(/^Xin chào/);
    expect(firstMessageForLanguage("ko")).toMatch(/^안녕하세요/);
    expect(firstMessageForLanguage("ar")).toMatch(/^مرحبًا/);
    expect(firstMessageForLanguage("fr")).toMatch(/^Bonjour,/);
    expect(firstMessageForLanguage("pt")).toMatch(/^Olá,/);
  });

  it("provides a mid-call switch instruction", () => {
    expect(switchInstructionForLanguage("hi")).toContain("हिंदी");
    expect(switchInstructionForLanguage("hi")).toContain('"hi"');
    expect(switchInstructionForLanguage("fr")).toContain("français");
    expect(switchInstructionForLanguage("en")).toContain('"en"');
  });

  it("falls back to the dashboard default for an unknown language", () => {
    expect(firstMessageForLanguage("de")).toBeUndefined();
    expect(isLanguageVerified("de")).toBe(false);
    expect(switchInstructionForLanguage("de")).toMatch(/language switch/i);
  });
});
