# CareCounter

Multilingual AI medical billing assistant. Upload a hospital statement, review flagged charges against public prices, talk with a billing guide that highlights line items as it speaks, and leave with a clear next-steps plan.

CareCounter surfaces **questions to ask** — never confirmed overcharges, guaranteed savings, or medical/legal advice.

## What it does

1. **Analyze** — Upload a PDF, photo, or pasted charges. Gemini extracts line items; the backend compares them to stored public hospital prices where available.
2. **Understand** — Review findings on the left while a multilingual ElevenLabs guide explains charges on the right. The guide focuses exact statement IDs (never guesses from transcript text).
3. **Plan** — See payment context, assistance leads from public resources, and a short action checklist. Missing action plans are generated when you open this page.

## Stack

- **Next.js 16** / React 19 / TypeScript / Tailwind
- **Gemini** — bill extraction
- **Neon** — analyses, price rows, public-resource evidence
- **ElevenLabs** — conversational billing guide
- **Zod** — shared contracts in `src/types/contracts.ts`

## Quick start

```bash
npm install
cp .env.example .env.local
# fill credentials (see below)

# Optional: snapshot public Sharp prices + assistance sources into Neon
npm run ingest:public-data

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Copy `.env.example` → `.env.local`. Never commit secrets or expose server keys as `NEXT_PUBLIC_*`.

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Bill extraction (server-only) |
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | Neon pooled app URL + direct URL for migrations |
| `BRIGHTDATA_API_KEY` / `BRIGHTDATA_UNLOCKER_ZONE` | Offline public-data ingest only |
| `NEXT_PUBLIC_USE_MOCK_ANALYSIS` | Must be `false` for live APIs; omit/`true` only for UI demos |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | Public agent id for the browser voice client |
| `ELEVENLABS_TOOL_SECRET` | Server secret for `POST /api/agent/tools` |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local Next.js app |
| `npm run build` / `npm start` | Production build + serve |
| `npm test` | Vitest suite |
| `npm run typecheck` | Next typegen + `tsc` |
| `npm run lint` | ESLint |
| `npm run ingest:public-data` | Offline Bright Data → Neon public prices/resources |

## Product routes

| Path | Role |
| --- | --- |
| `/` | Home + bill upload |
| `/analysis/[id]` | Findings + live billing guide |
| `/analysis/[id]/plan` | Next steps / action plan |

Key APIs: `POST /api/analyze`, `GET /api/analyses/[id]`, insurance / assistance / action-plan / fundraise / agent-context under `/api/analyses/[id]/…`, and `POST /api/agent/tools`.

## Team ownership

Shared response shapes live in `src/types/contracts.ts`. Prefer those over inventing new payloads.

| Owner | Focus |
| --- | --- |
| Sahil | Intake UI, analysis workspace, focus/highlight, VoicePanel shell |
| Raja | Analyze APIs, Gemini, pricing, Neon, public-data ingest |
| Sumedh | ElevenLabs `AgentRuntime`, insurance/assistance logic, agent tools |

Focus callback contract:

```ts
onFocus: (focus: FocusTarget) => string
// "focused" | "unknown_target" | "cleared"
```

AgentRuntime must call `onFocus` with IDs from the current `Analysis` only.

## Docs

- `docs/CARECOUNTER_TEAM_INTEGRATION_MASTER.md` — merge / integration plan
- `docs/RAJA_BACKEND_HANDOFF.md` — backend setup and API examples
- `docs/ELEVENLABS_LANGUAGES.md` — language / voice agent notes
- `docs/INTEGRATION_TEAM_MERGE_CHANGES.md` — integration branch changelog
- `AGENTS.md` — agent ownership map for coding agents

## Sample data

Synthetic fixtures (not real patient records) live under `sampledata/`:

- `carecounter-synthetic-bill.pdf`
- `carecounter-synthetic-bill.png` / `carecounter-synthetic-bill-v2.png`

## Safety notes

- Do not share SSNs, member IDs, account numbers, or passwords with CareCounter.
- Public price differences and assistance programs are **leads to investigate**, not verified patient costs.
- Bright Data is used only in offline ingest — not on the live request path.
