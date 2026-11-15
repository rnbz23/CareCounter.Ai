"use client";

import { cn } from "@/lib/utils";

export type LanguageOption = {
  code: string;
  label: string;
  /** Used as overrides.agent.firstMessage so the guide starts proactively. */
  firstMessage: string;
  /** Sent as a typed user turn when the caller changes language mid-call. */
  switchInstruction: string;
  /** True only after real audio has been tested for this language. */
  verified: boolean;
};

/**
 * Single source of truth for the languages exposed by the app.
 *
 * `verified` is deliberately conservative: only English has been exercised
 * with real browser audio. The other entries are configured language presets;
 * their voice output still needs a live audio check before being marked ready.
 *
 * ElevenLabs uses `fil` for Filipino; Tagalog is shown as a familiar label.
 */
export const SUPPORTED_LANGUAGES = [
  {
    code: "en",
    label: "English",
    firstMessage:
      "Hi, I've reviewed your bill. I'll walk you through anything that may be worth checking, then help you explore coverage or assistance. May I start with the first item?",
    switchInstruction: "Please continue the conversation in English.",
    verified: true,
  },
  {
    code: "es",
    label: "Español",
    firstMessage:
      "Hola, he revisado su factura. Le explicaré los puntos que vale la pena revisar y luego le ayudaré a explorar su seguro o la asistencia financiera. ¿Puedo empezar con el primer punto?",
    switchInstruction: "Por favor, continúe la conversación en español.",
    verified: false,
  },
  {
    code: "zh",
    label: "中文",
    firstMessage:
      "您好，我已经查看了您的账单。我会带您了解可能需要检查的项目，然后帮助您了解保险或经济援助。我可以从第一项开始吗？",
    switchInstruction: "请继续用中文交谈。",
    verified: false,
  },
  {
    code: "fil",
    label: "Filipino / Tagalog",
    firstMessage:
      "Kumusta, nasuri ko na ang iyong bill. Ipapaliwanag ko ang mga bagay na dapat tingnan, at tutulungan kitang alamin ang insurance o tulong pinansyal. Maaari ba tayong magsimula sa unang item?",
    switchInstruction: "Pakiusap, ipagpatuloy ang usapan sa Filipino.",
    verified: false,
  },
  {
    code: "hi",
    label: "हिन्दी (Hindi)",
    firstMessage:
      "नमस्ते, मैंने आपका बिल देख लिया है। मैं आपको उन बातों के बारे में बताऊँगा जिन्हें जाँचना उपयोगी हो सकता है, फिर बीमा या आर्थिक सहायता के विकल्प समझाऊँगा। क्या मैं पहली बात से शुरू करूँ?",
    switchInstruction: "कृपया बातचीत हिंदी में जारी रखें।",
    verified: false,
  },
  {
    code: "vi",
    label: "Tiếng Việt",
    firstMessage:
      "Xin chào, tôi đã xem hóa đơn của bạn. Tôi sẽ hướng dẫn bạn những điểm có thể cần kiểm tra, sau đó giúp bạn tìm hiểu về bảo hiểm hoặc hỗ trợ tài chính. Tôi có thể bắt đầu với mục đầu tiên không?",
    switchInstruction: "Vui lòng tiếp tục cuộc trò chuyện bằng tiếng Việt.",
    verified: false,
  },
  {
    code: "ko",
    label: "한국어",
    firstMessage:
      "안녕하세요, 청구서를 검토했습니다. 확인해 볼 만한 항목을 설명드리고 보험 또는 재정 지원 방안을 안내해 드리겠습니다. 첫 번째 항목부터 시작해도 될까요?",
    switchInstruction: "한국어로 대화를 계속해 주세요.",
    verified: false,
  },
  {
    code: "ar",
    label: "العربية",
    firstMessage:
      "مرحبًا، لقد راجعت فاتورتك. سأوضح لك العناصر التي قد تستحق المراجعة، ثم أساعدك في استكشاف التأمين أو المساعدة المالية. هل يمكنني البدء بالعنصر الأول؟",
    switchInstruction: "يرجى متابعة المحادثة باللغة العربية.",
    verified: false,
  },
  {
    code: "fr",
    label: "Français",
    firstMessage:
      "Bonjour, j'ai examiné votre facture. Je vais vous expliquer les éléments qui méritent peut-être d'être vérifiés, puis vous aider à explorer votre assurance ou les aides financières. Puis-je commencer par le premier point ?",
    switchInstruction: "Veuillez continuer la conversation en français.",
    verified: false,
  },
  {
    code: "pt",
    label: "Português",
    firstMessage:
      "Olá, analisei sua conta hospitalar. Vou explicar os pontos que podem valer a pena verificar e depois ajudar você a entender o seguro ou a assistência financeira. Posso começar pelo primeiro item?",
    switchInstruction: "Por favor, continue a conversa em português.",
    verified: false,
  },
] as const satisfies readonly LanguageOption[];

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

/** Undefined lets the dashboard's language-specific preset apply. */
export function firstMessageForLanguage(code: string): string | undefined {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code)?.firstMessage;
}

export function switchInstructionForLanguage(code: string): string {
  const language = SUPPORTED_LANGUAGES.find((option) => option.code === code);
  if (!language) {
    return "[LANGUAGE SWITCH] The caller requested a different language. Continue in the caller's language.";
  }
  return `[LANGUAGE SWITCH] ${language.switchInstruction} Call the language_detection tool with language "${language.code}" now, then continue in ${language.label} without restarting or repeating the greeting.`;
}

export function languageLabelForCode(code: string): string {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code)?.label ?? code.toUpperCase();
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
          "cc-select w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-navy-950 outline-none hover:border-cobalt-500/45",
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
