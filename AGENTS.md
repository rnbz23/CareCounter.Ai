<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CareCounter — agent ownership

Shared contracts live in `src/types/contracts.ts` and the demo fixture in `src/lib/mock/demo-analysis.ts`. Do not invent alternate response shapes. Prefer Raja's expanded contracts (including `AgentContextSchema`) as the canonical source.

| Owner | Branch | Owns |
| --- | --- | --- |
| Sahil (Cursor) | `feature/frontend` | `src/app/page.tsx`, `src/app/analysis/**`, `src/components/intake/**`, `src/components/analysis/**`, `src/components/voice/VoicePanel.tsx`, frontend adapters |
| Raja (Codex) | `feature/backend` | `src/app/api/analyze/**`, `src/app/api/analyses/**`, `src/lib/gemini/**`, `src/lib/pricing/**`, `src/lib/db/**`, `src/lib/data/**` |
| Sumedh (DeepSeek) | `feature/elevenlabs-language-support` | `src/components/voice/AgentRuntime.tsx`, `src/lib/insurance/**`, `src/app/api/agent/**` |

## Focus callback (Sahil ↔ Sumedh)

```ts
onFocus: (focus: FocusTarget) => string
// returns "focused" | "unknown_target" | "cleared"
```

AgentRuntime must call `onFocus` with exact IDs from the current Analysis. Never infer focus from transcript text.
