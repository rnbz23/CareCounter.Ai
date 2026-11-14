# CareCounter — agent ownership

Shared contracts live in `src/types/contracts.ts` and the demo fixture in `src/lib/mock/demo-analysis.ts`. Do not invent alternate response shapes.

| Owner | Branch suggestion | Owns |
| --- | --- | --- |
| Sahil (Cursor) | `feature/frontend` | `src/app/page.tsx`, `src/app/analysis/**`, `src/components/intake/**`, `src/components/analysis/**`, `src/components/voice/VoicePanel.tsx`, frontend adapters |
| Raja (Codex) | `feature/raja-backend` | `src/app/api/analyze/**`, `src/app/api/analyses/**`, `src/lib/gemini/**`, `src/lib/pricing/**`, `src/lib/db/**`, `src/lib/data/**` |
| Sumedh (DeepSeek) | `feature/sumedh-voice` | `src/components/voice/AgentRuntime.tsx`, `src/lib/voice/**`, `src/lib/insurance/**`, `src/app/api/agent/**` |

## Focus callback (Sahil ↔ Sumedh)

```ts
onFocus: (focus: FocusTarget) => string
// returns "focused" | "unknown_target" | "cleared"
```

AgentRuntime must call `onFocus` with exact IDs from the current Analysis. Never infer focus from transcript text.
