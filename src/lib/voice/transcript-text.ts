/**
 * ElevenLabs / agent prompts often prefix spoken replies with bracketed
 * delivery tags such as [friendly] or [empathetic]. Those are for the voice
 * model only — never show them in the chat transcript.
 */
const LEADING_DELIVERY_TAG =
  /^\s*\[([a-z][a-z\s/_-]{0,40})\]\s*/i;

const KNOWN_TONES = new Set([
  "friendly",
  "warm",
  "calm",
  "empathetic",
  "empathic",
  "professional",
  "serious",
  "cheerful",
  "concerned",
  "reassuring",
  "neutral",
  "excited",
  "sad",
  "happy",
  "sympathetic",
  "soft",
  "gentle",
  "confident",
  "patient",
]);

function isDeliveryTag(inner: string): boolean {
  const normalized = inner.trim().toLowerCase().replace(/[_/]+/g, " ");
  if (KNOWN_TONES.has(normalized)) return true;
  // Multi-word delivery hints: "soft tone", "warm voice", "friendly tone"
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length <= 3 && words.every((word) => /^[a-z]+$/.test(word))) {
    return words.some((word) => KNOWN_TONES.has(word) || word === "tone" || word === "voice");
  }
  return false;
}

/** Remove leading voice-delivery tags from agent transcript text. */
export function stripAgentDeliveryTags(text: string): string {
  let next = text;
  for (let i = 0; i < 4; i += 1) {
    const match = next.match(LEADING_DELIVERY_TAG);
    if (!match?.[1] || !isDeliveryTag(match[1])) break;
    next = next.slice(match[0].length);
  }
  return next.trimStart();
}
